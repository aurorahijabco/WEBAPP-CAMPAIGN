import { createAdminClient } from "@/lib/supabase/admin";
import { NewClaimForm } from "./NewClaimForm";

export default async function NewClaimPage() {
  const supabase = createAdminClient();
  const { data: branches } = await supabase
    .from("branches")
    .select("id, name")
    .eq("active", true)
    .order("name");

  return (
    <div className="space-y-4 pb-4">
      <div>
        <h1 className="font-display text-2xl text-plum-600 dark:text-cream-100">Klaim Baru</h1>
        <p className="mt-1 text-sm text-plum-400 dark:text-cream-100/70">
          Unggah struk pembelian Series Agustin untuk memulai klaim voucher.
        </p>
      </div>
      <div className="card sm:p-7">
        <NewClaimForm branches={branches ?? []} />
      </div>
    </div>
  );
}
