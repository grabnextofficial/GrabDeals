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
      <div className="absolute top-1/2 left-0 w-full h-px bg-gray-200 -translate-y-1/2 z-0" />
      <div className="absolute top-1/2 left-0 h-px bg-primary -translate-y-1/2 z-0 transition-all duration-500" style={{ width: currentStep === 1 ? '50%' : '100%' }} />
      
      {[
        { step: 1, label: "Info", icon: User },
        { step: 2, label: "Payment", icon: CreditCard },
        { step: 3, label: "Done", icon: CheckCircle2 },
      ].map((s) => (
        <div key={s.step} className="relative z-10 flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
            currentStep >= s.step ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white border text-gray-300"
          }`}>
            <s.icon className="h-4 w-4" />
          </div>
          <span className={`text-[9px] font-bold mt-1.5 uppercase tracking-wider ${
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
    <div className="min-h-screen bg-[#F8F9FB] text-gray-900 font-sans">
      {/* Mini Header with Site Branding */}
      <header className="bg-white border-b sticky top-0 z-[50]">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 shrink-0 group">
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center shadow-lg overflow-hidden group-hover:scale-105 transition-transform">
              <img
                src="/logo.png"
                alt="Grabnext"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-primary leading-none italic tracking-tight">Grabnext</span>
              <span className="text-[9px] text-primary/60 tracking-widest font-bold uppercase">Explore Plus</span>
            </div>
          </Link>
          <Link href="/cart" className="text-xs font-bold text-gray-400 hover:text-primary flex items-center gap-1.5 transition-colors uppercase tracking-wider">
            <ArrowLeft className="h-3.5 w-3.5" />
            Cart
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Summary Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b gap-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 uppercase">Checkout Flow</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Transaction Ref: #{items[0]?.productId.substring(0, 8).toUpperCase()}</p>
            </div>
            <div className="w-full md:w-56 shrink-0">
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
                <Card className="border-none shadow-sm rounded-2xl bg-white">
                  <CardHeader className="px-6 py-5 border-b border-gray-50">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                       Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Address</Label>
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
                            className="pl-9 h-11 bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-primary/20 rounded-xl text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="firstName" className="text-[10px] font-bold uppercase tracking-widest text-gray-400">First Name</Label>
                          <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required className="h-11 bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-primary/20 rounded-xl text-sm" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="lastName" className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Last Name</Label>
                          <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} className="h-11 bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-primary/20 rounded-xl text-sm" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                            placeholder="+91-XXXXXXXXXX"
                            className="pl-9 h-11 bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-primary/20 rounded-xl text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 2 (Optional): Shipping */}
                {!isDigitalOnly && (
                  <Card className="border-none shadow-sm rounded-2xl bg-white">
                    <CardHeader className="px-6 py-5 border-b border-gray-50">
                       <CardTitle className="text-sm font-bold uppercase tracking-wider">
                         Shipping Details
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="address" className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Street Address</Label>
                        <Input id="address" name="address" value={formData.address} onChange={handleInputChange} required className="h-11 bg-gray-50/50 border-gray-100 focus:bg-white rounded-xl text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="city" className="text-[10px] font-bold uppercase tracking-widest text-gray-400">City</Label>
                          <Input id="city" name="city" value={formData.city} onChange={handleInputChange} required className="h-11 bg-gray-50/50 border-gray-100 focus:bg-white rounded-xl text-sm" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="state" className="text-[10px] font-bold uppercase tracking-widest text-gray-400">State</Label>
                          <Input id="state" name="state" value={formData.state} onChange={handleInputChange} required className="h-11 bg-gray-50/50 border-gray-100 focus:bg-white rounded-xl text-sm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="zipCode" className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Zip Code</Label>
                          <Input id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleInputChange} required className="h-11 bg-gray-50/50 border-gray-100 focus:bg-white rounded-xl text-sm" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="country" className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Country</Label>
                          <Input id="country" name="country" value={formData.country} onChange={handleInputChange} required className="h-11 bg-gray-50/50 border-gray-100 focus:bg-white rounded-xl text-sm" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Digital Banner */}
                {isDigitalOnly && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center shrink-0 shadow-sm">
                      <Zap className="h-5 w-5 text-emerald-500" fill="currentColor" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-emerald-900 uppercase">Digital Instant Access Enabled</h3>
                      <p className="text-[10px] text-emerald-700/80 mt-0.5 leading-snug font-semibold">
                        Access your downloads directly from your dashboard after the transaction completes.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Payment Action */}
              {checkoutStep === 2 && (
                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
                    <Card className="border shadow-xl rounded-[2.5rem] bg-white text-center p-10">
                       <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Lock className="h-8 w-8 text-primary" />
                       </div>
                       <h3 className="text-xl font-bold text-gray-900 uppercase mb-2 tracking-tight">One Last Step</h3>
                       <p className="text-xs text-gray-500 max-w-[280px] mx-auto mb-8 font-medium">
                          Securely complete your payment via <span className="font-bold text-primary italic">{activeGateway === "razorpay" ? "Razorpay" : "XPay"}</span> Secure Portal.
                       </p>
                       <Button 
                        type="button" 
                        onClick={handlePayNow} 
                        disabled={loading}
                        className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 active:scale-[0.98] transition-all"
                       >
                        {loading ? (
                          <><Loader2 className="h-5 w-5 mr-3 animate-spin" />Processing...</>
                        ) : (
                          <><ShieldCheck className="h-5 w-5 mr-3" /> PAY {formatPrice(totalAmount)}</>
                        )}
                       </Button>
                       
                       <div className="flex items-center justify-center gap-6 mt-8 opacity-30 grayscale saturate-0">
                          <img src="https://img.icons8.com/color/48/visa.png" alt="Visa" className="h-5" />
                          <img src="https://img.icons8.com/color/48/mastercard.png" alt="Mastercard" className="h-5" />
                          <img src="https://img.icons8.com/color/48/upi.png" alt="UPI" className="h-5" />
                       </div>
                    </Card>
                    
                    <button type="button" onClick={() => setCheckoutStep(1)} className="w-full text-[10px] font-bold text-gray-400 hover:text-primary transition-colors cursor-pointer uppercase tracking-widest text-center">
                       ← Edit Registration Details
                    </button>
                 </div>
              )}
            </form>

            {/* Sidebar: Order Review */}
            <aside className="sticky top-24">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                <CardHeader className="bg-gray-50/50 p-6 border-b border-gray-100">
                   <div className="flex items-center justify-between">
                     <CardTitle className="text-sm font-bold uppercase tracking-wider">Review Order</CardTitle>
                     <Badge className="rounded-md px-2 py-0.5 font-bold bg-primary/10 text-primary border-none">
                        {items.length} {items.length === 1 ? 'PC' : 'PCS'}
                     </Badge>
                   </div>
                </CardHeader>
                
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {items.map((item) => (
                      <div key={item.productId} className="flex gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden">
                           <img src={item.product.imageUrl || "/placeholder.svg"} alt={item.product.title} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <h4 className="text-xs font-bold text-gray-900 line-clamp-1 uppercase mb-0.5">{item.product.title}</h4>
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] text-gray-400 font-bold uppercase">Qty: {item.quantity}</span>
                              <span className="text-xs font-bold text-gray-900 tracking-tight">{formatPrice(item.product.price * item.quantity)}</span>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="bg-gray-50" />

                  <div className="space-y-3">
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                      <span>Gross Amount</span>
                      <span className="text-gray-900">{formatPrice(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-emerald-600 uppercase">
                      <span>Digital Shipping</span>
                      <span>FREE</span>
                    </div>
                    
                    <div className="pt-4 flex justify-between items-end border-t border-dashed mt-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Grand Total</span>
                        <p className="text-[9px] text-gray-400 font-medium tracking-tight">VAT & TAX INCLUSIVE</p>
                      </div>
                      <span className="text-3xl font-bold text-primary tracking-tighter italic">
                        {formatPrice(totalAmount)}
                      </span>
                    </div>
                  </div>

                  {checkoutStep === 1 && (
                    <div className="pt-2">
                       <Button 
                        onClick={handleContinueToPayment} 
                        disabled={loading}
                        className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-xl shadow-primary/10"
                       >
                        {loading ? (
                          <><Loader2 className="h-5 w-5 mr-3 animate-spin" />Wait...</>
                        ) : (
                          <>Continue Checkout <ChevronRight className="h-5 w-5 ml-1" /></>
                        )}
                       </Button>
                    </div>
                  )}

                  {/* Trust Indicators */}
                  <div className="grid grid-cols-3 gap-1 pt-6 border-t mt-6">
                    <div className="flex flex-col items-center text-center gap-1.5">
                       <ShieldCheck className="h-4 w-4 text-primary" />
                       <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter text-center">SECURE</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-1.5 border-x border-gray-50">
                       <Truck className="h-4 w-4 text-primary" />
                       <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter text-center">EXPRESS</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-1.5">
                       <Award className="h-4 w-4 text-primary" />
                       <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter text-center">QUALITY</span>
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
