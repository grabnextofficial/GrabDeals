"use client"

export const runtime = 'edge'

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LandingPageBuilder } from "@/components/landing-page-builder"
import { toast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, Eye, Save, LayoutTemplate } from "lucide-react"
import { LandingSection } from "@/lib/types"

export default function LandingPageEditorPage({ params }: { params: { id: string } }) {
    const [sections, setSections] = useState<LandingSection[]>([])
    const [product, setProduct] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetch(`/api/products/${params.id}`)
            .then(r => r.json())
            .then(p => {
                setProduct(p)
                if (p.pageCode) {
                    try { setSections(JSON.parse(p.pageCode)) } catch { setSections([]) }
                }
                setLoading(false)
            })
            .catch(() => { toast({ title: "Failed to load product", variant: "destructive" }); setLoading(false) })
    }, [params.id])

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch(`/api/products/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...product,
                    pageCode: JSON.stringify(sections),
                    pageType: "landing",
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Save failed")
            toast({ title: "✅ Landing page saved!" })
        } catch (err: any) {
            toast({ title: "Save failed", description: err.message, variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
    )

    const productSlug = product?.slug || params.id

    return (
        <div className="h-screen w-full bg-slate-100 overflow-hidden">
            <LandingPageBuilder
                sections={sections}
                onChange={setSections}
                productTitle={product?.title}
                productPrice={product?.price}
                productDescription={product?.description}
                onSave={handleSave}
                saving={saving}
                exitLink={`/admin/products/${params.id}/edit`}
                previewLink={`/products/${productSlug}`}
            />
        </div>
    )
}
