"use client"

import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  Lock, Mail, User, Phone, CheckCircle2, Loader2,
  ShieldCheck, CreditCard, Truck, ArrowLeft, ChevronRight, 
  Award, ShoppingBag, Zap, Gift
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { StoreHeader } from "@/components/store-header"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { trackInitiateCheckout } from "@/lib/pixel"

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
  const hasFiredCheckout = useRef(false)

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

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setActiveGateway(data.payment_gateway || "xpay"))
      .catch(() => setActiveGateway("xpay"))
  }, [])

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
    if (totalAmount > 0 && !hasFiredCheckout.current) {
      hasFiredCheckout.current = true
      trackInitiateCheckout(
        {
          value: totalAmount,
          num_items: items.length,
          content_ids: items.map((i) => i.productId),
        },
        user ? {
          email: user.email || undefined,
          firstName: user.displayName?.split(' ')[0],
          lastName: user.displayName?.split(' ').slice(1).join(' '),
          external_id: user.uid
        } : undefined
      )
    }
  }, [totalAmount, items, user])

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

  const handleXPay = (orderId: string) => {
    if (!window.XPay) {
      toast({ title: "Payment system loading, please try again", variant: "destructive" })
      return
    }
    const orderTitle = items.length === 1 ? items[0].product.title : `${items[0].product.title} + ${items.length - 1} more`
    const xpay = new window.XPay({
      api_key: "xp_live_wtm5vj64kseuylg9cfmsl9",
      amount: Math.round(totalAmount),
      title: orderTitle,
      onSuccess: async (data: { utr: string }) => {
        setLoading(false)
        await updateOrder(orderId, data.utr)
        clearCart()
        router.push(`/checkout/success?utr=${data.utr}`)
      },
      onClose: () => {
        setLoading(false)
        router.push(`/dashboard`)
      },
    })
    xpay.open()
  }

  const handleRazorpay = async (orderId: string) => {
    const orderRes = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: totalAmount, currency: "INR" }),
    })
    const orderData = await orderRes.json()
    if (!orderData.orderId) {
      toast({ title: orderData.error || "Failed to create order", variant: "destructive" })
      setLoading(false)
      return
    }

    if (!window.Razorpay) {
      toast({ title: "Payment gateway not loaded", variant: "destructive" })
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
        router.push(`/checkout/success?utr=${paymentId}`)
      },
      modal: {
        ondismiss: () => {
          setLoading(false)
          router.push(`/dashboard`)
        },
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  const handleContinueToPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return toast({ title: "Cart is empty", variant: "destructive" })
    if (!formData.email) return toast({ title: "Email required", variant: "destructive" })
    
    setLoading(true)
    try {
      const userId = await getOrCreateUserId()
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
      if (!orderData.id) throw new Error("Failed to initialize order")

      setPendingOrderId(orderData.id)
      setCheckoutStep(2)
      
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
    if (!pendingOrderId) return
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

  const Stepper = ({ currentStep }: { currentStep: number }) => (
    <div className="flex items-center justify-between w-full relative max-w-sm mx-auto mb-8">
      <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-200 -translate-y-1/2 z-0" />
      <div className="absolute top-1/2 left-0 h-[2px] bg-green-500 -translate-y-1/2 z-0 transition-all duration-500" style={{ width: currentStep === 1 ? '50%' : '100%' }} />
      
      {[
        { step: 1, label: "Details", icon: User },
        { step: 2, label: "Payment", icon: CreditCard },
        { step: 3, label: "Done", icon: CheckCircle2 },
      ].map((s) => (
        <div key={s.step} className="relative z-10 flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
            currentStep >= s.step ? "bg-green-500 text-white shadow-md shadow-green-500/30" : "bg-white border-2 border-gray-200 text-gray-400"
          }`}>
            <s.icon className="h-4 w-4" />
          </div>
          <span className={`text-[11px] font-bold mt-2 uppercase tracking-wider ${
            currentStep >= s.step ? "text-gray-900" : "text-gray-400"
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
          <Button asChild size="lg" className="mt-4">
            <Link href="/products">Browse Store</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      <header className="bg-white border-b sticky top-0 z-[50]">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2 text-sm font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
            <Lock className="h-4 w-4" />
            256-Bit Secure Checkout
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Stepper currentStep={checkoutStep} />

          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
            {/* Left Column: Form Sections */}
            <form onSubmit={checkoutStep === 1 ? handleContinueToPayment : (e) => e.preventDefault()} className="space-y-6">
              
              <div className={`space-y-6 transition-all duration-300 ${checkoutStep === 2 ? "opacity-30 pointer-events-none" : ""}`}>
                <Card className="border shadow-md rounded-2xl bg-white overflow-hidden">
                  <div className="bg-[#00114E] text-white px-6 py-4">
                    <CardTitle className="text-xl font-black flex items-center gap-3 tracking-wide">
                       Step 1: Contact Information
                    </CardTitle>
                  </div>
                  <CardContent className="p-6 md:p-8 space-y-6">
                    <div className="grid gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-bold text-gray-700">Email Address *</Label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            disabled={!!user?.email}
                            placeholder="Enter your best email..."
                            className="pl-12 h-14 bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 focus:ring-green-500 rounded-xl text-base"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-sm font-bold text-gray-700">First Name *</Label>
                          <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required className="h-14 bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 focus:ring-green-500 rounded-xl text-base" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-sm font-bold text-gray-700">Last Name</Label>
                          <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} className="h-14 bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 focus:ring-green-500 rounded-xl text-base" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-bold text-gray-700">WhatsApp / Phone Number *</Label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                            placeholder="Your active WhatsApp number..."
                            className="pl-12 h-14 bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 focus:ring-green-500 rounded-xl text-base"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {isDigitalOnly && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex gap-4 shadow-sm">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <Zap className="h-6 w-6 text-emerald-600" fill="currentColor" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-emerald-900">Instant Digital Delivery</h3>
                      <p className="text-sm text-emerald-700 mt-1 font-medium leading-relaxed">
                        No physical shipping required! Your premium assets and tools will be instantly delivered to your email and dashboard right after successful payment.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {checkoutStep === 2 && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <Card className="border shadow-xl rounded-2xl bg-white text-center p-12">
                       <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100">
                          <ShieldCheck className="h-12 w-12 text-green-600" />
                       </div>
                       <h3 className="text-3xl font-black text-gray-900 mb-4">Complete Payment</h3>
                       <p className="text-base font-medium text-gray-500 max-w-[320px] mx-auto mb-10">
                          Securely complete your payment via our trusted gateway.
                       </p>
                       <Button 
                        type="button" 
                        onClick={handlePayNow} 
                        disabled={loading}
                        className="w-full h-16 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black text-xl shadow-[0px_8px_20px_rgba(22,163,74,0.4)] transition-all hover:-translate-y-1"
                       >
                        {loading ? (
                          <><Loader2 className="h-6 w-6 mr-3 animate-spin" />Processing...</>
                        ) : (
                          <>Pay {formatPrice(totalAmount)} Now &lt;&lt;</>
                        )}
                       </Button>
                       <div className="flex items-center justify-center gap-6 mt-10 grayscale opacity-60">
                          <img src="https://img.icons8.com/color/48/visa.png" alt="Visa" className="h-8" />
                          <img src="https://img.icons8.com/color/48/mastercard.png" alt="Mastercard" className="h-8" />
                          <img src="https://img.icons8.com/color/48/upi.png" alt="UPI" className="h-8" />
                       </div>
                    </Card>
                    <button type="button" onClick={() => setCheckoutStep(1)} className="w-full font-bold text-gray-400 hover:text-gray-700 transition-colors cursor-pointer text-center">
                       ← Edit Registration Details
                    </button>
                 </div>
              )}
            </form>

            {/* Right Column: Order Summary & Bonuses */}
            <aside className="sticky top-28 space-y-6">
              <Card className="border-4 border-[#00114E] shadow-2xl rounded-2xl overflow-hidden bg-white">
                <CardHeader className="bg-[#00114E] text-white px-6 py-5">
                   <CardTitle className="text-xl font-black text-center tracking-wide">
                     Order Summary
                   </CardTitle>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="space-y-5">
                    {items.map((item) => (
                      <div key={item.productId} className="flex gap-4 items-center">
                        <div className="h-16 w-20 rounded border border-gray-200 overflow-hidden shrink-0">
                           <img src={item.product.imageUrl || "https://images.unsplash.com/photo-1626785776985-c472c50436bc?w=800&q=80"} alt={item.product.title} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1">
                           <h4 className="font-bold text-gray-900 leading-tight">{item.product.title}</h4>
                           <span className="text-xs font-semibold text-green-600 uppercase">Lifetime Access</span>
                        </div>
                        <div className="text-right">
                           <span className="font-black text-gray-900 text-lg">{formatPrice(item.product.price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-6 border-dashed border-gray-300" />

                  {/* FREE BONUSES SECTION (Crucial for conversions) */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-lg uppercase">
                       Limited Time
                    </div>
                    <h5 className="font-black text-amber-900 flex items-center gap-2 mb-3 text-[15px]">
                      <Gift className="h-5 w-5 text-amber-600" />
                      Free Bonuses Included:
                    </h5>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span className="font-medium text-amber-950"><strong>Mega Video Editing Assets</strong> <span className="text-amber-700/80">(₹35,000 Value)</span></span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span className="font-medium text-amber-950"><strong>11 Mega Creative Collections</strong> <span className="text-amber-700/80">(₹15,000 Value)</span></span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span className="font-medium text-amber-950"><strong>800+ GB Graphics Bundle</strong> <span className="text-amber-700/80">(₹25,000 Value)</span></span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-semibold text-gray-500">
                      <span>Total Value:</span>
                      <span className="line-through">₹75,000+</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-gray-500">
                      <span>Subtotal</span>
                      <span>{formatPrice(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-green-600">
                      <span>Shipping</span>
                      <span>FREE</span>
                    </div>
                    
                    <div className="pt-4 pb-2 flex justify-between items-center border-t-2 border-gray-100 mt-2">
                      <span className="text-lg font-black text-gray-900 uppercase">You Pay Only</span>
                      <span className="text-3xl font-black text-green-600">
                        {formatPrice(totalAmount)}
                      </span>
                    </div>
                  </div>

                  {checkoutStep === 1 && (
                    <div className="pt-6">
                       <Button 
                        onClick={handleContinueToPayment} 
                        disabled={loading}
                        className="w-full h-16 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black text-[17px] uppercase shadow-[0px_8px_20px_rgba(22,163,74,0.3)] transition-all hover:-translate-y-1"
                       >
                        {loading ? (
                          <><Loader2 className="h-5 w-5 mr-3 animate-spin" />Processing...</>
                        ) : (
                          <>Continue To Payment <ChevronRight className="h-6 w-6 ml-1" /></>
                        )}
                       </Button>
                    </div>
                  )}
                  
                  <p className="text-center text-xs font-bold text-gray-400 mt-4 flex items-center justify-center gap-1">
                     <Lock className="h-3 w-3" /> Guaranteed Safe & Secure Checkout
                  </p>
                </CardContent>
              </Card>

              {/* Badges / Guarantees below summary */}
              <div className="bg-white rounded-xl border p-5 shadow-sm text-center">
                 <div className="text-4xl mb-2">🛡️</div>
                 <h4 className="font-black text-gray-900 text-sm mb-1">100% Satisfaction Guarantee</h4>
                 <p className="text-xs text-gray-500 font-medium">Full installation support provided. Your purchase is fully protected.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
