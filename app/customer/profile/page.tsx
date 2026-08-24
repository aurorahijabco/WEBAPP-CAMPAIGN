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
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-plum-600">Profil</h1>
      <ProfileForm profile={profile!} email={user!.email ?? ""} />
      <LogoutButton className="btn-outline w-full" />
    </div>
  );
}
