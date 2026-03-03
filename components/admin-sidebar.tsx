"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ShoppingBag, List, ShoppingCart, Store, Users, Image } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const sidebarItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: ShoppingBag },
  { name: "Categories", href: "/admin/categories", icon: List },
  { name: "Banners", href: "/admin/banners", icon: Image },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Users", href: "/admin/users", icon: Users },
]


export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full border-r bg-white w-64">
      <div className="p-6 border-b">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-white border flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="logo" className="h-7 w-7 object-contain" />
          </div>
          <span className="font-bold text-xl">Admin Panel</span>
        </Link>
      </div>

      <div className="flex-1 py-6 px-4 space-y-2">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-sm font-medium",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </div>
            </Link>
          )
        })}
      </div>

      <div className="p-4 border-t space-y-2">
        <Button asChild variant="outline" className="w-full justify-start gap-3">
          <Link href="/">
            <Store className="h-4 w-4" />
            Back to Store
          </Link>
        </Button>
      </div>
    </div>
  )
}