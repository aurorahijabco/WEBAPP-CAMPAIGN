"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ICONS = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  ),
  ticket: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9a2 2 0 0 0 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 1 0-4V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  ),
};

const ITEMS = [
  { href: "/customer/dashboard", label: "Beranda", icon: ICONS.home },
  { href: "/customer/vouchers", label: "Voucher", icon: ICONS.ticket },
  { href: "/customer/claims/new", label: "Klaim", icon: ICONS.plus, fab: true },
  { href: "/customer/notifications", label: "Info", icon: ICONS.bell },
  { href: "/customer/profile", label: "Akun", icon: ICONS.user },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-3 left-1/2 z-40 flex w-[calc(100%-24px)] max-w-md -translate-x-1/2
                 items-stretch justify-around gap-0.5 rounded-[22px] border border-cream-200
                 bg-white p-1.5 shadow-pop dark:border-plum-500/40 dark:bg-plum-700/90"
    >
      {ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        if (item.fab) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="-mt-4 flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-2 text-[10px] font-bold text-plum-400 dark:text-cream-100/70"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-500 text-plum-900 shadow-pop [&>svg]:h-[18px] [&>svg]:w-[18px]"
              >
                {item.icon}
              </span>
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-2 text-[10px] font-bold transition-colors",
              "[&>svg]:h-[19px] [&>svg]:w-[19px]",
              active
                ? "bg-cream-100 text-plum-600 [&>svg]:stroke-gold-500 dark:bg-plum-500/30 dark:text-cream-100"
                : "text-plum-300 [&>svg]:stroke-plum-300 dark:text-cream-100/40 dark:[&>svg]:stroke-cream-100/40"
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
