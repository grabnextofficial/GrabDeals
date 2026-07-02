"use client"

export const runtime = 'edge'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import {
    FileText, Plus, Loader2, Edit2, Trash2, Globe, GlobeLock,
    Eye, Copy, Clock, Sparkles, ExternalLink
} from "lucide-react"

interface LandingPage {
    id: string
    title: string
    slug: string
    isPublished: number
    productIds: string
    createdAt: number
    updatedAt: number
}

export default function LandingPagesPage() {
    const [pages, setPages] = useState<LandingPage[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [togglingId, setTogglingId] = useState<string | null>(null)
    const router = useRouter()

    const load = async () => {
        try {
            const res = await fetch('/api/landing-pages')
            const data = await res.json()
            setPages(Array.isArray(data) ? data : [])
        } catch {
            toast({ title: "Failed to load pages", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const handleCreate = async () => {
        setCreating(true)
        try {
            const res = await fetch('/api/landing-pages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'New Landing Page', sections: '[]' }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Create failed')
            router.push(`/admin/landing-pages/${data.id}`)
        } catch (e: any) {
            toast({ title: "Failed to create", description: e.message, variant: "destructive" })
            setCreating(false)
        }
    }

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
        setDeletingId(id)
        try {
            await fetch(`/api/landing-pages/${id}`, { method: 'DELETE' })
            setPages(prev => prev.filter(p => p.id !== id))
            toast({ title: "Page deleted" })
        } catch {
            toast({ title: "Delete failed", variant: "destructive" })
        } finally {
            setDeletingId(null)
        }
    }

    const handleTogglePublish = async (page: LandingPage) => {
        setTogglingId(page.id)
        const newStatus = page.isPublished ? 0 : 1
        try {
            const res = await fetch(`/api/landing-pages/${page.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: page.title,
                    slug: page.slug,
                    sections: '[]',
                    productIds: page.productIds || '[]',
                    isPublished: newStatus,
                }),
            })
            if (!res.ok) throw new Error()
            setPages(prev => prev.map(p => p.id === page.id ? { ...p, isPublished: newStatus } : p))
            toast({ title: newStatus ? "✅ Page Published! It's now live." : "Page unpublished" })
        } catch {
            toast({ title: "Failed to update", variant: "destructive" })
        } finally {
            setTogglingId(null)
        }
    }

    const copyLink = (slug: string) => {
        const url = `${window.location.origin}/lp/${slug}`
        navigator.clipboard.writeText(url)
        toast({ title: "🔗 Link copied!" })
    }

    const formatDate = (ts: number) => {
        if (!ts) return '—'
        return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    return (
        <div className="p-8">
            <div className="max-w-5xl mx-auto">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <FileText className="h-8 w-8 text-violet-600" />
                                Landing Pages
                            </h1>
                            <p className="text-gray-500 mt-1">Create AI-powered sales funnel pages and publish them instantly.</p>
                        </div>
                        <Button onClick={handleCreate} disabled={creating}
                            className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-bold shadow-lg shadow-violet-200 h-11 px-6">
                            {creating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating...</> : <><Plus className="h-4 w-4 mr-2" />New Landing Page</>}
                        </Button>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                        </div>
                    ) : pages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="h-20 w-20 bg-violet-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                                <Sparkles className="h-10 w-10 text-violet-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-700 mb-2">No landing pages yet</h2>
                            <p className="text-gray-400 mb-6 max-w-sm">Create your first AI-powered landing page in seconds. No coding needed.</p>
                            <Button onClick={handleCreate} disabled={creating}
                                className="bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-bold px-8">
                                {creating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating...</> : <>✨ Create First Page</>}
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {pages.map(page => (
                                <div key={page.id}
                                    className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex items-center gap-5">

                                    {/* Status indicator */}
                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${page.isPublished ? 'bg-green-50' : 'bg-gray-100'}`}>
                                        {page.isPublished
                                            ? <Globe className="h-6 w-6 text-green-600" />
                                            : <GlobeLock className="h-6 w-6 text-gray-400" />
                                        }
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h2 className="font-bold text-gray-900 text-base truncate">{page.title}</h2>
                                            {page.isPublished ? (
                                                <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">LIVE</span>
                                            ) : (
                                                <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">DRAFT</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                                            <span className="text-xs text-gray-400 font-mono">/lp/{page.slug}</span>
                                            {page.isPublished && (
                                                <a href={`/lp/${page.slug}`} target="_blank"
                                                    className="text-xs text-violet-500 hover:text-violet-700 flex items-center gap-1">
                                                    <ExternalLink className="h-3 w-3" /> View Live
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-400">
                                            <Clock className="h-3 w-3" />
                                            Updated {formatDate(page.updatedAt)}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                                        {page.isPublished && (
                                            <Button variant="outline" size="sm" onClick={() => copyLink(page.slug)}
                                                className="h-8 text-xs border-gray-200">
                                                <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Link
                                            </Button>
                                        )}
                                        <Button variant="outline" size="sm" onClick={() => router.push(`/admin/landing-pages/${page.id}`)}
                                            className="h-8 text-xs border-gray-200">
                                            <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit
                                        </Button>
                                        <Button size="sm" onClick={() => handleTogglePublish(page)}
                                            disabled={togglingId === page.id}
                                            className={`h-8 text-xs font-bold ${page.isPublished
                                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                                : 'bg-green-600 hover:bg-green-700 text-white shadow-sm shadow-green-200'
                                            }`}>
                                            {togglingId === page.id
                                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                : page.isPublished ? <><GlobeLock className="h-3.5 w-3.5 mr-1.5" />Unpublish</> : <><Globe className="h-3.5 w-3.5 mr-1.5" />Publish</>
                                            }
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(page.id, page.title)}
                                            disabled={deletingId === page.id}
                                            className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50">
                                            {deletingId === page.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
        </div>
    )
}
