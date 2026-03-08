export interface DigitalAsset {
  id: string
  name: string
  type: "pdf" | "video" | "link" | "file"
  provider: "vercel" | "tdrive" | "external"
  url: string
}

export interface Product {
  id: string
  title: string
  description: string
  price: number
  category: string
  tags: string[]
  imageUrl: string
  downloadUrl: string // Now stores JSON.stringify(DigitalAsset[])
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  salesCount: number
  pageCode?: string
  createdBy: string // Admin user ID who created this product
}

export interface CartItem {
  productId: string
  product: Product
  quantity: number
}

export interface Order {
  id: string
  userId: string
  items: CartItem[]
  totalAmount: number
  status: "pending" | "completed" | "refunded"
  paymentId?: string
  createdAt: Date
  updatedAt: Date
}

export interface User {
  uid: string
  email: string
  displayName: string
  role: "user" | "admin"
  createdAt: Date
}

export interface AdminStats {
  totalSales: number
  totalOrders: number
  totalUsers: number
  topProducts: Product[]
  recentOrders: Order[]
}
