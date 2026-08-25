"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const VISIBLE_MS = 3500;
const TRANSITION_MS = 300;

/**
 * Floating "Selamat Datang" toast shown when the landing page is opened via
 * a branch QR (?branch=CODE). `branchName` is already resolved+validated
 * server-side (see app/page.tsx) — this component only ever renders a name
 * that came from `branches.name` in the database, never the raw URL value.
 *
 * The single effect below keys off `branchName` (a primitive), so a parent
 * re-render that doesn't change the resolved branch never restarts the
 * timers or re-shows the toast.
 */
export function BranchWelcomeToast({ branchName }: { branchName: string | null }) {
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!branchName) return;

    const showFrame = requestAnimationFrame(() => setVisible(true));
    const hideTimer = setTimeout(() => setVisible(false), VISIBLE_MS);
    const removeTimer = setTimeout(() => setDone(true), VISIBLE_MS + TRANSITION_MS);

    return () => {
      cancelAnimationFrame(showFrame);
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, [branchName]);

  if (!branchName || done) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex justify-center px-4 sm:top-5"
    >
      <div
        role="status"
        className={cn(
          "flex max-w-[min(92vw,380px)] items-center gap-2.5 rounded-2xl border px-4 py-3 shadow-pop",
          "border-gold-400/50 bg-white text-plum-700",
          "dark:border-gold-400/30 dark:bg-plum-700 dark:text-cream-100",
          "transition-all duration-300 ease-out",
          visible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
        )}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-500 text-plum-900">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </span>
        <span className="text-[13px] font-semibold leading-snug">
          Selamat Datang di Aurora Campaign - Cabang {branchName}
        </span>
      </div>
    </div>
  );
}
