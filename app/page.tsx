import Link from "next/link";
import { REDEEM_PRODUCT_NAME, REDEEM_PRODUCT_REFERENCE_PRICE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { cn, formatDate } from "@/lib/utils";
import { IconChevronDown, IconGift, IconShield, IconSparkles, IconStore } from "@/components/icons";

async function getRedemptionPeriod() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaign_settings")
    .select("value")
    .eq("key", "redemption_period")
    .single();
  return data?.value as { start: string; end: string } | undefined;
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

export default async function LandingPage() {
  const period = await getRedemptionPeriod();

  return (
    <main className="min-h-screen bg-cream-50 text-plum-700 dark:bg-plum-900 dark:text-cream-100">
      {/* Hero */}
      <section
        className="relative overflow-hidden px-6 pt-14 pb-11 text-white"
        style={{ background: "radial-gradient(circle at 18% -14%, #6B3548, #3B1F2B 52%, #1a0c12 122%)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(201,163,116,0.4), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-10 h-52 w-52 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(201,123,132,0.28), transparent 70%)" }}
        />

        <div className="relative z-10 mx-auto max-w-md">
          <div className="mb-6 flex items-center gap-2.5">
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[10px] bg-gradient-to-br from-gold-300 to-gold-500 font-display text-sm font-bold text-plum-900 shadow-pop">
              A
            </div>
            <span className="font-display text-sm font-bold">Aurora Hijab</span>
          </div>

          <p className="mb-4 inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-rose-200">
            <span className="inline-block h-px w-4 bg-gold-400" />
            Voucher Reward Campaign
          </p>

          <h1 className="font-display text-[32px] font-semibold leading-[1.1] md:text-[40px]">
            Buat konten.
            <br />
            Dapatkan voucher
            <br />
            hingga <span className="text-gold-400">Rp50.000</span>.
          </h1>

          <p className="mt-4 max-w-[420px] text-[15px] text-white/80">
            Lakukan pembelian Series Agustin melalui Agen Aurora Hijab, unggah struk, buat konten
            orisinal, dan klaim reward-mu. Voucher eksklusif hanya dapat ditukarkan untuk{" "}
            {REDEEM_PRODUCT_NAME}.
          </p>

          <div className="mt-6">
            <a href="#join" className="btn-gold inline-flex max-w-[300px]">
              <IconSparkles className="h-[17px] w-[17px]" /> Ikutan Sekarang
            </a>
          </div>

          <div className="mt-7 grid grid-cols-4 gap-2">
            {[
              ["20K", "Story Photo"],
              ["30K", "Feed Photo"],
              ["40K", "Feed Reels"],
              ["50K", "Maksimum"],
            ].map(([amt, lbl], i) => (
              <div
                key={lbl}
                className={cn(
                  "rounded-2xl border p-3 text-center backdrop-blur",
                  i === 3
                    ? "border-transparent bg-gradient-to-br from-gold-300 to-gold-500 text-plum-900 shadow-pop"
                    : "border-white/20 bg-white/10"
                )}
              >
                <p className="font-mono text-[13.5px] font-bold">{amt}</p>
                <p className={cn("mt-1 text-[9px] uppercase tracking-wide", i === 3 ? "text-plum-900/90" : "text-white/75")}>
                  {lbl}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col items-center gap-1.5 pb-1 text-white/70">
            <span className="text-[11.5px] font-bold">Scroll ke bawah untuk ikutan</span>
            <IconChevronDown className="h-4 w-4 animate-bounce text-gold-400" />
          </div>
        </div>
      </section>

      {/* Body sections — overlaps the hero with a rounded top corner, matching the mockup */}
      <div className="relative z-10 -mt-7 space-y-6 rounded-t-[2.5rem] bg-cream-50 px-5 pb-4 pt-7 dark:bg-plum-900 md:px-8">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Tentang Campaign */}
          <section>
            <p className="section-title mb-3">Tentang Campaign</p>
            <div className="card card-accent">
              <p className="text-[13.5px] leading-relaxed text-plum-400 dark:text-cream-100/70">
                Aurora Hijab mengajak kamu berbagi pengalaman memakai <strong>Series Agustin</strong> lewat
                konten orisinal di Instagram atau TikTok. Beli Series Agustin lewat Agen Aurora, unggah
                struk, buat konten (wajib mention <strong>@aurorahijab.co</strong>), lalu klaim voucher.
                Reward <strong>tidak kumulatif</strong> — nilai mengikuti tier tertinggi yang terverifikasi,
                hingga maksimal Rp50.000. Jika konten ditolak, kamu bisa retry tanpa beli ulang. Voucher
                hanya untuk <strong>{REDEEM_PRODUCT_NAME}</strong> dan hanya ditukar di cabang tempat klaim.
              </p>
            </div>
          </section>

          {/* Cara Kerja */}
          <section>
            <p className="section-title mb-3">Cara Kerja</p>
            <div className="card divide-y divide-dashed divide-cream-200 dark:divide-plum-500/30">
              {[
                "Lakukan pembelian Series Agustin melalui Agen Aurora Hijab sebagai syarat utama keikutsertaan.",
                "Scan QR Code atau gunakan link yang diberikan oleh Agen untuk registrasi/login dan unggah struk pembelanjaanmu.",
                "Setelah pembelian terverifikasi, unggah konten orisinal (Story / Feed Photo / Feed Reels), wajib mention @aurorahijab.co.",
                "Dapatkan voucher hingga Rp50.000 (tidak kumulatif). Tukar di cabang tempat klaim untuk Series Sarimbit pada periode redemption.",
              ].map((text, i) => (
                <div key={i} className="flex gap-3.5 py-3 first:pt-0 last:pb-0">
                  <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[10px] bg-cream-100 font-mono text-xs font-extrabold text-gold-500 dark:bg-plum-500/30">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="pt-1 text-[13.5px]">{text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Syarat Konten */}
          <section>
            <p className="section-title mb-3">Syarat Konten</p>
            <div className="card">
              <KV k="Orisinalitas" v="Konten harus orisinal & dibuat sendiri. Retry tanpa beli ulang jika ditolak" />
              <KV k="Produk" v="Series Agustin harus terlihat jelas & menjadi bagian utama konten" />
              <KV k="Wajib mention" v="@aurorahijab.co di TikTok dan/atau Instagram" />
              <KV k="Story Photo" v="Foto/testimoni orisinal (Reward Rp20.000)" />
              <KV k="Feed Photo" v="Foto orisinal produk terlihat jelas (Reward Rp30.000)" />
              <KV k="Feed Reels" v="Video orisinal min. 30 detik + konsep/effort jelas (Reward Rp40.000)" />
              <KV
                k="Kombinasi"
                v={
                  <>
                    <strong>Tidak kumulatif.</strong> Nilai = tier tertinggi; maks. Rp50.000 jika ketiga
                    jenis terverifikasi
                  </>
                }
              />
            </div>
          </section>

          {/* Redemption */}
          <section>
            <p className="section-title mb-3">Redemption</p>
            <div className="card">
              <KV
                k="Periode redemption"
                v={period ? `${formatDate(period.start)} — ${formatDate(period.end)}` : "Akan diumumkan"}
              />
              <KV k="Produk Redemption" v={`Eksklusif ${REDEEM_PRODUCT_NAME} (tidak dapat diuangkan)`} />
              <KV k="Tempat penukaran" v="Hanya di cabang tempat klaim / pembelian" />
              <KV k="Harga referensi" v={`Rp${REDEEM_PRODUCT_REFERENCE_PRICE.toLocaleString("id-ID")} / piece`} />
              <KV k="1 voucher" v="1 transaksi" />
              <KV k="Promo lain" v="Tidak dapat digabung dengan promo lain kecuali diizinkan Aurora" />
            </div>
          </section>

          {/* Syarat & Ketentuan (full) */}
          <section id="sk">
            <p className="section-title mb-3">Syarat &amp; Ketentuan</p>
            <div className="card">
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
            </div>
          </section>

          {/* Gabung Campaign */}
          <section id="join" className="scroll-mt-6">
            <div className="card text-center">
              <div className="mx-auto mb-1 flex h-16 w-16 items-center justify-center rounded-[22px] bg-cream-100 text-gold-500 dark:bg-plum-500/30">
                <IconGift className="h-7 w-7" />
              </div>
              <h2 className="mt-3 font-display text-xl">Gabung Campaign</h2>
              <p className="mt-1.5 text-[13px] text-plum-400 dark:text-cream-100/70">
                Buat akun baru atau masuk ke akun yang sudah ada.
              </p>
              <div className="mt-5 flex flex-col gap-2.5">
                <Link href="/register" className="btn-primary">
                  Buat Akun
                </Link>
                <Link href="/login" className="btn-outline">
                  Masuk (Login)
                </Link>
              </div>
              <hr className="my-5 border-cream-200 dark:border-plum-500/30" />
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-plum-400 dark:text-cream-100/60">
                Login lainnya
              </p>
              <div className="flex flex-wrap justify-center gap-2.5">
                <Link
                  href="/agent-login"
                  className="inline-flex items-center gap-1.5 rounded-full border border-cream-200 bg-white px-4 py-2.5 text-[12.5px] font-bold text-plum-400 dark:border-plum-500/40 dark:bg-plum-700/60 dark:text-cream-100/80"
                >
                  <IconStore className="h-3.5 w-3.5" /> Agen Cabang
                </Link>
                <Link
                  href="/admin-login"
                  className="inline-flex items-center gap-1.5 rounded-full border border-cream-200 bg-white px-4 py-2.5 text-[12.5px] font-bold text-plum-400 dark:border-plum-500/40 dark:bg-plum-700/60 dark:text-cream-100/80"
                >
                  <IconShield className="h-3.5 w-3.5" /> Super Admin
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
