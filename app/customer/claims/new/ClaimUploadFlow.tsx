"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitClaimReceipt, type ClaimReceiptState } from "@/app/customer/actions";
import { Button } from "@/components/ui/Button";
import { formatIDR } from "@/lib/utils";

type Phase = "idle" | "uploading" | "reading" | "processing" | "valid" | "invalid" | "error";

const BUSY_LABEL: Record<string, string> = {
  uploading: "Mengunggah foto struk...",
  reading: "Membaca struk (OCR)...",
  processing: "Memverifikasi data...",
};

const SUPPORTED_TYPES = "image/jpeg,image/png,image/webp,image/heic,image/heif";

/**
 * The entire "Claim" screen: a single upload control that immediately runs
 * Gemini OCR (via the `submitClaimReceipt` Server Action, called directly —
 * no form/submit button) and walks through
 * Upload -> Reading Receipt -> Processing -> Result -> Valid/Invalid.
 * There is nothing left for the user to type: branch, items, and total all
 * come back from the OCR-verified result. The claim row is only ever
 * created server-side once validation (including the "Series Agustin" item
 * check) passes, so an invalid/errored attempt never leaves a stray row —
 * retrying just re-runs this same flow with a new photo.
 */
export function ClaimUploadFlow() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<ClaimReceiptState | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const busyRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  function clearTimers() {
    for (const t of timersRef.current) window.clearTimeout(t);
    timersRef.current = [];
  }

  async function handleFile(file: File) {
    if (busyRef.current) return;
    busyRef.current = true;

    clearTimers();
    setResult(null);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
    setPhase("uploading");

    const formData = new FormData();
    formData.set("photo", file);

    // Cosmetic stage labels layered on top of one real request: OCR,
    // deterministic validation, and the DB write all happen inside a single
    // atomic submitClaimReceipt call, so a claim is never created for a
    // photo that ultimately fails validation.
    timersRef.current.push(window.setTimeout(() => setPhase("reading"), 350));
    timersRef.current.push(window.setTimeout(() => setPhase("processing"), 2200));

    let outcome: ClaimReceiptState;
    try {
      outcome = await submitClaimReceipt(formData);
    } catch {
      outcome = { status: "error", error: "Terjadi kesalahan saat memverifikasi struk. Silakan coba lagi." };
    }

    clearTimers();
    busyRef.current = false;
    setResult(outcome);
    setPhase(outcome.status);
  }

  function reset() {
    clearTimers();
    busyRef.current = false;
    setResult(null);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    setPhase("idle");
  }

  const busy = phase === "uploading" || phase === "reading" || phase === "processing";

  return (
    <div className="space-y-4">
      {phase === "idle" && (
        <label
          htmlFor="claim-photo"
          className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-cream-200 bg-cream-50 px-6 py-10 text-center transition hover:border-gold-400 dark:border-plum-500/40 dark:bg-plum-600/40"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cream-100 text-gold-500 dark:bg-plum-500/30">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
              <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
            </svg>
          </span>
          <span className="text-sm font-bold text-plum-600 dark:text-cream-100">Upload Foto Struk</span>
          <span className="text-xs text-plum-400 dark:text-cream-100/60">JPG, PNG, atau WEBP — maksimal 5MB</span>
          <input
            id="claim-photo"
            type="file"
            accept={SUPPORTED_TYPES}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </label>
      )}

      {busy && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-4 rounded-2xl border border-cream-200 bg-cream-50 px-6 py-10 text-center dark:border-plum-500/40 dark:bg-plum-600/40"
        >
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- transient local object URL preview, not a Next-optimizable asset
            <img src={previewUrl} alt="Preview struk yang diunggah" className="h-28 w-28 rounded-xl object-cover opacity-70" />
          )}
          <span
            aria-hidden
            className="h-9 w-9 animate-spin rounded-full border-[3px] border-cream-200 border-t-gold-500 dark:border-plum-500/40 dark:border-t-gold-400"
          />
          <p className="text-sm font-bold text-plum-600 dark:text-cream-100">{BUSY_LABEL[phase]}</p>
          <p className="text-xs text-plum-400 dark:text-cream-100/60">Jangan tutup halaman ini.</p>
        </div>
      )}

      {phase === "valid" && result?.status === "valid" && (
        <div className="space-y-4">
          <div className="notice notice-success">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span>Struk valid — pembelian Series Agustin terverifikasi.</span>
          </div>

          <div className="card">
            <p className="section-title mb-3">Hasil Verifikasi Struk</p>
            <div className="kv">
              <p className="kv-k">Nama Cabang</p>
              <p className="kv-v">{result.branchName}</p>
            </div>
            <div className="py-2.5">
              <p className="kv-k mb-1.5">Item yang Dibeli</p>
              <ul className="list-disc space-y-1 pl-[18px] text-[13px] text-plum-600 dark:text-cream-100">
                {result.items.map((it, i) => (
                  <li key={i}>
                    {it.name}
                    {it.qty > 1 ? ` × ${it.qty}` : ""}
                  </li>
                ))}
              </ul>
            </div>
            <div className="kv">
              <p className="kv-k">Total Bill</p>
              <p className="kv-v">{formatIDR(result.total)}</p>
            </div>
          </div>

          <Button className="w-full" onClick={() => router.push(`/customer/claims/${result.claimId}`)}>
            Lanjut ke Detail Klaim
          </Button>
        </div>
      )}

      {phase === "invalid" && result?.status === "invalid" && (
        <div className="space-y-4">
          <div className="notice notice-danger">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
            <span>Klaim tidak valid: {result.reason}</span>
          </div>
          <Button variant="outline" className="w-full" onClick={reset}>
            Upload Ulang
          </Button>
        </div>
      )}

      {phase === "error" && result?.status === "error" && (
        <div className="space-y-4">
          <div className="notice notice-danger">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <span>{result.error}</span>
          </div>
          <Button variant="outline" className="w-full" onClick={reset}>
            Coba Lagi
          </Button>
        </div>
      )}
    </div>
  );
}
