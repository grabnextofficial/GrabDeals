"use client"

export const runtime = 'edge'

import { useState, useEffect } from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { BarChart2, Eye, MousePointerClick, FileInput, Loader2, RefreshCw, User, Phone, Mail, Calendar, Filter } from "lucide-react"

interface ProductStat {
    id: string
    title: string
    slug: string
    views: number
    clicks: number
    formSubmissions: number
}

interface FormSubmission {
    id: string
    productId: string
    productTitle: string
    fields: Record<string, string>
    ip: string
    createdAt: number
}

export default function AnalyticsPage() {
    const [stats, setStats] = useState<ProductStat[]>([])
    const [submissions, setSubmissions] = useState<FormSubmission[]>([])
    const [loadingStats, setLoadingStats] = useState(true)
    const [loadingSubs, setLoadingSubs] = useState(true)
    const [filterProduct, setFilterProduct] = useState("")
    const [tab, setTab] = useState<"overview" | "forms">("overview")

    const fetchStats = () => {
        setLoadingStats(true)
        fetch("/api/lp/analytics")
            .then(r => r.json())
            .then(d => { setStats(d.products || []); setLoadingStats(false) })
            .catch(() => setLoadingStats(false))
    }

    const fetchSubmissions = () => {
        setLoadingSubs(true)
        const url = filterProduct ? `/api/lp/form-submit?productId=${filterProduct}` : "/api/lp/form-submit"
        fetch(url)
            .then(r => r.json())
            .then(d => { setSubmissions(d.submissions || []); setLoadingSubs(false) })
            .catch(() => setLoadingSubs(false))
    }

    useEffect(() => { fetchStats(); fetchSubmissions() }, [])
    useEffect(() => { fetchSubmissions() }, [filterProduct])

    const totalViews = stats.reduce((s, p) => s + (p.views || 0), 0)
    const totalClicks = stats.reduce((s, p) => s + (p.clicks || 0), 0)
    const totalForms = stats.reduce((s, p) => s + (p.formSubmissions || 0), 0)

    return (
        <div className="flex h-screen bg-gray-50">
            <AdminSidebar />
            <main className="flex-1 overflow-auto p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <BarChart2 className="h-8 w-8 text-indigo-600" />
                                Landing Page Analytics
                            </h1>
                            <p className="text-gray-500 mt-1">Views, clicks, and form submissions from your landing pages.</p>
                        </div>
                        <button onClick={() => { fetchStats(); fetchSubmissions() }}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
                            <RefreshCw className="h-4 w-4" /> Refresh
                        </button>
                    </div>

                    {/* Summary cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {[
                            { label: "Total Views", value: totalViews, icon: Eye, color: "blue" },
                            { label: "Total Clicks", value: totalClicks, icon: MousePointerClick, color: "green" },
                            { label: "Form Submissions", value: totalForms, icon: FileInput, color: "purple" },
                        ].map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className="bg-white rounded-2xl border p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm text-gray-500 font-medium">{label}</p>
                                    <div className={`h-9 w-9 rounded-xl bg-${color}-50 flex items-center justify-center`}>
                                        <Icon className={`h-5 w-5 text-${color}-600`} />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
                        {(['overview', 'forms'] as const).map(t => (
                            <button key={t} onClick={() => setTab(t)}
                                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                {t === 'overview' ? '📊 Overview' : '📋 Form Submissions'}
                            </button>
                        ))}
                    </div>

                    {/* Overview Tab */}
                    {tab === 'overview' && (
                        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b">
                                <h2 className="font-semibold text-gray-800">Per Landing Page</h2>
                            </div>
                            {loadingStats ? (
                                <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
                            ) : stats.length === 0 ? (
                                <div className="text-center py-16 text-gray-400">
                                    <Eye className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p>No landing page views yet.</p>
                                    <p className="text-xs mt-1">Views will appear here once someone visits a landing page.</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                                            <th className="px-6 py-3 text-left">Product</th>
                                            <th className="px-6 py-3 text-right">Views</th>
                                            <th className="px-6 py-3 text-right">Clicks</th>
                                            <th className="px-6 py-3 text-right">Form Submissions</th>
                                            <th className="px-6 py-3 text-right">Conv. Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {stats.map(p => (
                                            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-gray-800">{p.title}</p>
                                                    <p className="text-xs text-gray-400 font-mono">{p.slug}</p>
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold text-blue-700">{(p.views || 0).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right font-semibold text-green-700">{(p.clicks || 0).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right font-semibold text-purple-700">{(p.formSubmissions || 0).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right text-gray-600">
                                                    {p.views > 0 ? `${((p.formSubmissions / p.views) * 100).toFixed(1)}%` : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* Form Submissions Tab */}
                    {tab === 'forms' && (
                        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b flex items-center justify-between">
                                <h2 className="font-semibold text-gray-800">Form Submissions</h2>
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-gray-400" />
                                    <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)}
                                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                        <option value="">All Products</option>
                                        {stats.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                    </select>
                                </div>
                            </div>
                            {loadingSubs ? (
                                <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
                            ) : submissions.length === 0 ? (
                                <div className="text-center py-16 text-gray-400">
                                    <FileInput className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p>No form submissions yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {submissions.map(sub => {
                                        const date = new Date(sub.createdAt).toLocaleString('en-IN')
                                        const fields = sub.fields || {}
                                        return (
                                            <div key={sub.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                                            {sub.productTitle || 'Product'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                        <Calendar className="h-3 w-3" />
                                                        {date}
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-4 mt-2">
                                                    {Object.entries(fields).map(([k, v]) => (
                                                        <div key={k} className="flex items-center gap-1.5 text-sm">
                                                            {k.toLowerCase().includes('email') ? <Mail className="h-3.5 w-3.5 text-blue-500" /> :
                                                                k.toLowerCase().includes('phone') || k.toLowerCase().includes('tel') ? <Phone className="h-3.5 w-3.5 text-green-500" /> :
                                                                    <User className="h-3.5 w-3.5 text-gray-400" />}
                                                            <span className="text-gray-500 text-xs">{k}:</span>
                                                            <span className="font-semibold text-gray-800">{String(v)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
