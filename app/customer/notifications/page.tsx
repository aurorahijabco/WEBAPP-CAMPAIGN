import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { markNotificationsRead } from "@/app/customer/actions";
import { Card } from "@/components/ui/Card";
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-plum-600">Notifikasi</h1>
        <form action={markNotificationsRead}>
          <button type="submit" className="text-xs text-plum-500 underline">
            Tandai semua dibaca
          </button>
        </form>
      </div>

      <div className="space-y-2">
        {notifications?.length ? (
          notifications.map((n) => (
            <Card key={n.id} className={cn(!n.read_at && "border-plum-400 bg-plum-50")}>
              <p className="text-sm text-plum-700">{n.message}</p>
              <p className="mt-1 text-xs text-plum-400">{formatDate(n.created_at)}</p>
            </Card>
          ))
        ) : (
          <Card className="text-center text-sm text-plum-400">Belum ada notifikasi.</Card>
        )}
      </div>
    </div>
  );
}
