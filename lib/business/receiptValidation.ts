import "server-only";
import type { ReceiptOcrResult } from "@/lib/business/ocr";

// Deterministic, app-layer checks run AFTER Gemini OCR. Gemini's own
// booleans/labels (is_receipt, quality) are inputs here, never the final
// word — every accept/reject decision is made by this plain code, not by
// trusting the model's judgment blindly.

export interface ReceiptValidationContext {
  /** End of the campaign's redemption window (`campaign_settings.redemption_period.end`), or null if unset. */
  redemptionPeriodEnd: Date | null;
  /** `campaign_settings.min_claim_amount` — 0 means no minimum is enforced. */
  minClaimAmount: number;
  /** Name of the branch resolved for this claim (from OCR merchant match, or the customer's registered branch as fallback — never manual input), for a loose merchant-name check. */
  branchName: string;
}

export interface ReceiptValidationResult {
  ok: boolean;
  /** Set when `ok` is false — a user-facing message asking for a re-upload or correction. */
  error?: string;
  /** Non-blocking issues worth a human reviewer's attention (merchant mismatch, missing date, OCR warnings, ...). */
  flagReasons: string[];
}

export function validateReceiptOcr(ocr: ReceiptOcrResult, ctx: ReceiptValidationContext): ReceiptValidationResult {
  const flagReasons: string[] = [];

  if (!ocr.is_receipt) {
    return {
      ok: false,
      error: "Gambar yang diunggah tidak terdeteksi sebagai struk belanja. Silakan upload ulang foto struk yang jelas.",
      flagReasons,
    };
  }

  if (ocr.quality === "unreadable") {
    return {
      ok: false,
      error: "Foto struk terlalu buram/tidak jelas untuk diverifikasi. Silakan upload ulang dengan foto yang lebih jelas.",
      flagReasons,
    };
  }

  if (ocr.total === null) {
    return {
      ok: false,
      error: "Nominal total pada struk tidak dapat terbaca dengan jelas. Silakan upload ulang foto yang lebih jelas.",
      flagReasons,
    };
  }
  if (ocr.total <= 0) {
    return { ok: false, error: "Nominal total pada struk tidak valid. Silakan upload ulang foto struk yang benar.", flagReasons };
  }

  if (ocr.transaction_date) {
    const txDate = new Date(ocr.transaction_date);
    if (!Number.isNaN(txDate.getTime())) {
      if (ctx.redemptionPeriodEnd && txDate.getTime() > ctx.redemptionPeriodEnd.getTime()) {
        return { ok: false, error: "Tanggal transaksi pada struk berada di luar periode campaign.", flagReasons };
      }
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (txDate.getTime() > Date.now() + oneDayMs) {
        return { ok: false, error: "Tanggal transaksi pada struk tidak valid (tanggal di masa depan).", flagReasons };
      }
    }
  } else {
    flagReasons.push("Tanggal transaksi tidak terbaca dari struk");
  }

  if (ctx.minClaimAmount > 0 && ocr.total < ctx.minClaimAmount) {
    return {
      ok: false,
      error: `Nominal transaksi minimal Rp${ctx.minClaimAmount.toLocaleString("id-ID")} untuk mengikuti campaign ini.`,
      flagReasons,
    };
  }

  // Merchant — loose, non-blocking check: OCR'd store names vary in
  // formatting/abbreviation and there is no canonical merchant registry to
  // match exactly against, so a mismatch is flagged for admin review rather
  // than rejected outright (consistent with the existing duplicate-amount
  // trigger, which also flags instead of blocking).
  if (ocr.merchant_name) {
    const merchant = ocr.merchant_name.toLowerCase();
    const matchesBrand = merchant.includes("aurora");
    const matchesBranch = ctx.branchName.length > 0 && merchant.includes(ctx.branchName.toLowerCase());
    if (!matchesBrand && !matchesBranch) {
      flagReasons.push(`Nama merchant pada struk ("${ocr.merchant_name}") tidak cocok dengan Aurora Hijab / cabang terpilih`);
    }
  } else {
    flagReasons.push("Nama merchant tidak terbaca dari struk");
  }

  if (ocr.quality === "blurry" || ocr.quality === "partial") {
    flagReasons.push(`Kualitas foto struk: ${ocr.quality}`);
  }
  for (const warning of ocr.warnings) {
    flagReasons.push(`OCR: ${warning}`);
  }

  return { ok: true, flagReasons };
}

const SERIES_AGUSTIN_KEYWORD = "agustin";

/**
 * The campaign's core eligibility rule: at least one OCR-read line item must
 * be "Series Agustin". Checked against Gemini's `items` array only — never
 * against anything the customer could type — so this can't be spoofed by
 * claiming a product name manually.
 */
export function hasSeriesAgustinItem(items: ReceiptOcrResult["items"]): boolean {
  if (!items) return false;
  return items.some((item) => (item.name ?? "").toLowerCase().includes(SERIES_AGUSTIN_KEYWORD));
}
