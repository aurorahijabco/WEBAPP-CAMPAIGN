import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { BottomNav } from "@/components/nav/BottomNav";
import { LogoutButton } from "@/components/nav/LogoutButton";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

async function getPhaseBanner() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaign_settings")
    .select("value")
    .eq("key", "redemption_period")
    .single();
  const period = data?.value as { start: string; end: string } | undefined;
  if (!period) return null;

  const now = new Date();
  const start = new Date(period.start);
  const end = new Date(period.end);

  if (now < start) {
    return {
      text: `Periode redemption mulai ${start.toLocaleDateString("id-ID")}. Voucher kamu berstatus RESERVED sampai saat itu.`,
      tone: "notice-warn" as const,
    };
  }
  if (now > end) {
    return { text: "Periode redemption sudah berakhir.", tone: "notice-danger" as const };
  }
  return {
    text: `Periode redemption sedang berlangsung sampai ${end.toLocaleDateString("id-ID")}. Tukarkan vouchermu sekarang!`,
    tone: "notice-success" as const,
  };
}

async function getUnreadCount(userId: string) {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer") redirect("/login");

  const [banner, unread] = await Promise.all([getPhaseBanner(), getUnreadCount(user.id)]);

  return (
    <div className="min-h-screen bg-cream-50 pb-28 dark:bg-plum-900">
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-cream-200 bg-cream-50/90 px-4 py-3 backdrop-blur dark:border-plum-500/30 dark:bg-plum-900/90 sm:px-8">
        <Link href="/customer/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[10px] bg-gradient-to-br from-gold-300 to-gold-500 font-display text-sm font-bold text-plum-900">
            A
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-bold text-plum-600 dark:text-cream-100">Aurora Hijab</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-gold-500">Reward Campaign</p>
          </div>
        </Link>
        <div className="flex items-center gap-1.5">
          <Link
            href="/customer/notifications"
            className="relative flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-cream-200 bg-white text-plum-600 dark:border-plum-500/40 dark:bg-plum-700/60 dark:text-cream-100"
            aria-label="Notifikasi"
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px]">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full border border-white bg-rose-500 dark:border-plum-700" />
            )}
          </Link>
          <LogoutButton
            aria-label="Keluar"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-cream-200 bg-white text-plum-600 dark:border-plum-500/40 dark:bg-plum-700/60 dark:text-cream-100"
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px]">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
          </LogoutButton>
        </div>
      </div>

      {banner && (
        <div className="px-4 pt-3 sm:px-8">
          <div className={cn("notice mx-auto max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl", banner.tone)}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            <span>{banner.text}</span>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-md px-4 pt-4 sm:max-w-xl sm:px-8 md:max-w-2xl lg:max-w-3xl">{children}</div>
      <BottomNav />
    </div>
  );
}
