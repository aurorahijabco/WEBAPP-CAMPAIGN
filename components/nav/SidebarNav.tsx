"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SidebarNav({
  title,
  items,
}: {
  title: string;
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  return (
    <aside className="w-full shrink-0 border-b border-cream-200 bg-white/70 dark:border-plum-500/30 dark:bg-plum-700/40 md:w-56 md:border-b-0 md:border-r">
      <div className="flex items-center gap-2.5 p-4">
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[10px] bg-gradient-to-br from-gold-300 to-gold-500 font-display text-sm font-bold text-plum-900">
          A
        </div>
        <span className="font-display text-base font-bold text-plum-600 dark:text-cream-100">{title}</span>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition",
                active
                  ? "bg-plum-600 text-cream-50 dark:bg-gold-500 dark:text-plum-900"
                  : "text-plum-500 hover:bg-cream-100 dark:text-cream-100/70 dark:hover:bg-plum-500/20"
              )}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
