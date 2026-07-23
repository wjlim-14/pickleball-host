// Deprecated: replaced by Supabase Google auth (see /login and /auth/callback).
export async function POST() {
  return new Response("Gone", { status: 410 });
}
