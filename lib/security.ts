import type { NextRequest } from "next/server"
import { rateLimit } from "./rate-limit"

export async function securityMiddleware(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (!rateLimitResult.success) {
    return new Response("Too many requests", { status: 429 })
  }

  // Removed input validation from middleware because reading request.json() 
  // consumes the stream and causes the API route to fail.
  // Input validation should be done in the respective API routes.

  return null // Continue processing
}

export function sanitizeInput(input: any): any {
  if (typeof input === "string") {
    return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
  }
  if (typeof input === "object" && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }
  return input
}
