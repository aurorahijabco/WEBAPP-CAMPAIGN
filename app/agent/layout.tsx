import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/business/auditLog";
import { redirect } from "next/navigation";
import { SidebarNav } from "@/components/nav/SidebarNav";
import { LogoutButton } from "@/components/nav/LogoutButton";

const NAV = [
  { href: "/agent/dashboard", label: "Dashboard" },
  { href: "/agent/redeem", label: "Redeem Voucher" },
];

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "agent") {
    if (user) {
      await writeAuditLog({
        action: "unauthorized_access",
        status: "failed",
        actor: { id: user.id, username: user.username, role: user.role },
        entityType: "route",
        metadata: { attemptedRoute: "/agent" },
      });
    }
    redirect("/agent-login");
  }

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, branch_id, branches(name)")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen flex-col bg-cream-50 dark:bg-plum-900 md:flex-row">
      <SidebarNav title="Agent Panel" items={NAV} />
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-cream-200 bg-white/70 px-6 py-4 dark:border-plum-500/30 dark:bg-plum-700/40">
          <div>
            <p className="text-sm font-bold text-plum-600 dark:text-cream-100">{profile?.name}</p>
            <p className="text-xs text-plum-400 dark:text-cream-100/60">{(profile as any)?.branches?.name ?? "Cabang belum diatur"}</p>
          </div>
          <LogoutButton className="btn-outline text-xs px-3 py-1.5" />
        </header>
        <main className="mx-auto max-w-3xl p-4 sm:p-6 lg:max-w-4xl">{children}</main>
      </div>
    </div>
  );
}
