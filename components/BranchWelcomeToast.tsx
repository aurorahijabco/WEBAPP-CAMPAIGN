"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const VISIBLE_MS = 2000;
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
          "notice notice-success shadow-pop max-w-[min(92vw,380px)] transition-all duration-300 ease-out",
          visible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
        )}
      >
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        <span className="text-[13px] font-semibold">Selamat Datang di Aurora Campaign - Cabang {branchName}</span>
      </div>
    </div>
  );
}
