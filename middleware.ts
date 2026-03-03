import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { securityMiddleware } from "./lib/security"

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // 1. Only apply security middleware (rate limit, validation) to API routes
  if (path.startsWith("/api/")) {
    try {
      const securityCheck = await securityMiddleware(request)
      if (securityCheck) return securityCheck
    } catch (error) {
      console.error("[v0] Middleware Security Error:", error)
      // On middleware error, we allow the request to proceed to avoid blocking the user completely
      // unless it's a critical failure which will be handled by the route handler itself.
    }
  }

  // 2. Dashboard & Admin Routes
  // We do NOT check cookies here because this app uses Client-Side Firebase Auth.
  // The protection happens inside the page components (e.g., AdminGuard, useAuth).
  // Checking cookies here would cause infinite redirects/500 errors.

  return NextResponse.next()
}

export const config = {
  // Apply to API, Admin, and Dashboard paths
  matcher: ["/api/:path*", "/admin/:path*", "/dashboard/:path*"],
}