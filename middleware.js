import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const isAuthPath =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/logout");
  const authed = req.cookies.get("pp_auth")?.value === process.env.ACCESS_CODE;

  if (!authed && !isAuthPath) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (authed && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
