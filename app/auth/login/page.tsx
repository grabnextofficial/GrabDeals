"use client"

import type React from "react"

import { useState } from "react"
import { signInWithEmail, ADMIN_EMAIL } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const router = useRouter()
  const { refreshUser } = useAuth()

  const handleRedirect = (userEmail: string | null) => {
    if (userEmail && userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      router.push("/admin");
    } else {
      router.push("/profile");
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      const user = await signInWithEmail(email, password)
      await refreshUser()
      handleRedirect(user?.email || null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleGoogleSignIn = async () => {
    setError("Google Sign-In is not supported. Please use email/password.")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-500 via-pink-500 to-red-500">
      <div className="bg-white/20 backdrop-blur-lg p-10 rounded-2xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center">Welcome Back</h1>
        <p className="text-center text-white mt-2">Sign in to your Digital Store account</p>

        <form onSubmit={handleLogin} className="mt-6">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 mb-4 rounded-lg bg-white/80 focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 mb-4 rounded-lg bg-white/80 focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-red-200 text-sm mb-3 bg-red-600/50 p-2 rounded">{error}</p>}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:opacity-90 transition-all duration-200"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-white mt-6">
          Don't have an account?{" "}
          <Link href="/auth/register" className="underline font-semibold hover:text-pink-200 transition-colors">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}
