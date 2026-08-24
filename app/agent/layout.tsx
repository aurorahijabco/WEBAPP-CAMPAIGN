import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SidebarNav } from "@/components/nav/SidebarNav";
import { LogoutButton } from "@/components/nav/LogoutButton";

const NAV = [
  { href: "/agent/dashboard", label: "Dashboard" },
  { href: "/agent/redeem", label: "Redeem Voucher" },
];

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/agent-login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, branch_id, branches(name)")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col md:flex-row">
      <SidebarNav title="Agent Panel" items={NAV} />
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-cream-200 bg-white/70 px-6 py-4">
          <div>
            <p className="text-sm font-medium text-plum-600">{profile?.name}</p>
            <p className="text-xs text-plum-400">{(profile as any)?.branches?.name ?? "Cabang belum diatur"}</p>
          </div>
          <LogoutButton className="btn-outline text-xs px-3 py-1.5" />
        </header>
        <main className="p-6 max-w-3xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
