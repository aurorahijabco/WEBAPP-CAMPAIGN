import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { markNotificationsRead } from "@/app/customer/actions";
import { cn } from "@/lib/utils";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <p className="section-title">Notifikasi</p>
        <form action={markNotificationsRead}>
          <button type="submit" className="text-xs font-bold text-gold-500 underline underline-offset-2">
            Tandai semua dibaca
          </button>
        </form>
      </div>

      {notifications?.length ? (
        <div className="space-y-2.5">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "card flex items-start gap-3",
                !n.read_at && "border-gold-400/70 bg-cream-100/60 dark:bg-plum-500/10"
              )}
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-cream-100 text-gold-500 dark:bg-plum-500/30">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-plum-700 dark:text-cream-100">{n.message}</p>
                <p className="mt-1 text-xs text-plum-400 dark:text-cream-100/50">{formatDate(n.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-cream-100 text-rose-500 dark:bg-plum-500/30">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
          </div>
          <p className="mt-3.5 font-display text-base font-bold text-plum-600 dark:text-cream-100">Belum ada notifikasi</p>
        </div>
      )}
    </div>
  );
}
