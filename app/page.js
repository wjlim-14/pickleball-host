import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HostApp from "@/components/HostApp";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "jaylim.wjie@gmail.com";

export default async function Page() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("activated, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.activated) redirect("/activate");

  return (
    <HostApp
      user={{
        id: user.id,
        email: user.email,
        name: profile.full_name || user.email,
        isAdmin: (user.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase(),
      }}
    />
  );
}
