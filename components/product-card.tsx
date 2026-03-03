"use client"

import Link from "next/link"
import { ShoppingCart, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useCart } from "@/contexts/cart-context"
import type { Product } from "@/lib/types"
import { useState, useEffect, useRef } from "react"

interface ProductCardProps { product: Product }

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart()
  const [added, setAdded] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price)

  // Use real originalPrice if admin set it, else no strikethrough
  const p = product as any
  const origPrice: number | null = p.originalPrice ? Number(p.originalPrice) : null
  const discount = origPrice && origPrice > product.price
    ? Math.round(((origPrice - product.price) / origPrice) * 100)
    : 0

  // Real rating from DB (joined in products API)
  const avgRating: number = p.avgRating ? Number(p.avgRating) : 0
  const reviewCount: number = p.reviewCount ? Number(p.reviewCount) : 0

  // Build images array
  const images: string[] = (() => {
    const arr = Array.isArray(p.images) ? p.images : []
    if (arr.filter(Boolean).length > 0) return arr.filter(Boolean)
    if (product.imageUrl) return [product.imageUrl]
    return []
  })()

  const isValidUrl = (url: string) => url && (url.startsWith("http") || url.startsWith("/"))
  const currentImg = images[imgIdx] && isValidUrl(images[imgIdx])
    ? images[imgIdx]
    : `/placeholder.svg?height=200&width=300&query=${encodeURIComponent(product?.category || "product")}`

  const handleMouseEnter = () => {
    if (images.length < 2) return
    timerRef.current = setInterval(() => {
      setImgIdx((i) => (i + 1) % images.length)
    }, 1200)
  }
  const handleMouseLeave = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setImgIdx(0)
  }
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    addToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const href = `/products/${p.slug || product.id}`

  return (
    <Link href={href} className="block h-full">
      <Card
        className="group relative bg-white border border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden h-full flex flex-col cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Badges */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">-{discount}%</div>
        )}
        {product.salesCount > 100 && (
          <div className="absolute top-2 right-2 z-10 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">Bestseller</div>
        )}

        {/* Image */}
        <div className="relative h-40 w-full bg-gray-50 overflow-hidden flex items-center justify-center p-2">
          <img
            src={currentImg}
            alt={product?.title || "product"}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
          {images.length > 1 && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all ${i === imgIdx ? "w-4 bg-primary" : "w-1 bg-gray-300"}`} />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-3 flex-1 flex flex-col gap-1">
          <h3 className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm leading-snug">
            {product.title}
          </h3>

          {/* Real rating — only show if product has at least 1 review */}
          {avgRating > 0 ? (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5 bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                {avgRating.toFixed(1)} <Star className="h-2.5 w-2.5 fill-current ml-0.5" />
              </div>
              <span className="text-xs text-gray-400">({reviewCount})</span>
            </div>
          ) : (
            <div className="text-xs text-gray-400">No reviews yet</div>
          )}

          <div className="mt-auto pt-1">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base font-bold text-slate-900">{formatPrice(product.price)}</span>
              {/* Only show strikethrough if admin set originalPrice AND it's higher than current price */}
              {origPrice && origPrice > product.price && (
                <>
                  <span className="text-xs text-gray-400 line-through">{formatPrice(origPrice)}</span>
                  <span className="text-xs font-semibold text-green-600">{discount}% off</span>
                </>
              )}
            </div>
            <div className="text-[10px] text-green-700 font-medium">Free Delivery</div>
          </div>

          <Button
            className={`w-full mt-1.5 h-8 text-xs font-semibold transition-all active:scale-95 ${added ? "bg-green-500 hover:bg-green-600 text-white" : "bg-yellow-400 hover:bg-yellow-500 text-slate-900"}`}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
            {added ? "✓ Added!" : "Add to Cart"}
          </Button>
        </CardContent>
      </Card>
    </Link>
  )
}