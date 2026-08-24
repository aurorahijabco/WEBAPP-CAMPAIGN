import { destroySession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

async function logoutAction() {
  "use server";
  await destroySession();
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
