import { createAdminClient } from "@/lib/supabase/admin";
import { AddBranchCard } from "./AddBranchCard";
import { BranchRow } from "./BranchRow";

export default async function AdminBranchesPage() {
  const supabase = createAdminClient();
  const { data: branches } = await supabase.from("branches").select("*").order("name");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl text-plum-600 dark:text-cream-100">Kelola Cabang</h1>
        <p className="mt-1 text-sm text-plum-400 dark:text-cream-100/70">
          Tambah, edit, atau hapus data cabang. Cabang yang masih memiliki agent, struk, klaim, atau voucher terkait
          tidak bisa dihapus — nonaktifkan saja lewat toggle Aktif/Nonaktif.
        </p>
      </div>

      <AddBranchCard />

      <div className="card divide-y divide-cream-200 p-2 dark:divide-plum-500/30">
        {branches?.length ? (
          branches.map((b) => <BranchRow key={b.id} branch={b} />)
        ) : (
          <p className="empty">Belum ada cabang.</p>
        )}
      </div>
    </div>
  );
}
