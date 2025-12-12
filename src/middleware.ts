import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block access to /admin routes in Vercel production
  if (pathname.startsWith("/admin")) {
    // VERCEL env variable is set when running in Vercel
    const isVercel = process.env.VERCEL === "1";

    if (isVercel) {
      // Redirect to home page
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
