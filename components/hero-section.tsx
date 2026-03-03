"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"

export function HeroSection() {
  // Autoplay plugin not available, carousel will use manual controls

  const banners = [
    {
      id: 1,
      title: "Big Billion Days",
      subtitle: "Up to 80% Off on Software",
      bgClass: "bg-gradient-to-r from-blue-600 to-cyan-500",
      image: "/banner1.png", // In a real app, use real images
      cta: "Shop Now",
      href: "/products?category=software"
    },
    {
      id: 2,
      title: "Premium Templates",
      subtitle: "Start your project in seconds",
      bgClass: "bg-gradient-to-r from-purple-600 to-pink-500",
      image: "/banner2.png",
      cta: "Explore",
      href: "/products?category=template"
    },
    {
      id: 3,
      title: "Master New Skills",
      subtitle: "Trending Courses at lowest prices",
      bgClass: "bg-gradient-to-r from-orange-500 to-yellow-500",
      image: "/banner3.png",
      cta: "Start Learning",
      href: "/products?category=course"
    }
  ]

  return (
    <section className="container mx-auto px-4 py-4">
      <Carousel
        className="w-full"
      >
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="p-1">
                <Card className="border-0 shadow-none">
                  <CardContent className={`flex flex-col md:flex-row items-center justify-between p-8 md:p-16 h-[300px] md:h-[400px] rounded-xl text-white ${banner.bgClass} relative overflow-hidden`}>
                    
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black opacity-10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>

                    <div className="z-10 space-y-4 max-w-lg text-center md:text-left animate-slide-up">
                      <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{banner.title}</h2>
                      <p className="text-lg md:text-xl opacity-90">{banner.subtitle}</p>
                      <Button asChild size="lg" className="bg-white text-black hover:bg-slate-100 font-semibold mt-4 shadow-lg transition-transform hover:scale-105">
                        <Link href={banner.href}>
                          {banner.cta}
                        </Link>
                      </Button>
                    </div>
                    
                    {/* Placeholder for Image */}
                    <div className="hidden md:block z-10 w-64 h-64 bg-white/20 backdrop-blur-sm rounded-lg shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500 flex items-center justify-center">
                       <span className="text-4xl">✨</span>
                    </div>

                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4" />
        <CarouselNext className="right-4" />
      </Carousel>
    </section>
  )
}
