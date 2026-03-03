"use client"

import * as React from "react"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { getUserProfile, type UserProfile } from "@/lib/auth"

interface AuthContextType {
  user: UserProfile | null
  userProfile: UserProfile | null
  loading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  refreshUser: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children?: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    setLoading(true)
    try {
      const profile = await getUserProfile()
      setUser(profile)
      setUserProfile(profile)
    } catch (error) {
      setUser(null)
      setUserProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  return <AuthContext.Provider value={{ user, userProfile, loading, refreshUser }}>{children}</AuthContext.Provider>
}
