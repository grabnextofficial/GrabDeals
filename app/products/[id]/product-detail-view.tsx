"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    Star, ShoppingCart, Zap, ChevronRight, Shield,
    Heart, Share2, Loader2, X, ChevronLeft, Clock, CheckCircle2
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
function StarRating({
    rating,
    interactive = false,
    onRate,
}: {
    rating: number
    interactive?: boolean
    onRate?: (r: number) => void
}) {
    const [hovered, setHovered] = useState(0)
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={!interactive}
                    onClick={() => onRate?.(star)}
                    onMouseEnter={() => interactive && setHovered(star)}
                    onMouseLeave={() => interactive && setHovered(0)}
                    className={`${interactive ? "cursor-pointer" : "cursor-default"} focus:outline-none`}
                >
                    <Star
                        className={`h-4 w-4 transition-colors ${(hovered || rating) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                    />
                </button>
            ))}
        </div>
    )
}

// ─── Image Zoom Modal ─────────────────────────────────────────────────────────
function ZoomModal({
    images,
    startIdx,
    onClose,
}: {
    images: string[]
    startIdx: number
    onClose: () => void
}) {
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
        <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={onClose}
        >
            <button
                onClick={(e) => { e.stopPropagation(); onClose() }}
                className="absolute top-4 right-4 h-10 w-10 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
                <X className="h-5 w-5" />
            </button>
            {images.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); go(-1) }}
                        className="absolute left-4 h-10 w-10 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); go(1) }}
                        className="absolute right-4 h-10 w-10 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </>
            )}
            <img
                src={images[idx]}
                alt="Product zoom"
                className="max-h-[85vh] max-w-[85vw] object-contain"
                onClick={(e) => e.stopPropagation()}
            />
            {images.length > 1 && (
                <div className="absolute bottom-4 flex gap-2">
                    {images.map((_, i) => (
                        <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); setIdx(i) }}
                            className={`h-2 rounded-full transition-all ${i === idx ? "w-8 bg-white" : "w-2 bg-white/40"}`}
                        />
                    ))}
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
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-7 text-xs text-gray-500">{pct}%</span>
        </div>
    )
}

export function ProductDetailView({ product: initialProduct, id }: { product: Product; id: string }) {
    const router = useRouter()
    const { addToCart } = useCart()
    const { user } = useAuth()

    const [product] = useState<Product>(initialProduct)
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
    const [reviews, setReviews] = useState<any[]>([])
    const [reviewStats, setReviewStats] = useState({ count: 0, avgRating: "0.0" })
    const [ratingBreakdown, setRatingBreakdown] = useState<Record<number, number>>({})
    const [pageLoading, setPageLoading] = useState(true)
    const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "", userName: user?.displayName || "" })
    const [submittingReview, setSubmittingReview] = useState(false)
    const [wishlisted, setWishlisted] = useState(false)
    const [buyingNow, setBuyingNow] = useState(false)
    const [activeTab, setActiveTab] = useState<"description" | "reviews">("description")

    // Image gallery
    const [activeImg, setActiveImg] = useState(0)
    const [imgFade, setImgFade] = useState(true)
    const [zoomIdx, setZoomIdx] = useState<number | null>(null)

    const changeActiveImg = (i: number) => {
        setImgFade(false)
        setTimeout(() => { setActiveImg(i); setImgFade(true) }, 150)
    }

    useEffect(() => {
        if (user?.displayName) setReviewForm((f) => ({ ...f, userName: f.userName || user.displayName }))
    }, [user])

    useEffect(() => {
        const load = async () => {
            setPageLoading(true)
            try {
                const realId = initialProduct.id || id
                const [reviewData, allProds] = await Promise.all([
                    fetchProductReviews(realId),
                    fetchProducts(),
                ])
                setReviews(reviewData.reviews || [])
                setReviewStats(reviewData.stats || { count: 0, avgRating: "0.0" })
                const bd: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                reviewData.reviews?.forEach((r: any) => { bd[r.rating] = (bd[r.rating] || 0) + 1 })
                setRatingBreakdown(bd)
                setRelatedProducts(
                    (allProds as Product[])
                        .filter((p) => p.category === initialProduct.category && p.id !== initialProduct.id && p.isActive)
                        .slice(0, 4)
                )
            } catch (e) { console.error(e) }
            finally { setPageLoading(false) }
        }
        load()
    }, [id, initialProduct])

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!reviewForm.rating) { toast({ title: "Please select a rating", variant: "destructive" }); return }
        if (!reviewForm.userName.trim()) { toast({ title: "Please enter your name", variant: "destructive" }); return }
        setSubmittingReview(true)
        try {
            const realProductId = product?.id || id
            await submitReview({
                productId: realProductId,
                userId: user?.uid,
                userName: reviewForm.userName,
                rating: reviewForm.rating,
                comment: reviewForm.comment,
            })
            toast({ title: "✅ Review submitted!" })
            setReviewForm({ rating: 0, comment: "", userName: user?.displayName || "" })
            const reviewData = await fetchProductReviews(realProductId)
            setReviews(reviewData.reviews || [])
            setReviewStats(reviewData.stats || { count: 0, avgRating: "0.0" })
            const bd: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            reviewData.reviews?.forEach((r: any) => { bd[r.rating] = (bd[r.rating] || 0) + 1 })
            setRatingBreakdown(bd)
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
    const descIsHtml = product.description?.includes("<") && product.description?.includes(">")

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <StoreHeader />

            <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-4">

                {/* ── Hero Product Card ─────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">

                        {/* LEFT: Image Gallery */}
                        <div className="flex flex-col gap-3">
                            {/* Main image — natural size, no white box */}
                            <div className="relative rounded-xl overflow-hidden cursor-zoom-in" onClick={() => setZoomIdx(activeImg)}>
                                {product.salesCount > 100 && (
                                    <Badge className="absolute top-3 left-3 z-10 bg-blue-600 text-white text-xs">Bestseller</Badge>
                                )}
                                {discount > 0 && (
                                    <Badge className="absolute top-3 right-3 z-10 bg-red-500 text-white text-xs font-bold">{discount}% OFF</Badge>
                                )}
                                <div
                                    style={{ opacity: imgFade ? 1 : 0, transition: "opacity 0.15s ease-in-out" }}
                                    className="w-full"
                                >
                                    <img
                                        src={images[activeImg]}
                                        alt={product.title}
                                        className="w-full h-auto max-h-[420px] object-contain mx-auto block"
                                        style={{ background: "transparent" }}
                                    />
                                </div>
                            </div>

                            {/* Thumbnails */}
                            {images.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                    {images.map((img, i) => (
                                        <button
                                            key={i}
                                            onMouseEnter={() => changeActiveImg(i)}
                                            onClick={() => changeActiveImg(i)}
                                            className={`shrink-0 h-14 w-14 sm:h-16 sm:w-16 rounded-lg border-2 overflow-hidden transition-all duration-200
                                                ${i === activeImg
                                                    ? "border-blue-600 shadow-md scale-105"
                                                    : "border-gray-200 hover:border-blue-400 hover:shadow-sm"
                                                }`}
                                        >
                                            <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-contain" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Info Panel */}
                        <div className="flex flex-col gap-4">
                            {/* Category + Title */}
                            <div>
                                <Badge variant="outline" className="text-xs capitalize mb-2 border-gray-200 text-gray-500">
                                    {product.category}
                                </Badge>
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                                    {product.title}
                                </h1>
                            </div>

                            {/* Rating row */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-1">
                                    <span className="font-semibold text-gray-900 text-sm">
                                        {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                                    </span>
                                    <StarRating rating={Math.round(avgRating)} />
                                </div>
                                <span
                                    className="text-sm text-blue-600 underline cursor-pointer"
                                    onClick={() => setActiveTab("reviews")}
                                >
                                    {reviewStats.count} ratings
                                </span>
                                <span className="text-gray-300">|</span>
                                <span className="text-sm text-blue-600">{product.salesCount} sold</span>
                            </div>

                            <Separator />

                            {/* Price */}
                            <div className="space-y-1">
                                <div className="flex items-baseline gap-3 flex-wrap">
                                    <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                                        {formatPrice(product.price)}
                                    </span>
                                    <span className="text-base text-gray-400 line-through">{formatPrice(originalPrice)}</span>
                                    <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                        Save {discount}%
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400">Inclusive of all taxes. Free Delivery.</p>
                            </div>

                            {/* ── CTA BUTTONS under price on right side ── */}
                            <div className="flex flex-col sm:flex-row gap-3 mt-1">
                                {/* Add to Cart */}
                                <Button
                                    id="add-to-cart-btn"
                                    size="lg"
                                    variant="outline"
                                    className="flex-1 h-12 font-bold border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-200 rounded-xl text-sm sm:text-base"
                                    onClick={() => {
                                        addToCart(product)
                                        toast({ title: "🛒 Added to cart!" })
                                    }}
                                >
                                    <ShoppingCart className="h-5 w-5 mr-2 shrink-0" />
                                    Add to Cart
                                </Button>

                                {/* Buy Now — direct checkout, no sidebar */}
                                <Button
                                    id="buy-now-btn"
                                    size="lg"
                                    className="flex-1 h-12 font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] rounded-xl text-sm sm:text-base"
                                    disabled={buyingNow}
                                    onClick={() => {
                                        setBuyingNow(true)
                                        addToCart(product)
                                        router.push("/checkout")
                                    }}
                                >
                                    <Zap className="h-5 w-5 mr-2 shrink-0" />
                                    {buyingNow ? "Going..." : "Buy Now"}
                                </Button>
                            </div>

                            {/* Trust line */}
                            <p className="text-xs text-gray-500 text-center sm:text-left">
                                ⚡ Instant Delivery &nbsp;|&nbsp; 🔒 Secure Payment &nbsp;|&nbsp; ✅ Verified Product
                            </p>

                            <Separator />

                            {/* Tags */}
                            {product.tags && product.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {product.tags.map((tag: string) => (
                                        <Badge key={tag} variant="secondary" className="rounded-full capitalize text-xs px-3">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {/* Trust badges */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="flex flex-col items-center gap-1 p-2.5 bg-green-50 rounded-xl border border-green-100">
                                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                                    <span className="text-[10px] sm:text-xs font-medium text-green-700 text-center">Secure Payment</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                                    <span className="text-[10px] sm:text-xs font-medium text-blue-700 text-center">Instant Delivery</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 p-2.5 bg-purple-50 rounded-xl border border-purple-100">
                                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                                    <span className="text-[10px] sm:text-xs font-medium text-purple-700 text-center">Verified Product</span>
                                </div>
                            </div>

                            {/* Wishlist & Share */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={`flex-1 transition-all ${wishlisted ? "text-red-500 border-red-300 bg-red-50" : "border-gray-200"}`}
                                    onClick={() => setWishlisted(!wishlisted)}
                                >
                                    <Heart className={`h-4 w-4 mr-1.5 ${wishlisted ? "fill-red-500" : ""}`} />
                                    {wishlisted ? "Wishlisted" : "Wishlist"}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 border-gray-200"
                                    onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: "Link copied!" }) }}
                                >
                                    <Share2 className="h-4 w-4 mr-1.5" /> Share
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Tabs Section ─────────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                    {/* Tab bar */}
                    <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-hide">
                        {(["description", "reviews"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 sm:px-8 py-4 text-sm font-semibold capitalize whitespace-nowrap transition-all border-b-2 -mb-px flex-shrink-0
                                    ${activeTab === tab
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-800"
                                    }`}
                            >
                                {tab}
                                {tab === "reviews" && reviewStats.count > 0 && (
                                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                        {reviewStats.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="p-4 sm:p-6 lg:p-8">

                        {/* Description */}
                        {activeTab === "description" && (
                            <div>
                                {pageLoading ? (
                                    <div className="animate-pulse space-y-3">
                                        <div className="h-4 bg-gray-100 rounded w-3/4" />
                                        <div className="h-4 bg-gray-100 rounded w-full" />
                                        <div className="h-4 bg-gray-100 rounded w-2/3" />
                                        <div className="h-4 bg-gray-100 rounded w-5/6" />
                                    </div>
                                ) : product.description ? (
                                    descIsHtml ? (
                                        <div
                                            className="prose max-w-none text-sm sm:text-base leading-relaxed
                                                prose-headings:text-gray-900 prose-headings:font-bold
                                                prose-p:text-gray-600 prose-li:text-gray-600
                                                prose-strong:text-gray-900 prose-a:text-blue-600
                                                prose-h2:text-lg prose-h3:text-base
                                                prose-ul:my-2 prose-li:my-0.5"
                                            dangerouslySetInnerHTML={{ __html: product.description }}
                                        />
                                    ) : (
                                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-line">
                                            {product.description}
                                        </p>
                                    )
                                ) : (
                                    <p className="text-sm text-gray-400">No description available.</p>
                                )}
                            </div>
                        )}

                        {/* Reviews */}
                        {activeTab === "reviews" && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                                {/* Rating summary */}
                                <div className="flex flex-col items-center justify-start lg:border-r lg:border-gray-100 lg:pr-8">
                                    <div className="text-5xl sm:text-6xl font-bold text-gray-900">
                                        {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                                    </div>
                                    <StarRating rating={Math.round(avgRating)} />
                                    <p className="text-sm text-gray-500 mt-1">{reviewStats.count} ratings</p>
                                    <div className="w-full mt-4 space-y-1.5">
                                        {[5, 4, 3, 2, 1].map((star) => (
                                            <RatingBar key={star} label={`${star} star`} count={ratingBreakdown[star] || 0} total={reviewStats.count} />
                                        ))}
                                    </div>
                                </div>

                                {/* Write + list */}
                                <div className="lg:col-span-2">
                                    <h3 className="font-semibold text-gray-900 mb-4">Write a Review</h3>
                                    <form onSubmit={handleReviewSubmit} className="space-y-3">
                                        <div>
                                            <Label className="mb-1 block text-sm font-medium text-gray-700">Overall Rating</Label>
                                            <StarRating rating={reviewForm.rating} interactive onRate={(r) => setReviewForm({ ...reviewForm, rating: r })} />
                                        </div>
                                        <div>
                                            <Label htmlFor="reviewer-name" className="mb-1 block text-sm font-medium text-gray-700">Your Name</Label>
                                            <Input
                                                id="reviewer-name"
                                                value={reviewForm.userName}
                                                onChange={(e) => setReviewForm({ ...reviewForm, userName: e.target.value })}
                                                placeholder="Your name"
                                                required
                                                className="text-sm"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="review-comment" className="mb-1 block text-sm font-medium text-gray-700">
                                                Your Review <span className="text-gray-400 font-normal">(optional)</span>
                                            </Label>
                                            <Textarea
                                                id="review-comment"
                                                value={reviewForm.comment}
                                                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                                placeholder="Share your experience..."
                                                rows={3}
                                                className="text-sm resize-none"
                                            />
                                        </div>
                                        <Button type="submit" disabled={submittingReview} className="w-full sm:w-auto">
                                            {submittingReview
                                                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
                                                : "Submit Review"}
                                        </Button>
                                    </form>

                                    <div className="mt-6 space-y-5">
                                        {pageLoading ? (
                                            <div className="animate-pulse space-y-3">
                                                <div className="h-12 bg-gray-100 rounded" />
                                                <div className="h-12 bg-gray-100 rounded" />
                                            </div>
                                        ) : reviews.length === 0 ? (
                                            <p className="text-sm text-gray-400">No reviews yet. Be the first!</p>
                                        ) : reviews.map((review: any) => (
                                            <div key={review.id} className="border-b border-gray-100 pb-5 last:border-0">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                        {review.userName?.[0]?.toUpperCase() || "U"}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <span className="font-semibold text-sm text-gray-900">{review.userName}</span>
                                                            <StarRating rating={review.rating} />
                                                            <span className="text-xs text-gray-400 ml-auto">
                                                                {new Date(review.createdAt).toLocaleDateString("en-IN", {
                                                                    day: "numeric", month: "short", year: "numeric"
                                                                })}
                                                            </span>
                                                        </div>
                                                        {review.comment && (
                                                            <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Related Products ─────────────────────────────────── */}
                {relatedProducts.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Related Products</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                            {relatedProducts.map((rp) => (
                                <Link key={rp.id} href={`/products/${(rp as any).slug || rp.id}`} className="group">
                                    <div className="rounded-xl p-3 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all bg-gray-50">
                                        <div className="relative aspect-square mb-2 rounded-lg overflow-hidden">
                                            <img
                                                src={rp.imageUrl || `/placeholder.svg?height=200&width=200&query=${rp.category}`}
                                                alt={rp.title}
                                                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                            />
                                        </div>
                                        <h4 className="text-xs font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                            {rp.title}
                                        </h4>
                                        <p className="text-sm font-bold text-gray-900 mt-1">{formatPrice(rp.price)}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Zoom Modal */}
            {zoomIdx !== null && (
                <ZoomModal images={images} startIdx={zoomIdx} onClose={() => setZoomIdx(null)} />
            )}

            <Footer />
        </div>
    )
}
