"use client"

export const runtime = 'edge'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LandingPageBuilder } from "@/components/landing-page-builder"
import { CartProvider } from "@/contexts/cart-context"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { LandingSection } from "@/lib/types"

export default function LandingPageEditorPage({ params }: { params: { id: string } }) {
    const [htmlContent, setHtmlContent] = useState("")
    const [page, setPage] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [products, setProducts] = useState<any[]>([])
    const router = useRouter()

    useEffect(() => {
        const load = async () => {
            try {
                const [pageRes, productsRes] = await Promise.all([
                    fetch(`/api/landing-pages/${params.id}`),
                    fetch('/api/products?limit=100&active=1'),
                ])
                if (!pageRes.ok) throw new Error('Page not found')
                const pageData = await pageRes.json()
                setPage(pageData)
                try {
                    const parsed = typeof pageData.sections === 'string'
                        ? JSON.parse(pageData.sections)
                        : pageData.sections
                    if (parsed && parsed.format === 'html') {
                        setHtmlContent(parsed.html || "")
                    } else if (Array.isArray(parsed)) {
                        setHtmlContent("<!-- Legacy Builder Content. Generate new HTML via AI to upgrade. -->")
                    } else {
                        setHtmlContent(typeof parsed === 'string' ? parsed : "")
                    }
                } catch { 
                    setHtmlContent(pageData.sections || "")
                }

                if (productsRes.ok) {
                    const pData = await productsRes.json()
                    setProducts(Array.isArray(pData) ? pData : pData.products || [])
                }
            } catch (e: any) {
                toast({ title: "Failed to load page", description: e.message, variant: "destructive" })
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [params.id])

    const handleSave = async (currentHtmlContent: string) => {
        if (!page) return
        setSaving(true)
        try {
            const res = await fetch(`/api/landing-pages/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: page.title,
                    slug: page.slug,
                    sections: JSON.stringify({ format: "html", html: currentHtmlContent }),
                    productIds: page.productIds || '[]',
                    isPublished: page.isPublished,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Save failed')
            toast({ title: "✅ Page saved!" })
        } catch (e: any) {
            toast({ title: "Save failed", description: e.message, variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const handleTitleChange = (newTitle: string) => {
        setPage((prev: any) => ({ ...prev, title: newTitle }))
    }

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-slate-100">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
                <p className="text-sm text-gray-500">Loading builder...</p>
            </div>
        </div>
    )

    return (
        <div className="h-screen w-full bg-slate-100 overflow-hidden">
            <CartProvider>
                <LandingPageBuilder
                    htmlContent={htmlContent}
                    onChange={setHtmlContent}
                    productTitle={page?.title}
                    productPrice={null}
                    productDescription={null}
                    onSave={handleSave}
                    saving={saving}
                    exitLink="/admin/landing-pages"
                    previewLink={page?.slug ? `/lp/${page.slug}` : undefined}
                    isPublished={!!page?.isPublished}
                    pageTitle={page?.title}
                    pageSlug={page?.slug}
                    onTitleChange={handleTitleChange}
                    storeProducts={products}
                />
            </CartProvider>
        </div>
    )
}
