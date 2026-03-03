"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Lock, Mail, User, Phone, Eye, EyeOff, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { StoreHeader } from "@/components/store-header"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

declare global {
  interface Window { XPay: any }
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalAmount, clearCart } = useCart()
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [newAccountInfo, setNewAccountInfo] = useState<{ email: string; password: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
  })

  // Pre-fill from logged-in user
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value })

  const saveOrder = useCallback(async (utr: string, userId: string) => {
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userEmail: formData.email,
          userName: `${formData.firstName} ${formData.lastName}`.trim(),
          userPhone: formData.phone,
          items: JSON.stringify(
            items.map((i) => ({
              productId: i.productId,
              title: i.product.title,
              price: i.product.price,
              quantity: i.quantity,
            }))
          ),
          totalAmount,
          status: "paid",
          paymentId: utr,
        }),
      })
    } catch (err) {
      console.error("Order save error:", err)
    }
  }, [formData, items, totalAmount])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (items.length === 0) {
      toast({ title: "Your cart is empty", variant: "destructive" })
      return
    }

    if (!formData.email) {
      toast({ title: "Please enter your email address", variant: "destructive" })
      return
    }

    if (!window.XPay) {
      toast({ title: "Payment system loading, please try again", variant: "destructive" })
      return
    }

    setLoading(true)

    const orderTitle =
      items.length === 1
        ? items[0].product.title
        : `${items[0].product.title} + ${items.length - 1} more`

    const xpay = new window.XPay({
      api_key: "xp_live_wtm5vj64kseuylg9cfmsl9",
      amount: Math.round(totalAmount),
      title: orderTitle,

      onSuccess: async (data: { utr: string }) => {
        setLoading(false)

        // Determine userId: logged-in user or create guest account
        let userId = user?.uid || "guest"

        if (!user) {
          // Auto-create guest account
          try {
            const guestRes = await fetch("/api/auth/guest-register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: formData.email,
                displayName: `${formData.firstName} ${formData.lastName}`.trim(),
                phone: formData.phone,
              }),
            })
            const guestData = await guestRes.json()
            if (guestData.user?.uid) {
              userId = guestData.user.uid
              if (!guestData.isExisting && guestData.temporaryPassword) {
                setNewAccountInfo({
                  email: formData.email,
                  password: guestData.temporaryPassword,
                })
              }
            }
            await refreshUser()
          } catch (err) {
            console.error("Guest register error:", err)
          }
        }

        await saveOrder(data.utr, userId)
        clearCart()
        toast({
          title: "🎉 Payment Successful!",
          description: `UTR: ${data.utr} — Your order has been placed.`,
        })
        router.push(`/checkout/success?utr=${data.utr}`)
      },

      onClose: () => {
        setLoading(false)
        toast({ title: "Payment cancelled", variant: "destructive" })
      },
    })

    xpay.open()
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <StoreHeader />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="text-6xl mb-4">🛒</div>
              <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">Add some products to proceed with checkout.</p>
              <Button asChild size="lg">
                <Link href="/products">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader />

      {/* Account created dialog */}
      <Dialog open={!!newAccountInfo} onOpenChange={() => setNewAccountInfo(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Account Created!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              We've created an account for you automatically so you can track your orders.
            </p>
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{newAccountInfo?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Password:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary">
                    {showPassword ? newAccountInfo?.password : "••••••••••"}
                  </span>
                  <button type="button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-orange-600 font-medium">
              ⚠️ Please save this password. You can use it to login and track your orders.
            </p>
            <Button
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText(newAccountInfo?.password || "")
                toast({ title: "Password copied!" })
              }}
            >
              Copy Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          {!user && (
            <p className="text-sm text-muted-foreground mb-6">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>{" "}
              to load your details. Or continue as guest — we'll create an account for you automatically.
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left: Forms */}
              <div className="space-y-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        disabled={!!user?.email}
                        placeholder="your@email.com"
                      />
                      {!user && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Order confirmation will be sent here
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Billing Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Billing Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required className="pl-10" placeholder="+91 XXXXX XXXXX" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" name="address" value={formData.address} onChange={handleInputChange} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input id="city" name="city" value={formData.city} onChange={handleInputChange} />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input id="state" name="state" value={formData.state} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleInputChange} />
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input id="country" name="country" value={formData.country} onChange={handleInputChange} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Order Summary */}
              <div>
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.productId} className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm line-clamp-2">{item.product.title}</h4>
                            <p className="text-muted-foreground text-xs">Qty: {item.quantity}</p>
                          </div>
                          <span className="font-medium text-sm shrink-0">
                            {formatPrice(item.product.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatPrice(totalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax</span>
                        <span>Included</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span className="text-green-600 font-medium">Free</span>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">{formatPrice(totalAmount)}</span>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="flex items-start gap-2">
                        <Checkbox id="terms" required className="mt-0.5" />
                        <Label htmlFor="terms" className="text-sm font-normal leading-relaxed">
                          I agree to the{" "}
                          <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                          {" "}and{" "}
                          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                        </Label>
                      </div>

                      <Button type="submit" className="w-full" size="lg" disabled={loading}>
                        {loading ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Opening payment...</>
                        ) : (
                          <><Lock className="h-4 w-4 mr-2" />Pay {formatPrice(totalAmount)}</>
                        )}
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
                        Secured by XPay · UPI payment gateway
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}