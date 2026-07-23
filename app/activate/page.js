import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ActivateClient from "./ActivateClient";

export default async function Activate() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("activated")
    .eq("id", user.id)
    .single();

  if (profile?.activated) redirect("/");

  return <ActivateClient email={user.email} name={user.user_metadata?.full_name || ""} />;
}
