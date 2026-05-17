"use client"

/**
 * components/facebook-pixel.tsx
 *
 * Handles:
 *  - Initial pixel init + first PageView (via inline script in layout)
 *  - Subsequent SPA route-change PageView tracking via usePathname()
 *  - Prevents duplicate PageView fires on the same path
 *  - Supports Facebook Events Manager Test Events via FB_TEST_CODE env var
 */

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { FB_PIXEL_ID, trackPageView } from "@/lib/pixel"

export function FacebookPixelRouteTracker() {
  const pathname = usePathname()
  // Track the last path we fired PageView for to prevent duplicates
  const lastTrackedPath = useRef<string | null>(null)

  useEffect(() => {
    // Skip if fbq isn't available yet (script still loading)
    if (typeof window === "undefined" || typeof window.fbq !== "function") return

    // Skip duplicate fires on the same path
    if (lastTrackedPath.current === pathname) return

    lastTrackedPath.current = pathname
    trackPageView()
  }, [pathname])

  return null
}

/**
 * Inline pixel base code – rendered once in <head> via RootLayout.
 * The noscript fallback is handled separately in <body> in layout.tsx.
 */
export function FacebookPixelScript() {
  // Optional: read test event code from a public env var
  const testCode = process.env.NEXT_PUBLIC_FB_TEST_EVENT_CODE

  const initScript = `
    !function(f,b,e,v,n,t,s){
      if(f.fbq)return;
      n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)
    }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', '${FB_PIXEL_ID}');
    ${testCode ? `fbq('set', 'agent', 'test', '${testCode}');` : ""}
    fbq('track', 'PageView');
  `

  return (
    <script
      id="fb-pixel-base"
      dangerouslySetInnerHTML={{ __html: initScript }}
    />
  )
}
