import { createServerClient } from "@supabase/ssr";
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

  if (url.pathname.startsWith("/account")) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnon) {
      return new NextResponse("Supabase not configured", { status: 503 });
    }

    const response = NextResponse.next();
    const supabase = createServerClient(supabaseUrl, supabaseAnon, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    return response;
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
  matcher: ["/admin/health", "/account", "/api/:path*"],
};
