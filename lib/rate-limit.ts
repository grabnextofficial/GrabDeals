import type { NextRequest } from "next/server"

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export async function rateLimit(request: NextRequest, limit = 100, windowMs = 15 * 60 * 1000) {
  const ip = (request as any).ip || request.headers.get("x-forwarded-for") || "unknown"
  const now = Date.now()

  const userLimit = rateLimitMap.get(ip)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }

  if (userLimit.count >= limit) {
    return { success: false, remaining: 0 }
  }

  userLimit.count++
  return { success: true, remaining: limit - userLimit.count }
}
