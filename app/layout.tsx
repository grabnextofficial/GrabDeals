import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { AuthProvider } from "@/contexts/auth-context"
import { CartProvider } from "@/contexts/cart-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ShopAIChat } from "@/components/shop-ai-chat"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Grabnext - Buy Digital Products, Software, Courses & Templates Online India",
    template: "%s | Grabnext",
  },
  description:
    "Grabnext is India's trusted digital marketplace. Buy software, online courses, design templates, ebooks & more at the best prices with instant delivery and secure UPI payment.",
  keywords: [
    "grabnext",
    "buy digital products india",
    "software buy online india",
    "online courses india",
    "design templates",
    "ebooks india",
    "digital download india",
    "instant delivery digital goods",
    "buy software cheap india",
    "digital marketplace india",
  ],
  authors: [{ name: "Grabnext", url: "https://grabnext.pages.dev" }],
  creator: "Grabnext",
  publisher: "Grabnext",
  metadataBase: new URL("https://grabnext.pages.dev"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://grabnext.pages.dev",
    siteName: "Grabnext",
    title: "Grabnext - Buy Digital Products Online India",
    description:
      "India's trusted digital store. Software, courses, templates & more at the best prices with instant delivery.",
    images: [
      {
        url: "/favicon.png",
        width: 512,
        height: 512,
        alt: "Grabnext - Digital Marketplace India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@grabnext",
    creator: "@grabnext",
    title: "Grabnext - Buy Digital Products Online India",
    description:
      "India's trusted digital store. Software, courses, templates & more with instant delivery.",
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
    canonical: "https://grabnext.pages.dev",
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
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-TBEMXJ6DCV"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-TBEMXJ6DCV');
            `,
          }}
        />
        <script src="https://x-pg.pages.dev/xpay.js" async />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '864520106659183');
              fbq('track', 'PageView');
            `,
          }}
        />
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
                "name": "Grabnext",
                "url": "https://grabnext.pages.dev",
                "description": "India's trusted digital marketplace. Buy software, online courses, design templates, ebooks & more with instant delivery.",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": "https://grabnext.pages.dev/products?q={search_term_string}"
                  },
                  "query-input": "required name=search_term_string"
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "Grabnext",
                "url": "https://grabnext.pages.dev",
                "logo": "https://grabnext.pages.dev/favicon.png",
                "description": "Grabnext is India's trusted digital marketplace for software, courses, templates & digital downloads with instant delivery.",
                "contactPoint": {
                  "@type": "ContactPoint",
                  "contactType": "customer support",
                  "url": "https://grabnext.pages.dev/contact",
                  "availableLanguage": ["English", "Hindi"]
                },
                "sameAs": []
              }
            ])
          }}
        />
      </head>
      <body>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=864520106659183&ev=PageView&noscript=1"
          />
        </noscript>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <CartProvider>
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