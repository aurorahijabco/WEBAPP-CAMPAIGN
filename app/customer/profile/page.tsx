import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ProfileForm } from "./ProfileForm";
import { LogoutButton } from "@/components/nav/LogoutButton";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = createAdminClient();
  // Never select password_hash here — this row is passed as a prop straight
  // into a client component (ProfileForm), so anything selected is
  // serialized to the browser.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, name, username, whatsapp, branch_id, agreed_sk_at, created_at")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6 pb-4">
      <div className="flex items-center gap-3">
        <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl border border-cream-200 bg-gradient-to-br from-cream-100 to-cream-200 font-display text-lg font-bold text-plum-600 dark:border-plum-500/40 dark:from-plum-600 dark:to-plum-500 dark:text-cream-100">
          {(profile?.name ?? "?").charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-display text-lg font-bold text-plum-600 dark:text-cream-100">{profile?.name}</p>
          <p className="text-[11.5px] font-mono text-plum-400 dark:text-cream-100/50">@{profile?.username}</p>
        </div>
      </div>

      <ProfileForm profile={profile!} />
      <LogoutButton className="btn-outline w-full" />
    </div>
  );
}
