import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/auth/login", "/auth/signup"];
const PUBLIC_API = ["/api/auth/login", "/api/auth/signup", "/api/auth/logout"];

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  // ✅ Allow public auth APIs
  if (PUBLIC_API.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // ✅ Logged-in user should not access login/signup
  if (token && PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ✅ Block protected pages if no token
  const protectedPaths =
    pathname === "/" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/trader") ||
    pathname.startsWith("/consignment");

  if (!token && protectedPaths) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/auth/login",
    "/auth/signup",
    "/admin/:path*",
    "/dashboard/:path*",
    "/trader/:path*",
    "/consignment/:path*",
    "/api/auth/login",
    "/api/auth/signup",
    "/api/auth/logout",
  ],
};
