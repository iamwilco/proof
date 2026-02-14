import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const RATE_LIMITS = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

const getClientIp = (request: NextRequest) => {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
};

const isBlocked = (ip: string) => {
  const blocked = process.env.BLOCKED_IPS ?? "";
  return blocked.split(",").map((value) => value.trim()).includes(ip);
};

const isRateLimited = (ip: string) => {
  const now = Date.now();
  const entry = RATE_LIMITS.get(ip);
  if (!entry || entry.resetAt <= now) {
    RATE_LIMITS.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  RATE_LIMITS.set(ip, entry);
  return entry.count > RATE_LIMIT_MAX;
};

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const ip = getClientIp(request);

  if (isBlocked(ip)) {
    console.warn("Blocked request from IP", ip, url.pathname);
    return new NextResponse("Blocked", { status: 403 });
  }

  if (url.pathname.startsWith("/admin/health")) {
    const adminToken = process.env.ADMIN_TOKEN ?? "";

    if (!adminToken) {
      return new NextResponse("ADMIN_TOKEN not configured", { status: 503 });
    }

    const incomingToken = request.headers.get("x-admin-token") ?? "";

    if (incomingToken !== adminToken) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.next();
  }

  const protectedPrefixes = [
    "/account",
    "/admin",
    "/moderators",
    "/reviewers",
    "/my",
    "/transactions",
    "/voting",
    "/reports",
    "/bookmarks",
  ];
  const isProtectedRoute = protectedPrefixes.some((prefix) => url.pathname.startsWith(prefix));

  if (isProtectedRoute) {
    const sessionToken = request.cookies.get("session")?.value;

    if (!sessionToken) {
      url.pathname = "/login";
      url.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  if (url.pathname.startsWith("/api/")) {
    if (isRateLimited(ip)) {
      console.warn("Rate limit exceeded", ip, url.pathname);
      return new NextResponse("Too many requests", { status: 429 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/health",
    "/account",
    "/admin/:path*",
    "/moderators/:path*",
    "/reviewers/:path*",
    "/my/:path*",
    "/transactions/:path*",
    "/voting/:path*",
    "/reports/:path*",
    "/bookmarks/:path*",
    "/api/:path*",
  ],
};
