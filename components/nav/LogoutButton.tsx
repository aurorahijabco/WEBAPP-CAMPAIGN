import { destroySession, getCurrentUser } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/business/auditLog";
import { redirect } from "next/navigation";

async function logoutAction() {
  "use server";
  const user = await getCurrentUser();
  await destroySession();
  if (user) {
    await writeAuditLog({
      action: "logout",
      status: "success",
      actor: { id: user.id, username: user.username, role: user.role },
      entityType: "session",
      branchId: user.branchId,
    });
  }
  redirect("/");
}

export function LogoutButton({
  className,
  children,
  "aria-label": ariaLabel,
}: {
  className?: string;
  children?: React.ReactNode;
  "aria-label"?: string;
}) {
  return (
    <form action={logoutAction}>
      <button type="submit" className={className ?? "btn-outline"} aria-label={ariaLabel}>
        {children ?? "Keluar"}
      </button>
    </form>
  );
}
