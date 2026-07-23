import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminClient from "./AdminClient";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "jaylim.wjie@gmail.com";

export default async function Admin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if ((user.email || "").toLowerCase() !== ADMIN_EMAIL.toLowerCase()) redirect("/");

  const { data: stats } = await supabase.rpc("admin_stats");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, club_name, meets_per_week, participants_range, location, activated, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: codes } = await supabase
    .from("beta_codes")
    .select("code, assigned_to, redeemed_by, note, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  return <AdminClient stats={stats || {}} profiles={profiles || []} codes={codes || []} />;
}
