"use client"

import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { trackInitiateCheckout, trackAddPaymentInfo } from "@/lib/pixel"

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
          contents: items.map((i) => ({
            id: i.productId,
            quantity: i.quantity || 1,
            item_price: i.product.price,
          })),
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

  // Dynamic header based on cart items
  const getHeaderTitle = () => {
    if (items.length === 0) return "YOUR PREMIUM BUNDLE"
    if (items.length === 1) {
      return `ACCESSING YOUR ${items[0].product.title.toUpperCase()}`
    }
    return "ACCESSING YOUR SELECTED PREMIUM PRODUCTS"
  }

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

      // Track AddPaymentInfo with filled checkout data for advanced matching
      trackAddPaymentInfo(
        {
          value: totalAmount,
          num_items: items.length,
          content_ids: items.map((i) => i.productId),
          contents: items.map((i) => ({
            id: i.productId,
            quantity: i.quantity || 1,
            item_price: i.product.price,
          })),
        },
        {
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          firstName: formData.firstName || undefined,
          lastName: formData.lastName || undefined,
          external_id: userId || undefined,
        }
      )

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
        <h2 className="text-[#FFE600] text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-wider drop-shadow-md" style={{ fontFamily: "Montserrat, sans-serif" }}>
          {getHeaderTitle()}
        </h2>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="max-w-[1200px] mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          
          {/* LEFT COLUMN: ORDER SUMMARY & BONUSES */}
          <div className="text-white pt-4 space-y-8">
            {/* ORDER SUMMARY */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
              <h3 className="text-xl md:text-2xl font-black tracking-wide border-b border-white/10 pb-4 flex items-center justify-between" style={{ fontFamily: "Montserrat, sans-serif" }}>
                <span>YOUR ORDER SUMMARY</span>
                <span className="text-xs bg-[#FFE600] text-black px-2.5 py-1 rounded-full font-bold uppercase">
                  {items.reduce((acc, curr) => acc + curr.quantity, 0)} {items.reduce((acc, curr) => acc + curr.quantity, 0) === 1 ? 'Item' : 'Items'}
                </span>
              </h3>

              <div className="divide-y divide-white/10 space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-4 pt-4 first:pt-0 items-center">
                    <div className="relative w-20 h-20 flex-shrink-0 bg-white/10 rounded-lg border border-white/10 overflow-hidden flex items-center justify-center">
                      <img
                        src={item.product.imageUrl || `/placeholder.svg?height=80&width=80&query=${item.product.category || 'product'} ${item.product.title}`}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-base md:text-lg truncate hover:text-[#FFE600] transition-colors">
                        {item.product.title}
                      </h4>
                      <p className="text-gray-400 text-xs mt-1">
                        Category: <span className="text-gray-300 font-semibold">{item.product.category || "Premium Digital Asset"}</span>
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-400">Qty: <span className="text-white font-bold">{item.quantity}</span></span>
                        <span className="text-[#FFE600] font-extrabold text-base md:text-lg">{formatPrice(item.product.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-4 space-y-3">
                <div className="flex justify-between items-center text-sm text-gray-300">
                  <span>Subtotal</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-300">
                  <span>Delivery</span>
                  <span className="text-green-400 font-bold uppercase tracking-wider text-xs bg-green-500/10 px-2 py-0.5 rounded">FREE</span>
                </div>
                <div className="flex justify-between items-center text-xl font-black pt-3 border-t border-white/10">
                  <span className="text-white">Total Amount</span>
                  <span className="text-[#FFE600]">{formatPrice(totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* BONUSES */}
            <div className="bg-gradient-to-br from-[#1c223c]/50 to-[#151221]/50 border border-[#FFE600]/20 rounded-2xl p-6 md:p-8 space-y-6">
              <h3 className="text-xl md:text-2xl font-black leading-tight" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Also, Buy before the deadline to <br className="hidden md:block" />
                unlock <span className="text-[#FFE600]">Bonuses worth ₹75,000 for FREE!</span>
              </h3>

              <div className="space-y-4 text-sm font-medium tracking-wide">
                <div className="flex items-start gap-3">
                  <span className="text-[#FFE600] font-black mt-0.5">✓</span>
                  <p className="text-gray-200">
                    <strong>BONUS 1:</strong> Mega Video Editing Assets | <span className="text-[#FFE600]">Value : ₹35,000</span>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#FFE600] font-black mt-0.5">✓</span>
                  <p className="text-gray-200">
                    <strong>BONUS 2:</strong> 11 Mega Creative Collections | <span className="text-[#FFE600]">Value : ₹15,000</span>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#FFE600] font-black mt-0.5">✓</span>
                  <p className="text-gray-200">
                    <strong>BONUS 3:</strong> 800+ GB Graphics Bundle | <span className="text-[#FFE600]">Value : ₹25,000</span>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#FFE600] font-black mt-0.5">✓</span>
                  <p className="text-gray-200">
                    <strong>BONUS 4:</strong> Premium WhatsApp Pro Community Access | <span className="text-[#FFE600]">Value : ₹2,000</span>
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 text-center">
                <h4 className="text-[#FFE600] text-base md:text-lg font-bold">
                  Register Before today midnight <span className="text-white ml-1 text-sm md:text-base font-bold">to grab all the bonuses</span>
                </h4>
              </div>
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
                          className="w-full px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm text-gray-700 font-medium">Last name <span className="text-red-500">*</span></label>
                        <input
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-colors"
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
                        className="w-full px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-colors"
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
                        className="w-full px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-200"
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
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 space-y-4">
                       <h4 className="font-bold text-gray-900 border-b pb-2 text-base flex justify-between items-center">
                         <span>Final Review</span>
                         <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-semibold">
                           {items.length} {items.length === 1 ? 'Item' : 'Items'}
                         </span>
                       </h4>
                       <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                         {items.map((item) => (
                           <div key={item.productId} className="flex items-center gap-3 text-sm">
                             <img
                               src={item.product.imageUrl || `/placeholder.svg?height=40&width=40&query=${item.product.category || 'product'} ${item.product.title}`}
                               alt={item.product.title}
                               className="w-10 h-10 object-cover rounded bg-white border border-gray-200 flex-shrink-0"
                             />
                             <div className="flex-1 min-w-0">
                               <h5 className="font-semibold text-gray-800 truncate text-xs">{item.product.title}</h5>
                               <p className="text-gray-500 text-[10px]">Qty: {item.quantity} × {formatPrice(item.product.price)}</p>
                             </div>
                             <span className="font-bold text-gray-900 text-xs">{formatPrice(item.product.price * item.quantity)}</span>
                           </div>
                         ))}
                       </div>
                       <div className="border-t border-gray-200 pt-3 space-y-2 text-xs text-gray-600">
                         <div className="flex justify-between">
                           <span>Subtotal</span>
                           <span>{formatPrice(totalAmount)}</span>
                         </div>
                         <div className="flex justify-between items-center">
                           <span>Delivery</span>
                           <span className="text-green-600 font-bold uppercase text-[10px]">FREE</span>
                         </div>
                       </div>
                       <div className="flex justify-between items-center text-lg font-black mt-3 pt-3 border-t border-gray-200">
                         <span className="text-gray-900">Total Price</span>
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
