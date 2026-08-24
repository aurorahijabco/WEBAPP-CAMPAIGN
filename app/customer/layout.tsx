import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/nav/BottomNav";
import { redirect } from "next/navigation";

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
    return { text: `Periode redemption mulai ${start.toLocaleDateString("id-ID")}. Voucher kamu berstatus RESERVED sampai saat itu.`, tone: "info" as const };
  }
  if (now > end) {
    return { text: "Periode redemption sudah berakhir.", tone: "muted" as const };
  }
  return { text: `Periode redemption sedang berlangsung sampai ${end.toLocaleDateString("id-ID")}. Tukarkan vouchermu sekarang!`, tone: "active" as const };
}

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const banner = await getPhaseBanner();

  return (
    <div className="min-h-screen bg-cream-50 pb-24">
      {banner && (
        <div
          className={
            banner.tone === "active"
              ? "bg-green-600 text-white text-center text-xs py-2 px-4"
              : banner.tone === "info"
                ? "bg-plum-500 text-white text-center text-xs py-2 px-4"
                : "bg-gray-400 text-white text-center text-xs py-2 px-4"
          }
        >
          {banner.text}
        </div>
      )}
      <div className="mx-auto max-w-md px-4 pt-6">{children}</div>
      <BottomNav />
    </div>
  );
}
