"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, X, Send, Loader2, ShoppingBag, Sparkles, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Message {
  role: "user" | "ai"
  text: string
  timestamp: Date
}

const QUICK_QUESTIONS = [
  "Kaunse products available hain?",
  "Best deals kya hain?",
  "Payment methods kya accept hote hain?",
  "Order kaise track karein?",
]

export function ShopAIChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Namaskar! 🙏 Main **GrabNext AI Assistant** hoon! GrabNext pe shopping ke baare mein koi bhi sawaal puchein — products, price, deals, ya kuch bhi! ✨",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showBubble, setShowBubble] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [messages, isOpen])

  useEffect(() => {
    // Hide the bubble hint after 5 seconds
    const t = setTimeout(() => setShowBubble(false), 5000)
    return () => clearTimeout(t)
  }, [])

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || isLoading) return

    const userMsg: Message = { role: "user", text: msg, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    // Build history (exclude the initial greeting)
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
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: data.reply || "Kuch galat ho gaya. Please dobara try karein.", timestamp: new Date() },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "GrabNext AI se connect nahi ho paa raha. Please internet check karein. 🙏", timestamp: new Date() },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const formatText = (text: string) => {
    // Simple markdown-like bold formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br/>")
  }

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2">
        {/* Hint Bubble */}
        {showBubble && !isOpen && (
          <div
            className="bg-white text-gray-800 text-sm px-4 py-2 rounded-2xl shadow-lg border border-orange-100 animate-bounce-in max-w-[200px] text-center cursor-pointer"
            onClick={() => { setIsOpen(true); setShowBubble(false) }}
          >
            🤖 GrabNext AI se puchein!
            <div className="absolute bottom-[-6px] right-6 w-3 h-3 bg-white border-b border-r border-orange-100 rotate-45" />
          </div>
        )}

        <button
          onClick={() => { setIsOpen(!isOpen); setShowBubble(false) }}
          className="relative h-14 w-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center text-white group"
          aria-label="GrabNext AI Chat"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <>
              <Bot className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
            </>
          )}
          {/* Glow ring */}
          <span className="absolute inset-0 rounded-full bg-orange-400 opacity-0 group-hover:opacity-20 transition-opacity" />
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[9998] w-[360px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-sm">GrabNext AI</span>
                  <Sparkles className="h-3 w-3 text-yellow-300" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-orange-100">Shopping Assistant • Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <ChevronDown className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[380px] min-h-[280px] bg-gray-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}
              >
                {msg.role === "ai" && (
                  <div className="h-7 w-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-4 w-4 text-orange-500" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-orange-500 text-white rounded-br-sm"
                      : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm"
                  }`}
                >
                  <span
                    dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
                  />
                  <div className={`text-[10px] mt-1 ${msg.role === "user" ? "text-orange-100" : "text-gray-400"}`}>
                    {msg.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="h-7 w-7 rounded-full bg-orange-500 flex items-center justify-center shrink-0 mt-0.5 text-white text-xs font-bold">
                    U
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-orange-100 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-orange-500" />
                </div>
                <div className="bg-white px-4 py-2.5 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100">
                  <div className="flex gap-1 items-center">
                    <span className="h-2 w-2 rounded-full bg-orange-400 animate-bounce [animation-delay:0ms]" />
                    <span className="h-2 w-2 rounded-full bg-orange-400 animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-orange-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions (shown only initially) */}
          {messages.length <= 1 && (
            <div className="px-4 py-2 flex flex-wrap gap-1.5 bg-gray-50 border-t border-gray-100">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-[11px] px-2.5 py-1.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 transition-colors truncate max-w-full"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage() }}
              className="flex gap-2 items-center"
            >
              <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-2 gap-2 focus-within:border-orange-400 focus-within:bg-white transition-all">
                <ShoppingBag className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Koi sawaal puchein..."
                  className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="h-9 w-9 rounded-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0 shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              Powered by <strong className="text-orange-500">GrabNext AI</strong> × Gemini
            </p>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.8); }
          70% { transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-bounce-in {
          animation: bounce-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </>
  )
}
