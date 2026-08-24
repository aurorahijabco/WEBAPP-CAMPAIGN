"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/customer/dashboard", label: "Home", icon: "🏠" },
  { href: "/customer/claims/new", label: "Klaim", icon: "🧾" },
  { href: "/customer/vouchers", label: "Voucher", icon: "🎟️" },
  { href: "/customer/notifications", label: "Notif", icon: "🔔" },
  { href: "/customer/profile", label: "Profil", icon: "👤" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-cream-200 bg-white/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-xs font-medium",
                  active ? "text-plum-600" : "text-plum-400"
                )}
              >
                <span aria-hidden className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
