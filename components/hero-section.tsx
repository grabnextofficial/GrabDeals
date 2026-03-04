"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const banners = [
  {
    id: 1,
    title: "Big Billion Days",
    subtitle: "Up to 80% Off on Software",
    bgClass: "from-blue-600 to-cyan-500",
    emoji: "💻",
    cta: "Shop Now",
    href: "/products?category=software",
  },
  {
    id: 2,
    title: "Premium Templates",
    subtitle: "Start your project in seconds",
    bgClass: "from-purple-600 to-pink-500",
    emoji: "🎨",
    cta: "Explore",
    href: "/products?category=template",
  },
  {
    id: 3,
    title: "Master New Skills",
    subtitle: "Trending Courses at lowest prices",
    bgClass: "from-orange-500 to-yellow-500",
    emoji: "🎓",
    cta: "Start Learning",
    href: "/products?category=course",
  },
]

export function HeroSection() {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const goTo = (index: number) => {
    if (animating) return
    setAnimating(true)
    setCurrent(index)
    setTimeout(() => setAnimating(false), 600)
  }

  const next = () => goTo((current + 1) % banners.length)
  const prev = () => goTo((current - 1 + banners.length) % banners.length)

  const startAutoplay = () => {
    intervalRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % banners.length)
    }, 4000)
  }

  const stopAutoplay = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    startAutoplay()
    return () => stopAutoplay()
  }, [])

  return (
    <section className="container mx-auto px-4 py-4">
      <div
        className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-xl"
        onMouseEnter={stopAutoplay}
        onMouseLeave={startAutoplay}
      >
        {/* Slides */}
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            className={`absolute inset-0 bg-gradient-to-r ${banner.bgClass} flex flex-col md:flex-row items-center justify-between px-8 md:px-16 transition-all duration-700 ease-in-out`}
            style={{
              opacity: i === current ? 1 : 0,
              transform: i === current ? "translateX(0)" : i < current ? "translateX(-30px)" : "translateX(30px)",
              zIndex: i === current ? 10 : 0,
              pointerEvents: i === current ? "auto" : "none",
            }}
          >
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-black opacity-10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2 pointer-events-none" />

            {/* Text */}
            <div className="z-10 space-y-4 max-w-lg text-center md:text-left text-white">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight drop-shadow-md">
                {banner.title}
              </h2>
              <p className="text-lg md:text-xl opacity-90">{banner.subtitle}</p>
              <Button
                asChild
                size="lg"
                className="bg-white text-black hover:bg-slate-100 font-semibold mt-4 shadow-lg transition-transform hover:scale-105"
              >
                <Link href={banner.href}>{banner.cta}</Link>
              </Button>
            </div>

            {/* Emoji icon block */}
            <div className="hidden md:flex z-10 w-48 h-48 bg-white/20 backdrop-blur-sm rounded-2xl shadow-2xl items-center justify-center transition-transform duration-500 hover:rotate-3 hover:scale-105">
              <span className="text-7xl">{banner.emoji}</span>
            </div>
          </div>
        ))}

        {/* Prev / Next buttons */}
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all backdrop-blur-sm"
          aria-label="Previous"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all backdrop-blur-sm"
          aria-label="Next"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-400 ${i === current
                  ? "w-7 h-2.5 bg-white"
                  : "w-2.5 h-2.5 bg-white/50 hover:bg-white/80"
                }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
