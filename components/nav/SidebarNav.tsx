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
    <aside className="w-full md:w-56 md:shrink-0 border-b md:border-b-0 md:border-r border-cream-200 bg-white/70">
      <div className="p-4 font-display text-lg text-plum-600">{title}</div>
      <nav className="flex md:flex-col overflow-x-auto md:overflow-visible px-2 pb-2 gap-1">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium",
                active ? "bg-plum-600 text-cream-50" : "text-plum-500 hover:bg-cream-100"
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
