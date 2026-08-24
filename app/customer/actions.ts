"use server";

import { createClient } from "@/lib/supabase/server";
import { newClaimSchema, contentSubmissionSchema } from "@/lib/business/validation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type ActionState = { error?: string; success?: string } | undefined;

/**
 * Creates a bill (receipt) + claim in one flow. The receipt photo is uploaded
 * to the private `receipts` bucket under `{user_id}/{random}.{ext}` so that
 * storage RLS (owner-only) applies automatically.
 */
export async function createClaim(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir, silakan login ulang." };

  const itemNames = formData.getAll("itemName");
  const itemQtys = formData.getAll("itemQty");
  const itemPrices = formData.getAll("itemPrice");
  const items = itemNames.map((name, i) => ({
    name: String(name),
    qty: Number(itemQtys[i] ?? 1),
    price: Number(itemPrices[i] ?? 0),
  }));

  const parsed = newClaimSchema.safeParse({
    branchId: formData.get("branchId"),
    amount: formData.get("amount"),
    items,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data klaim tidak valid" };
  }

  const photo = formData.get("photo") as File | null;
  if (!photo || photo.size === 0) return { error: "Foto struk wajib diunggah" };
  if (photo.size > 5 * 1024 * 1024) return { error: "Ukuran foto maksimal 5MB" };

  const ext = photo.name.split(".").pop() || "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("receipts").upload(path, photo, {
    contentType: photo.type,
    upsert: false,
  });
  if (uploadError) return { error: "Gagal mengunggah foto struk: " + uploadError.message };

  const { data: bill, error: billError } = await supabase
    .from("bills")
    .insert({
      customer_id: user.id,
      branch_id: parsed.data.branchId,
      amount: parsed.data.amount,
      items: parsed.data.items,
      photo_path: path,
      status: "HOLD",
    })
    .select("id")
    .single();
  if (billError || !bill) return { error: "Gagal menyimpan struk: " + billError?.message };

  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .insert({
      customer_id: user.id,
      branch_id: parsed.data.branchId,
      bill_id: bill.id,
      purchase_status: "HOLD",
    })
    .select("id")
    .single();
  if (claimError || !claim) return { error: "Gagal membuat klaim: " + claimError?.message };

  revalidatePath("/customer/dashboard");
  redirect(`/customer/claims/${claim.id}`);
}

export async function submitContent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir, silakan login ulang." };

  const parsed = contentSubmissionSchema.safeParse({
    claimId: formData.get("claimId"),
    type: formData.get("type"),
    platform: formData.get("platform"),
    url: formData.get("url"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data konten tidak valid" };
  }

  // Ownership check (defense in depth, RLS also enforces this)
  const { data: claim } = await supabase
    .from("claims")
    .select("id, customer_id")
    .eq("id", parsed.data.claimId)
    .single();
  if (!claim || claim.customer_id !== user.id) {
    return { error: "Klaim tidak ditemukan" };
  }

  const { error } = await supabase.from("content_submissions").insert({
    claim_id: parsed.data.claimId,
    type: parsed.data.type,
    platform: parsed.data.platform,
    url: parsed.data.url,
    status: "PENDING",
  });
  if (error) return { error: "Gagal mengirim konten: " + error.message };

  revalidatePath(`/customer/claims/${parsed.data.claimId}`);
  return { success: "Konten berhasil dikirim dan menunggu review." };
}

export async function markNotificationsRead(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  revalidatePath("/customer/notifications");
}
