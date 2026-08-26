import type { Metadata } from "next";
import "./globals.css";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Aurora Hijab — Voucher Reward Campaign",
  description:
    "Beli Series Agustin, submit konten, dapatkan voucher untuk Series Sarimbit di Aurora Hijab.",
};

// Runs before paint so the stored theme applies immediately (no flash of
// the wrong theme). Kept inline since it must execute ahead of hydration.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("aurora_theme");
    var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // suppressHydrationWarning: the inline theme-init script above adds the
  // "dark" class to <html> before React hydrates (to avoid a flash of the
  // wrong theme), which otherwise makes React log a harmless
  // hydration-mismatch warning on every dark-mode page load.
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
