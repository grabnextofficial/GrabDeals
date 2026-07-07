"use client"

import type React from "react"
import { useState } from "react"
import { signInWithEmail, ADMIN_EMAIL } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff, Loader2, LogIn, Mail, Lock } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { refreshUser } = useAuth()

  const handleRedirect = (userEmail: string | null) => {
    if (userEmail && userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const user = await signInWithEmail(email, password)
      await refreshUser()
      handleRedirect(user?.email || null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-950 p-4">
      {/* Background Animated Blobs for Visual Depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-80 h-80 rounded-full bg-blue-600/20 blur-[100px] animate-blob" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-orange-600/15 blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-purple-600/20 blur-[100px] animate-blob animation-delay-4000" />
      </div>

      <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Glassmorphic Container */}
        <div className="backdrop-blur-2xl bg-slate-900/60 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-3xl p-8 md:p-10 transition-all duration-300 hover:border-white/20">
          
          {/* Logo / Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-44 h-16 mb-2 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="GrabDeals Logo"
                fill
                sizes="(max-width: 768px) 100vw, 176px"
                className="object-contain filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.08)]"
                priority
              />
            </div>
            <p className="text-slate-400 text-sm text-center font-medium mt-2">Welcome back! Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white placeholder:text-slate-500 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white placeholder:text-slate-500 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs px-4 py-3 rounded-xl transition-all duration-200">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 disabled:opacity-60 text-white py-3.5 rounded-xl font-extrabold shadow-lg hover:shadow-orange-500/20 transition-all duration-300 flex items-center justify-center gap-2 text-sm hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
              ) : (
                <><LogIn className="h-4 w-4" /> Sign In</>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-900 px-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">New to GrabDeals?</span>
            </div>
          </div>

          <Link
            href="/auth/register"
            className="block w-full text-center py-3 rounded-xl border border-white/10 text-white font-extrabold hover:bg-white/5 transition-all duration-200 text-sm hover:scale-[1.01] active:scale-[0.99]"
          >
            Create a free account
          </Link>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="text-slate-400 underline hover:text-white">Terms</Link>{" "}and{" "}
          <Link href="/privacy" className="text-slate-400 underline hover:text-white">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
