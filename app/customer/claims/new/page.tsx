import { createClient } from "@/lib/supabase/server";
import { NewClaimForm } from "./NewClaimForm";

export default async function NewClaimPage() {
  const supabase = await createClient();
  const { data: branches } = await supabase
    .from("branches")
    .select("id, name")
    .eq("active", true)
    .order("name");

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-plum-600">Klaim Baru</h1>
      <p className="text-sm text-plum-400">
        Unggah struk pembelian Series Agustin untuk memulai klaim voucher.
      </p>
      <NewClaimForm branches={branches ?? []} />
    </div>
  );
}
