import { NextResponse } from "next/server";

export async function POST(req) {
  const form = await req.formData();
  const code = String(form.get("code") || "");
  const good = process.env.ACCESS_CODE && code === process.env.ACCESS_CODE;
  if (!good) {
    return NextResponse.redirect(new URL("/login?e=1", req.url), 303);
  }
  const res = NextResponse.redirect(new URL("/", req.url), 303);
  res.cookies.set("pp_auth", process.env.ACCESS_CODE, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
