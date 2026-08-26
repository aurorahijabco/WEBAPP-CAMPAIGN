import Link from "next/link";
import { REDEEM_PRODUCT_NAME, REDEEM_PRODUCT_REFERENCE_PRICE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn, formatDate } from "@/lib/utils";
import { IconGift, IconShield, IconSparkles, IconStore } from "@/components/icons";
import { BranchWelcomeToast } from "@/components/BranchWelcomeToast";
import { Accordion } from "@/components/Accordion";

// The public anon-key client no longer touches next/headers cookies() (it
// never did anything auth-related), so Next.js would otherwise statically
// optimize this page at build time and bake in a stale redemption period.
export const dynamic = "force-dynamic";

async function getRedemptionPeriod() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaign_settings")
    .select("value")
    .eq("key", "redemption_period")
    .single();
  return data?.value as { start: string; end: string } | undefined;
}

/**
 * Resolves the QR-detected branch code against the database for the
 * welcome toast — same resolution pattern as the register page. The name
 * shown to the customer always comes from `branches.name`, never the raw
 * URL value, and the toast is only surfaced for a branch that exists and
 * is active. The public anon client can't read `branches` (RLS default-
 * deny), so this uses the service-role client — read-only, and only ever
 * returns a name string to the page, never anything sensitive.
 */
async function getWelcomeBranchName(codeParam: string | undefined): Promise<string | null> {
  if (!codeParam) return null;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("branches")
    .select("name, active")
    .eq("code", codeParam.trim().toUpperCase())
    .maybeSingle();
  if (!data || !data.active) return null;
  return data.name;
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="kv">
      <div className="kv-k">{k}</div>
      <div className="kv-v">{v}</div>
    </div>
  );
}

