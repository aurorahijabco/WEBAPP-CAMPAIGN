import { createAdminClient } from "@/lib/supabase/admin";
import { BranchToggle } from "./BranchToggle";

export default async function AdminBranchesPage() {
  const supabase = createAdminClient();
  const { data: branches } = await supabase.from("branches").select("*").order("name");

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-plum-600 dark:text-cream-100">Daftar Cabang</h1>
      <div className="card divide-y divide-cream-200 p-2 dark:divide-plum-500/30">
        {branches?.map((b) => (
          <div key={b.id} className="flex items-center justify-between gap-3 px-2.5 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-plum-600 dark:text-cream-100">{b.name}</p>
              <p className="text-xs text-plum-400 dark:text-cream-100/60">
                {b.code} · {b.address}
              </p>
            </div>
            <BranchToggle branchId={b.id} active={b.active} />
          </div>
        ))}
      </div>
    </div>
  );
}
