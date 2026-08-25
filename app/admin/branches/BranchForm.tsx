"use client";

import { useActionState, useEffect } from "react";
import { createBranch, updateBranch } from "./actions";
import { Input, Label, Textarea, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

type Props =
  | { mode: "create"; onDone?: () => void }
  | {
      mode: "edit";
      branch: { id: string; name: string; code: string | null; qr_code: string | null; address: string | null };
      onDone?: () => void;
    };

export function BranchForm(props: Props) {
  const action = props.mode === "create" ? createBranch : updateBranch;
  const [state, formAction, pending] = useActionState(action, undefined);

  useEffect(() => {
    if (state?.success) props.onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <form action={formAction} className="space-y-3.5">
      {props.mode === "edit" && <input type="hidden" name="branchId" value={props.branch.id} />}

      <div>
        <Label htmlFor={`name-${props.mode}`}>Nama Cabang</Label>
        <Input
          id={`name-${props.mode}`}
          name="name"
          required
          placeholder="Aurora Hijab Kemang, Jakarta Selatan"
          defaultValue={props.mode === "edit" ? props.branch.name : ""}
        />
      </div>

      <div>
        <Label htmlFor={`code-${props.mode}`}>Kode Cabang</Label>
        <Input
          id={`code-${props.mode}`}
          name="code"
          required
          placeholder="KEMANG"
          className="uppercase"
          defaultValue={props.mode === "edit" ? props.branch.code ?? "" : ""}
        />
      </div>

      <div>
        <Label htmlFor={`qrCode-${props.mode}`}>Kode QR</Label>
        <Input
          id={`qrCode-${props.mode}`}
          name="qrCode"
          required
          placeholder="qr-kemang-001"
          defaultValue={props.mode === "edit" ? props.branch.qr_code ?? "" : ""}
        />
      </div>

      <div>
        <Label htmlFor={`address-${props.mode}`}>Alamat</Label>
        <Textarea
          id={`address-${props.mode}`}
          name="address"
          placeholder="Jl. Kemang Raya No. 10, Jakarta Selatan"
          defaultValue={props.mode === "edit" ? props.branch.address ?? "" : ""}
        />
      </div>

      <FieldError message={state?.error} />
      {state?.success && <p className="text-xs font-semibold text-success">{state.success}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Menyimpan..." : props.mode === "create" ? "Tambah Cabang" : "Simpan Perubahan"}
      </Button>
    </form>
  );
}
