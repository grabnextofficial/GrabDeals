"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { StoreHeader } from "@/components/store-header"
import { useAuth } from "@/contexts/auth-context"
import { getUserOrders } from "@/lib/d1-client"
import { toast } from "@/hooks/use-toast"
import { User, ShoppingBag, Download, Loader2, Package, LogIn } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        paid: "bg-green-100 text-green-700",
        pending: "bg-yellow-100 text-yellow-700",
        completed: "bg-blue-100 text-blue-700",
        refunded: "bg-red-100 text-red-700",
    }
    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] || "bg-gray-100 text-gray-600"}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    )
}

export default function DashboardPage() {
    const { user, loading: authLoading, refreshUser } = useAuth()
    const [orders, setOrders] = useState<any[]>([])
    const [ordersLoading, setOrdersLoading] = useState(true)
    const [profileForm, setProfileForm] = useState({
        displayName: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        country: "",
    })
    const [savingProfile, setSavingProfile] = useState(false)

    useEffect(() => {
        if (user) {
            setProfileForm({
                displayName: user.displayName || "",
                phone: (user as any).phone || "",
                address: (user as any).address || "",
                city: (user as any).city || "",
                state: (user as any).state || "",
                country: (user as any).country || "",
            })
            loadOrders()
        } else if (!authLoading) {
            setOrdersLoading(false)
        }
    }, [user, authLoading])

    const loadOrders = async () => {
        if (!user) return
        setOrdersLoading(true)
        try {
            const data = await getUserOrders(user.uid)
            setOrders(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error(e)
        } finally {
            setOrdersLoading(false)
        }
    }

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setSavingProfile(true)
        try {
            const res = await fetch("/api/users/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profileForm),
            })
            if (!res.ok) throw new Error("Failed to save")
            toast({ title: "✅ Profile updated!" })
            await refreshUser()
        } catch {
            toast({ title: "Failed to update profile", variant: "destructive" })
        } finally {
            setSavingProfile(false)
        }
    }

    // Downloads: collect all downloadUrl from ordered products
    const downloadableItems = orders.flatMap((order) => {
        let items: any[] = []
        try { items = JSON.parse(order.items) } catch { items = [] }
        return items.filter((item: any) => item.downloadUrl)
    })

    if (authLoading) {
        return (
            <div className="min-h-screen">
                <StoreHeader />
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50">
                <StoreHeader />
                <div className="container mx-auto px-4 py-24 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="text-6xl mb-4">🔒</div>
                        <h1 className="text-2xl font-bold mb-2">Sign in to access your dashboard</h1>
                        <p className="text-muted-foreground mb-6">View your orders, manage your profile, and download your purchases.</p>
                        <div className="flex gap-3 justify-center">
                            <Button asChild>
                                <Link href="/auth/login"><LogIn className="h-4 w-4 mr-2" />Sign In</Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/auth/register">Create Account</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <StoreHeader />
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                            {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{user.displayName || "My Account"}</h1>
                            <p className="text-muted-foreground">{user.email}</p>
                        </div>
                    </div>

                    <Tabs defaultValue="orders">
                        <TabsList className="mb-6">
                            <TabsTrigger value="orders" className="flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4" />Orders
                            </TabsTrigger>
                            <TabsTrigger value="profile" className="flex items-center gap-2">
                                <User className="h-4 w-4" />Profile
                            </TabsTrigger>
                            <TabsTrigger value="downloads" className="flex items-center gap-2">
                                <Download className="h-4 w-4" />Downloads
                            </TabsTrigger>
                        </TabsList>

                        {/* Orders Tab */}
                        <TabsContent value="orders">
                            {ordersLoading ? (
                                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
                            ) : orders.length === 0 ? (
                                <div className="text-center py-16">
                                    <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                                    <h3 className="text-lg font-semibold mb-1">No orders yet</h3>
                                    <p className="text-muted-foreground mb-4">Your order history will appear here</p>
                                    <Button asChild><Link href="/products">Browse Products</Link></Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orders.map((order: any) => {
                                        let items: any[] = []
                                        try { items = JSON.parse(order.items) } catch { }
                                        return (
                                            <Card key={order.id}>
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Order ID</p>
                                                            <p className="font-mono text-sm font-semibold">{order.id.slice(0, 8).toUpperCase()}...</p>
                                                        </div>
                                                        <StatusBadge status={order.status} />
                                                        <div className="text-right">
                                                            <p className="text-xs text-muted-foreground">Total</p>
                                                            <p className="font-bold text-primary">₹{Number(order.totalAmount).toLocaleString("en-IN")}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs text-muted-foreground">Date</p>
                                                            <p className="text-sm">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <Separator className="mb-3" />
                                                    <div className="space-y-2">
                                                        {items.map((item: any, i: number) => (
                                                            <div key={i} className="flex justify-between text-sm">
                                                                <span className="text-gray-700">{item.title} × {item.quantity}</span>
                                                                <span className="font-medium">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {order.paymentId && (
                                                        <p className="text-xs text-muted-foreground mt-3">Payment ID: {order.paymentId}</p>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            )}
                        </TabsContent>

                        {/* Profile Tab */}
                        <TabsContent value="profile">
                            <Card>
                                <CardHeader><CardTitle>Edit Profile</CardTitle></CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                                        <div>
                                            <Label htmlFor="displayName">Full Name</Label>
                                            <Input id="displayName" value={profileForm.displayName} onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })} />
                                        </div>
                                        <div>
                                            <Label htmlFor="email-display">Email</Label>
                                            <Input id="email-display" value={user.email} disabled className="bg-gray-50" />
                                            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                                        </div>
                                        <div>
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input id="phone" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
                                        </div>
                                        <div>
                                            <Label htmlFor="address">Address</Label>
                                            <Input id="address" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} placeholder="Street address" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="city">City</Label>
                                                <Input id="city" value={profileForm.city} onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })} />
                                            </div>
                                            <div>
                                                <Label htmlFor="state">State</Label>
                                                <Input id="state" value={profileForm.state} onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })} />
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="country">Country</Label>
                                            <Input id="country" value={profileForm.country} onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })} />
                                        </div>
                                        <Button type="submit" disabled={savingProfile}>
                                            {savingProfile ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Downloads Tab */}
                        <TabsContent value="downloads">
                            {downloadableItems.length === 0 ? (
                                <div className="text-center py-16">
                                    <Download className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                                    <h3 className="text-lg font-semibold mb-1">No downloads available</h3>
                                    <p className="text-muted-foreground">Purchase digital products to see download links here</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {downloadableItems.map((item: any, i: number) => (
                                        <Card key={i}>
                                            <CardContent className="flex items-center justify-between py-4 px-5">
                                                <span className="font-medium">{item.title}</span>
                                                <Button asChild size="sm">
                                                    <a href={item.downloadUrl} target="_blank" rel="noopener noreferrer">
                                                        <Download className="h-4 w-4 mr-2" />Download
                                                    </a>
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
