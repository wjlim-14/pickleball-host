import { NextResponse } from "next/server";

export async function POST(req) {
  const res = NextResponse.redirect(new URL("/login", req.url), 303);
  res.cookies.set("pp_auth", "", { path: "/", maxAge: 0 });
  return res;
}
