"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    Star, Zap, Shield,
    Heart, Share2, Loader2, X, ChevronLeft, ChevronRight, Clock, CheckCircle2
} from "lucide-react"
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
                    onClick={() => onRate?.(star)}
                    onMouseEnter={() => interactive && setHovered(star)}
                    onMouseLeave={() => interactive && setHovered(0)}
                    className={`${interactive ? "cursor-pointer" : "cursor-default"} focus:outline-none p-0.5`}>
                    <Star className={`h-4 w-4 transition-colors ${(hovered || rating) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
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
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={onClose}>
            <button onClick={(e) => { e.stopPropagation(); onClose() }}
                className="absolute top-4 right-4 h-10 w-10 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-colors z-10">
                <X className="h-5 w-5" />
            </button>
            {images.length > 1 && (<>
                <button onClick={(e) => { e.stopPropagation(); go(-1) }} className="absolute left-2 sm:left-4 h-10 w-10 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 z-10">
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); go(1) }} className="absolute right-2 sm:right-4 h-10 w-10 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 z-10">
                    <ChevronRight className="h-5 w-5" />
                </button>
            </>)}
            <img src={images[idx]} alt="Product zoom" className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
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
        <div className="flex items-center gap-2">
            <span className="w-12 text-right text-xs text-blue-600 shrink-0">{label}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-8 text-xs text-gray-400 text-right shrink-0">{pct}%</span>
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
                const [reviewData, allProds] = await Promise.all([fetchProductReviews(realId), fetchProducts()])
                setReviews(reviewData.reviews || [])
                setReviewStats(reviewData.stats || { count: 0, avgRating: "0.0" })
                const bd: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                reviewData.reviews?.forEach((r: any) => { bd[r.rating] = (bd[r.rating] || 0) + 1 })
                setRatingBreakdown(bd)
                setRelatedProducts((allProds as Product[]).filter((p) => p.category === initialProduct.category && p.id !== initialProduct.id && p.isActive).slice(0, 4))
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
            await submitReview({ productId: realProductId, userId: user?.uid, userName: reviewForm.userName, rating: reviewForm.rating, comment: reviewForm.comment })
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

    const images: string[] = (() => {
        const arr = Array.isArray((product as any).images) ? (product as any).images : []
        if (arr.filter(Boolean).length > 0) return arr.filter(Boolean)
        if (product.imageUrl) return [product.imageUrl]
        return [`/placeholder.svg?height=400&width=400&query=${encodeURIComponent(product.title)}`]
    })()

    const originalPrice = (product as any).originalPrice || product.price * 1.25
    const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100)
    const avgRating = parseFloat(reviewStats.avgRating)
    const descIsHtml = product.description?.includes("<") && product.description?.includes(">")

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <StoreHeader />

            <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6 space-y-4">

                {/* ── Hero Card ─────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2">

                        {/* LEFT — Image */}
                        <div className="flex flex-col gap-3 p-4 sm:p-6 lg:border-r lg:border-gray-100">
                            {/* Main image */}
                            <div
                                className="relative rounded-xl overflow-hidden cursor-zoom-in bg-gray-50"
                                onClick={() => setZoomIdx(activeImg)}
                            >
                                {product.salesCount > 100 && (
                                    <Badge className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-[10px]">Bestseller</Badge>
                                )}
                                {discount > 0 && (
                                    <Badge className="absolute top-2 right-2 z-10 bg-red-500 text-white text-[10px] font-bold">{discount}% OFF</Badge>
                                )}
                                <div style={{ opacity: imgFade ? 1 : 0, transition: "opacity 0.15s ease-in-out" }}>
                                    <img
                                        src={images[activeImg]}
                                        alt={product.title}
                                        className="w-full h-auto max-h-[300px] sm:max-h-[380px] object-contain mx-auto block py-2"
                                    />
                                </div>
                                <p className="text-center text-[10px] text-gray-400 pb-1">Tap to zoom</p>
                            </div>

                            {/* Thumbnails */}
                            {images.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                    {images.map((img, i) => (
                                        <button
                                            key={i}
                                            onMouseEnter={() => changeActiveImg(i)}
                                            onClick={() => changeActiveImg(i)}
                                            className={`shrink-0 h-14 w-14 rounded-lg border-2 overflow-hidden transition-all duration-200 bg-gray-50
                                                ${i === activeImg ? "border-blue-600 shadow-md scale-105" : "border-gray-200 hover:border-blue-400"}`}
                                        >
                                            <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-contain p-1" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* RIGHT — Info + Buttons */}
                        <div className="flex flex-col gap-3 p-4 sm:p-6">

                            {/* Category + Title */}
                            <div>
                                <span className="inline-block text-[11px] capitalize text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mb-2">
                                    {product.category}
                                </span>
                                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-snug">
                                    {product.title}
                                </h1>
                            </div>

                            {/* Ratings */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                                    {avgRating > 0 ? avgRating.toFixed(1) : "New"} <Star className="h-3 w-3 fill-white ml-0.5" />
                                </div>
                                <button className="text-xs text-blue-600 underline" onClick={() => setActiveTab("reviews")}>
                                    {reviewStats.count} ratings
                                </button>
                                <span className="text-gray-300 text-xs">|</span>
                                <span className="text-xs text-gray-500">{product.salesCount} sold</span>
                            </div>

                            <Separator />

                            {/* Price block */}
                            <div>
                                <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                                        {formatPrice(product.price)}
                                    </span>
                                    <span className="text-sm text-gray-400 line-through">{formatPrice(originalPrice)}</span>
                                    <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                                        {discount}% off
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">Inclusive of all taxes. Instant Delivery.</p>
                            </div>

                            {/* ── BUY NOW BUTTON ── */}
                            <div className="mt-1">
                                <button
                                    id="buy-now-btn"
                                    disabled={buyingNow}
                                    className="w-full flex items-center justify-center gap-2 h-13 py-3.5 rounded-xl font-bold text-base text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-red-600 shadow-md shadow-orange-200 transition-all duration-200 active:scale-[0.98] disabled:opacity-70"
                                    onClick={() => {
                                        setBuyingNow(true)
                                        addToCart(product)
                                        router.push("/checkout")
                                    }}
                                >
                                    <Zap className="h-5 w-5 shrink-0" />
                                    {buyingNow ? "Redirecting..." : "Pay and Download"}
                                </button>
                            </div>

                            {/* Trust strip */}
                            <div className="flex items-center justify-around bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                                <div className="flex flex-col items-center gap-1">
                                    <Shield className="h-4 w-4 text-green-600" />
                                    <span className="text-[10px] text-gray-600 font-medium text-center">Secure<br/>Payment</span>
                                </div>
                                <div className="w-px h-8 bg-gray-200" />
                                <div className="flex flex-col items-center gap-1">
                                    <Clock className="h-4 w-4 text-blue-600" />
                                    <span className="text-[10px] text-gray-600 font-medium text-center">Instant<br/>Delivery</span>
                                </div>
                                <div className="w-px h-8 bg-gray-200" />
                                <div className="flex flex-col items-center gap-1">
                                    <CheckCircle2 className="h-4 w-4 text-purple-600" />
                                    <span className="text-[10px] text-gray-600 font-medium text-center">Verified<br/>Product</span>
                                </div>
                            </div>

                            {/* Tags */}
                            {product.tags && product.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {product.tags.map((tag: string) => (
                                        <span key={tag} className="text-[11px] capitalize bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Wishlist & Share */}
                            <div className="flex gap-2 pt-1">
                                <button
                                    className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-medium border transition-all
                                        ${wishlisted ? "text-red-500 border-red-200 bg-red-50" : "text-gray-600 border-gray-200 bg-white hover:bg-gray-50"}`}
                                    onClick={() => setWishlisted(!wishlisted)}
                                >
                                    <Heart className={`h-4 w-4 ${wishlisted ? "fill-red-500" : ""}`} />
                                    {wishlisted ? "Wishlisted" : "Wishlist"}
                                </button>
                                <button
                                    className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-all"
                                    onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: "Link copied!" }) }}
                                >
                                    <Share2 className="h-4 w-4" /> Share
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Tabs ─────────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Tab bar */}
                    <div className="flex border-b border-gray-100">
                        {(["description", "reviews"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 sm:flex-none px-5 sm:px-8 py-3.5 text-sm font-semibold capitalize transition-all border-b-2 -mb-px
                                    ${activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                            >
                                {tab}
                                {tab === "reviews" && reviewStats.count > 0 && (
                                    <span className="ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                        {reviewStats.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-4 sm:p-6 lg:p-8">
                        {/* Description */}
                        {activeTab === "description" && (
                            <div>
                                {pageLoading ? (
                                    <div className="animate-pulse space-y-3">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="h-4 bg-gray-100 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
                                        ))}
                                    </div>
                                ) : product.description ? (
                                    descIsHtml ? (
                                        <div
                                            className="prose prose-sm sm:prose max-w-none
                                                prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
                                                prose-p:text-gray-600 prose-p:leading-relaxed
                                                prose-li:text-gray-600 prose-li:my-1
                                                prose-strong:text-gray-800
                                                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                                                prose-ul:pl-5 prose-ol:pl-5"
                                            dangerouslySetInnerHTML={{ __html: product.description }}
                                        />
                                    ) : (
                                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-line">
                                            {product.description}
                                        </p>
                                    )
                                ) : (
                                    <p className="text-sm text-gray-400 text-center py-8">No description available.</p>
                                )}
                            </div>
                        )}

                        {/* Reviews */}
                        {activeTab === "reviews" && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                                {/* Rating summary */}
                                <div className="flex flex-col items-center lg:border-r lg:border-gray-100 lg:pr-8 pb-4 lg:pb-0 border-b lg:border-b-0 border-gray-100">
                                    <div className="text-5xl font-bold text-gray-900">
                                        {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                                    </div>
                                    <StarRating rating={Math.round(avgRating)} />
                                    <p className="text-sm text-gray-400 mt-1 mb-4">{reviewStats.count} ratings</p>
                                    <div className="w-full space-y-1.5">
                                        {[5, 4, 3, 2, 1].map((star) => (
                                            <RatingBar key={star} label={`${star} star`} count={ratingBreakdown[star] || 0} total={reviewStats.count} />
                                        ))}
                                    </div>
                                </div>

                                {/* Write + list */}
                                <div className="lg:col-span-2">
                                    <h3 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Write a Review</h3>
                                    <form onSubmit={handleReviewSubmit} className="space-y-3">
                                        <div>
                                            <Label className="mb-1.5 block text-sm font-medium text-gray-700">Overall Rating</Label>
                                            <StarRating rating={reviewForm.rating} interactive onRate={(r) => setReviewForm({ ...reviewForm, rating: r })} />
                                        </div>
                                        <div>
                                            <Label htmlFor="reviewer-name" className="mb-1 block text-sm text-gray-700">Your Name</Label>
                                            <Input id="reviewer-name" value={reviewForm.userName}
                                                onChange={(e) => setReviewForm({ ...reviewForm, userName: e.target.value })}
                                                placeholder="Your name" required className="text-sm h-10" />
                                        </div>
                                        <div>
                                            <Label htmlFor="review-comment" className="mb-1 block text-sm text-gray-700">Review <span className="text-gray-400">(optional)</span></Label>
                                            <Textarea id="review-comment" value={reviewForm.comment}
                                                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                                placeholder="Share your experience..." rows={3} className="text-sm resize-none" />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={submittingReview}
                                            className="w-full sm:w-auto px-6 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center gap-2"
                                        >
                                            {submittingReview ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</> : "Submit Review"}
                                        </button>
                                    </form>

                                    <div className="mt-6 space-y-4">
                                        {pageLoading ? (
                                            <div className="animate-pulse space-y-3">
                                                {[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
                                            </div>
                                        ) : reviews.length === 0 ? (
                                            <div className="text-center py-8">
                                                <Star className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                                                <p className="text-sm text-gray-400">No reviews yet. Be the first!</p>
                                            </div>
                                        ) : reviews.map((review: any) => (
                                            <div key={review.id} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                    {review.userName?.[0]?.toUpperCase() || "U"}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                        <span className="font-semibold text-sm text-gray-900">{review.userName}</span>
                                                        <StarRating rating={review.rating} />
                                                    </div>
                                                    <p className="text-[11px] text-gray-400 mb-1">
                                                        {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                    </p>
                                                    {review.comment && <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>}
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
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Related Products</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {relatedProducts.map((rp) => (
                                <Link key={rp.id} href={`/products/${(rp as any).slug || rp.id}`} className="group">
                                    <div className="rounded-xl p-3 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all bg-gray-50 h-full">
                                        <div className="aspect-square mb-2 rounded-lg overflow-hidden bg-white">
                                            <img
                                                src={rp.imageUrl || `/placeholder.svg?height=200&width=200&query=${rp.category}`}
                                                alt={rp.title}
                                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                        <h4 className="text-xs font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                                            {rp.title}
                                        </h4>
                                        <p className="text-sm font-bold text-gray-900 mt-1">
                                            {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(rp.price)}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {zoomIdx !== null && <ZoomModal images={images} startIdx={zoomIdx} onClose={() => setZoomIdx(null)} />}
            <Footer />
        </div>
    )
}
