/**
 * lib/pixel.ts
 * Centralized Meta (Facebook) Pixel helper.
 *
 * All pixel calls in the app must go through these typed helpers.
 * Direct use of window.fbq() or (window as any).fbq() is forbidden.
 *
 * Usage:
 *   import { trackPageView, trackAddToCart } from "@/lib/pixel"
 *   trackPageView()
 *   trackAddToCart({ content_name: "My Product", content_ids: ["abc"], value: 99 })
 */

export const FB_PIXEL_ID = "864520106659183"

// ── TypeScript ambient declaration for window.fbq ─────────────────────────────
declare global {
  interface Window {
    fbq: (...args: any[]) => void
    _fbq: (...args: any[]) => void
  }
}

// ── Valid Meta Pixel standard event names (enforced by type) ──────────────────
type StandardEvent =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase"
  | "Lead"
  | "CompleteRegistration"
  | "Search"
  | "AddToWishlist"
  | "AddPaymentInfo"
  | "Contact"
  | "CustomizeProduct"
  | "Donate"
  | "FindLocation"
  | "Schedule"
  | "StartTrial"
  | "SubmitApplication"
  | "Subscribe"

// ── Core safe fbq wrapper ─────────────────────────────────────────────────────
/**
 * Safe wrapper around window.fbq.
 * Guards against:
 *  - SSR (window undefined)
 *  - pixel not loaded yet (fbq not a function)
 *  - empty or undefined event names
 */
function _fbq(
  action: "track" | "trackCustom" | "init" | "set",
  eventName: string,
  params?: Record<string, any>
): void {
  if (typeof window === "undefined") return
  if (typeof window.fbq !== "function") return
  if (!eventName || typeof eventName !== "string" || eventName.trim() === "") {
    console.warn("[Meta Pixel] Blocked: fbq called with empty or invalid event name.")
    return
  }
  if (params !== undefined && Object.keys(params).length > 0) {
    window.fbq(action, eventName, params)
  } else {
    window.fbq(action, eventName)
  }
}

// Export raw fbq for advanced/custom use (e.g. DashboardView custom conversion)
export { _fbq as fbq }

// ── Standard event helpers ────────────────────────────────────────────────────

/** Fire a PageView event. Called automatically by FacebookPixelRouteTracker. */
export function trackPageView(): void {
  _fbq("track", "PageView")
}

/** Fire ViewContent when a user views a product detail page. */
export function trackViewContent(params: {
  content_name: string
  content_category?: string
  content_ids: string[]
  value: number
  currency?: string
}): void {
  _fbq("track", "ViewContent", {
    content_type: "product",
    currency: "INR",
    ...params,
  })
}

/** Fire AddToCart when a product is added to the cart. */
export function trackAddToCart(params: {
  content_name: string
  content_ids: string[]
  value: number
  currency?: string
}): void {
  _fbq("track", "AddToCart", {
    content_type: "product",
    currency: "INR",
    ...params,
  })
}

/** Fire InitiateCheckout when a user enters the checkout flow. */
export function trackInitiateCheckout(params: {
  value: number
  num_items?: number
  content_ids?: string[]
  currency?: string
}): void {
  _fbq("track", "InitiateCheckout", {
    currency: "INR",
    ...params,
  })
}

/** Fire Purchase on a confirmed, paid order. */
export function trackPurchase(params: {
  value: number
  content_ids: string[]
  currency?: string
}): void {
  _fbq("track", "Purchase", {
    content_type: "product",
    currency: "INR",
    ...params,
  })
}

/**
 * Fire Lead on a contact form submission or newsletter signup.
 * Only passes params if they contain at least one key.
 */
export function trackLead(params?: {
  content_name?: string
  value?: number
  currency?: string
}): void {
  if (params && Object.keys(params).length > 0) {
    _fbq("track", "Lead", params)
  } else {
    _fbq("track", "Lead")
  }
}

/**
 * Fire CompleteRegistration on successful account creation.
 * Only passes params if they contain at least one key.
 */
export function trackCompleteRegistration(params?: {
  content_name?: string
  status?: boolean | string
}): void {
  if (params && Object.keys(params).length > 0) {
    _fbq("track", "CompleteRegistration", params)
  } else {
    _fbq("track", "CompleteRegistration")
  }
}
