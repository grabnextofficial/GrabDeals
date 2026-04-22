"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Lock, Mail, User, Phone, CheckCircle2, Loader2, Package, 
  ShieldCheck, CreditCard, Truck, ArrowLeft, ChevronRight, 
  Award, ShoppingBag, Shield 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { StoreHeader } from "@/components/store-header"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

declare global {
  interface Window {
    XPay: any
    Razorpay: any
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalAmount, clearCart } = useCart()
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activeGateway, setActiveGateway] = useState<string>("xpay")

  // Two-step checkout states
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1)
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
  })
  const isDigitalOnly = items.every(item => item.product.downloadUrl)

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

  // Pre-fill from logged-in user
  useEffect(() => {
    if (user) {
      setFormData((f) => ({
        ...f,
        email: user.email || "",
        firstName: user.displayName?.split(" ")[0] || "",
        lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
        phone: (user as any).phone || "",
      }))
    }
  }, [user])

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(price)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value })

  const updateOrder = useCallback(async (orderId: string, paymentId: string) => {
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
    } catch (err) {
      console.error("Order update error:", err)
    }
  }, [])

  const getOrCreateUserId = async () => {
    if (user?.uid) return user.uid
    const regRes = await fetch("/api/auth/guest-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.email,
        displayName: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone,
      }),
    })
    const regData = await regRes.json()
    if (!regRes.ok) {
      throw new Error(regData.error || "Registration failed")
    }

    if (regData.user?.uid) {
      await refreshUser()
      return regData.user.uid
    }

    return "guest"
  }

  // ─── XPay ────────────────────────────────────────────────────────────
  const handleXPay = (orderId: string) => {
    if (!window.XPay) {
      toast({ title: "Payment system loading, please try again", variant: "destructive" })
      return
    }
    const orderTitle =
      items.length === 1
        ? items[0].product.title
        : `${items[0].product.title} + ${items.length - 1} more`

    const xpay = new window.XPay({
      api_key: "xp_live_wtm5vj64kseuylg9cfmsl9",
      amount: Math.round(totalAmount),
      title: orderTitle,
      onSuccess: async (data: { utr: string }) => {
        setLoading(false)
        await updateOrder(orderId, data.utr)
        clearCart()
        toast({ title: "🎉 Payment Successful!", description: `UTR: ${data.utr}` })
        router.push(`/checkout/success?utr=${data.utr}`)
      },
      onClose: () => {
        setLoading(false)
        router.push(`/dashboard`)
        toast({ title: "Order Saved", description: "Your order is pending. You can complete payment from your dashboard." })
      },
    })
    xpay.open()
  }

  // ─── Razorpay ────────────────────────────────────────────────────────
  const handleRazorpay = async (orderId: string) => {
    const orderRes = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: totalAmount, currency: "INR" }),
    })
    const orderData = await orderRes.json()
    if (!orderData.orderId) {
      toast({ title: orderData.error || "Failed to create Razorpay order", variant: "destructive" })
      setLoading(false)
      return
    }

    if (!window.Razorpay) {
      toast({ title: "Razorpay not loaded, please try again", variant: "destructive" })
      setLoading(false)
      return
    }

    const options = {
      key: orderData.keyId,
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      name: "Grabnext",
      description: items.length === 1 ? items[0].product.title : `${items.length} items`,
      order_id: orderData.orderId,
      prefill: {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        contact: formData.phone,
      },
      theme: { color: "#2563eb" },
      handler: async (response: any) => {
        setLoading(false)
        const paymentId = response.razorpay_payment_id
        await updateOrder(orderId, paymentId)
        clearCart()
        toast({ title: "🎉 Payment Successful!", description: `Payment ID: ${paymentId}` })
        router.push(`/checkout/success?utr=${paymentId}`)
      },
      modal: {
        ondismiss: () => {
          setLoading(false)
          router.push(`/dashboard`)
          toast({ title: "Order Saved", description: "Your order is pending. You can complete payment from your dashboard." })
        },
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  const handleContinueToPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) {
      toast({ title: "Your cart is empty", variant: "destructive" })
      return
    }
    if (!formData.email) {
      toast({ title: "Please enter your email address", variant: "destructive" })
      return
    }

    setLoading(true)

    try {
      // 1. Ensure user is registered/logged in first
      const userId = await getOrCreateUserId()

      // 2. Create a "Pending" order immediately
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userEmail: formData.email,
          userName: `${formData.firstName} ${formData.lastName}`.trim(),
          userPhone: formData.phone,
          items: items.map((i) => ({
            productId: i.productId,
            title: i.product.title,
            price: i.product.price,
            quantity: i.quantity,
            imageUrl: i.product.imageUrl,
            downloadUrl: i.product.downloadUrl
          })),
          totalAmount,
          status: "pending",
        }),
      })

      const orderData = await orderRes.json()
      if (!orderData.id) {
        throw new Error("Failed to initialize order")
      }

      setPendingOrderId(orderData.id)
      setCheckoutStep(2) // Move to step 2 (Payment UI will auto-open)
      toast({ title: "Processing Payment...", description: "Securely opening the payment gateway." })

      // Auto-trigger payment gateway immediately
      if (activeGateway === "razorpay") {
        await handleRazorpay(orderData.id)
      } else {
        handleXPay(orderData.id)
      }
    } catch (err: any) {
      setLoading(false)
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const handlePayNow = async () => {
    if (!pendingOrderId) {
      toast({ title: "Missing order ID, please try again", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      if (activeGateway === "razorpay") {
        await handleRazorpay(pendingOrderId)
      } else {
        handleXPay(pendingOrderId)
      }
    } catch (err: any) {
      setLoading(false)
      toast({ title: "Payment Error", description: err.message, variant: "destructive" })
    }
  }

  // Helper component for the progress stepper
  const Stepper = ({ currentStep }: { currentStep: number }) => (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto mb-10 relative">
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
      <div className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500" style={{ width: currentStep === 1 ? '50%' : '100%' }} />
      
      {[
        { step: 1, label: "Information", icon: User },
        { step: 2, label: "Payment", icon: CreditCard },
        { step: 3, label: "Success", icon: CheckCircle2 },
      ].map((s) => (
        <div key={s.step} className="relative z-10 flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
            currentStep >= s.step ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-white border-2 border-gray-200 text-gray-400"
          }`}>
            <s.icon className="h-5 w-5" />
          </div>
          <span className={`text-[10px] sm:text-xs font-bold mt-2 uppercase tracking-wider ${
            currentStep >= s.step ? "text-primary" : "text-gray-400"
          }`}>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  )

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <StoreHeader />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border">
               <ShoppingBag className="h-10 w-10 text-gray-300" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Your cart is empty</h2>
              <p className="text-gray-500">Looks like you haven't added anything to your cart yet.</p>
            </div>
            <Button asChild size="lg" className="rounded-full px-8 shadow-md">
              <Link href="/products">Browse products</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFDFF]">
      {/* Mini Checkout Header */}
      <header className="bg-white border-b sticky top-0 z-[50]">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-black text-xl tracking-tighter hover:opacity-80 transition-opacity">
            GRABNEXT<span className="text-primary">.</span>
          </Link>
          <Link href="/cart" className="text-sm font-medium text-gray-500 hover:text-primary flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to cart
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-6xl mx-auto">
          {/* Stepper Header */}
          <div className="text-center mb-4">
             <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">Secure Checkout</h1>
             <p className="text-sm text-gray-500">Complete your purchase securely in just two steps</p>
          </div>
          
          <Stepper currentStep={checkoutStep} />

          <div className="grid lg:grid-cols-[1fr_380px] gap-10 items-start">
            {/* Left Column: Checkout Forms */}
            <form onSubmit={checkoutStep === 1 ? handleContinueToPayment : (e) => e.preventDefault()} className="space-y-8">
              
              {/* Login Promotion (Guest mode) */}
              {!user && checkoutStep === 1 && (
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex gap-4 items-center">
                  <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 leading-tight">
                      <strong>Already have an account?</strong> Login to checkout faster and track your orders.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild className="rounded-full bg-white">
                    <Link href="/auth/login">Login</Link>
                  </Button>
                </div>
              )}

              {/* Step 1: Information */}
              <div className={`space-y-6 transition-all duration-500 ${checkoutStep === 2 ? "opacity-50 pointer-events-none grayscale-[0.5]" : ""}`}>
                {/* Section: Personal Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center text-white text-sm font-bold">1</div>
                    <h2 className="text-lg font-bold text-gray-900">Personal Details</h2>
                  </div>
                  
                  <Card className="border-none shadow-sm ring-1 ring-gray-200 overflow-hidden rounded-2xl">
                    <CardContent className="p-6 space-y-5">
                      <div className="grid gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              required
                              disabled={!!user?.email}
                              placeholder="janedoe@example.com"
                              className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-primary/20 rounded-xl transition-all"
                            />
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">First Name</Label>
                            <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required className="h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-primary/20 rounded-xl transition-all" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Last Name</Label>
                            <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} className="h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-primary/20 rounded-xl transition-all" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="phone"
                              name="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={handleInputChange}
                              required
                              placeholder="+91 00000 00000"
                              className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-primary/20 rounded-xl transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Section: Shipping (If not digital) */}
                {!isDigitalOnly && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center text-white text-sm font-bold">2</div>
                      <h2 className="text-lg font-bold text-gray-900">Shipping Address</h2>
                    </div>
                    
                    <Card className="border-none shadow-sm ring-1 ring-gray-200 overflow-hidden rounded-2xl">
                      <CardContent className="p-6 space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Street Address</Label>
                          <Input id="address" name="address" value={formData.address} onChange={handleInputChange} required className="h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-primary/20 rounded-xl transition-all" />
                        </div>
                        
                        <div className="grid sm:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <Label htmlFor="city" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">City</Label>
                            <Input id="city" name="city" value={formData.city} onChange={handleInputChange} required className="h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-primary/20 rounded-xl transition-all" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">State</Label>
                            <Input id="state" name="state" value={formData.state} onChange={handleInputChange} required className="h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-primary/20 rounded-xl transition-all" />
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <Label htmlFor="zipCode" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">ZIP / Postal Code</Label>
                            <Input id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleInputChange} required className="h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-primary/20 rounded-xl transition-all" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="country" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Country</Label>
                            <Input id="country" name="country" value={formData.country} onChange={handleInputChange} required className="h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-primary/20 rounded-xl transition-all" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Digital Perks Box */}
                {isDigitalOnly && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex gap-4">
                    <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                      <Zap className="h-6 w-6 text-emerald-500" fill="currentColor" />
                    </div>
                    <div>
                      <h3 className="font-bold text-emerald-900 text-sm">Instant Digital Delivery</h3>
                      <p className="text-xs text-emerald-700/80 mt-0.5 leading-relaxed">
                        Since your order contains only digital items, you'll receive your download links immediately after payment is confirmed. No shipping required!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Payment (Visible when on step 2) */}
              {checkoutStep === 2 && (
                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white text-sm font-bold">3</div>
                      <h2 className="text-lg font-bold text-gray-900">Payment Selection</h2>
                    </div>

                    <Card className="border-none shadow-sm ring-2 ring-primary overflow-hidden rounded-2xl bg-primary/[0.02]">
                       <CardContent className="p-8 text-center space-y-6">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-primary/10">
                            <Lock className="h-8 w-8 text-primary" />
                          </div>
                          <div className="space-y-2">
                             <h3 className="text-xl font-black text-gray-900">Ready to Secure Order?</h3>
                             <p className="text-sm text-gray-500 max-w-sm mx-auto">
                               Click below to complete your purchase using <strong>{activeGateway === "razorpay" ? "Razorpay" : "XPay"}</strong>. Our checkout is 100% safe and encrypted.
                             </p>
                          </div>
                          <Button 
                            type="button" 
                            onClick={handlePayNow} 
                            disabled={loading}
                            className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                          >
                            {loading ? (
                              <><Loader2 className="h-5 w-5 mr-3 animate-spin" />Connecting Gateway...</>
                            ) : (
                              <><ShieldCheck className="h-5 w-5 mr-2" /> Pay Now {formatPrice(totalAmount)}</>
                            )}
                          </Button>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            Verified Secure · PCI-DSS Compliant
                          </p>
                       </CardContent>
                    </Card>
                 </div>
              )}
            </form>

            {/* Right Column: Sticky Summary */}
            <aside className="space-y-6 sticky top-24">
              <Card className="border-none shadow-xl ring-1 ring-gray-100 rounded-3xl overflow-hidden bg-white">
                <CardHeader className="bg-gray-50/50 border-b p-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-black text-gray-900">Order Summary</CardTitle>
                    <Badge variant="secondary" className="rounded-full bg-gray-200 text-gray-700 border-none font-bold">
                      {items.length} {items.length === 1 ? 'Item' : 'Items'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6 space-y-6">
                  {/* Item List */}
                  <div className="space-y-5 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                    {items.map((item) => (
                      <div key={item.productId} className="flex gap-4">
                        <div className="h-16 w-16 rounded-xl bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden group">
                           <img 
                            src={item.product.imageUrl || "/placeholder.svg"} 
                            alt={item.product.title} 
                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" 
                           />
                        </div>
                        <div className="flex-1 min-w-0">
                           <h4 className="text-sm font-bold text-gray-900 line-clamp-1 mb-0.5">{item.product.title}</h4>
                           <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 font-medium">Qty: {item.quantity}</span>
                              <span className="text-sm font-black text-gray-900">{formatPrice(item.product.price * item.quantity)}</span>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="bg-gray-100" />

                  {/* Calculations */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-500 font-medium tracking-tight">
                      <span>Subtotal</span>
                      <span className="text-gray-900">{formatPrice(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 font-medium tracking-tight">
                      <span>Shipping</span>
                      <span className="text-emerald-600 font-bold">FREE</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 font-medium tracking-tight">
                      <span>Processing Fee</span>
                      <span className="text-gray-900">₹0.00</span>
                    </div>
                    <div className="pt-2 flex justify-between items-baseline">
                      <span className="text-base font-black text-gray-900">Total</span>
                      <div className="text-right">
                        <span className="text-2xl font-black text-primary tracking-tighter">
                          {formatPrice(totalAmount)}
                        </span>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter -mt-1">Inc. of all taxes</p>
                      </div>
                    </div>
                  </div>

                  {/* Checkout Actions */}
                  {checkoutStep === 1 && (
                    <div className="pt-4 space-y-4">
                       <Button 
                        onClick={handleContinueToPayment} 
                        disabled={loading}
                        className="w-full h-14 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-base shadow-lg transition-all animate-pulse-subtle"
                       >
                        {loading ? (
                          <><Loader2 className="h-5 w-5 mr-3 animate-spin" />Please wait...</>
                        ) : (
                          <>Checkout & Pay <ChevronRight className="h-5 w-5 ml-1" /></>
                        )}
                       </Button>
                       
                       <div className="flex items-center justify-center gap-6 pt-2">
                          <img src="https://img.icons8.com/color/48/visa.png" alt="Visa" className="h-5 grayscale opacity-50 contrast-125" />
                          <img src="https://img.icons8.com/color/48/mastercard.png" alt="Mastercard" className="h-5 grayscale opacity-50 contrast-125" />
                          <img src="https://img.icons8.com/color/48/upi.png" alt="UPI" className="h-5 grayscale opacity-50 contrast-200" />
                       </div>
                    </div>
                  )}

                  {/* Trust Factors */}
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t mt-6">
                    <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-gray-50/50 space-y-2 border border-gray-100">
                      <ShieldCheck className="h-6 w-6 text-primary" />
                      <span className="text-[9px] font-black uppercase text-gray-600 tracking-tighter">100% Secure Checkout</span>
                    </div>
                    <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-gray-50/50 space-y-2 border border-gray-100">
                      <Award className="h-6 w-6 text-primary" />
                      <span className="text-[9px] font-black uppercase text-gray-600 tracking-tighter">GrabNext Verified Seller</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Need help footer */}
              <div className="px-6 text-center">
                 <p className="text-[11px] text-gray-400 leading-relaxed">
                   By completing your purchase you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>. All transactions are secured using bank-level encryption.
                 </p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Global CSS for checkout */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E5E7EB;
          border-radius: 10px;
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.95; }
        }
      `}</style>
    </div>
  )
}
