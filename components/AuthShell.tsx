import Link from "next/link";

export function AuthShell({
  title,
  subtitle,
  eyebrow,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  eyebrow?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-cream-50 dark:bg-plum-900">
      <div className="flex items-center gap-2.5 px-5 py-4 sm:px-8">
        <Link
          href="/"
          aria-label="Kembali ke beranda"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-cream-200 bg-white text-plum-600 dark:border-plum-500/40 dark:bg-plum-700/60 dark:text-cream-100"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[10px] bg-gradient-to-br from-gold-300 to-gold-500 font-display text-sm font-bold text-plum-900">
          A
        </div>
        <div className="leading-tight">
          <p className="font-display text-sm font-bold text-plum-600 dark:text-cream-100">Aurora Hijab</p>
          {eyebrow && (
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-gold-500">{eyebrow}</p>
          )}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-14 pt-2 sm:max-w-lg sm:px-8 lg:max-w-xl">
        <h1 className="font-display text-2xl text-plum-600 dark:text-cream-100 sm:text-3xl">{title}</h1>
        <p className="mt-1.5 text-sm text-plum-400 dark:text-cream-100/70">{subtitle}</p>

        <div className="card mt-6 sm:p-7">{children}</div>

        {footer && <div className="mt-6 text-center text-sm text-plum-400 dark:text-cream-100/70">{footer}</div>}
      </div>
    </main>
  );
}
