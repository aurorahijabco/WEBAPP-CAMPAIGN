"use client";

import { useActionState, useState, useEffect } from "react";
import { redeemVoucher, lookupVoucher } from "@/app/agent/actions";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { REDEEM_PRODUCT_NAME } from "@/lib/constants";
import { formatIDR } from "@/lib/utils";

export function RedeemForm() {
  const [lookupState, lookupAction, lookupPending] = useActionState(lookupVoucher, undefined);
  const [redeemState, redeemAction, redeemPending] = useActionState(redeemVoucher, undefined);
  const [confirmed, setConfirmed] = useState(false);
  const [code, setCode] = useState("");

  const validated = lookupState && "voucher" in lookupState ? lookupState.voucher : undefined;
  // Once a redeem succeeds, lock the form even though `validated.status` is
  // stale ("ACTIVE") — this is a UX guard against re-clicking; the RPC's
  // row lock + ALREADY_REDEEMED check is the real defense against
  // double-submit / race conditions on the server.
  const canRedeem = validated?.status === "ACTIVE" && !redeemState?.success;

  // Any edit to the code after a successful validation invalidates it —
  // the agent must re-validate before redeeming a different code.
  useEffect(() => {
    if (redeemState?.success) {
      setCode("");
      setConfirmed(false);
    }
  }, [redeemState?.success]);

  return (
    <div className="space-y-4">
      <div className="card sm:p-7">
        <form action={lookupAction} className="space-y-4">
          <div>
            <Label htmlFor="code">Kode Voucher</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                name="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="AH-XXXXXXXX"
                required
                autoComplete="off"
                className="uppercase tracking-widest"
              />
              <Button type="submit" variant="secondary" disabled={lookupPending || code.trim().length < 4} className="shrink-0">
                {lookupPending ? "Memeriksa..." : "Validasi"}
              </Button>
            </div>
            <p className="mt-1.5 text-xs text-plum-400 dark:text-cream-100/60">
              Nominal voucher hanya muncul setelah kode berhasil divalidasi dan tidak dapat diubah manual.
            </p>
          </div>
          <FieldError message={lookupState && "error" in lookupState ? lookupState.error : undefined} />
        </form>
      </div>

      {validated && (
        <div className="card sm:p-7">
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-cream-100 p-4 dark:bg-plum-500/20">
            <div className="min-w-0">
              <p className="truncate font-mono text-[13px] font-bold text-plum-600 dark:text-cream-100">{validated.code}</p>
              <p className="truncate text-xs text-plum-400 dark:text-cream-100/70">{validated.customerName ?? "—"}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-lg font-bold text-plum-600 dark:text-cream-100">{formatIDR(validated.value)}</p>
              <Badge status={validated.status} />
            </div>
          </div>

          {!canRedeem && !redeemState?.success && (
            <div className="notice notice-danger mb-4">
              <span>Voucher berstatus {validated.status}, tidak dapat ditukarkan.</span>
            </div>
          )}

          <form action={redeemAction} className="space-y-4">
            <input type="hidden" name="code" value={validated.code} />
            <input type="hidden" name="productName" value={REDEEM_PRODUCT_NAME} />

            <p className="text-sm text-plum-500 dark:text-cream-100/80">
              Produk ditukar: <strong>{REDEEM_PRODUCT_NAME}</strong>
            </p>

            <label className="flex items-start gap-3 rounded-2xl border-[1.5px] border-cream-200 p-3.5 text-sm dark:border-plum-500/40">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                disabled={!canRedeem}
                className="mt-1 h-[19px] w-[19px] accent-gold-500"
              />
              <span className="text-plum-600 dark:text-cream-100">
                Saya sudah memverifikasi identitas pelanggan dan produk {REDEEM_PRODUCT_NAME} yang diambil.
              </span>
            </label>

            <FieldError message={redeemState?.error} />
            {redeemState?.success && (
              <div className="notice notice-success">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span>
                  {redeemState.success} Kode: {redeemState.voucher?.code}
                </span>
              </div>
            )}

            <Button type="submit" disabled={redeemPending || !confirmed || !canRedeem} className="w-full">
              {redeemPending ? "Memproses..." : "Konfirmasi Redeem"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
