"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";

/**
 * Renders (client-side, via the `qrcode` package) a scannable QR encoding
 * the registration link for the agent's OWN branch only. `branchName` and
 * `qrUrl` are both server-resolved props (see app/agent/dashboard/page.tsx)
 * — there is no branch picker, no editable input, and nothing here is ever
 * sent back to a server action, so an agent has no way to view or generate
 * a QR for any branch other than their own. `qrUrl` is a public link
 * (`{origin}/?branch=CODE}`), not sensitive data — the QR is meant to be
 * shown/printed/shared with customers.
 */
export function BranchQrCard({ branchName, branchCode, qrUrl }: { branchName: string; branchCode: string; qrUrl: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(qrUrl, {
      width: 480,
      margin: 2,
      color: { dark: "#1f1147", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [qrUrl]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setModalOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  function handleDownload() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `QR-Registrasi-${branchCode}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (permissions, non-HTTPS context);
      // failing silently here is fine, the link is also visible as text.
    }
  }

  return (
    <div className="card space-y-3.5">
      <div>
        <p className="section-title">QR Registrasi Cabang</p>
        <p className="text-xs text-plum-400 dark:text-cream-100/60">
          Customer scan QR ini untuk membuka halaman pendaftaran dengan cabang otomatis terisi ke {branchName}.
        </p>
      </div>

      <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-cream-200 bg-cream-50 p-4 dark:border-plum-500/40 dark:bg-plum-600/40">
        <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-xl bg-white p-2">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- locally generated data URL, not a Next-optimizable remote asset
            <img src={dataUrl} alt={`QR registrasi cabang ${branchName}`} className="h-full w-full object-contain" />
          ) : (
            <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-cream-200 border-t-gold-500" />
          )}
        </div>
        <p className="text-sm font-bold text-plum-600 dark:text-cream-100">{branchName}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Button type="button" variant="outline" onClick={() => setModalOpen(true)} className="text-xs">
          Show QR
        </Button>
        <Button type="button" variant="outline" onClick={handleDownload} disabled={!dataUrl} className="text-xs">
          Download QR
        </Button>
        <Button type="button" variant="outline" onClick={handleCopyLink} className="col-span-2 text-xs sm:col-span-1">
          {copied ? "Link Disalin!" : "Copy Link"}
        </Button>
      </div>

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`QR registrasi cabang ${branchName}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 dark:bg-plum-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-bold text-plum-600 dark:text-cream-100">QR Registrasi</p>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Tutup"
                className="flex h-8 w-8 items-center justify-center rounded-full text-plum-400 hover:bg-cream-100 dark:text-cream-100/60 dark:hover:bg-plum-500/30"
              >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 flex flex-col items-center gap-3">
              <div className="flex w-full items-center justify-center rounded-xl bg-white p-3">
                {dataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- locally generated data URL, not a Next-optimizable remote asset
                  <img src={dataUrl} alt={`QR registrasi cabang ${branchName}`} className="h-64 w-64 object-contain" />
                )}
              </div>
              <p className="text-center text-sm font-bold text-plum-600 dark:text-cream-100">{branchName}</p>
              <p className="break-all text-center text-[11px] text-plum-400 dark:text-cream-100/60">{qrUrl}</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={handleDownload} disabled={!dataUrl} className="text-xs">
                Download QR
              </Button>
              <Button type="button" onClick={handleCopyLink} className="text-xs">
                {copied ? "Link Disalin!" : "Copy Link"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
