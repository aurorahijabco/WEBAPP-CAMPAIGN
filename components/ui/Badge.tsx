import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  VALID: "badge-valid",
  APPROVED: "badge-approved",
  ACTIVE: "badge-active",
  REDEEMED: "badge-redeemed",
  HOLD: "badge-hold",
  PENDING: "badge-pending",
  RESERVED: "badge-reserved",
  INVALID: "badge-invalid",
  REJECTED: "badge-rejected",
  EXPIRED: "badge-expired",
};

export function Badge({ status }: { status: string }) {
  return (
    <span className={cn("badge", STYLES[status] ?? "bg-cream-100 text-plum-400")}>
      {status}
    </span>
  );
}
