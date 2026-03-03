"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, ShoppingCart, User, Menu, ChevronDown, Package, LayoutGrid, Monitor, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { CartDrawer } from "./cart-drawer"
import { useAuth } from "@/contexts/auth-context"
import { useCart } from "@/contexts/cart-context"
import { ADMIN_EMAIL } from "@/lib/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

export function StoreHeader() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user, userProfile } = useAuth()
  const { totalItems } = useCart()

  useEffect(() => {
    setMounted(true)
  }, [])

  const categories = [
    { name: "All Categories", icon: LayoutGrid, href: "/products" },
    { name: "Electronics", icon: Monitor, href: "/products?category=electronics" },
    { name: "Fashion", icon: Package, href: "/products?category=fashion" },
    { name: "Home & Kitchen", icon: BookOpen, href: "/products?category=home" },
  ]

  // Check if user is admin (either by Role OR by Email)
  const isAdmin = userProfile?.role === "admin" || (user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  return (
    <div className="sticky top-0 z-50 w-full flex flex-col shadow-md">
      {/* Top Bar - Orange Primary Brand */}
      <header className="bg-primary text-primary-foreground border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 shrink-0 group">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-lg overflow-hidden group-hover:scale-110 transition-transform">
              <img
                src="/logo.png"
                alt="Grabnext"
                className="h-9 w-9 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-2xl text-white leading-none italic tracking-tight">Grabnext</span>
              <span className="text-[10px] text-white/80 tracking-widest font-semibold">Explore Plus</span>
            </div>
          </Link>

          {/* Search Bar - Wide & Central */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4">
            <form
              className="relative w-full flex shadow-sm"
              onSubmit={(e) => {
                e.preventDefault()
                const q = (e.currentTarget.querySelector('input') as HTMLInputElement)?.value?.trim()
                if (q) window.location.href = `/products?q=${encodeURIComponent(q)}`
                else window.location.href = '/products'
              }}
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                name="q"
                placeholder="Search for products, brands and more"
                className="pl-10 rounded-r-none bg-white text-gray-900 border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-500 h-10"
              />
              <Button type="submit" className="rounded-l-none bg-yellow-400 text-gray-900 hover:bg-yellow-500 border border-l-0 font-medium px-6 h-10">
                Search
              </Button>
            </form>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2 md:space-x-6 shrink-0">

            {/* User Account Dropdown */}
            {mounted && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hidden md:flex gap-1 text-white hover:bg-white/10 font-medium">
                    <User className="h-4 w-4" />
                    <span className="max-w-[100px] truncate">{user.displayName || "Account"}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">My Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">My Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Downloads</Link>
                  </DropdownMenuItem>

                  {/* Explicit Admin Link for Admin Email */}
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="text-blue-600 font-medium bg-blue-50">
                        <Link href="/admin">Admin Panel</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:block">
                <Button asChild className="bg-white text-primary border border-white hover:bg-gray-100 px-8 font-semibold shadow-lg">
                  <Link href="/auth/login">
                    Login
                  </Link>
                </Button>
              </div>
            )}

            {/* Cart */}
            <CartDrawer>
              <Button variant="ghost" className="flex items-center gap-2 text-white hover:bg-white/10">
                <div className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {mounted && totalItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-4 w-4 min-w-[16px] p-0 flex items-center justify-center text-[10px] bg-red-600 text-white border-2 border-primary">
                      {totalItems}
                    </Badge>
                  )}
                </div>
                <span className="hidden md:inline font-medium">Cart</span>
              </Button>
            </CartDrawer>

            {/* Mobile Menu Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col space-y-6 mt-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Categories</h3>
                    {categories.map((cat) => (
                      <Link
                        key={cat.name}
                        href={cat.href}
                        className="flex items-center gap-3 text-muted-foreground hover:text-blue-600 transition-colors"
                      >
                        <cat.icon className="h-4 w-4" />
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg border-b pb-2">Account</h3>
                    {mounted && user ? (
                      <>
                        <Button asChild variant="ghost" className="w-full justify-start">
                          <Link href="/dashboard">My Dashboard</Link>
                        </Button>
                        <Button asChild variant="ghost" className="w-full justify-start">
                          <Link href="/dashboard">My Orders</Link>
                        </Button>
                        {isAdmin && (
                          <Button asChild variant="default" className="w-full">
                            <Link href="/admin">Admin Panel</Link>
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button asChild className="w-full">
                        <Link href="/auth/login">Login</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </div>
  )
}