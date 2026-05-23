"use client"

import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { useCurrency } from "@/contexts/currency-context"
import { toast } from "@/hooks/use-toast"
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
  })

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

  const { currency, formatPrice, convertPrice } = useCurrency()

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
    const convertedAmount = convertPrice(totalAmount)
    const orderRes = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: convertedAmount, currency: currency }),
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

    const isZeroDecimal = currency === "JPY"
    const optionsAmount = isZeroDecimal ? Math.round(convertedAmount) : Math.round(convertedAmount * 100)

    const options = {
      key: orderData.keyId,
      amount: optionsAmount,
      currency: currency,
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
            price: convertPrice(i.product.price),
            quantity: i.quantity,
            imageUrl: i.product.imageUrl,
            downloadUrl: i.product.downloadUrl
          })),
          totalAmount: convertPrice(totalAmount),
          currency,
          status: "pending",
        }),
      })

      const orderData = await orderRes.json()
      if (!orderData.id) throw new Error("Failed to initialize order")

      setPendingOrderId(orderData.id)
      setCheckoutStep(2)
      setLoading(false)
      
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

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#151221] text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-black mb-4">Your cart is empty</h2>
          <button onClick={() => router.push("/products")} className="bg-yellow-400 text-black px-8 py-3 font-bold rounded hover:bg-yellow-500">
            Browse Store
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#151221] font-sans overflow-x-hidden selection:bg-yellow-400 selection:text-black">
      {/* HEADER SECTION */}
      <div className="w-full bg-gradient-to-b from-[#1c223c] to-[#151221] pt-12 pb-8 px-4 text-center border-b border-white/5">
        <h1 className="text-white text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-wide mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
          Congrats! You are just one step away from
        </h1>
        <h2 className="text-[#FFE600] text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-wider drop-shadow-md" style={{ fontFamily: "Montserrat, sans-serif" }}>
          ACCESSING YOUR PREMIUM ADOBE BUNDLE
        </h2>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="max-w-[1200px] mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          
          {/* LEFT COLUMN: BONUSES */}
          <div className="text-white pt-4">
            <h3 className="text-2xl md:text-3xl font-bold mb-10 leading-tight" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Also, Buy before the deadline to <br className="hidden md:block" />
              unlock <span className="text-[#FFE600]">Bonuses worth Rs. 75,000 for FREE!</span>
            </h3>

            <div className="space-y-8 text-lg font-medium tracking-wide">
              <p>
                <strong><span className="underline decoration-white underline-offset-4">BONUS 1:</span></strong> Mega Video Editing Assets | <span className="text-[#FFE600]">Value : 35,000 INR</span>
              </p>
              <p>
                <strong><span className="underline decoration-white underline-offset-4">BONUS 2:</span></strong> 11 Mega Creative Collections | <span className="text-[#FFE600]">Value : 15,000 INR</span>
              </p>
              <p>
                <strong><span className="underline decoration-white underline-offset-4">BONUS 3:</span></strong> 800+ GB Graphics Bundle | <span className="text-[#FFE600]">Value : 25,000 INR</span>
              </p>
            </div>

            <div className="mt-14 pt-4 text-center lg:text-left">
              <h4 className="text-[#FFE600] text-xl md:text-2xl font-bold inline-block">
                Register Before today midnight <span className="text-white ml-2 text-lg md:text-xl font-bold">to grab all the bonuses</span>
              </h4>
            </div>
          </div>

          {/* RIGHT COLUMN: FORM BOX */}
          <div className="relative">
            <div className="bg-white rounded shadow-2xl overflow-hidden w-full max-w-[550px] mx-auto lg:mx-0">
              
              {/* YELLOW BANNER */}
              <div className="bg-[#FFF000] text-black text-center py-4 font-bold text-lg relative z-10">
                Unlock the exclusive bonuses, Now!
                {/* CSS Triangle */}
                <div className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-[#FFF000]"></div>
              </div>

              {/* STEPPER TABS */}
              <div className="flex border-b border-gray-200 mt-2">
                <div className={`flex-1 flex items-center justify-center py-4 px-2 gap-3 transition-colors ${checkoutStep === 1 ? 'bg-white' : 'bg-gray-50'}`}>
                  <span className={`text-2xl font-black ${checkoutStep === 1 ? 'text-gray-900' : 'text-gray-400'}`}>1</span>
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold ${checkoutStep === 1 ? 'text-gray-900' : 'text-gray-400'}`}>Contact</span>
                    <span className="text-[11px] text-gray-500">Your Contact Info</span>
                  </div>
                </div>
                <div className={`flex-1 flex items-center justify-center py-4 px-2 gap-3 border-l border-gray-200 transition-colors ${checkoutStep === 2 ? 'bg-white' : 'bg-gray-50'}`}>
                  <span className={`text-2xl font-black ${checkoutStep === 2 ? 'text-gray-900' : 'text-gray-400'}`}>2</span>
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold ${checkoutStep === 2 ? 'text-gray-900' : 'text-gray-400'}`}>Payment</span>
                    <span className="text-[11px] text-gray-500">Of your order</span>
                  </div>
                </div>
              </div>

              {/* FORM CONTENT */}
              <div className="p-8">
                {checkoutStep === 1 && (
                  <form onSubmit={handleContinueToPayment} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-sm text-gray-700 font-medium">First name <span className="text-red-500">*</span></label>
                        <input
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2.5 border border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white text-gray-900"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm text-gray-700 font-medium">Last name <span className="text-red-500">*</span></label>
                        <input
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2.5 border border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm text-gray-700 font-medium">Phone <span className="text-red-500">*</span></label>
                      <input
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2.5 border border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white text-gray-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm text-gray-700 font-medium">Email address <span className="text-red-500">*</span></label>
                      <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        disabled={!!user?.email}
                        className="w-full px-3 py-2.5 border border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white text-gray-900"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#1A8242] hover:bg-[#146b35] text-white py-4 px-4 flex flex-col items-center justify-center transition-colors disabled:opacity-70"
                      >
                        <div className="flex items-center gap-2 font-bold text-lg">
                          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                          {loading ? "Processing..." : "Next Step"}
                        </div>
                        <span className="text-xs font-semibold mt-1">Yes! I want this offer!</span>
                      </button>
                    </div>
                  </form>
                )}

                {checkoutStep === 2 && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
                       <h4 className="font-bold text-gray-800 border-b pb-2 mb-3">Order Summary</h4>
                       <div className="flex justify-between items-center mb-2">
                         <span className="text-gray-600 text-sm">{items.length}x Premium Assets</span>
                         <span className="font-medium text-gray-800">{formatPrice(totalAmount)}</span>
                       </div>
                       <div className="flex justify-between items-center text-lg font-black mt-4 pt-4 border-t border-gray-200">
                         <span>Total</span>
                         <span className="text-[#1A8242]">{formatPrice(totalAmount)}</span>
                       </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handlePayNow}
                        disabled={loading}
                        className="w-full bg-[#1A8242] hover:bg-[#146b35] text-white py-4 px-4 flex flex-col items-center justify-center transition-colors shadow-lg disabled:opacity-70"
                      >
                        <div className="flex items-center gap-2 font-bold text-lg">
                          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                          {loading ? "Processing..." : `Complete Payment of ${formatPrice(totalAmount)}`}
                        </div>
                        <span className="text-xs font-semibold mt-1">100% Secure Checkout</span>
                      </button>
                      <button onClick={() => setCheckoutStep(1)} className="w-full text-center text-sm text-gray-400 mt-4 hover:text-gray-700 font-medium">
                        ← Back to Contact Info
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
