import { Metadata } from "next"
import { EditingLandingPageClient } from "./editing-client"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "World's Biggest Video Editing Bundle | GrabDeals",
  description: "Get over 70 GB of premium video editing assets: 800+ transitions, 2,000+ FX presets, 10,000+ fonts, 3,050+ sound effects, cinematic LUTs & full masterclass. Lifetime access for only ₹149!",
  openGraph: {
    title: "World's Biggest Video Editing Bundle | GrabDeals",
    description: "Get over 70 GB of premium video editing assets: 800+ transitions, 2,000+ FX presets, 10,000+ fonts, 3,050+ sound effects, cinematic LUTs & full masterclass. Lifetime access for only ₹149!",
    url: "https://shop.grabdeals.app/editing",
    siteName: "GrabDeals",
    images: [
      {
        url: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/hero1.webp",
        width: 1400,
        height: 800,
        alt: "GrabDeals Video Editing Assets Package Mockup"
      }
    ],
    locale: "en_IN",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "World's Biggest Video Editing Bundle | GrabDeals",
    description: "Get over 70 GB of video editing assets, LUTs, FX, templates, and courses. Lifetime access for only ₹149.",
    images: ["https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/hero1.webp"]
  },
  alternates: {
    canonical: "https://shop.grabdeals.app/editing"
  }
}

export default function EditingLandingPage() {
  return <EditingLandingPageClient />
}
