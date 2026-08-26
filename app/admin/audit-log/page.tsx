import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Input, Select, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { formatDate, cn } from "@/lib/utils";
import { AUDIT_ACTIONS, AUDIT_ACTION_LABELS, type AuditAction } from "@/lib/business/auditLog";
import type { AppRole } from "@/types/domain";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

type SearchParams = {
  page?: string;
  username?: string;
  role?: string;
  branch?: string;
  action?: string;
  status?: string;
  from?: string;
  to?: string;
  q?: string;
};

const ROLE_OPTIONS: AppRole[] = ["customer", "agent", "admin"];

/**
 * Read-only monitoring page — reachable only under /admin, whose layout
 * (app/admin/layout.tsx) already redirects anyone who isn't role='admin'
 * away before this ever renders. The `audit_logs` table itself has RLS
 * enabled with no policies at all (see 0009_audit_logs.sql), so even a
 * stray anon/authenticated-key request can never read it — this page's
 * service-role query is the only path in the whole app that can.
 */
export default async function AuditLogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const supabase = createAdminClient();

  const { data: branches } = await supabase.from("branches").select("id, name").order("name");

  let query = supabase.from("audit_logs").select("*", { count: "exact" });

  if (sp.username) query = query.ilike("username", `%${sp.username}%`);
  if (sp.role) query = query.eq("role", sp.role);
  if (sp.branch) query = query.eq("branch_id", sp.branch);
  if (sp.action) query = query.eq("action", sp.action);
  if (sp.status) query = query.eq("status", sp.status);
  if (sp.from) query = query.gte("created_at", new Date(sp.from + "T00:00:00").toISOString());
  if (sp.to) query = query.lte("created_at", new Date(sp.to + "T23:59:59.999").toISOString());
  if (sp.q) {
    const term = sp.q.replace(/[%,]/g, "");
    query = query.or(
      `username.ilike.%${term}%,action.ilike.%${term}%,entity_type.ilike.%${term}%,branch_name.ilike.%${term}%`
    );
  }

  const from = (page - 1) * PAGE_SIZE;
  const { data: logs, count } = await query.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(targetPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(sp)) {
      if (key !== "page" && value) params.set(key, value);
    }
    params.set("page", String(targetPage));
    return `/admin/audit-log?${params.toString()}`;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl text-plum-600 dark:text-cream-100">Audit Log</h1>
        <p className="mt-1 text-sm text-plum-400 dark:text-cream-100/60">
          Riwayat aktivitas penting seluruh user — hanya terlihat oleh Super Admin.
        </p>
      </div>

      <form method="get" className="card grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="col-span-2 sm:col-span-3 lg:col-span-2">
          <Label htmlFor="q">Cari</Label>
          <Input id="q" name="q" defaultValue={sp.q} placeholder="Username, aksi, entity, cabang..." />
        </div>
        <div>
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" defaultValue={sp.username} placeholder="username" />
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Select id="role" name="role" defaultValue={sp.role ?? ""}>
            <option value="">Semua</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="branch">Cabang</Label>
          <Select id="branch" name="branch" defaultValue={sp.branch ?? ""}>
            <option value="">Semua</option>
            {branches?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="action">Aksi</Label>
          <Select id="action" name="action" defaultValue={sp.action ?? ""}>
            <option value="">Semua</option>
            {AUDIT_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {AUDIT_ACTION_LABELS[a as AuditAction]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={sp.status ?? ""}>
            <option value="">Semua</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="from">Dari Tanggal</Label>
          <Input id="from" name="from" type="date" defaultValue={sp.from} />
        </div>
        <div>
          <Label htmlFor="to">Sampai Tanggal</Label>
          <Input id="to" name="to" type="date" defaultValue={sp.to} />
        </div>
        <div className="col-span-2 flex items-end gap-2 sm:col-span-3 lg:col-span-1">
          <Button type="submit" className="w-full">
            Filter
          </Button>
          {(sp.username || sp.role || sp.branch || sp.action || sp.status || sp.from || sp.to || sp.q) && (
            <Link href="/admin/audit-log" className="btn-outline shrink-0">
              Reset
            </Link>
          )}
        </div>
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="w-full whitespace-nowrap text-sm">
          <thead>
            <tr className="border-b border-cream-200 text-left text-xs text-plum-400 dark:border-plum-500/30 dark:text-cream-100/60">
              <th className="py-3 pl-4 pr-3">Waktu</th>
              <th className="py-3 pr-3">User</th>
              <th className="py-3 pr-3">Role</th>
              <th className="py-3 pr-3">Aksi</th>
              <th className="py-3 pr-3">Entity</th>
              <th className="py-3 pr-3">Cabang</th>
              <th className="py-3 pr-3">Status</th>
              <th className="py-3 pr-4">Detail</th>
            </tr>
          </thead>
          <tbody>
            {logs?.map((row) => (
              <tr key={row.id} className="border-b border-cream-100 align-top dark:border-plum-500/20">
                <td className="py-2.5 pl-4 pr-3 text-xs text-plum-400 dark:text-cream-100/60">{formatDate(row.created_at)}</td>
                <td className="py-2.5 pr-3 font-semibold text-plum-600 dark:text-cream-100">{row.username ?? "—"}</td>
                <td className="py-2.5 pr-3 text-xs uppercase text-plum-400 dark:text-cream-100/60">{row.role ?? "—"}</td>
                <td className="py-2.5 pr-3 text-plum-600 dark:text-cream-100">
                  {AUDIT_ACTION_LABELS[row.action as AuditAction] ?? row.action}
                </td>
                <td className="py-2.5 pr-3 text-xs text-plum-400 dark:text-cream-100/60">
                  {row.entity_type ? `${row.entity_type}${row.entity_id ? ` · ${String(row.entity_id).slice(0, 8)}` : ""}` : "—"}
                </td>
                <td className="py-2.5 pr-3 text-xs text-plum-400 dark:text-cream-100/60">{row.branch_name ?? "—"}</td>
                <td className="py-2.5 pr-3">
                  <span className={cn("badge", row.status === "success" ? "badge-valid" : "badge-invalid")}>
                    {row.status === "success" ? "SUCCESS" : "FAILED"}
                  </span>
                </td>
                <td className="max-w-[280px] truncate py-2.5 pr-4 font-mono text-[11px] text-plum-400 dark:text-cream-100/60">
                  {row.metadata && Object.keys(row.metadata).length ? JSON.stringify(row.metadata) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!logs?.length && <p className="py-8 text-center text-sm text-plum-400 dark:text-cream-100/60">Belum ada aktivitas tercatat.</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-plum-400 dark:text-cream-100/60">
          <p>
            Halaman {page} dari {totalPages} · {total} entri
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className="btn-outline btn-sm">
                Sebelumnya
              </Link>
            )}
            {page < totalPages && (
              <Link href={pageHref(page + 1)} className="btn-outline btn-sm">
                Berikutnya
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
