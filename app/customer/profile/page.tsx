import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./ProfileForm";
import { LogoutButton } from "@/components/nav/LogoutButton";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();

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

      <ProfileForm profile={profile!} email={user!.email ?? ""} />
      <LogoutButton className="btn-outline w-full" />
    </div>
  );
}