function SkSection({ title, items }: { title: string; items: React.ReactNode[] }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="mb-2.5 text-[12px] font-extrabold uppercase tracking-wider text-gold-500">{title}</p>
      <ul className="list-disc space-y-1.5 pl-[18px] text-[12.5px] leading-relaxed text-plum-400 dark:text-cream-100/70">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

const REWARD_TIERS = [
  ["Rp20.000", "Story Photo"],
  ["Rp30.000", "Feed Photo"],
  ["Rp40.000", "Feed Reels"],
  ["Rp50.000", "Maksimum"],
] as const;

const STEPS = [
  "Beli Series Agustin melalui Agen Aurora Hijab, lalu unggah struk pembelanjaanmu.",
  "Buat konten orisinal (Story / Feed Photo / Feed Reels) dan wajib mention @aurorahijab.co.",
  "Klaim voucher — nilainya mengikuti tier tertinggi yang terverifikasi (tidak kumulatif).",
  `Tukar voucher untuk ${REDEEM_PRODUCT_NAME} di cabang tempat kamu klaim, selama periode redemption.`,
];

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const { branch } = await searchParams;
  const [period, welcomeBranchName] = await Promise.all([getRedemptionPeriod(), getWelcomeBranchName(branch)]);
  // Carry the QR-detected branch code through to Register — final
  // resolution/validation against the database happens there, never here.
  const registerHref = branch ? `/register?branch=${encodeURIComponent(branch)}` : "/register";
  const periodLabel = period ? `${formatDate(period.start)} — ${formatDate(period.end)}` : "Akan diumumkan";

  return (
    <main className="min-h-screen bg-cream-50 text-plum-700 dark:bg-plum-900 dark:text-cream-100">
      <BranchWelcomeToast branchName={welcomeBranchName} />

      {/* Hero — one soft glow behind the headline instead of layered decorative
          blobs, and a plain kicker -> headline -> subheadline -> CTA order so
          hierarchy reads at a glance. This block is an intentionally "always
          dark" brand surface (white text on the plum gradient), so it reads
          the same regardless of the site's light/dark toggle. */}
      <section
        className="relative overflow-hidden px-6 pb-12 pt-12 text-white sm:px-8 sm:pt-14 lg:pb-16 lg:pt-20"
        style={{ background: "radial-gradient(circle at 50% -18%, #6B3548, #2c1620 58%, #170a0f 122%)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full lg:h-[26rem] lg:w-[26rem]"
          style={{ background: "radial-gradient(circle, rgba(201,163,116,0.3), transparent 72%)" }}
        />

        <div className="relative z-10 mx-auto flex max-w-md flex-col items-center text-center lg:max-w-2xl">
          <div className="mb-8 flex items-center gap-2.5 lg:mb-10">
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[10px] bg-gradient-to-br from-gold-300 to-gold-500 font-display text-sm font-bold text-plum-900 shadow-pop">
              A
            </div>
            <span className="font-display text-sm font-bold">Aurora Hijab</span>
          </div>

          <p className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.24em] text-gold-300/90">
            Voucher Reward Campaign
          </p>

          <h1 className="text-balance font-display text-[clamp(1.85rem,1.4rem+2.2vw,2.9rem)] font-semibold leading-[1.12]">
            Dapat Voucher hingga <span className="text-gold-400">Rp50.000</span>
          </h1>

          <p className="mt-5 max-w-[420px] text-pretty text-[15px] leading-relaxed text-white/75 lg:max-w-[480px] lg:text-base">
            Beli Series Agustin, buat konten, lalu klaim voucher untuk belanja Series Sarimbit.
          </p>

          <a href="#join" className="btn-gold mt-8 inline-flex lg:mt-10">
            <IconSparkles className="h-[17px] w-[17px]" /> Ikut Campaign
          </a>

          {/* Reward teaser — a single quiet line rather than competing badges, so the hero stays uncluttered. */}
          <p className="mt-7 text-[11px] font-semibold uppercase tracking-wide text-white/45 lg:mt-9">
            {REWARD_TIERS.slice(0, 3)
              .map(([, lbl]) => lbl)
              .join(" · ")}
          </p>
        </div>
      </section>

      {/* Body sections — overlaps the hero with a rounded top corner, matching the mockup */}
      <div className="relative z-10 -mt-7 space-y-6 rounded-t-[2.5rem] bg-cream-50 px-5 pb-4 pt-7 dark:bg-plum-900 md:px-8 lg:px-12 lg:pt-10">
        <div className="mx-auto max-w-2xl space-y-6 lg:max-w-3xl">
          {/* Cara Kerja — step-by-step, the first thing after the hero */}
          <section>
            <p className="section-title mb-3">Cara Kerja</p>
            <div className="card divide-y divide-dashed divide-cream-200 dark:divide-plum-500/30">
              {STEPS.map((text, i) => (
                <div key={i} className="flex gap-3.5 py-3 first:pt-0 last:pb-0">
                  <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[10px] bg-cream-100 font-mono text-xs font-extrabold text-gold-500 dark:bg-plum-500/30">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="pt-1 text-[13.5px]">{text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Reward — the full visual breakdown, given its own room now that the hero is uncluttered */}
          <section>
            <p className="section-title mb-3">Reward per Jenis Konten</p>
            <div className="card">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {REWARD_TIERS.map(([amt, lbl], i) => (
                  <div
                    key={lbl}
                    className={cn(
                      "rounded-2xl border p-3 text-center",
                      i === 3
                        ? "border-transparent bg-gradient-to-br from-gold-300 to-gold-500 text-plum-900 shadow-pop"
                        : "border-cream-200 bg-cream-50 dark:border-plum-500/40 dark:bg-plum-500/20"
                    )}
                  >
                    <p className="font-mono text-[13.5px] font-bold">{amt}</p>
                    <p
                      className={cn(
                        "mt-1 text-[9.5px] uppercase tracking-wide",
                        i === 3 ? "text-plum-900/90" : "text-plum-400 dark:text-cream-100/60"
                      )}
                    >
                      {lbl}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-plum-400 dark:text-cream-100/60">
                <strong className="text-plum-600 dark:text-cream-100">Tidak kumulatif</strong> — nilai voucher
                mengikuti tier tertinggi yang terverifikasi, bukan penjumlahan semua konten.
              </p>
            </div>
          </section>

          {/* Highlight — the handful of facts every user must not miss, always visible (never behind a collapse) */}
          <section>
            <p className="section-title mb-3">Yang Perlu Kamu Tahu</p>
            <div className="card">
              <KV k="Redeem voucher untuk" v={REDEEM_PRODUCT_NAME} />
              <KV k="Sifat reward" v="Tidak kumulatif (tier tertinggi)" />
              <KV k="Tempat penukaran" v="Cabang tempat klaim" />
              <KV k="Periode redemption" v={periodLabel} />
            </div>
          </section>

          {/* Detail panjang — dikumpulkan di balik accordion, info krusial sudah tampil di atas.
              id="sk" is the target of the "Baca S&K" link on the register page. */}
          <section id="sk" className="scroll-mt-6 space-y-3">
            <p className="section-title mb-0">Detail Lengkap</p>
            <Accordion title="Syarat Konten">
              <div className="space-y-0">
                <KV k="Orisinalitas" v="Konten orisinal & dibuat sendiri. Retry tanpa beli ulang jika ditolak" />
                <KV k="Produk" v="Series Agustin harus terlihat jelas & jadi bagian utama konten" />
                <KV k="Wajib mention" v="@aurorahijab.co di TikTok dan/atau Instagram" />
                <KV k="Feed Reels" v="Minimal 30 detik + konsep/effort jelas" />
              </div>
            </Accordion>
            <Accordion title="Ketentuan Redemption">
              <div className="space-y-0">
                <KV k="Produk redemption" v={`Eksklusif ${REDEEM_PRODUCT_NAME} (tidak dapat diuangkan)`} />
                <KV k="Harga referensi" v={`Rp${REDEEM_PRODUCT_REFERENCE_PRICE.toLocaleString("id-ID")} / piece`} />
                <KV k="1 voucher" v="1 transaksi" />
                <KV k="Promo lain" v="Tidak dapat digabung, kecuali diizinkan Aurora" />
              </div>
            </Accordion>
            <Accordion title="Syarat & Ketentuan Lengkap">
              <SkSection
                title="Keikutsertaan"
                items={[
                  <>
                    Wajib membeli <strong>Series Agustin</strong> melalui <strong>Agen Aurora Hijab</strong>.
                  </>,
                  "Registrasi & submit konten melalui Landing Page (QR Code / link dari Agen).",
                  "Dengan ikut, customer dianggap telah membaca dan menyetujui seluruh S&K.",
                ]}
              />
              <SkSection
                title="Konten"
                items={[
                  "Konten wajib orisinal, menampilkan Series Agustin dengan jelas, dan memiliki effort / kreativitas.",
                  <>
                    <strong>Wajib mention @aurorahijab.co</strong> di TikTok dan/atau Instagram.
                  </>,
                  "Feed Reels: minimal 30 detik, konsep jelas, bukan slideshow asal-asalan.",
                  "Akun & konten harus dapat diakses untuk verifikasi.",
                  <>
                    Jika ditolak, dapat <strong>retry</strong> tanpa pembelian ulang.
                  </>,
                ]}
              />
              <SkSection
                title="Reward"
                items={[
                  <>
                    Story Photo <strong>Rp20.000</strong> · Feed Photo <strong>Rp30.000</strong> · Feed
                    Reels <strong>Rp40.000</strong>.
                  </>,
                  <>
                    <strong>Tidak kumulatif.</strong> Nilai = tier tertinggi yang terverifikasi.
                  </>,
                  <>
                    Maksimal <strong>Rp50.000</strong> jika ketiga jenis konten terverifikasi.
                  </>,
                ]}
              />
              <SkSection
                title="Voucher & Redemption"
                items={[
                  <>
                    Hanya untuk pembelian <strong>{REDEEM_PRODUCT_NAME}</strong> — tidak untuk Series
                    Agustin.
                  </>,
                  "Tidak dapat diuangkan dan tidak dapat digabung promo lain (kecuali diizinkan Aurora).",
                  <>
                    Hanya ditukar di <strong>cabang tempat klaim</strong>.
                  </>,
                  <>
                    Berlaku selama periode redemption
                    {period ? (
                      <>
                        : <strong>{formatDate(period.start)} — {formatDate(period.end)}</strong>.
                      </>
                    ) : (
                      " sesuai jadwal yang diumumkan."
                    )}
                  </>,
                  "1 voucher = 1 transaksi.",
                ]}
              />
              <SkSection
                title="Verifikasi & Lainnya"
                items={[
                  "Aurora Hijab berhak memverifikasi struk maupun konten secara manual.",
                  "Konten/akun yang melanggar ketentuan atau indikasi kecurangan dapat ditolak / dibatalkan.",
                ]}
              />
            </Accordion>
          </section>

          {/* Gabung Campaign */}
          <section id="join" className="scroll-mt-6">
            <div className="card text-center">
              <div className="mx-auto mb-1 flex h-16 w-16 items-center justify-center rounded-[22px] bg-cream-100 text-gold-500 dark:bg-plum-500/30">
                <IconGift className="h-7 w-7" />
              </div>
              <h2 className="mt-3 font-display text-xl">Ikut Campaign</h2>
              <p className="mt-1.5 text-[13px] text-plum-400 dark:text-cream-100/70">
                Buat akun baru atau masuk ke akun yang sudah ada.
              </p>
              <div className="mt-5 flex flex-col gap-2.5">
                <Link href={registerHref} className="btn-primary">
                  Buat Akun
                </Link>
                <Link href="/login" className="btn-outline">
                  Masuk (Login)
                </Link>
              </div>
            </div>
          </section>
        </div>

        {/* Footer — internal staff logins live here, well out of the primary
            customer register/login flow above (they're not for customers). */}
        <footer className="mx-auto mt-2 max-w-2xl px-1 pb-8 pt-4 text-center">
          <p className="mb-2.5 text-[10.5px] font-bold uppercase tracking-wider text-plum-400/70 dark:text-cream-100/40">
            Untuk staf Aurora Hijab
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-[11.5px]">
            <Link
              href="/agent-login"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold text-plum-400/80 hover:bg-cream-100 dark:text-cream-100/50 dark:hover:bg-plum-500/20"
            >
              <IconStore className="h-3 w-3" /> Login Agen Cabang
            </Link>
            <Link
              href="/admin-login"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold text-plum-400/80 hover:bg-cream-100 dark:text-cream-100/50 dark:hover:bg-plum-500/20"
            >
              <IconShield className="h-3 w-3" /> Login Super Admin
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
