"use client";

import { useActionState, useState } from "react";
import { redeemVoucher } from "@/app/agent/actions";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { REDEEM_PRODUCT_NAME, REDEEM_PRODUCT_REFERENCE_PRICE } from "@/lib/constants";

export function RedeemForm() {
  const [state, formAction, pending] = useActionState(redeemVoucher, undefined);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <Card>
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

        <label className="flex items-start gap-2 text-sm text-plum-500">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1"
          />
          Saya sudah memverifikasi identitas pelanggan dan produk {REDEEM_PRODUCT_NAME} yang diambil.
        </label>

        <FieldError message={state?.error} />
        {state?.success && (
          <p className="text-sm font-medium text-green-600">
            {state.success} Kode: {state.voucher?.code}
          </p>
        )}

        <Button type="submit" disabled={pending || !confirmed} className="w-full">
          {pending ? "Memproses..." : "Konfirmasi Redeem"}
        </Button>
      </form>
    </Card>
  );
}
