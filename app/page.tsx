"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { fetchProducts, fetchCategories } from "@/lib/d1-client"
import type { Product } from "@/lib/types"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"

// ─── Carousel ───────────────────────────────────────────────────────────────
function useBannerCarousel(total: number) {
  const [idx, setIdx] = useState(0)
  const next = useCallback(() => setIdx((i) => (i + 1) % total), [total])
  const prev = useCallback(() => setIdx((i) => (i - 1 + total) % total), [total])
  useEffect(() => {
    if (total < 2) return
    const t = setInterval(next, 4500)
    return () => clearInterval(t)
  }, [next, total])
  return { idx, next, prev, setIdx }
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [banners, setBanners] = useState<any[]>([])   // empty = no carousel shown
  const [loading, setLoading] = useState(true)

  const { idx, next, prev, setIdx } = useBannerCarousel(banners.length)

  const loadProducts = useCallback(async () => {
    try {
      const [prods, cats] = await Promise.all([fetchProducts(), fetchCategories()])
      setProducts(Array.isArray(prods) ? (prods as Product[]).filter((p) => p.isActive) : [])
      setCategories(Array.isArray(cats) ? cats.filter((c) => c.isActive !== 0) : [])
      // Banners — only real ones from admin, no fallback dummies
      try {
        const res = await fetch("/api/banners", { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) setBanners(data)
        }
      } catch { /* banners optional */ }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
    // Re-fetch when user returns to page (e.g. after submitting a review)
    const onVisible = () => { if (document.visibilityState === 'visible') loadProducts() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [loadProducts])

  const featured = products.slice(0, 8)
  const topSellers = [...products].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, 4)

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <StoreHeader />

      {/* Category Quick-Nav */}
      {categories.length > 0 && (
        <div className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-2 overflow-x-auto scrollbar-hide">
            <div className="flex gap-5 min-w-max">
              {categories.slice(0, 12).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="flex flex-col items-center gap-1 group min-w-[56px]"
                >
                  <div className="h-11 w-11 rounded-full bg-slate-50 border-2 border-transparent group-hover:border-primary transition-all overflow-hidden flex items-center justify-center">
                    {cat.imageUrl
                      ? <img src={cat.imageUrl} alt={cat.name} className="h-full w-full object-cover" />
                      : <span className="text-lg font-bold text-slate-300">{cat.name[0]}</span>
                    }
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600 group-hover:text-primary text-center leading-tight">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 container mx-auto px-3 md:px-4 py-4 space-y-5">

        {/* Banner Carousel — only if admin added banners */}
        {banners.length > 0 && (
          <div className="relative rounded-2xl overflow-hidden h-44 md:h-64 shadow-md">
            {banners.map((b, i) => {
              const isHex = b.bgColor?.startsWith("#")
              return (
                <div
                  key={b.id}
                  className={`absolute inset-0 transition-all duration-700 ${i === idx ? "opacity-100 z-10" : "opacity-0 z-0"} ${!isHex ? `bg-gradient-to-r ${b.bgColor || "from-blue-600 to-indigo-700"}` : ""}`}
                  style={isHex ? { background: b.bgColor } : {}}
                >
                  {b.imageUrl && (
                    <img src={b.imageUrl} alt={b.title} className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-14 gap-2">
                    <h2 className="text-xl md:text-3xl font-extrabold text-white leading-tight drop-shadow">{b.title}</h2>
                    {b.subtitle && <p className="text-white/90 text-sm md:text-base max-w-lg">{b.subtitle}</p>}
                    <Link href={b.linkUrl || "/products"}>
                      <Button className="mt-1 bg-white text-gray-900 hover:bg-gray-100 font-bold shadow-lg w-fit text-sm h-9">
                        {b.buttonText || "Shop Now"} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
            {banners.length > 1 && (
              <>
                <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow">
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                  {banners.map((_, i) => (
                    <button key={i} onClick={() => setIdx(i)}
                      className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Featured Products */}
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Featured Products</h2>
              <p className="text-xs text-slate-400 mt-0.5">Top picks for you</p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs h-8">
              <Link href="/products">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="rounded-xl bg-gray-100 animate-pulse h-60" />)}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-400 text-sm">No products yet.</p>
              <Button asChild variant="outline" className="mt-3" size="sm"><Link href="/admin/products">Add Products →</Link></Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>

        {/* Top Sellers */}
        {!loading && topSellers.length > 0 && (
          <section className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">🔥 Top Sellers</h2>
              <Button asChild variant="ghost" size="sm" className="text-primary text-xs h-8">
                <Link href="/products?sort=popular">See All</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {topSellers.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* Category Cards */}
        {categories.length > 0 && (
          <section className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Shop by Category</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {categories.slice(0, 12).map((cat) => (
                <Link key={cat.id} href={`/products?category=${cat.slug}`}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-primary hover:shadow-sm transition-all group">
                  <div className="h-12 w-12 rounded-full overflow-hidden bg-slate-50 flex items-center justify-center border border-gray-100">
                    {cat.imageUrl
                      ? <img src={cat.imageUrl} alt={cat.name} className="h-full w-full object-cover" />
                      : <span className="text-xl font-bold text-slate-300">{cat.name[0]}</span>
                    }
                  </div>
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-primary text-center leading-tight">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>
      <Footer />
    </div>
  )
}