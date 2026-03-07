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
                        <div className="flex flex-col gap-3">
                            {/* Amazon-style hover zoom */}
                            <div className="relative">
                                {product.salesCount > 100 && <Badge className="absolute top-3 left-3 z-10 bg-blue-600">Bestseller</Badge>}
                                {discount > 0 && <Badge className="absolute bottom-3 left-3 z-10 bg-red-500">{discount}% OFF</Badge>}
                                <div
                                    style={{
                                        opacity: imgFade ? 1 : 0,
                                        transition: "opacity 0.18s ease-in-out",
                                    }}
                                >
                                    <ImageZoom
                                        src={images[activeImg]}
                                        alt={product.title}
                                        zoomLevel={2.5}
                                    />
                                </div>
                            </div>


                            {/* Thumbnail strip */}
                            {images.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                    {images.map((img, i) => (
                                        <button
                                            key={i}
                                            onMouseEnter={() => changeActiveImg(i)}
                                            onClick={() => changeActiveImg(i)}
                                            className={`shrink-0 h-14 w-14 rounded-lg border-2 overflow-hidden bg-gray-50 transition-all duration-200 ${i === activeImg ? "border-primary shadow-md scale-105" : "border-gray-200 hover:border-primary hover:shadow-sm"}`}
                                        >
                                            <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-contain p-1" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Buy buttons */}
                            <div className="grid grid-cols-2 gap-3 mt-1">
                                <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold h-12"
                                    onClick={() => { addToCart(product); setDrawerOpen(true); toast({ title: "🛒 Added to cart!" }) }}>
                                    <ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart
                                </Button>
                                <Button
                                    size="lg"
                                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-12"
                                    disabled={buyingNow}
                                    onClick={() => {
                                        setBuyingNow(true)
                                        addToCart(product)
                                        router.push("/checkout")
                                    }}
                                >
                                    <Zap className="h-5 w-5 mr-2" />
                                    {buyingNow ? "Going..." : "Buy Now"}
                                </Button>
                            </div>

                        </div>

                        {/* Right: Info */}
                        <div className="space-y-4">
                            <div>
                                <Badge variant="outline" className="text-xs capitalize mb-2">{product.category}</Badge>
                                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">{product.title}</h1>
                            </div>

                            {/* Rating row */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-gray-900">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</span>
                                    <StarRating rating={Math.round(avgRating)} />
                                </div>
                                <span className="text-sm text-blue-600 underline cursor-pointer">{reviewStats.count} ratings</span>
                                <Separator orientation="vertical" className="h-4" />
                                <span className="text-sm text-blue-600">{product.salesCount} sold</span>
                            </div>

                            <Separator />

                            {/* Price */}
                            <div>
                                <div className="flex items-baseline gap-3 flex-wrap">
                                    <span className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</span>
                                    <span className="text-lg text-gray-400 line-through">{formatPrice(originalPrice)}</span>
                                    <span className="text-lg font-bold text-green-600">Save {discount}%</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">Inclusive of all taxes. Free Delivery.</p>
                            </div>

                            {/* Description */}
                            {product.description && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">About this product</h3>
                                    {descIsHtml ? (
                                        <div
                                            className="text-gray-600 text-sm leading-relaxed prose max-w-none"
                                            dangerouslySetInnerHTML={{ __html: product.description }}
                                        />
                                    ) : (
                                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
                                    )}
                                </div>
                            )}

                            {/* Tags */}
                            {product.tags && product.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {product.tags.map((tag: string) => (
                                        <Badge key={tag} variant="secondary" className="rounded-full capitalize text-xs">{tag}</Badge>
                                    ))}
                                </div>
                            )}

                            <Separator />

                            {/* Trust badges */}
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="flex flex-col items-center gap-1 p-2.5 bg-green-50 rounded-xl">
                                    <Shield className="h-5 w-5 text-green-600" />
                                    <span className="text-xs font-medium text-green-700">Secure Payment</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 p-2.5 bg-blue-50 rounded-xl">
                                    <Truck className="h-5 w-5 text-blue-600" />
                                    <span className="text-xs font-medium text-blue-700">Fast Delivery</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 p-2.5 bg-purple-50 rounded-xl">
                                    <RefreshCw className="h-5 w-5 text-purple-600" />
                                    <span className="text-xs font-medium text-purple-700">Easy Refund</span>
                                </div>
                            </div>

                            {/* Wishlist & Share */}
                            <div className="flex gap-3">
                                <Button variant="outline" className={`flex-1 ${wishlisted ? "text-red-500 border-red-200 bg-red-50" : ""}`}
                                    onClick={() => setWishlisted(!wishlisted)}>
                                    <Heart className={`h-4 w-4 mr-2 ${wishlisted ? "fill-red-500" : ""}`} />
                                    {wishlisted ? "Wishlisted" : "Wishlist"}
                                </Button>
                                <Button variant="outline" className="flex-1" onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: "Link copied!" }) }}>
                                    <Share2 className="h-4 w-4 mr-2" /> Share
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
