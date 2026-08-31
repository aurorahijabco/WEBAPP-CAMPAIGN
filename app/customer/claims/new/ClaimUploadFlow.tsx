"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitClaimReceipt, type ClaimReceiptState } from "@/app/customer/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { formatIDR } from "@/lib/utils";

type Phase = "idle" | "uploading" | "valid" | "invalid" | "error";

const BUSY_LABEL: Record<string, string> = {
  uploading: "Mengunggah struk...",
};

const SUPPORTED_TYPES = "image/jpeg,image/png,image/webp,image/heic,image/heif";

// Client-only safety net so the user is never stuck staring at the spinner
// indefinitely on a dropped connection or a hung serverless invocation.
const CLIENT_TIMEOUT_MS = 35_000;
const TIMEOUT_MESSAGE = "Permintaan memakan waktu terlalu lama. Periksa koneksi internet kamu, lalu coba lagi.";

/**
 * The "Claim" screen: customer picks a receipt photo, enters the total
 * amount shown on it, and submits (via the `submitClaimReceipt` Server
 * Action, called directly — no automated verification). The claim always
 * lands in HOLD ("menunggu review") for a Super Admin to manually check the
 * photo and approve/reject — see app/admin/receipts. An invalid/errored
 * attempt never leaves a stray row, so retrying with a different photo is
 * always safe.
 */
export function ClaimUploadFlow() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<ClaimReceiptState | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const busyRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  // Bumped on every new attempt (submit call or reset). A late-arriving
  // result from an attempt the user has already backed out of (via the
  // timeout's retry button, or a fresh upload) is stale and must never
  // clobber whatever state is current by then.
  const generationRef = useRef(0);

  function clearTimers() {
    for (const t of timersRef.current) window.clearTimeout(t);
    timersRef.current = [];
  }

  function pickFile(f: File) {
    setFile(f);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(f);
    });
  }

  async function handleSubmit() {
    if (busyRef.current || !file) return;
    const amountValue = Number(amount);
    if (!amount || !Number.isFinite(amountValue) || amountValue <= 0) {
      setResult({ status: "error", error: "Masukkan nominal total belanja sesuai struk." });
      setPhase("error");
      return;
    }

    busyRef.current = true;
    const generation = ++generationRef.current;

    clearTimers();
    setResult(null);
    setPhase("uploading");

    const formData = new FormData();
    formData.set("photo", file);
    formData.set("amount", amount);

    const timeout = new Promise<ClaimReceiptState>((resolve) => {
      timersRef.current.push(
        window.setTimeout(() => resolve({ status: "error", error: TIMEOUT_MESSAGE }), CLIENT_TIMEOUT_MS)
      );
    });

    let outcome: ClaimReceiptState;
    try {
      outcome = await Promise.race([submitClaimReceipt(formData), timeout]);
    } catch {
      outcome = { status: "error", error: "Terjadi kesalahan saat mengirim struk. Silakan coba lagi." };
    }

    // The real request may still be in flight after the client timeout won
    // the race, or the user may have already reset/retried — either way,
    // only the attempt that's still current is allowed to update the UI.
    if (generationRef.current !== generation) return;

    clearTimers();
    busyRef.current = false;
    setResult(outcome);
    setPhase(outcome.status);
  }

  function reset() {
    generationRef.current++;
    clearTimers();
    busyRef.current = false;
    setResult(null);
    setFile(null);
    setAmount("");
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    setPhase("idle");
  }

  const busy = phase === "uploading";

  return (
    <div className="space-y-4">
      {phase === "idle" && (
        <div className="space-y-4">
          <label
            htmlFor="claim-photo"
            className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-cream-200 bg-cream-50 px-6 py-10 text-center transition hover:border-gold-400 dark:border-plum-500/40 dark:bg-plum-600/40"
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- transient local object URL preview, not a Next-optimizable asset
              <img src={previewUrl} alt="Preview struk yang dipilih" className="h-28 w-28 rounded-xl object-cover" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cream-100 text-gold-500 dark:bg-plum-500/30">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
                  <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
                </svg>
              </span>
            )}
            <span className="text-sm font-bold text-plum-600 dark:text-cream-100">
              {file ? "Ganti Foto Struk" : "Upload Foto Struk"}
            </span>
            <span className="text-xs text-plum-400 dark:text-cream-100/60">JPG, PNG, atau WEBP — maksimal 5MB</span>
            <input
              id="claim-photo"
              type="file"
              accept={SUPPORTED_TYPES}
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) pickFile(f);
              }}
            />
          </label>

          {file && (
            <div className="space-y-2">
              <label htmlFor="claim-amount" className="text-xs font-bold text-plum-600 dark:text-cream-100">
                Nominal Total Belanja (sesuai struk)
              </label>
              <Input
                id="claim-amount"
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="Contoh: 250000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Button className="w-full" onClick={handleSubmit}>
                Kirim untuk Review
              </Button>
            </div>
          )}
        </div>
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
            <span>Struk berhasil dikirim dan menunggu review dari tim Aurora Hijab.</span>
          </div>

          <div className="card">
            <p className="section-title mb-3">Struk Kamu</p>
            <div className="kv">
              <p className="kv-k">Nama Cabang</p>
              <p className="kv-v">{result.branchName}</p>
            </div>
            <div className="kv">
              <p className="kv-k">Total Belanja</p>
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
