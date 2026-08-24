import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aurora Hijab — Voucher Reward Campaign",
  description:
    "Beli Series Agustin, submit konten, dapatkan voucher untuk Series Sarimbit di Aurora Hijab.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
