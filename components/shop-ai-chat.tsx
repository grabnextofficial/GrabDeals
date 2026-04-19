"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Send, Loader2, ShoppingBag, Sparkles, ShoppingCart, Zap, Star, ExternalLink, X } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import type { Product } from "@/lib/types"
import Link from "next/link"

interface SuggestedProduct {
  id: string
  title: string
  description: string
  price: number
  originalPrice: number | null
  category: string
  imageUrl: string
  slug: string
  downloadUrl: string
  isActive: boolean
  salesCount: number
  tags: string[]
  createdAt: any
  updatedAt: any
  createdBy: string
}

interface Message {
  role: "user" | "ai"
  text: string
  timestamp: string
  products?: SuggestedProduct[]
  action?: string | null
}

const INITIAL_MESSAGE: Message = {
  role: "ai",
  text: "Hey! 👋 I'm **GrabNext AI** — your personal shopping assistant! Ask me anything about our products, deals, or orders. I'm here to help! ✨",
  timestamp: new Date().toISOString(),
}

const QUICK_QUESTIONS = [
  "What's available?",
  "Best deals today?",
  "How do I order?",
  "Payment options?",
]

const STORAGE_KEY = "grabnext-ai-chat-v1"

export function ShopAIChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)
  const [iconSpin, setIconSpin] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { addToCart } = useCart()
  const router = useRouter()

  // ── Icon spin every 5 seconds ──
  useEffect(() => {
    if (isOpen) return
    const interval = setInterval(() => {
      setIconSpin(true)
      setTimeout(() => setIconSpin(false), 800)
    }, 5000)
    return () => clearInterval(interval)
  }, [isOpen])

  // ── Load chat from localStorage ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed: Message[] = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed)
      }
    } catch {}
    setHydrated(true)
  }, [])

  // ── Save chat to localStorage ──
  useEffect(() => {
    if (!hydrated) return
    try {
      const toSave = messages.slice(-40).map((m) => ({ ...m, products: undefined }))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    } catch {}
  }, [messages, hydrated])

  useEffect(() => {
    if (isOpen) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80)
  }, [messages, isOpen])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200)
  }, [isOpen])

  const toCartProduct = (p: SuggestedProduct): Product => ({
    ...p,
    createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
    updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
  })

  const handleAddToCart = useCallback((product: SuggestedProduct) => {
    addToCart(toCartProduct(product), 1)
    setAddedIds((prev) => new Set(prev).add(product.id))
  }, [addToCart])

  const handleBuyNow = useCallback((product: SuggestedProduct) => {
    addToCart(toCartProduct(product), 1)
    setAddedIds((prev) => new Set(prev).add(product.id))
    setIsOpen(false)
    router.push("/checkout")
  }, [addToCart, router])

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || isLoading) return

    const userMsg: Message = { role: "user", text: msg, timestamp: new Date().toISOString() }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    const history = messages
      .filter((_, i) => i > 0)
      .slice(-12)
      .map((m) => ({ role: m.role === "ai" ? "model" : "user", text: m.text }))

    try {
      const res = await fetch("/api/ai/shop-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history }),
      })
      const data = await res.json()
      const aiProducts: SuggestedProduct[] = data.products || []
      const action: string | null = data.action || null

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: data.reply || "Something went wrong. Please try again.",
          timestamp: new Date().toISOString(),
          products: aiProducts,
          action,
        },
      ])

      if (action === "add_to_cart" && aiProducts.length > 0) {
        aiProducts.forEach((p) => { addToCart(toCartProduct(p), 1); setAddedIds((prev) => new Set(prev).add(p.id)) })
      } else if (action === "checkout" && aiProducts.length > 0) {
        aiProducts.forEach((p) => { addToCart(toCartProduct(p), 1); setAddedIds((prev) => new Set(prev).add(p.id)) })
        setTimeout(() => { setIsOpen(false); router.push("/checkout") }, 900)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "GrabNext AI is offline right now. Check your connection and try again! 🙏", timestamp: new Date().toISOString(), products: [] },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const formatText = (text: string) =>
    text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>").replace(/\n/g, "<br/>")

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price)

  const getDiscount = (price: number, original: number) => Math.round((1 - price / original) * 100)

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) } catch { return "" }
  }

  return (
    <>
      {/* ── Floating Pill Button — hidden when chat is open ── */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-[9999]">
          {/* Animated border wrapper */}
          <div className="relative overflow-hidden rounded-full p-[2.5px] shadow-xl hover:scale-105 transition-transform duration-300 cursor-pointer" onClick={() => setIsOpen(true)}>
            {/* Spinning conic-gradient border ring */}
            <div className="ai-border-ring" />
            {/* Black pill inner */}
            <div className="relative bg-black rounded-full flex items-center gap-3 px-5 py-3 z-10">
              {/* AI sparkle icon — spins every 5s */}
              <div className={`h-9 w-9 rounded-full bg-sky-500 flex items-center justify-center shrink-0 shadow-md ${iconSpin ? "ai-icon-spin" : ""}`}>
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-white font-bold text-base tracking-wide whitespace-nowrap">Shop with AI</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Chat Window ── */}
      {isOpen && (
        <div
          className="fixed z-[9998] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          style={{
            bottom: "20px",
            right: "20px",
            width: "min(385px, calc(100vw - 32px))",
            maxHeight: "calc(100dvh - 40px)",
            animation: "chatSlideUp 0.32s cubic-bezier(0.34,1.56,0.64,1) forwards",
          }}
        >
          {/* Header */}
          <div className="bg-sky-500 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-white drop-shadow" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-green-400 rounded-full border-2 border-sky-500" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-sm tracking-wide">GrabNext AI</span>
                </div>
                <span className="text-[10px] text-sky-100">Shopping Assistant · Always Online</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center transition-colors"
              aria-label="Close chat"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 bg-[#f0f6ff]">
            {messages.map((msg, i) => (
              <div key={i} className="space-y-2">
                <div className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "ai" && (
                    <div className="shrink-0 mb-0.5">
                      <Sparkles className="h-5 w-5 text-sky-500" />
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-sky-500 text-white rounded-br-sm"
                        : "bg-white text-gray-800 rounded-bl-sm border border-gray-100"
                    }`}
                  >
                    <span dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
                    <div className={`text-[10px] mt-1 ${msg.role === "user" ? "text-sky-100" : "text-gray-400"}`}>
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="h-7 w-7 rounded-full bg-sky-500 flex items-center justify-center shrink-0 mb-0.5 text-white text-[10px] font-bold shadow">
                      You
                    </div>
                  )}
                </div>

                {/* Product Cards */}
                {msg.role === "ai" && msg.products && msg.products.length > 0 && (
                  <div className="ml-7 space-y-2">
                    {msg.products.map((product) => {
                      const isAdded = addedIds.has(product.id)
                      const discount = product.originalPrice ? getDiscount(product.price, product.originalPrice) : 0
                      const productUrl = product.slug ? `/products/${product.slug}` : `/products/${product.id}`
                      return (
                        <div key={product.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                          <Link href={productUrl} onClick={() => setIsOpen(false)} className="flex gap-3 p-3 group">
                            <div className="relative shrink-0">
                              <img
                                src={product.imageUrl || `/placeholder.svg?height=64&width=64`}
                                alt={product.title}
                                className="h-16 w-16 object-cover rounded-lg bg-gray-100 group-hover:scale-105 transition-transform duration-200"
                              />
                              {discount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                                  -{discount}%
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-sky-500 transition-colors">
                                {product.title}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                <span className="text-[10px] text-gray-400">GrabNext Certified</span>
                              </div>
                              <div className="flex items-baseline gap-1.5 mt-1">
                                <span className="text-sm font-bold text-sky-500">{formatPrice(product.price)}</span>
                                {product.originalPrice && (
                                  <span className="text-[11px] text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                                )}
                              </div>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover:text-sky-400 shrink-0 mt-1 transition-colors" />
                          </Link>
                          <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleAddToCart(product)}
                              disabled={isAdded}
                              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all border ${
                                isAdded ? "bg-green-50 text-green-600 border-green-200 cursor-default" : "border-sky-200 text-sky-600 hover:bg-sky-50"
                              }`}
                            >
                              <ShoppingCart className="h-3.5 w-3.5" />
                              {isAdded ? "Added ✓" : "Add to Cart"}
                            </button>
                            <button
                              onClick={() => handleBuyNow(product)}
                              className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-all shadow hover:shadow-md"
                            >
                              <Zap className="h-3.5 w-3.5" />
                              Buy Now
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-end gap-2">
                <Sparkles className="h-5 w-5 text-sky-500 shrink-0" />
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1.5 items-center">
                    <span className="h-2 w-2 rounded-full bg-sky-400 animate-bounce [animation-delay:0ms]" />
                    <span className="h-2 w-2 rounded-full bg-sky-400 animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-sky-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Chips */}
          {messages.length <= 1 && !isLoading && (
            <div className="px-3 py-2 flex flex-wrap gap-1.5 bg-white border-t border-gray-100 shrink-0">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-[11px] px-3 py-1.5 rounded-full bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 transition-colors font-medium"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100 shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="flex gap-2 items-center">
              <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-full px-3.5 py-2 gap-2 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100 transition-all">
                <ShoppingBag className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything about our products..."
                  className="flex-1 text-xs bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="h-9 w-9 rounded-full bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shadow hover:shadow-md shrink-0"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* Chat window entry animation */
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(18px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }

        /* Rotating blue border ring on pill button */
        .ai-border-ring {
          position: absolute;
          width: 220%;
          aspect-ratio: 1;
          top: 50%;
          left: 50%;
          background: conic-gradient(
            from 0deg,
            #38bdf8,
            #0ea5e9,
            #0284c7,
            #7dd3fc,
            #38bdf8,
            transparent 60%,
            transparent 80%,
            #38bdf8
          );
          animation: borderSpin 2s linear infinite;
        }
        @keyframes borderSpin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }

        /* Icon spin animation — triggers every 5s via JS class toggle */
        .ai-icon-spin {
          animation: iconSpinOnce 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes iconSpinOnce {
          0%   { transform: rotate(0deg)   scale(1);    }
          40%  { transform: rotate(200deg) scale(1.15); }
          80%  { transform: rotate(340deg) scale(1.05); }
          100% { transform: rotate(360deg) scale(1);    }
        }
      `}</style>
    </>
  )
}
