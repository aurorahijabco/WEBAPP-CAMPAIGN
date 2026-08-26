import { getCurrentUser } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/business/auditLog";
import { redirect } from "next/navigation";
import { SidebarNav } from "@/components/nav/SidebarNav";
import { LogoutButton } from "@/components/nav/LogoutButton";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/claims", label: "Klaim" },
  { href: "/admin/receipts", label: "Verifikasi Struk" },
  { href: "/admin/content", label: "Review Konten" },
  { href: "/admin/vouchers", label: "Voucher" },
  { href: "/admin/branches", label: "Cabang" },
  { href: "/admin/agents", label: "Agent" },
  { href: "/admin/audit-log", label: "Audit Log" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    // Only log a genuine cross-role attempt (a logged-in customer/agent
    // hitting /admin), not every anonymous/no-session visit — those are
    // just visitors without a session yet, not an authorization failure.
    if (user) {
      await writeAuditLog({
        action: "unauthorized_access",
        status: "failed",
        actor: { id: user.id, username: user.username, role: user.role },
        entityType: "route",
        metadata: { attemptedRoute: "/admin" },
      });
    }
    redirect("/admin-login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream-50 dark:bg-plum-900 md:flex-row">
      <SidebarNav title="Super Admin" items={NAV} />
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-cream-200 bg-white/70 px-6 py-4 dark:border-plum-500/30 dark:bg-plum-700/40">
          <p className="text-sm font-bold text-plum-600 dark:text-cream-100">{user.name}</p>
          <LogoutButton className="btn-outline text-xs px-3 py-1.5" />
        </header>
        <main className="mx-auto max-w-5xl p-4 sm:p-6 xl:max-w-6xl">{children}</main>
      </div>
    </div>
  );
}
