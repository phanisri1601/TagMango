import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/web/dashboard", "/web/feed", "/web/workshops", "/web/courses", "/web/messages", "/admin", "/reviewer"];

/**
 * Public addresses (rewritten to the real pages in next.config.ts):
 *   /login        creators and coaches        /signup   new creators
 *   /admin/login  master admin only           /admin    master admin dashboard
 *   /reviewer     KYC reviewers               /portal   learners (own email-code sign-in)
 * Signed-out visitors are bounced to the right login, signed-in ones away from the login pages.
 */
export function middleware(req: NextRequest) {
  const hasSession = Boolean(req.cookies.get("tm_session")?.value);
  const { pathname } = req.nextUrl;
  const adminArea = pathname === "/admin" || pathname.startsWith("/admin/");

  if (pathname === "/admin/login") return hasSession ? NextResponse.redirect(new URL("/admin", req.url)) : NextResponse.next();

  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/")) && !hasSession) {
    const url = new URL(adminArea ? "/admin/login" : "/login", req.url);
    url.searchParams.set("afterLoginRedirectTo", pathname);
    return NextResponse.redirect(url);
  }
  if ((pathname === "/login" || pathname === "/signup") && hasSession) {
    return NextResponse.redirect(new URL("/web/dashboard/getstarted", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/web/:path*", "/admin/:path*", "/admin", "/reviewer", "/login", "/signup", "/signup/:path*"] };
