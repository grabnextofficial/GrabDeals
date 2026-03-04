"use client"

export const runtime = 'edge'

import { use } from "react"
import { AdminProductForm } from "@/components/admin-product-form"

export default function EditProductPage({ params }: { params: { id: string } }) {
    return <AdminProductForm mode="edit" productId={params.id} />
}
