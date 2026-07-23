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

  const { data: codes } = await supabase
    .from("beta_codes")
    .select("code, note, redeemed_by, redeemed_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: requests } = await supabase
    .from("beta_requests")
    .select("id, name, email, club, location, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return <AdminClient initialCodes={codes || []} initialRequests={requests || []} />;
}
