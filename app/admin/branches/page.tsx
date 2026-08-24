import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { BranchToggle } from "./BranchToggle";

export default async function AdminBranchesPage() {
  const supabase = await createClient();
  const { data: branches } = await supabase.from("branches").select("*").order("name");

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-plum-600">Daftar Cabang</h1>
      <div className="space-y-2">
        {branches?.map((b) => (
          <Card key={b.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-plum-600">{b.name}</p>
              <p className="text-xs text-plum-400">{b.code} · {b.address}</p>
            </div>
            <BranchToggle branchId={b.id} active={b.active} />
          </Card>
        ))}
      </div>
    </div>
  );
}
