import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  VALID: "bg-green-100 text-green-700",
  APPROVED: "bg-green-100 text-green-700",
  ACTIVE: "bg-green-100 text-green-700",
  REDEEMED: "bg-plum-100 text-plum-600",
  HOLD: "bg-amber-100 text-amber-700",
  PENDING: "bg-amber-100 text-amber-700",
  RESERVED: "bg-blue-100 text-blue-700",
  INVALID: "bg-red-100 text-red-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-500",
};

export function Badge({ status }: { status: string }) {
  return (
    <span className={cn("badge", STYLES[status] ?? "bg-gray-100 text-gray-600")}>
      {status}
    </span>
  );
}
