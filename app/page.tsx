import Link from "next/link";
import { CONTENT_REQUIREMENTS, REDEEM_PRODUCT_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

async function getRedemptionPeriod() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaign_settings")
    .select("value")
    .eq("key", "redemption_period")
    .single();
  return data?.value as { start: string; end: string } | undefined;
}

export default async function LandingPage() {
  const period = await getRedemptionPeriod();

  return (
    <main className="min-h-screen bg-gradient-to-b from-plum-600 via-plum-500 to-plum-600 text-cream-50">
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-12 text-center">
        <p className="text-xs tracking-[0.3em] text-gold-400 uppercase mb-3">Aurora Hijab</p>
        <h1 className="font-display text-4xl md:text-5xl leading-tight mb-4">
          Voucher Reward Campaign
        </h1>
        <p className="text-cream-100/90 mb-8">
          Beli Series Agustin, ceritakan pengalamanmu di media sosial, dan dapatkan voucher
          eksklusif untuk berbelanja {REDEEM_PRODUCT_NAME}.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/register" className="btn-gold">Daftar Sekarang</Link>
          <Link href="/login" className="btn-outline border-cream-100 text-cream-50 hover:bg-white/10">
            Masuk
          </Link>
        </div>
        <div className="mt-6 flex justify-center gap-4 text-xs text-cream-100/70">
          <Link href="/agent-login" className="underline underline-offset-2">Login Agen Cabang</Link>
          <span>·</span>
          <Link href="/admin-login" className="underline underline-offset-2">Login Admin</Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-cream-50 text-plum-700 rounded-t-[2.5rem] px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-2xl mb-6 text-center">Cara Kerja</h2>
          <ol className="space-y-4">
            {[
              "Beli produk Series Agustin melalui Agen Aurora Hijab di cabang manapun.",
              "Unggah foto struk pembelian pada akun Aurora Hijab kamu.",
              "Submit konten orisinal di Instagram atau TikTok sesuai ketentuan.",
              "Konten diverifikasi tim Aurora Hijab. Voucher terbit otomatis setelah disetujui.",
              `Tukarkan voucher untuk ${REDEEM_PRODUCT_NAME} di cabang tempat kamu klaim, selama periode redemption.`,
            ].map((text, i) => (
              <li key={i} className="flex gap-4 card">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-plum-600 text-cream-50 font-semibold">
                  {i + 1}
                </span>
                <p className="text-sm pt-1">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Content requirements */}
      <section className="bg-cream-50 text-plum-700 px-6 py-4">
        <div className="mx-auto max-w-3xl card">
          <h3 className="font-display text-xl mb-3">Syarat Konten</h3>
          <ul className="space-y-2 text-sm">
            {CONTENT_REQUIREMENTS.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="text-gold-400">✦</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Reward tiers */}
      <section className="bg-cream-50 text-plum-700 px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <h3 className="font-display text-xl mb-4 text-center">Nilai Reward (Tidak Kumulatif)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ["Story Photo", "Rp20.000"],
              ["Feed Photo", "Rp30.000"],
              ["Feed Reels", "Rp40.000"],
              ["Ketiganya", "Rp50.000"],
            ].map(([label, value]) => (
              <div key={label} className="card text-center">
                <p className="text-xs text-plum-400 mb-1">{label}</p>
                <p className="font-display text-lg text-plum-600">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-plum-400">
            Nilai reward = tier tertinggi yang terverifikasi, tidak dijumlahkan (kecuali ketiga jenis konten disetujui).
          </p>
        </div>
      </section>

      {/* Redemption period + terms */}
      <section className="bg-cream-50 text-plum-700 px-6 pb-16">
        <div className="mx-auto max-w-3xl card">
          <h3 className="font-display text-xl mb-2">Periode Redemption</h3>
          {period ? (
            <p className="text-sm mb-4">
              {formatDate(period.start)} — {formatDate(period.end)}. Voucher hanya dapat ditukar
              dalam periode ini, di cabang tempat kamu mengajukan klaim.
            </p>
          ) : (
            <p className="text-sm mb-4 text-plum-400">Periode akan diumumkan.</p>
          )}
          <h3 className="font-display text-xl mb-2">Syarat &amp; Ketentuan Singkat</h3>
          <ul className="text-sm space-y-1.5 list-disc pl-5">
            <li>Voucher hanya berlaku untuk pembelian {REDEEM_PRODUCT_NAME}.</li>
            <li>Voucher hanya dapat ditukar di cabang tempat klaim diajukan.</li>
            <li>Konten yang ditolak dapat diajukan ulang tanpa perlu membeli ulang.</li>
            <li>Reward tidak berlaku kumulatif antar tier konten.</li>
            <li>Aurora Hijab berhak menahan (HOLD) klaim/konten yang memerlukan verifikasi lanjutan.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
