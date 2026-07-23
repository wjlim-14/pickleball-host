import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StatsClient from "./StatsClient";

export default async function Stats() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("activated, club_name")
    .eq("id", user.id)
    .single();
  if (!profile?.activated) redirect("/activate");

  const { data: stats } = await supabase.rpc("host_stats");
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, name, date, status, games_count, players_count, created_at, started_at, ended_at")
    .order("created_at", { ascending: false })
    .limit(12);

  return (
    <StatsClient
      stats={stats || {}}
      sessions={sessions || []}
      club={profile.club_name || "Your club"}
    />
  );
}
