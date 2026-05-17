/**
 * lib/pixel.ts
 * Centralized Meta (Facebook) Pixel helper.
 *
 * Usage:
 *   import { fbq } from "@/lib/pixel"
 *   fbq("track", "PageView")
 *   fbq("track", "AddToCart", { value: 99, currency: "INR", content_ids: ["id1"] })
 */

export const FB_PIXEL_ID = "864520106659183"

// ── TypeScript ambient type for fbq ──────────────────────────────────────────
declare global {
  interface Window {
    fbq: (...args: any[]) => void
    _fbq: (...args: any[]) => void
  }
}

// ── Safe fbq wrapper ──────────────────────────────────────────────────────────
export function fbq(
  action: "track" | "trackCustom" | "init" | "set",
  eventNameOrParam: string,
  params?: Record<string, any>
): void {
  if (typeof window === "undefined") return
  if (typeof window.fbq !== "function") return
  if (!eventNameOrParam) {
    console.warn("[Meta Pixel] fbq called without an event name – skipped.")
    return
  }
  if (params !== undefined) {
    window.fbq(action, eventNameOrParam, params)
  } else {
    window.fbq(action, eventNameOrParam)
  }
}

// ── Standard event helpers ────────────────────────────────────────────────────

export function trackPageView() {
  fbq("track", "PageView")
}

export function trackViewContent(params: {
  content_name: string
  content_category?: string
  content_ids: string[]
  value: number
  currency?: string
}) {
  fbq("track", "ViewContent", {
    currency: "INR",
    ...params,
    content_type: "product",
  })
}

export function trackAddToCart(params: {
  content_name: string
  content_ids: string[]
  value: number
  currency?: string
}) {
  fbq("track", "AddToCart", {
    currency: "INR",
    content_type: "product",
    ...params,
  })
}

export function trackInitiateCheckout(params: {
  value: number
  num_items?: number
  content_ids?: string[]
  currency?: string
}) {
  fbq("track", "InitiateCheckout", {
    currency: "INR",
    ...params,
  })
}

export function trackPurchase(params: {
  value: number
  content_ids: string[]
  currency?: string
}) {
  fbq("track", "Purchase", {
    currency: "INR",
    content_type: "product",
    ...params,
  })
}

export function trackLead(params?: {
  content_name?: string
  value?: number
  currency?: string
}) {
  fbq("track", "Lead", params || {})
}

export function trackCompleteRegistration(params?: {
  content_name?: string
  status?: boolean | string
}) {
  fbq("track", "CompleteRegistration", params || {})
}
