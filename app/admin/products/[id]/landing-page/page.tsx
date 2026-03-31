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
        <div className="min-h-screen bg-slate-50">
            {/* Sticky Header */}
            <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/products/${params.id}/edit`}><ArrowLeft className="h-5 w-5" /></Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <LayoutTemplate className="h-4 w-4 text-indigo-500" />
                                <h1 className="text-xl font-bold text-gray-800">Landing Page Editor</h1>
                            </div>
                            <p className="text-xs text-gray-400 truncate max-w-xs">{product?.title || ''}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/products/${productSlug}`} target="_blank">
                                <Eye className="h-4 w-4 mr-1" /> Preview
                            </Link>
                        </Button>
                        <Button onClick={handleSave} disabled={saving}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white">
                            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save</>}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-2.5">
                <div className="container mx-auto flex items-center gap-2 text-sm text-indigo-700">
                    <LayoutTemplate className="h-4 w-4 shrink-0" />
                    <span>Build your landing page using sections. Use <strong>✨ Generate with AI</strong> for instant pages, or add sections manually.</span>
                </div>
            </div>

            {/* Builder */}
            <div className="container mx-auto px-6 py-6 max-w-4xl">
                <LandingPageBuilder
                    sections={sections}
                    onChange={setSections}
                    productTitle={product?.title}
                    productPrice={product?.price}
                    productDescription={product?.description}
                />
                {sections.length > 0 && (
                    <div className="mt-6 flex justify-end">
                        <Button onClick={handleSave} disabled={saving}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8">
                            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save Landing Page</>}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
