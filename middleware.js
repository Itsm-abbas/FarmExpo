import { NextResponse } from "next/server";

// Pages for signed-out visitors; signed-in users are sent to the dashboard.
const GUEST_ROUTES = ["/auth/login", "/auth/signup", "/auth/forgot-password"];
// Pages anyone may open.
const PUBLIC_ROUTES = [...GUEST_ROUTES, "/auth/reset-password"];

// Runs on pages only. API routes check the session themselves (lib/session.js),
// because verifying the JWT needs the Node runtime.
export function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const isGuestOnly = GUEST_ROUTES.some((route) => pathname.startsWith(route));

  // ✅ Logged-in user should not access login/signup
  if (token && isGuestOnly) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ✅ Block every other page if no token
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Everything except API routes, Next.js internals and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
