import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { AuthProvider } from "@/contexts/auth-context"
import { CartProvider } from "@/contexts/cart-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ShopAIChat } from "@/components/shop-ai-chat"
import { FacebookPixelScript, FacebookPixelRouteTracker } from "@/components/facebook-pixel"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "GrabDeals - India's Ultimate Shopping & Online Deals Platform",
    template: "%s | GrabDeals",
  },
  description:
    "GrabDeals is India's trusted online shopping platform. Find unbeatable deals on electronics, fashion, lifestyle, home essentials, books, software, digital assets & more.",
  keywords: [
    "grabdeals",
    "grab deals",
    "online shopping india",
    "best deals online india",
    "buy electronics online",
    "fashion shopping india",
    "home decor offers",
    "digital marketplace india",
    "discount shopping india",
    "instant deals india",
  ],
  authors: [{ name: "GrabDeals", url: "https://shop.grabdeals.app" }],
  creator: "GrabDeals",
  publisher: "GrabDeals",
  metadataBase: new URL("https://shop.grabdeals.app"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://shop.grabdeals.app",
    siteName: "GrabDeals",
    title: "GrabDeals - India's Ultimate Shopping & Online Deals Platform",
    description:
      "India's trusted online store. Shop electronics, fashion, home decor, digital goods & more at the best prices with secure payment and instant delivery.",
    images: [
      {
        url: "/favicon.png",
        width: 512,
        height: 512,
        alt: "GrabDeals - Online Shopping India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@grabdeals",
    creator: "@grabdeals",
    title: "GrabDeals - India's Ultimate Shopping & Online Deals Platform",
    description:
      "India's trusted online store. Shop electronics, fashion, home decor, digital goods & more with instant delivery and secure checkout.",
    images: ["/favicon.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: "a6IFtvu-QdswT63axIr-jp_-vPxu2OYz5dpN6y8CZmk",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  alternates: {
    canonical: "https://shop.grabdeals.app",
  },
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable}`}>
      <head>
        <meta name="google-adsense-account" content="ca-pub-4010815088153941" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-C3HYF0VYC0"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-C3HYF0VYC0');
            `,
          }}
        />
        <script src="https://x-pg.pages.dev/xpay.js" async />
        {/* ── Meta (Facebook) Pixel – init + first PageView ── */}
        <FacebookPixelScript />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "wf91qtq1oa");
            `,
          }}
        />
        <style dangerouslySetInnerHTML={{
          __html: `
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
}
        `
        }} />
        {/* ── WebSite + Organization Structured Data (AI & Search Discovery) ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "GrabDeals",
                "url": "https://shop.grabdeals.app",
                "alternateName": "GrabDeals Online Shopping Marketplace",
                "description": "India's trusted online store. Shop electronics, fashion, home decor, digital goods & more at the best prices with secure payment and instant delivery.",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": "https://shop.grabdeals.app/products?q={search_term_string}"
                  },
                  "query-input": "required name=search_term_string"
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "GrabDeals",
                "url": "https://shop.grabdeals.app",
                "logo": "https://shop.grabdeals.app/favicon.png",
                "description": "GrabDeals is India's trusted online shopping platform for electronics, fashion, home decor, software, templates & courses with instant delivery.",
                "contactPoint": {
                  "@type": "ContactPoint",
                  "contactType": "customer support",
                  "url": "https://shop.grabdeals.app/contact",
                  "availableLanguage": ["English", "Hindi"]
                },
                "sameAs": [
                  "https://grabdeals.pages.dev"
                ]
              }
            ])
          }}
        />
      </head>
      <body>
        {/* Meta Pixel noscript fallback */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=864520106659183&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <CartProvider>
              {/* Tracks PageView on every SPA route change */}
              <FacebookPixelRouteTracker />
              {children}
              <Toaster />
              <ShopAIChat />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}