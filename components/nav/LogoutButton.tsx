"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton({
  className,
  children,
  "aria-label": ariaLabel,
}: {
  className?: string;
  children?: React.ReactNode;
  "aria-label"?: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className={className ?? "btn-outline"} aria-label={ariaLabel}>
      {children ?? "Keluar"}
    </button>
  );
}
