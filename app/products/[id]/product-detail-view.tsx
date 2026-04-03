"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ImageZoom } from "@/components/image-zoom"
import {
    Star, ShoppingCart, Zap, ChevronRight, Shield, Truck, RefreshCw,
    Heart, Share2, Loader2, X, ChevronLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { fetchProductReviews, submitReview, fetchProducts } from "@/lib/d1-client"
import { toast } from "@/hooks/use-toast"
import type { Product } from "@/lib/types"

// ─── Star Rating ─────────────────────────────────────────────────────────────
function StarRating({ rating, interactive = false, onRate }: { rating: number; interactive?: boolean; onRate?: (r: number) => void }) {
    const [hovered, setHovered] = useState(0)
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" disabled={!interactive}
                    onClick={() => onRate?.(star)} onMouseEnter={() => interactive && setHovered(star)} onMouseLeave={() => interactive && setHovered(0)}
                    className={`${interactive ? "cursor-pointer" : "cursor-default"} focus:outline-none`}>
                    <Star className={`h-5 w-5 transition-colors ${(hovered || rating) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                </button>
            ))}
        </div>
    )
}

// ─── Image Zoom Modal ─────────────────────────────────────────────────────────
function ZoomModal({ images, startIdx, onClose }: { images: string[]; startIdx: number; onClose: () => void }) {
    const [idx, setIdx] = useState(startIdx)
    const go = (d: number) => setIdx((i) => (i + d + images.length) % images.length)
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
            if (e.key === "ArrowLeft") go(-1)
            if (e.key === "ArrowRight") go(1)
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [])
    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
            <button onClick={(e) => { e.stopPropagation(); onClose() }}
                className="absolute top-4 right-4 h-10 w-10 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30">
                <X className="h-5 w-5" />
            </button>
            {images.length > 1 && (<>
                <button onClick={(e) => { e.stopPropagation(); go(-1) }} className="absolute left-4 h-10 w-10 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30">
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); go(1) }} className="absolute right-4 h-10 w-10 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30">
                    <ChevronRight className="h-5 w-5" />
                </button>
            </>)}
            <img src={images[idx]} alt="Product zoom" className="max-h-[85vh] max-w-[85vw] object-contain" onClick={(e) => e.stopPropagation()} />
            {images.length > 1 && (
                <div className="absolute bottom-4 flex gap-2">
                    {images.map((_, i) => <button key={i} onClick={(e) => { e.stopPropagation(); setIdx(i) }}
                        className={`h-2 rounded-full transition-all ${i === idx ? "w-8 bg-white" : "w-2 bg-white/40"}`} />)}
                </div>
            )}
        </div>
    )
}

// ─── Rating Bar ───────────────────────────────────────────────────────────────
function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0
    return (
        <div className="flex items-center gap-2 text-sm">
            <span className="w-14 text-right text-xs text-blue-600">{label}</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-7 text-xs text-gray-500">{pct}%</span>
        </div>
    )
}

export function ProductDetailView({ product: initialProduct, id }: { product: Product, id: string }) {
    const router = useRouter()
    const { addToCart, setDrawerOpen } = useCart()
    const { user } = useAuth()

    const [product, setProduct] = useState<Product>(initialProduct)
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
    const [reviews, setReviews] = useState<any[]>([])
    const [reviewStats, setReviewStats] = useState({ count: 0, avgRating: "0.0" })
    const [ratingBreakdown, setRatingBreakdown] = useState<Record<number, number>>({})
    const [loading, setLoading] = useState(false)
    const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "", userName: user?.displayName || "" })
    const [submittingReview, setSubmittingReview] = useState(false)
    const [wishlisted, setWishlisted] = useState(false)
    const [buyingNow, setBuyingNow] = useState(false)

    // Image gallery state
    const [activeImg, setActiveImg] = useState(0)
    const [imgFade, setImgFade] = useState(true)
    const [zoomIdx, setZoomIdx] = useState<number | null>(null)

    const changeActiveImg = (i: number) => {
        setImgFade(false)
        setTimeout(() => {
            setActiveImg(i)
            setImgFade(true)
        }, 180)
    }

    useEffect(() => {
        if (user?.displayName) setReviewForm(f => ({ ...f, userName: f.userName || user.displayName }))
    }, [user])

    const loadData = async () => {
        try {
            // Use initialProduct.id (UUID) — not the URL slug — for reviews
            const realId = initialProduct.id || id
            const [reviewData, allProds] = await Promise.all([
                fetchProductReviews(realId),
                fetchProducts(),
            ])
            setReviews(reviewData.reviews || [])
            setReviewStats(reviewData.stats || { count: 0, avgRating: '0.0' })
            const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            reviewData.reviews?.forEach((r: any) => { breakdown[r.rating] = (breakdown[r.rating] || 0) + 1 })
            setRatingBreakdown(breakdown)
            setRelatedProducts((allProds as Product[]).filter(p => p.category === initialProduct.category && p.id !== initialProduct.id && p.isActive).slice(0, 4))
        } catch (e) { console.error(e) }
    }

    useEffect(() => { loadData() }, [id, initialProduct])

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!reviewForm.rating) { toast({ title: "Please select a rating", variant: "destructive" }); return }
        if (!reviewForm.userName.trim()) { toast({ title: "Please enter your name", variant: "destructive" }); return }
        setSubmittingReview(true)
        try {
            // Always use the real product UUID, not the URL slug
            const realProductId = product?.id || id
            await submitReview({ productId: realProductId, userId: user?.uid, userName: reviewForm.userName, rating: reviewForm.rating, comment: reviewForm.comment })
            toast({ title: "✅ Review submitted!" })
            setReviewForm({ rating: 0, comment: "", userName: user?.displayName || "" })
            // Re-fetch reviews using the real product ID
            const reviewData = await fetchProductReviews(realProductId)
            setReviews(reviewData.reviews || [])
            setReviewStats(reviewData.stats || { count: 0, avgRating: '0.0' })
            const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            reviewData.reviews?.forEach((r: any) => { breakdown[r.rating] = (breakdown[r.rating] || 0) + 1 })
            setRatingBreakdown(breakdown)
        } catch { toast({ title: "Failed to submit review", variant: "destructive" }) }
        finally { setSubmittingReview(false) }
    }

    const formatPrice = (price: number) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price)

    // Build images array
    const images: string[] = (() => {
        const arr = Array.isArray((product as any).images) ? (product as any).images : []
        if (arr.filter(Boolean).length > 0) return arr.filter(Boolean)
        if (product.imageUrl) return [product.imageUrl]
        return [`/placeholder.svg?height=600&width=600&query=${encodeURIComponent(product.title)}`]
    })()

    const originalPrice = (product as any).originalPrice || product.price * 1.25
    const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100)
    const avgRating = parseFloat(reviewStats.avgRating)

    // Check if description is HTML
    const descIsHtml = product.description?.includes("<") && product.description?.includes(">")

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <StoreHeader />

            <main className="flex-1 container mx-auto px-4 py-6 space-y-4">

                {/* Main Product Card */}
                <div className="bg-white rounded-2xl shadow-sm p-5 lg:p-8">
                    <div className="grid lg:grid-cols-2 gap-8">

                        {/* Left: Image Gallery */}
                        <div className="lg:sticky lg:top-24 h-fit space-y-4">
                            <div className="flex flex-col-reverse md:flex-row gap-4">
                                {/* Thumbnail strip - Vertical on desktop, horizontal on mobile */}
                                {images.length > 1 && (
                                    <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[500px] pb-2 md:pb-0 scrollbar-hide shrink-0 min-w-[64px]">
                                        {images.map((img, i) => (
                                            <button
                                                key={i}
                                                onMouseEnter={() => changeActiveImg(i)}
                                                onClick={() => changeActiveImg(i)}
                                                className={`shrink-0 h-16 w-16 rounded-xl border-2 overflow-hidden bg-white transition-all duration-200 ${i === activeImg ? "border-indigo-600 shadow-md ring-2 ring-indigo-100" : "border-gray-100 hover:border-indigo-400"}`}
                                            >
                                                <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-contain p-1" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Main Image Display */}
                                <div className="flex-1 relative bg-white border border-gray-100 rounded-3xl overflow-hidden group shadow-sm hover:shadow-md transition-shadow duration-300">
                                    {product.salesCount > 100 && (
                                        <Badge className="absolute top-4 left-4 z-10 bg-indigo-600 text-white font-bold px-3 py-1 scale-110 shadow-lg">
                                            Bestseller
                                        </Badge>
                                    )}
                                    {discount > 0 && (
                                        <Badge className="absolute top-4 right-4 z-10 bg-red-500 text-white font-bold px-3 py-1 scale-110 shadow-lg">
                                            -{discount}%
                                        </Badge>
                                    )}
                                    <div
                                        className="aspect-square cursor-crosshair"
                                        style={{
                                            opacity: imgFade ? 1 : 0,
                                            transition: "opacity 0.25s ease-in-out",
                                        }}
                                    >
                                        <ImageZoom
                                            src={images[activeImg]}
                                            alt={product.title}
                                            zoomLevel={2.5}
                                        />
                                    </div>
                                    
                                    {/* Quick action buttons on image hover */}
                                    <div className="absolute bottom-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="secondary" size="icon" className="rounded-full shadow-md bg-white/80 backdrop-blur-sm hover:bg-white" onClick={() => setWishlisted(!wishlisted)}>
                                            <Heart className={`h-5 w-5 ${wishlisted ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
                                        </Button>
                                        <Button variant="secondary" size="icon" className="rounded-full shadow-md bg-white/80 backdrop-blur-sm hover:bg-white" onClick={() => setZoomIdx(activeImg)}>
                                            <Share2 className="h-5 w-5 text-gray-600" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Buy buttons */}
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold h-14 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
                                    onClick={() => { addToCart(product); setDrawerOpen(true); toast({ title: "🛒 Added to cart!" }) }}>
                                    <ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart
                                </Button>
                                <Button
                                    size="lg"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-14 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 border-0"
                                    disabled={buyingNow}
                                    onClick={() => {
                                        setBuyingNow(true)
                                        addToCart(product)
                                        router.push("/checkout")
                                    }}
                                >
                                    <Zap className="h-5 w-5 mr-2" />
                                    {buyingNow ? "Redirecting..." : "Buy Now"}
                                </Button>
                            </div>
                        </div>

                        {/* Right: Info */}
                        <div className="space-y-6">
                            <div>
                                <Badge variant="secondary" className="text-indigo-600 bg-indigo-50 border-indigo-100 text-[10px] uppercase tracking-wider font-bold mb-3 px-3 py-0.5">
                                    {product.category}
                                </Badge>
                                <h1 className="text-3xl lg:text-4xl font-black text-gray-900 leading-tight tracking-tight">
                                    {product.title}
                                </h1>
                            </div>

                            {/* Rating row */}
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-1.5 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                                    <span className="font-black text-yellow-700 text-sm">{avgRating > 0 ? avgRating.toFixed(1) : "5.0"}</span>
                                    <StarRating rating={Math.round(avgRating) || 5} />
                                </div>
                                <span className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer transition-colors">
                                    {reviewStats.count || 12} customer reviews
                                </span>
                                <Separator orientation="vertical" className="h-4 bg-gray-200" />
                                <Badge variant="outline" className="text-xs font-bold text-green-600 border-green-100 bg-green-50 px-2">
                                    <Truck className="h-3 w-3 mr-1" /> {product.salesCount || 150}+ Sold
                                </Badge>
                            </div>

                            <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-4">
                                {/* Price */}
                                <div>
                                    <div className="flex items-baseline gap-3 flex-wrap">
                                        <span className="text-4xl font-black text-gray-900">{formatPrice(product.price)}</span>
                                        <span className="text-xl text-gray-400 line-through decoration-red-400/50">{formatPrice(originalPrice)}</span>
                                        <Badge className="bg-green-500 text-white font-bold px-2 py-0">SAVE {discount}%</Badge>
                                    </div>
                                    <p className="text-[11px] font-medium text-gray-400 mt-2 flex items-center gap-1.5">
                                        <Shield className="h-3 w-3 text-green-500" /> Inclusive of all taxes • Free Express Delivery
                                    </p>
                                </div>

                                <Separator className="bg-gray-200/50" />

                                {/* Description */}
                                {product.description && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Product Details</h3>
                                        <div>
                                            {descIsHtml ? (
                                                <div
                                                    className="text-gray-600 text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-2 prose-strong:text-gray-900"
                                                    dangerouslySetInnerHTML={{ __html: product.description }}
                                                />
                                            ) : (
                                                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                                                    {product.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Tags */}
                            {product.tags && product.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {product.tags.map((tag: string) => (
                                        <Badge key={tag} className="rounded-full bg-white border-gray-200 text-gray-600 text-[10px] font-bold px-3 py-0.5 hover:border-indigo-300 hover:text-indigo-600 transition-all cursor-default">
                                            #{tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {/* Trust badges */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col items-center gap-2 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                                    <div className="p-2 rounded-full bg-green-50 group-hover:bg-green-100 transition-colors">
                                        <Shield className="h-5 w-5 text-green-600" />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-700 uppercase tracking-tight">Authentic</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                                    <div className="p-2 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
                                        <Truck className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-700 uppercase tracking-tight">Express</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                                    <div className="p-2 rounded-full bg-purple-50 group-hover:bg-purple-100 transition-colors">
                                        <RefreshCw className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-700 uppercase tracking-tight">7d Return</span>
                                </div>
                            </div>

                            {/* Wishlist & Share */}
                            <div className="flex gap-4">
                                <Button variant="outline" className={`flex-1 h-12 rounded-xl text-xs font-bold border-gray-200 transition-all ${wishlisted ? "text-red-500 border-red-100 bg-red-50/50" : "hover:bg-gray-50"}`}
                                    onClick={() => setWishlisted(!wishlisted)}>
                                    <Heart className={`h-4 w-4 mr-2 ${wishlisted ? "fill-red-500" : ""}`} />
                                    {wishlisted ? "SAVED TO WISHLIST" : "WISH LIST"}
                                </Button>
                                <Button variant="outline" className="flex-1 h-12 rounded-xl text-xs font-bold border-gray-200 hover:bg-gray-50 transition-all" 
                                    onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: "Link copied!" }) }}>
                                    <Share2 className="h-4 w-4 mr-2 text-indigo-500" /> SHARE NOW
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews */}
                <div className="bg-white rounded-2xl shadow-sm p-5 lg:p-8">
                    <h2 className="text-xl font-bold mb-5">Customer Reviews</h2>
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Rating summary */}
                        <div className="flex flex-col items-center justify-start border-r border-gray-100 pr-8">
                            <div className="text-6xl font-bold text-gray-900">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</div>
                            <StarRating rating={Math.round(avgRating)} />
                            <p className="text-sm text-gray-500 mt-1">{reviewStats.count} ratings</p>
                            <div className="w-full mt-4 space-y-1">
                                {[5, 4, 3, 2, 1].map(star => (
                                    <RatingBar key={star} label={`${star} star`} count={ratingBreakdown[star] || 0} total={reviewStats.count} />
                                ))}
                            </div>
                        </div>

                        {/* Write + list */}
                        <div className="lg:col-span-2">
                            <h3 className="font-semibold text-gray-900 mb-4">Write a review</h3>
                            <form onSubmit={handleReviewSubmit} className="space-y-3">
                                <div>
                                    <Label className="mb-1 block text-sm font-medium">Overall Rating</Label>
                                    <StarRating rating={reviewForm.rating} interactive onRate={r => setReviewForm({ ...reviewForm, rating: r })} />
                                </div>
                                <div>
                                    <Label htmlFor="reviewer-name" className="mb-1 block text-sm font-medium">Your Name</Label>
                                    <Input id="reviewer-name" value={reviewForm.userName} onChange={e => setReviewForm({ ...reviewForm, userName: e.target.value })} placeholder="Your name" required />
                                </div>
                                <div>
                                    <Label htmlFor="review-comment" className="mb-1 block text-sm font-medium">Your Review (optional)</Label>
                                    <Textarea id="review-comment" value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="Share your experience..." rows={3} />
                                </div>
                                <Button type="submit" disabled={submittingReview}>
                                    {submittingReview ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : "Submit Review"}
                                </Button>
                            </form>

                            <div className="mt-6 space-y-5">
                                {reviews.length === 0 ? (
                                    <p className="text-gray-500 text-sm">No reviews yet. Be the first!</p>
                                ) : (
                                    reviews.map((review: any) => (
                                        <div key={review.id} className="border-b border-gray-100 pb-5 last:border-0">
                                            <div className="flex items-start gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                    {review.userName?.[0]?.toUpperCase() || "U"}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <span className="font-semibold text-sm">{review.userName}</span>
                                                        <StarRating rating={review.rating} />
                                                        <span className="text-xs text-gray-400 ml-auto">
                                                            {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                        </span>
                                                    </div>
                                                    {review.comment && <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm p-5 lg:p-8">
                        <h2 className="text-xl font-bold mb-4">Related Products</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {relatedProducts.map((rp) => (
                                <Link key={rp.id} href={`/products/${(rp as any).slug || rp.id}`} className="group">
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all">
                                        <div className="relative aspect-square mb-2 bg-white rounded-lg overflow-hidden">
                                            <img
                                                src={rp.imageUrl || `/placeholder.svg?height=200&width=200&query=${rp.category}`}
                                                alt={rp.title}
                                                className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform"
                                            />
                                        </div>
                                        <h4 className="text-xs font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">{rp.title}</h4>
                                        <p className="text-sm font-bold text-gray-900 mt-1">{formatPrice(rp.price)}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Zoom Modal */}
            {zoomIdx !== null && <ZoomModal images={images} startIdx={zoomIdx} onClose={() => setZoomIdx(null)} />}

            <Footer />
        </div>
    )
}
