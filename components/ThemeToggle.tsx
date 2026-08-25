"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { IconMoon, IconSun } from "@/components/icons";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  // Customer pages have a fixed bottom nav bar spanning most of the
  // viewport width on mobile; a bottom-4/right-4 toggle would sit on top of
  // its rightmost tab. Lift the toggle above the nav on those routes only.
  const pathname = usePathname();
  const hasBottomNav = pathname?.startsWith("/customer");

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("aurora_theme", next ? "dark" : "light");
    } catch {
      // localStorage unavailable (private mode) — theme just won't persist
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Ganti tema terang atau gelap"
      title="Ganti tema terang/gelap"
      className={cn(
        "fixed right-4 z-[60] flex h-11 w-11 items-center justify-center rounded-full",
        "border border-cream-200 bg-white text-plum-600 shadow-pop transition",
        "hover:scale-105 active:scale-95 dark:border-plum-500/40 dark:bg-plum-600 dark:text-cream-100",
        hasBottomNav ? "bottom-24" : "bottom-4"
      )}
    >
      {dark ? <IconSun className="h-[19px] w-[19px]" /> : <IconMoon className="h-[19px] w-[19px]" />}
    </button>
  );
}
