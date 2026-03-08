"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { StoreHeader } from "@/components/store-header"
import { useAuth } from "@/contexts/auth-context"
import { getUserOrders } from "@/lib/d1-client"
import { toast } from "@/hooks/use-toast"
import {
    User, ShoppingBag, Download, Loader2, Package, LogIn,
    CalendarDays, CreditCard, ExternalLink, ShieldCheck, ChevronDown, ChevronUp, MapPin, Lock, ShoppingCart
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { DigitalProductViewer } from "@/components/digital-product-viewer"

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { bg: string; text: string; dot: string }> = {
        paid: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
        pending: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
        completed: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
        processing: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
        refunded: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
        cancelled: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-500" },
    }
    const style = map[status] || { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" }
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    )
}

function formatDateTime(ts: number | string) {
    if (!ts) return "—"
    const d = new Date(Number(ts))
    return d.toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true
    })
}

function OrderCard({ order, onPay }: { order: any, onPay?: (order: any) => void }) {
    const [expanded, setExpanded] = useState(false)
    let items: any[] = []
    try { items = Array.isArray(order.items) ? order.items : JSON.parse(order.items) } catch { }

    const hasDigitalItems = items.some((item: any) => item.downloadUrl)

    return (
        <Card className="overflow-hidden border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
            {/* Order Header */}
            <div
                className="flex flex-wrap gap-4 items-center justify-between px-5 py-4 cursor-pointer bg-gradient-to-r from-blue-50 to-white"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="space-y-0.5">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Order ID</p>
                    <p className="font-mono text-sm font-bold text-gray-800">{order.id}</p>
                </div>

                <div className="space-y-0.5">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide flex items-center gap-1"><CalendarDays className="h-3 w-3" />Date</p>
                    <p className="text-sm font-medium text-gray-700">{formatDateTime(order.createdAt)}</p>
                </div>

                <div className="space-y-0.5 text-right">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total</p>
                    <p className="text-lg font-bold text-blue-600">₹{Number(order.totalAmount).toLocaleString("en-IN")}</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={order.status} />
                    {hasDigitalItems && (
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Download className="h-3 w-3" /> Digital
                        </span>
                    )}
                </div>

                <button className="text-gray-400 hover:text-blue-500 transition-colors">
                    {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <CardContent className="px-5 pb-5 pt-0">
                    <Separator className="mb-4" />

                    {/* Customer Info */}
                    <div className="mb-4 bg-gray-50 rounded-xl p-3 text-sm">
                        <p className="text-xs font-semibold uppercase text-gray-500 mb-2 tracking-wide flex items-center gap-1">
                            <User className="h-3 w-3" /> Customer Info
                        </p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-gray-700">
                            {order.userName && <p><span className="text-gray-400">Name:</span> {order.userName}</p>}
                            {order.userEmail && <p><span className="text-gray-400">Email:</span> {order.userEmail}</p>}
                            {order.userPhone && <p><span className="text-gray-400">Phone:</span> {order.userPhone}</p>}
                        </div>
                    </div>

                    {/* Items List */}
                    <p className="text-xs font-semibold uppercase text-gray-500 mb-3 tracking-wide flex items-center gap-1">
                        <Package className="h-3 w-3" /> Items Ordered
                    </p>
                    <div className="space-y-3">
                        {items.map((item: any, i: number) => (
                            <div key={i} className="flex gap-3 items-start bg-white border border-gray-100 rounded-xl p-3">
                                {/* Product image */}
                                <div className="shrink-0 h-16 w-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                    {item.imageUrl ? (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            className="h-full w-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center">
                                            <Package className="h-6 w-6 text-gray-300" />
                                        </div>
                                    )}
                                </div>

                                {/* Product info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            {item.id ? (
                                                <Link href={`/products/${item.id}`} className="font-semibold text-gray-800 hover:text-blue-600 transition-colors line-clamp-2 flex items-center gap-1 group">
                                                    {item.title}
                                                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 shrink-0" />
                                                </Link>
                                            ) : (
                                                <p className="font-semibold text-gray-800 line-clamp-2">{item.title}</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Qty: {item.quantity} × ₹{Number(item.price).toLocaleString("en-IN")}
                                            </p>
                                        </div>
                                        <p className="font-bold text-gray-800 shrink-0">
                                            ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                                        </p>
                                    </div>

                                    {/* Download button for digital products */}
                                    {item.downloadUrl && (
                                        <div className="flex gap-2 mt-2">
                                            <a
                                                href={item.downloadUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 px-3 py-1.5 rounded-lg transition-all shadow-sm hover:shadow-md"
                                            >
                                                <Download className="h-3.5 w-3.5" /> Download
                                            </a>
                                            <DigitalProductViewer downloadUrl={item.downloadUrl} title={item.title} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Payment Info */}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        {order.status === 'pending' && onPay && (
                            <Button
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); onPay(order); }}
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold shadow-sm"
                            >
                                <CreditCard className="h-4 w-4 mr-2" /> Pay Now
                            </Button>
                        )}
                        {order.paymentId && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border">
                                <CreditCard className="h-4 w-4 shrink-0" />
                                <span><strong>Payment ID:</strong> {order.paymentId}</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    )
}

export default function DashboardPage() {
    const { user, loading: authLoading, refreshUser } = useAuth()
    const [orders, setOrders] = useState<any[]>([])
    const [ordersLoading, setOrdersLoading] = useState(true)
    const [profileForm, setProfileForm] = useState({
        displayName: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        country: "",
    })
    const [savingProfile, setSavingProfile] = useState(false)
    const [activeGateway, setActiveGateway] = useState<string>("xpay")
    const [completingPayment, setCompletingPayment] = useState<boolean>(false)

    // Load active payment gateway from settings
    useEffect(() => {
        fetch("/api/settings")
            .then((r) => r.json())
            .then((data) => setActiveGateway(data.payment_gateway || "xpay"))
            .catch(() => setActiveGateway("xpay"))
    }, [])

    // Load Razorpay script when needed
    useEffect(() => {
        if (activeGateway === "razorpay") {
            if (!document.querySelector('script[src*="razorpay"]')) {
                const script = document.createElement("script")
                script.src = "https://checkout.razorpay.com/v1/checkout.js"
                script.async = true
                document.body.appendChild(script)
            }
        }
    }, [activeGateway])

    useEffect(() => {
        if (user) {
            setProfileForm({
                displayName: user.displayName || "",
                phone: (user as any).phone || "",
                address: (user as any).address || "",
                city: (user as any).city || "",
                state: (user as any).state || "",
                country: (user as any).country || "",
            })
            loadOrders()
        } else if (!authLoading) {
            setOrdersLoading(false)
        }
    }, [user, authLoading])

    const loadOrders = async () => {
        if (!user) return
        setOrdersLoading(true)
        try {
            const data = await getUserOrders(user.uid)
            setOrders(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error(e)
        } finally {
            setOrdersLoading(false)
        }
    }

    const updateOrder = async (orderId: string, paymentId: string) => {
        try {
            await fetch("/api/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: orderId,
                    status: "paid",
                    paymentId,
                }),
            })
            toast({ title: "🎉 Payment Successful!" })
            loadOrders()
        } catch (err) {
            console.error("Order update error:", err)
        }
    }

    const handlePayNow = async (order: any) => {
        setCompletingPayment(true)
        const orderId = order.id

        if (activeGateway === "razorpay") {
            const orderRes = await fetch("/api/razorpay/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: order.totalAmount, currency: "INR" }),
            })
            const orderData = await orderRes.json()
            if (!orderData.orderId || !window.Razorpay) {
                toast({ title: "Failed to load payment gateway", variant: "destructive" })
                setCompletingPayment(false)
                return
            }

            const options = {
                key: orderData.keyId,
                amount: Math.round(order.totalAmount * 100),
                currency: "INR",
                name: "Grabnext",
                order_id: orderData.orderId,
                prefill: {
                    name: order.userName || "",
                    email: order.userEmail || "",
                    contact: order.userPhone || "",
                },
                handler: async (response: any) => {
                    await updateOrder(orderId, response.razorpay_payment_id)
                    setCompletingPayment(false)
                },
                modal: { ondismiss: () => setCompletingPayment(false) }
            }
            const rzp = new window.Razorpay(options)
            rzp.open()
        } else {
            if (!window.XPay) {
                toast({ title: "XPay not loaded", variant: "destructive" })
                setCompletingPayment(false)
                return
            }
            const xpay = new window.XPay({
                api_key: "xp_live_wtm5vj64kseuylg9cfmsl9",
                amount: Math.round(order.totalAmount),
                title: `Order ${orderId}`,
                onSuccess: async (data: { utr: string }) => {
                    await updateOrder(orderId, data.utr)
                    setCompletingPayment(false)
                },
                onClose: () => setCompletingPayment(false),
            })
            xpay.open()
        }
    }

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setSavingProfile(true)
        try {
            const res = await fetch("/api/users/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profileForm),
            })
            if (!res.ok) throw new Error("Failed to save")
            toast({ title: "✅ Profile updated!" })
            await refreshUser()
        } catch {
            toast({ title: "Failed to update profile", variant: "destructive" })
        } finally {
            setSavingProfile(false)
        }
    }

    // All downloadable items across all orders
    const downloadableItems = orders.flatMap((order) => {
        let items: any[] = []
        try { items = Array.isArray(order.items) ? order.items : JSON.parse(order.items) } catch { }
        return items.filter((item: any) => item.downloadUrl).map((item: any) => ({
            ...item,
            orderId: order.id,
            orderDate: order.createdAt,
        }))
    })

    if (authLoading) {
        return (
            <div className="min-h-screen">
                <StoreHeader />
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50">
                <StoreHeader />
                <div className="container mx-auto px-4 py-24 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="h-12 w-12 text-blue-500" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2 text-gray-800">Sign in to your account</h1>
                        <p className="text-muted-foreground mb-6">View your orders, manage your profile, and download your purchases.</p>
                        <div className="flex gap-3 justify-center">
                            <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6">
                                <Link href="/auth/login"><LogIn className="h-4 w-4 mr-2" />Sign In</Link>
                            </Button>
                            <Button asChild variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold px-6">
                                <Link href="/auth/register">Create Account</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <StoreHeader />
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-5 mb-8">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shrink-0">
                            {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{user.displayName || "My Account"}</h1>
                            <p className="text-gray-500">{user.email}</p>
                        </div>
                        {(user as any).isGuest && (
                            <Link href="/dashboard/confirm-account" className="ml-auto flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-md transition-all">
                                <ShieldCheck className="h-4 w-4" /> Set Password
                            </Link>
                        )}
                    </div>

                    <Tabs defaultValue="orders">
                        <TabsList className="mb-6 bg-blue-50 border border-blue-200">
                            <TabsTrigger value="orders" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                                <ShoppingBag className="h-4 w-4" />Orders
                                {orders.length > 0 && (
                                    <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                                        {orders.length}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                                <User className="h-4 w-4" />Profile
                            </TabsTrigger>
                            <TabsTrigger value="downloads" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                                <Download className="h-4 w-4" />Downloads
                                {downloadableItems.length > 0 && (
                                    <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                                        {downloadableItems.length}
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        {/* Orders Tab */}
                        <TabsContent value="orders">
                            {ordersLoading ? (
                                <div className="flex justify-center py-16">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                        <Package className="h-12 w-12 text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-1 text-gray-700">No orders yet</h3>
                                    <p className="text-muted-foreground mb-6">Your order history will appear here after your first purchase</p>
                                    <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                                        <Link href="/products">Browse Products</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orders.map((order: any) => (
                                        <OrderCard key={order.id} order={order} onPay={handlePayNow} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Profile Tab */}
                        <TabsContent value="profile">
                            <Card className="border-gray-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-blue-500" /> Edit Profile
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSaveProfile} className="space-y-5 max-w-lg">
                                        <div>
                                            <Label htmlFor="displayName">Full Name</Label>
                                            <Input id="displayName" value={profileForm.displayName} onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })} className="mt-1.5" />
                                        </div>
                                        <div>
                                            <Label htmlFor="email-display">Email</Label>
                                            <Input id="email-display" value={user.email} disabled className="bg-gray-50 mt-1.5" />
                                            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                                        </div>
                                        <div>
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input id="phone" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" className="mt-1.5" />
                                        </div>
                                        <div>
                                            <Label htmlFor="address">
                                                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Address</span>
                                            </Label>
                                            <Input id="address" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} placeholder="Street address" className="mt-1.5" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="city">City</Label>
                                                <Input id="city" value={profileForm.city} onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })} className="mt-1.5" />
                                            </div>
                                            <div>
                                                <Label htmlFor="state">State</Label>
                                                <Input id="state" value={profileForm.state} onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })} className="mt-1.5" />
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="country">Country</Label>
                                            <Input id="country" value={profileForm.country} onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })} className="mt-1.5" />
                                        </div>
                                        <Button type="submit" disabled={savingProfile} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                                            {savingProfile ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Downloads Tab */}
                        <TabsContent value="downloads">
                            {downloadableItems.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                                        <Download className="h-12 w-12 text-blue-300" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-1 text-gray-700">No downloads available</h3>
                                    <p className="text-muted-foreground">Purchase digital products to see download links here</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {downloadableItems.map((item: any, i: number) => (
                                        <Card key={i} className="border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
                                            <CardContent className="flex items-center gap-4 py-4 px-5">
                                                {/* Thumbnail */}
                                                <div className="shrink-0 h-14 w-14 rounded-lg overflow-hidden bg-gray-100 border">
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center">
                                                            <Package className="h-6 w-6 text-gray-300" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {item.id ? (
                                                        <Link href={`/products/${item.id}`} className="font-semibold text-gray-800 hover:text-blue-600 transition-colors line-clamp-1 flex items-center gap-1 group">
                                                            {item.title}
                                                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 shrink-0" />
                                                        </Link>
                                                    ) : (
                                                        <p className="font-semibold text-gray-800 line-clamp-1">{item.title}</p>
                                                    )}
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        From order <span className="font-mono">{item.orderId}</span> · {formatDateTime(item.orderDate)}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 isolate shrink-0">
                                                    <DigitalProductViewer downloadUrl={item.downloadUrl} title={item.title} />
                                                    <a
                                                        href={item.downloadUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 px-4 py-2 rounded-lg transition-all shadow-sm"
                                                    >
                                                        <Download className="h-4 w-4" /> Download
                                                    </a>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
