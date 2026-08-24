import { createClient } from "@/lib/supabase/server";
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
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin-login");

  const { data: profile } = await supabase.from("profiles").select("name, role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/admin-login");

  return (
    <div className="flex min-h-screen flex-col bg-cream-50 dark:bg-plum-900 md:flex-row">
      <SidebarNav title="Super Admin" items={NAV} />
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-cream-200 bg-white/70 px-6 py-4 dark:border-plum-500/30 dark:bg-plum-700/40">
          <p className="text-sm font-bold text-plum-600 dark:text-cream-100">{profile?.name}</p>
          <LogoutButton className="btn-outline text-xs px-3 py-1.5" />
        </header>
        <main className="mx-auto max-w-5xl p-4 sm:p-6 xl:max-w-6xl">{children}</main>
      </div>
    </div>
  );
}
