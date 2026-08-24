"use client";

import { useActionState, useState } from "react";
import { createClaim } from "@/app/customer/actions";
import { Input, Label, Select, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { FileUploadZone } from "@/components/ui/FileUploadZone";

type Branch = { id: string; name: string };
type ItemRow = { name: string; qty: number; price: number };

export function NewClaimForm({ branches }: { branches: Branch[] }) {
  const [state, formAction, pending] = useActionState(createClaim, undefined);
  const [items, setItems] = useState<ItemRow[]>([{ name: "Series Agustin", qty: 1, price: 0 }]);

  function updateItem(i: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="branchId">Cabang Pembelian</Label>
        <Select id="branchId" name="branchId" required defaultValue="">
          <option value="" disabled>Pilih cabang...</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="amount">Total Nominal Struk (Rp)</Label>
        <Input id="amount" name="amount" type="number" min={0} step="1000" required />
      </div>

      <div className="space-y-2">
        <Label>Item Pembelian</Label>
        {items.map((item, i) => (
          <div key={i} className="space-y-2 rounded-2xl border border-cream-200 p-3 dark:border-plum-500/30">
            <Input
              name="itemName"
              placeholder="Nama item"
              value={item.name}
              onChange={(e) => updateItem(i, { name: e.target.value })}
              required
            />
            <div className="flex gap-2">
              <Input
                name="itemQty"
                type="number"
                min={1}
                placeholder="Qty"
                value={item.qty}
                onChange={(e) => updateItem(i, { qty: Number(e.target.value) })}
                required
              />
              <Input
                name="itemPrice"
                type="number"
                min={0}
                placeholder="Harga"
                value={item.price}
                onChange={(e) => updateItem(i, { price: Number(e.target.value) })}
                required
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setItems((p) => [...p, { name: "", qty: 1, price: 0 }])}
          className="text-sm font-bold text-gold-500 underline underline-offset-2"
        >
          + Tambah item
        </button>
      </div>

      <div>
        <Label htmlFor="photo">Foto Struk</Label>
        <FileUploadZone id="photo" name="photo" required />
      </div>

      <FieldError message={state?.error} />

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Mengunggah..." : "Kirim Klaim"}
      </Button>
    </form>
  );
}
