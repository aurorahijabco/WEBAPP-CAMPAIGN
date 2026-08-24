"use client";

import { useActionState, useState } from "react";
import { redeemVoucher } from "@/app/agent/actions";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { REDEEM_PRODUCT_NAME, REDEEM_PRODUCT_REFERENCE_PRICE } from "@/lib/constants";

export function RedeemForm() {
  const [state, formAction, pending] = useActionState(redeemVoucher, undefined);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="card sm:p-7">
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="code">Kode Voucher</Label>
          <Input id="code" name="code" placeholder="AH-XXXXXXXX" required className="uppercase tracking-widest" />
        </div>

        <div>
          <Label htmlFor="productName">Produk yang Ditukar</Label>
          <Input id="productName" name="productName" defaultValue={REDEEM_PRODUCT_NAME} required />
        </div>

        <div>
          <Label htmlFor="amount">Nominal Redeem (Rp)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min={0}
            defaultValue={REDEEM_PRODUCT_REFERENCE_PRICE}
            required
          />
        </div>

        <label className="flex items-start gap-3 rounded-2xl border-[1.5px] border-cream-200 p-3.5 text-sm dark:border-plum-500/40">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 h-[19px] w-[19px] accent-gold-500"
          />
          <span className="text-plum-600 dark:text-cream-100">
            Saya sudah memverifikasi identitas pelanggan dan produk {REDEEM_PRODUCT_NAME} yang diambil.
          </span>
        </label>

        <FieldError message={state?.error} />
        {state?.success && (
          <div className="notice notice-success">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span>
              {state.success} Kode: {state.voucher?.code}
            </span>
          </div>
        )}

        <Button type="submit" disabled={pending || !confirmed} className="w-full">
          {pending ? "Memproses..." : "Konfirmasi Redeem"}
        </Button>
      </form>
    </div>
  );
}
