// Deprecated: sign-out now uses supabase.auth.signOut() from the client.
export async function POST() {
  return new Response("Gone", { status: 410 });
}
