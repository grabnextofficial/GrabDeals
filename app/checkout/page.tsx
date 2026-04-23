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
    <div className="flex items-center justify-between w-full relative">
      <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-100 -translate-y-1/2 z-0" />
      <div className="absolute top-1/2 left-0 h-[2px] bg-primary -translate-y-1/2 z-0 transition-all duration-500" style={{ width: currentStep === 1 ? '50%' : '100%' }} />
      
      {[
        { step: 1, label: "Information", icon: User },
        { step: 2, label: "Payment", icon: CreditCard },
        { step: 3, label: "Confirmation", icon: CheckCircle2 },
      ].map((s) => (
        <div key={s.step} className="relative z-10 flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
            currentStep >= s.step ? "bg-primary text-white" : "bg-white border-2 border-gray-100 text-gray-300"
          }`}>
            <s.icon className="h-5 w-5" />
          </div>
          <span className={`text-[10px] font-semibold mt-2 uppercase tracking-wider ${
            currentStep >= s.step ? "text-primary" : "text-gray-300"
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
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
             <ShoppingBag className="h-8 w-8 text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 text-sm mb-8">Add something to your cart to continue with checkout.</p>
          <Button asChild size="lg" className="rounded-xl px-10 font-semibold bg-primary hover:bg-primary/90">
            <Link href="/products">Browse Store</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-gray-900 font-sans">
      {/* Mini Header with Site Branding */}
      <header className="bg-white border-b sticky top-0 z-[50]">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 shrink-0 group">
            <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center overflow-hidden border border-primary/10">
              <img
                src="/logo.png"
                alt="Grabnext"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-2xl text-primary tracking-tight">Grabnext</span>
              <span className="text-[10px] text-gray-400 tracking-[0.2em] font-medium uppercase">Premium Shopping</span>
            </div>
          </Link>
          <Link href="/cart" className="text-sm font-medium text-gray-500 hover:text-primary flex items-center gap-2 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Section Summary Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Secure Checkout</h1>
              <p className="text-sm text-gray-500">Order Ref: <span className="font-mono text-primary font-medium">#{items[0]?.productId.substring(0, 8).toUpperCase()}</span></p>
            </div>
            <div className="w-full md:w-[400px] shrink-0">
               <Stepper currentStep={checkoutStep} />
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_360px] gap-10 items-start">
            {/* Left Column: Form Sections */}
            <form onSubmit={checkoutStep === 1 ? handleContinueToPayment : (e) => e.preventDefault()} className="space-y-6">
              
              {/* Profile Link (Guest) */}
              {!user && checkoutStep === 1 && (
                <div className="bg-white border rounded-2xl p-4 flex gap-4 items-center shadow-sm text-sm">
                  <div className="h-9 w-9 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 font-medium">
                    Returning customer? <Link href="/auth/login" className="text-primary font-bold hover:underline">Sign in for faster checkout</Link>
                  </div>
                </div>
              )}

              {/* Step 1: Customer Info */}
              <div className={`space-y-6 transition-all duration-300 ${checkoutStep === 2 ? "opacity-30 scale-[0.99] pointer-events-none" : ""}`}>
                <Card className="border shadow-none rounded-xl bg-white">
                  <CardHeader className="px-8 py-6 border-b border-gray-50">
                    <CardTitle className="text-lg font-semibold flex items-center gap-3">
                       Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="grid gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            disabled={!!user?.email}
                            placeholder="yourname@example.com"
                            className="pl-11 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-1 focus:ring-primary rounded-lg text-base"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
                          <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required className="h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-1 focus:ring-primary rounded-lg text-base" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
                          <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} className="h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-1 focus:ring-primary rounded-lg text-base" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter your phone number"
                            className="pl-11 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:ring-1 focus:ring-primary rounded-lg text-base"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 2 (Optional): Shipping */}
                {!isDigitalOnly && (
                <Card className="border shadow-none rounded-xl bg-white">
                    <CardHeader className="px-8 py-6 border-b border-gray-50">
                       <CardTitle className="text-lg font-semibold">
                         Shipping Address
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm font-medium text-gray-700">Street Address</Label>
                        <Input id="address" name="address" value={formData.address} onChange={handleInputChange} required className="h-12 bg-gray-50 border-gray-200 focus:bg-white rounded-lg text-base" />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-sm font-medium text-gray-700">City</Label>
                          <Input id="city" name="city" value={formData.city} onChange={handleInputChange} required className="h-12 bg-gray-50 border-gray-200 focus:bg-white rounded-lg text-base" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state" className="text-sm font-medium text-gray-700">State</Label>
                          <Input id="state" name="state" value={formData.state} onChange={handleInputChange} required className="h-12 bg-gray-50 border-gray-200 focus:bg-white rounded-lg text-base" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="zipCode" className="text-sm font-medium text-gray-700">Zip Code</Label>
                          <Input id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleInputChange} required className="h-12 bg-gray-50 border-gray-200 focus:bg-white rounded-lg text-base" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country" className="text-sm font-medium text-gray-700">Country</Label>
                          <Input id="country" name="country" value={formData.country} onChange={handleInputChange} required className="h-12 bg-gray-50 border-gray-200 focus:bg-white rounded-lg text-base" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Digital Banner */}
                {isDigitalOnly && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-white border border-emerald-200 flex items-center justify-center shrink-0 shadow-sm">
                      <Zap className="h-5 w-5 text-emerald-500" fill="currentColor" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-emerald-900">Digital Access Enabled</h3>
                      <p className="text-xs text-emerald-700/80 mt-1 leading-relaxed">
                        Your digital items will be available for instant download in your dashboard immediately after payment.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Payment Action */}
              {checkoutStep === 2 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <Card className="border shadow-lg rounded-2xl bg-white text-center p-12">
                       <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-primary/10">
                          <ShieldCheck className="h-10 w-10 text-primary" />
                       </div>
                       <h3 className="text-2xl font-bold text-gray-900 mb-4">Complete Your Payment</h3>
                       <p className="text-sm text-gray-500 max-w-[320px] mx-auto mb-10 leading-relaxed">
                          Please proceed to complete your payment securely via <span className="font-semibold text-primary">{activeGateway === "razorpay" ? "Razorpay" : "XPay"}</span>.
                       </p>
                       <Button 
                        type="button" 
                        onClick={handlePayNow} 
                        disabled={loading}
                        className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-lg shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                       >
                        {loading ? (
                          <><Loader2 className="h-5 w-5 mr-3 animate-spin" />Processing...</>
                        ) : (
                          <>Pay {formatPrice(totalAmount)} Now</>
                        )}
                       </Button>
                       
                       <div className="flex items-center justify-center gap-8 mt-12 opacity-50 grayscale hover:opacity-100 transition-opacity">
                          <img src="https://img.icons8.com/color/48/visa.png" alt="Visa" className="h-6" />
                          <img src="https://img.icons8.com/color/48/mastercard.png" alt="Mastercard" className="h-6" />
                          <img src="https://img.icons8.com/color/48/upi.png" alt="UPI" className="h-6" />
                       </div>
                    </Card>
                    
                    <button type="button" onClick={() => setCheckoutStep(1)} className="w-full text-sm font-medium text-gray-400 hover:text-primary transition-colors cursor-pointer text-center">
                       ← Return to registration details
                    </button>
                 </div>
              )}
            </form>

            {/* Sidebar: Order Review */}
            <aside className="sticky top-28">
              <Card className="border shadow-none rounded-xl overflow-hidden bg-white">
                <CardHeader className="bg-gray-50/30 px-6 py-5 border-b border-gray-100">
                   <div className="flex items-center justify-between">
                     <CardTitle className="text-base font-semibold">Order Summary</CardTitle>
                     <Badge variant="outline" className="rounded-full px-3 font-medium border-primary/20 text-primary">
                        {items.length} {items.length === 1 ? 'Item' : 'Items'}
                     </Badge>
                   </div>
                </CardHeader>
                
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-5 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                    {items.map((item) => (
                      <div key={item.productId} className="flex gap-4">
                        <div className="h-16 w-16 rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden">
                           <img src={item.product.imageUrl || "/placeholder.svg"} alt={item.product.title} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                           <h4 className="text-sm font-medium text-gray-900 line-clamp-1 mb-1">{item.product.title}</h4>
                           <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                              <span className="text-sm font-semibold text-gray-900">{formatPrice(item.product.price * item.quantity)}</span>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="bg-gray-100" />

                  <div className="space-y-4">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal</span>
                      <span className="text-gray-900 font-medium">{formatPrice(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium text-emerald-600">
                      <span>Shipping</span>
                      <span>Free</span>
                    </div>
                    
                    <div className="pt-6 flex justify-between items-center border-t border-gray-100 mt-2">
                      <span className="text-base font-bold text-gray-900 uppercase tracking-tight">Total</span>
                      <span className="text-2xl font-bold text-primary tracking-tight">
                        {formatPrice(totalAmount)}
                      </span>
                    </div>
                  </div>

                  {checkoutStep === 1 && (
                    <div className="pt-4">
                       <Button 
                        onClick={handleContinueToPayment} 
                        disabled={loading}
                        className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-base shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                       >
                        {loading ? (
                          <><Loader2 className="h-5 w-5 mr-3 animate-spin" />Processing...</>
                        ) : (
                          <>Continue to Payment <ChevronRight className="h-5 w-5 ml-1" /></>
                        )}
                       </Button>
                    </div>
                  )}

                  {/* Trust Indicators */}
                  <div className="grid grid-cols-3 gap-2 pt-8 border-t border-gray-50 mt-8">
                    <div className="flex flex-col items-center text-center gap-2">
                       <ShieldCheck className="h-5 w-5 text-gray-400" />
                       <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Secure</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2 border-x border-gray-100 px-2">
                       <Truck className="h-5 w-5 text-gray-400" />
                       <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Shipping</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                       <Award className="h-5 w-5 text-gray-400" />
                       <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Quality</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </div>
  )
}
