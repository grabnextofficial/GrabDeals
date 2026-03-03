"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ADMIN_EMAIL } from "@/lib/auth"
import { Loader2 } from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (!loading) {
      // Check if user is admin either by DB role or by hardcoded email
      const isAdmin = userProfile?.role === "admin" || (user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())
      
      if (!user || !isAdmin) {
        router.push("/")
      } else {
        setIsAuthorized(true)
      }
    }
  }, [user, userProfile, loading, router])

  if (loading || !isAuthorized) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-slate-500 font-medium">Verifying access...</span>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="hidden md:block">
        <AdminSidebar />
      </div>
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}