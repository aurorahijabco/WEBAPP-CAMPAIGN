"use client";

import { useActionState, useEffect } from "react";
import { createAgent, updateAgent } from "./actions";
import { Input, Label, Select, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

type Branch = { id: string; name: string };

type Props =
  | { mode: "create"; branches: Branch[]; onDone?: () => void }
  | {
      mode: "edit";
      branches: Branch[];
      agent: { id: string; name: string; username: string; whatsapp: string; branch_id: string | null };
      onDone?: () => void;
    };

export function AgentForm(props: Props) {
  const action = props.mode === "create" ? createAgent : updateAgent;
  const [state, formAction, pending] = useActionState(action, undefined);

  useEffect(() => {
    if (state?.success) props.onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <form action={formAction} className="space-y-3.5">
      {props.mode === "edit" && <input type="hidden" name="agentId" value={props.agent.id} />}

      <div>
        <Label htmlFor={`name-${props.mode}`}>Nama</Label>
        <Input id={`name-${props.mode}`} name="name" required defaultValue={props.mode === "edit" ? props.agent.name : ""} />
      </div>

      {props.mode === "create" && (
        <div>
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" required autoComplete="off" />
        </div>
      )}
      {props.mode === "edit" && (
        <div>
          <Label>Username</Label>
          <p className="input flex items-center bg-cream-100 text-plum-400 dark:bg-plum-500/20 dark:text-cream-100/60">
            {props.agent.username}
          </p>
        </div>
      )}

      <div>
        <Label htmlFor={`whatsapp-${props.mode}`}>Nomor WhatsApp</Label>
        <Input
          id={`whatsapp-${props.mode}`}
          name="whatsapp"
          required
          defaultValue={props.mode === "edit" ? props.agent.whatsapp : ""}
        />
      </div>

      <div>
        <Label htmlFor={`branch-${props.mode}`}>Cabang</Label>
        <Select id={`branch-${props.mode}`} name="branchId" required defaultValue={props.mode === "edit" ? props.agent.branch_id ?? "" : ""}>
          <option value="" disabled>
            Pilih cabang
          </option>
          {props.branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor={`password-${props.mode}`}>{props.mode === "create" ? "Password" : "Password Baru (opsional)"}</Label>
        <Input
          id={`password-${props.mode}`}
          name="password"
          type="password"
          autoComplete="new-password"
          required={props.mode === "create"}
          placeholder={props.mode === "edit" ? "Kosongkan jika tidak diubah" : undefined}
        />
      </div>

      <FieldError message={state?.error} />
      {state?.success && <p className="text-xs font-semibold text-success">{state.success}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Menyimpan..." : props.mode === "create" ? "Tambah Agent" : "Simpan Perubahan"}
      </Button>
    </form>
  );
}
