import Link from "next/link";
import { CONTENT_REQUIREMENTS, REDEEM_PRODUCT_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { cn, formatDate } from "@/lib/utils";

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
    <main className="min-h-screen bg-cream-50 text-plum-700">
      {/* Hero */}
      <section
        className="relative overflow-hidden px-6 pt-16 pb-14 text-white"
        style={{
          background:
            "radial-gradient(circle at 18% -14%, #6B3548, #3B1F2B 52%, #1a0c12 122%)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(201,163,116,0.4), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(201,123,132,0.28), transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-rose-200">
            <span className="inline-block h-px w-4 bg-gold-400" />
            Aurora Hijab
          </p>
          <h1 className="font-display text-4xl leading-tight md:text-5xl mb-4">
            Voucher <span className="text-gold-400">Reward</span> Campaign
          </h1>
          <p className="mx-auto mb-8 max-w-md text-white/80">
            Beli Series Agustin, ceritakan pengalamanmu di media sosial, dan dapatkan voucher
            eksklusif untuk berbelanja {REDEEM_PRODUCT_NAME}.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="btn-gold">Daftar Sekarang</Link>
            <Link href="/login" className="btn-outline border-white/30 text-white hover:bg-white/10">
              Masuk
            </Link>
          </div>
          <div className="mt-6 flex justify-center gap-4 text-xs text-white/60">
            <Link href="/agent-login" className="underline underline-offset-2">Login Agen Cabang</Link>
            <span>·</span>
            <Link href="/admin-login" className="underline underline-offset-2">Login Admin</Link>
          </div>

          <div className="relative z-10 mt-8 grid grid-cols-4 gap-2">
            {[
              ["Story", "Rp20rb"],
              ["Photo", "Rp30rb"],
              ["Reels", "Rp40rb"],
              ["Semua", "Rp50rb"],
            ].map(([label, amt], i) => (
              <div
                key={label}
                className={cn(
                  "rounded-2xl border p-3 text-center backdrop-blur",
                  i === 3
                    ? "border-transparent bg-gradient-to-br from-gold-300 to-gold-500 text-plum-900 shadow-pop"
                    : "border-white/20 bg-white/10"
                )}
              >
                <p className="font-mono text-[13px] font-bold">{amt}</p>
                <p className={cn("mt-1 text-[9px] uppercase tracking-wide", i === 3 ? "text-plum-900/80" : "text-white/70")}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 -mt-8 rounded-t-[2.5rem] bg-cream-50 px-6 py-12 text-plum-700">
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
