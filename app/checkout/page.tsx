"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Lock, Mail, User, Phone, CheckCircle2, Loader2, Package, 
  ShieldCheck, CreditCard, Truck, ArrowLeft, ChevronRight, 
  Award, ShoppingBag, Shield, Zap 
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
      <div className="min-h-screen bg-white">
        <StoreHeader />
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto border-2 border-dashed border-gray-200">
               <ShoppingBag className="h-8 w-8 text-gray-300" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">YOUR CART IS EMPTY</h2>
              <p className="text-gray-500 text-sm">Add something amazing to get started.</p>
            </div>
            <Button asChild size="lg" className="rounded-xl px-10 font-bold shadow-lg shadow-primary/20">
              <Link href="/products">BROWSE STORE</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-gray-900 font-sans selection:bg-primary selection:text-white">
      {/* High-Contrast Mini Header */}
      <header className="bg-white border-b-2 border-gray-100 sticky top-0 z-[50] shadow-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-black text-2xl tracking-[ -0.05em] hover:opacity-80 transition-opacity">
            GRABNEXT<span className="text-primary">.</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/cart" className="text-[11px] font-black uppercase tracking-tighter text-gray-400 hover:text-primary flex items-center gap-1 transition-colors">
              <ArrowLeft className="h-3 w-3" />
              Cart
            </Link>
            <Separator orientation="vertical" className="h-4 bg-gray-200" />
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/5 rounded-lg border border-primary/10">
               <ShieldCheck className="h-3.5 w-3.5 text-primary" />
               <span className="text-[10px] font-black uppercase tracking-tighter text-primary">Secure SSL</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Summary */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 px-2">
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-gray-900 uppercase italic leading-none">Checkout</h1>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Order #GN-{Math.random().toString(36).substring(7).toUpperCase()}</p>
            </div>
            <div className="flex-shrink-0">
               <Stepper currentStep={checkoutStep} />
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
            {/* Left Column: Compact Forms */}
            <form onSubmit={checkoutStep === 1 ? handleContinueToPayment : (e) => e.preventDefault()} className="space-y-6">
              
              {/* Login Promotion (Guest mode) - More compact */}
              {!user && checkoutStep === 1 && (
                <div className="bg-white border-2 border-primary/20 rounded-2xl p-4 flex gap-4 items-center shadow-sm">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 font-bold leading-tight">
                      Express checkout? <Link href="/auth/login" className="text-primary underline">Login here</Link>
                    </p>
                  </div>
                </div>
              )}

              {/* Step 1: Information */}
              <div className={`space-y-6 transition-all duration-300 ${checkoutStep === 2 ? "opacity-30 pointer-events-none scale-[0.98]" : ""}`}>
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-200 overflow-hidden rounded-2xl bg-white">
                  <CardHeader className="p-5 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-gray-900 flex items-center justify-center text-white text-[10px] font-black italic">STEP 01</div>
                      <CardTitle className="text-base font-black uppercase tracking-tight italic">Personal Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-3 space-y-4">
                    <div className="grid gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-0.5">Email Contact</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            disabled={!!user?.email}
                            placeholder="janedoe@mail.com"
                            className="pl-9 h-11 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary rounded-xl font-medium text-sm transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="firstName" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-0.5">First Name</Label>
                          <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/10 rounded-xl font-medium text-sm transition-all" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="lastName" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-0.5">Last Name</Label>
                          <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/10 rounded-xl font-medium text-sm transition-all" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-0.5">Primary Mobile</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                            placeholder="+91-0000000000"
                            className="pl-9 h-11 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/10 rounded-xl font-medium text-sm transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {!isDigitalOnly && (
                  <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-200 overflow-hidden rounded-2xl bg-white">
                    <CardHeader className="p-5 pb-2">
                       <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg bg-gray-900 flex items-center justify-center text-white text-[10px] font-black italic">STEP 02</div>
                        <CardTitle className="text-base font-black uppercase tracking-tight italic">Shipping Address</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-3 space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-0.5">Full Street Address</Label>
                        <Input id="address" name="address" value={formData.address} onChange={handleInputChange} required className="h-11 bg-gray-50 border-gray-200 focus:bg-white rounded-xl font-medium text-sm" />
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-0.5">City</Label>
                          <Input id="city" name="city" value={formData.city} onChange={handleInputChange} required className="h-11 bg-gray-50 border-gray-200 focus:bg-white rounded-xl font-medium text-sm" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="state" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-0.5">State</Label>
                          <Input id="state" name="state" value={formData.state} onChange={handleInputChange} required className="h-11 bg-gray-50 border-gray-200 focus:bg-white rounded-xl font-medium text-sm" />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="zipCode" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-0.5">Zip Code</Label>
                          <Input id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleInputChange} required className="h-11 bg-gray-50 border-gray-200 focus:bg-white rounded-xl font-medium text-sm" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="country" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-0.5">Country</Label>
                          <Input id="country" name="country" value={formData.country} onChange={handleInputChange} required className="h-11 bg-gray-50 border-gray-200 focus:bg-white rounded-xl font-medium text-sm" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {isDigitalOnly && (
                  <div className="bg-gray-900 border-none rounded-2xl p-4 flex gap-4 text-white shadow-xl shadow-gray-200 animate-in zoom-in-95 duration-300">
                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <Zap className="h-5 w-5 text-yellow-400" fill="currentColor" />
                    </div>
                    <div>
                      <h3 className="font-black text-xs uppercase italic tracking-wider">Instant Digital Access</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-snug font-medium">
                        Your links will be visible in your dashboard + sent to email immediately after the transaction is confirmed.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Payment (Bold variant) */}
              {checkoutStep === 2 && (
                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
                    <Card className="border-none shadow-2xl ring-2 ring-primary overflow-hidden rounded-3xl bg-white relative">
                       <div className="absolute top-0 right-0 p-4">
                          <Badge className="bg-primary text-white font-black italic rounded-lg">SECURE 256-BIT</Badge>
                       </div>
                       <CardContent className="p-8 text-center space-y-6">
                          <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto border-2 border-primary/20">
                            <ShieldCheck className="h-8 w-8 text-primary" />
                          </div>
                          <div className="space-y-2">
                             <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">Secure Verification</h3>
                             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest max-w-[240px] mx-auto leading-relaxed">
                               Complete your purchase using <span className="text-primary">{activeGateway === "razorpay" ? "Razorpay" : "XPay"}</span> Secure Portal
                             </p>
                          </div>
                          <Button 
                            type="button" 
                            onClick={handlePayNow} 
                            disabled={loading}
                            className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xl shadow-2xl shadow-primary/30 transition-all active:scale-[0.97]"
                          >
                            {loading ? (
                              <><Loader2 className="h-6 w-6 mr-3 animate-spin" />OPENING GATEWAY...</>
                            ) : (
                              <><ShieldCheck className="h-6 w-6 mr-3" /> PAY {formatPrice(totalAmount)}</>
                            )}
                          </Button>
                          
                          <div className="flex items-center justify-center gap-6 opacity-40 contrast-125 grayscale pt-2">
                             <img src="https://img.icons8.com/color/48/visa.png" alt="Visa" className="h-5" />
                             <img src="https://img.icons8.com/color/48/mastercard.png" alt="Mastercard" className="h-5" />
                             <img src="https://img.icons8.com/color/48/upi.png" alt="UPI" className="h-5" />
                          </div>
                       </CardContent>
                    </Card>
                    
                    <button 
                      type="button" 
                      onClick={() => setCheckoutStep(1)} 
                      className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      ← Edit Contact Information
                    </button>
                 </div>
              )}
            </form>

            {/* Right Column: High-Contrast Sidebar */}
            <aside className="space-y-6 sticky top-24">
              <Card className="border-none shadow-2xl ring-1 ring-gray-200 rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-gray-50 border-b-2 border-gray-200/50 p-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-black text-gray-900 uppercase tracking-widest italic">Order Summary</CardTitle>
                    <span className="text-[10px] font-black px-2 py-0.5 bg-gray-900 text-white rounded-md italic">
                      {items.length} PCS
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="p-5 space-y-5">
                  {/* Item List - Denser */}
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {items.map((item) => (
                      <div key={item.productId} className="flex gap-3">
                        <div className="h-12 w-12 rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden shadow-sm">
                           <img 
                            src={item.product.imageUrl || "/placeholder.svg"} 
                            alt={item.product.title} 
                            className="h-full w-full object-cover" 
                           />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                           <h4 className="text-[11px] font-black text-gray-900 line-clamp-1 uppercase tracking-tight">{item.product.title}</h4>
                           <div className="flex items-center justify-between mt-0.5">
                              <span className="text-[10px] text-gray-400 font-bold">QTY · {item.quantity}</span>
                              <span className="text-xs font-black text-gray-900 tracking-tighter">{formatPrice(item.product.price * item.quantity)}</span>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="bg-gray-100 h-0.5" />

                  {/* Calculations - Stronger weight */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] text-gray-500 font-bold uppercase tracking-tight">
                      <span>Gross Amount</span>
                      <span className="text-gray-900">{formatPrice(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-emerald-600 font-black uppercase tracking-tight">
                      <span>Shipping Fee</span>
                      <span>FREE</span>
                    </div>
                    
                    <div className="pt-3 flex justify-between items-end border-t-2 border-gray-100 mt-2">
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Payable</span>
                        <p className="text-[9px] text-gray-400 font-medium -mt-1 underline decoration-primary decoration-2 underline-offset-4">INCLUSIVE OF ALL TAXES</p>
                      </div>
                      <span className="text-3xl font-black text-gray-900 tracking-[ -0.06em] italic">
                        {formatPrice(totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Checkout Actions */}
                  {checkoutStep === 1 && (
                    <div className="pt-2 space-y-4">
                       <Button 
                        onClick={handleContinueToPayment} 
                        disabled={loading}
                        className="w-full h-14 rounded-2xl bg-gray-900 hover:bg-black text-white font-black text-[15px] uppercase tracking-tighter shadow-xl shadow-gray-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                       >
                        {loading ? (
                          <><Loader2 className="h-5 w-5 mr-3 animate-spin" />WAIT...</>
                        ) : (
                          <>CONTINUE TO PAY <ChevronRight className="h-5 w-5 ml-1" /></>
                        )}
                       </Button>
                    </div>
                  )}

                  {/* Trust Badges - Minimal but Bold */}
                  <div className="flex items-center justify-around gap-2 pt-4 border-t mt-4">
                    <div className="flex flex-col items-center gap-1">
                      <Shield className="h-4 w-4 text-gray-900" />
                      <span className="text-[8px] font-black uppercase tracking-tight text-gray-500">ENCRYPTED</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Truck className="h-4 w-4 text-gray-900" />
                      <span className="text-[8px] font-black uppercase tracking-tight text-gray-500">FAST SHIP</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Lock className="h-4 w-4 text-gray-900" />
                      <span className="text-[8px] font-black uppercase tracking-tight text-gray-500">SECURE</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Need help footer - Smaller */}
              <div className="px-8 text-center text-gray-400 space-y-1">
                 <p className="text-[9px] font-black uppercase tracking-widest">Need Help?</p>
                 <p className="text-[9px] font-medium leading-relaxed italic">
                   Contact support at grabnext.com if you face any issues during the payment process.
                 </p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #111; border-radius: 10px; }
        ::selection { background: #000; color: #fff; }
      `}</style>
    </div>
  )
}
