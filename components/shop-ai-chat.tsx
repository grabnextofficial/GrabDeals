"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Send, Loader2, ShoppingBag, Sparkles, X, ShoppingCart, Zap, Star, ExternalLink, Minimize2 } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import type { Product } from "@/lib/types"
import Link from "next/link"
import Image from "next/image"

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
  timestamp: Date
  products?: SuggestedProduct[]
  action?: string | null
}

const QUICK_QUESTIONS = [
  "What's available?",
  "Best deals today?",
  "How do I order?",
  "Payment options?",
]

export function ShopAIChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Hey! 👋 I'm **GrabNext AI** — your personal shopping assistant! Ask me anything about our products, deals, or orders. I'm here to help! ✨",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showBubble, setShowBubble] = useState(true)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { addToCart } = useCart()
  const router = useRouter()

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  useEffect(() => {
    const t = setTimeout(() => setShowBubble(false), 6000)
    return () => clearTimeout(t)
  }, [])

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

    const userMsg: Message = { role: "user", text: msg, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    const history = messages
      .filter((_, i) => i > 0)
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

      const aiMsg: Message = {
        role: "ai",
        text: data.reply || "Something went wrong. Please try again.",
        timestamp: new Date(),
        products: aiProducts,
        action,
      }
      setMessages((prev) => [...prev, aiMsg])

      // Handle autonomous actions
      if (action === "add_to_cart" && aiProducts.length > 0) {
        aiProducts.forEach((p) => {
          addToCart(toCartProduct(p), 1)
          setAddedIds((prev) => new Set(prev).add(p.id))
        })
      } else if (action === "checkout" && aiProducts.length > 0) {
        aiProducts.forEach((p) => {
          addToCart(toCartProduct(p), 1)
          setAddedIds((prev) => new Set(prev).add(p.id))
        })
        setTimeout(() => {
          setIsOpen(false)
          router.push("/checkout")
        }, 800)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "GrabNext AI is offline. Please check your connection and try again! 🙏",
          timestamp: new Date(),
          products: [],
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const formatText = (text: string) =>
    text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br/>")

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price)

  const getDiscount = (price: number, original: number) =>
    Math.round((1 - price / original) * 100)

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-2">
        {/* Hint bubble */}
        {showBubble && !isOpen && (
          <div
            onClick={() => { setIsOpen(true); setShowBubble(false) }}
            className="relative cursor-pointer bg-white text-gray-700 text-xs font-medium px-3 py-2 rounded-xl shadow-lg border border-blue-100 whitespace-nowrap animate-[bounceIn_0.4s_ease]"
          >
            💬 Chat with GrabNext AI!
            <span className="absolute -bottom-1.5 right-5 w-3 h-3 bg-white border-b border-r border-blue-100 rotate-45 block" />
          </div>
        )}

        <button
          onClick={() => { setIsOpen((o) => !o); setShowBubble(false) }}
          aria-label="Open GrabNext AI Chat"
          className="relative h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl hover:shadow-blue-300 hover:scale-110 transition-all duration-300 flex items-center justify-center text-white group overflow-hidden"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <>
              {/* GrabNext Logo */}
              <img src="/logo.png" alt="GrabNext AI" className="h-8 w-8 object-contain rounded-full" />
              <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-green-400 rounded-full border-2 border-white animate-pulse" />
            </>
          )}
          <span className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed z-[9998] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-[slideUp_0.3s_cubic-bezier(0.34,1.56,0.64,1)_forwards]"
          style={{
            bottom: "90px",
            right: "20px",
            width: "min(380px, calc(100vw - 32px))",
            maxHeight: "calc(100dvh - 110px)",
          }}
        >
          {/* ── Header ── */}
          <div className="bg-blue-600 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 rounded-full bg-white flex items-center justify-center shadow">
                <img src="/logo.png" alt="GrabNext" className="h-7 w-7 object-contain rounded-full" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-green-400 rounded-full border-2 border-white" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-white text-sm">GrabNext AI</span>
                  <Sparkles className="h-3 w-3 text-yellow-300" />
                </div>
                <span className="text-[10px] text-blue-200">Shopping Assistant • Always Online</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <Minimize2 className="h-3.5 w-3.5 text-white" />
            </button>
          </div>

          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-[#f5f7fb]">
            {messages.map((msg, i) => (
              <div key={i} className="space-y-2">
                <div className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {/* AI Avatar */}
                  {msg.role === "ai" && (
                    <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mb-0.5 shadow">
                      <img src="/logo.png" alt="GrabNext" className="h-5 w-5 object-contain rounded-full" />
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white text-gray-800 rounded-bl-sm border border-gray-100"
                    }`}
                  >
                    <span dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
                    <div className={`text-[10px] mt-1 ${msg.role === "user" ? "text-blue-200" : "text-gray-400"}`}>
                      {msg.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>

                  {/* User Avatar */}
                  {msg.role === "user" && (
                    <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mb-0.5 shadow text-white text-[11px] font-bold">
                      You
                    </div>
                  )}
                </div>

                {/* ── Product Cards ── */}
                {msg.role === "ai" && msg.products && msg.products.length > 0 && (
                  <div className="ml-9 space-y-2">
                    {msg.products.map((product) => {
                      const isAdded = addedIds.has(product.id)
                      const discount = product.originalPrice ? getDiscount(product.price, product.originalPrice) : 0
                      const productUrl = product.slug ? `/products/${product.slug}` : `/products/${product.id}`

                      return (
                        <div
                          key={product.id}
                          className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
                        >
                          {/* Card clickable top → product page */}
                          <Link href={productUrl} onClick={() => setIsOpen(false)} className="flex gap-3 p-3 group">
                            <div className="relative shrink-0">
                              <img
                                src={product.imageUrl || `/placeholder.svg?height=64&width=64`}
                                alt={product.title}
                                className="h-16 w-16 object-cover rounded-lg bg-gray-100 group-hover:scale-105 transition-transform"
                              />
                              {discount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                  -{discount}%
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                                {product.title}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                <span className="text-[10px] text-gray-400">GrabNext Certified</span>
                              </div>
                              <div className="flex items-baseline gap-1.5 mt-1">
                                <span className="text-sm font-bold text-blue-600">{formatPrice(product.price)}</span>
                                {product.originalPrice && (
                                  <span className="text-[11px] text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                                )}
                              </div>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-400 shrink-0 mt-1 transition-colors" />
                          </Link>

                          {/* Action Buttons */}
                          <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleAddToCart(product)}
                              disabled={isAdded}
                              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all border ${
                                isAdded
                                  ? "bg-green-50 text-green-600 border-green-200 cursor-default"
                                  : "border-blue-200 text-blue-600 hover:bg-blue-50"
                              }`}
                            >
                              <ShoppingCart className="h-3.5 w-3.5" />
                              {isAdded ? "Added ✓" : "Add to Cart"}
                            </button>
                            <button
                              onClick={() => handleBuyNow(product)}
                              className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow hover:shadow-md"
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

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex items-end gap-2">
                <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 shadow">
                  <img src="/logo.png" alt="GrabNext" className="h-5 w-5 object-contain rounded-full" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1.5 items-center">
                    <span className="h-2 w-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
                    <span className="h-2 w-2 rounded-full bg-blue-400 animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-blue-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Quick Chips ── */}
          {messages.length <= 1 && !isLoading && (
            <div className="px-3 py-2 flex flex-wrap gap-1.5 bg-white border-t border-gray-100 shrink-0">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-[11px] px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors font-medium"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* ── Input ── */}
          <div className="p-3 bg-white border-t border-gray-100 shrink-0">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage() }}
              className="flex gap-2 items-center"
            >
              <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-full px-3.5 py-2 gap-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <ShoppingBag className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything about our products..."
                  className="flex-1 text-xs bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                  disabled={isLoading}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shadow hover:shadow-md shrink-0"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
            <p className="text-[10px] text-gray-400 text-center mt-1.5">
              <span className="text-blue-500 font-semibold">GrabNext AI</span> · Powered by Gemini
            </p>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes bounceIn {
          0%   { opacity: 0; transform: scale(0.8); }
          70%  { transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  )
}
