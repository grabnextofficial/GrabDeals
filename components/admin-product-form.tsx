"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RichTextEditor } from "@/components/rich-text-editor"
import { toast } from "@/hooks/use-toast"
import { ArrowLeft, Upload, Loader2, X, ImageIcon, Plus, GripVertical, FileText, Video, Link as LinkIcon, File } from "lucide-react"
import { fetchCategories } from "@/lib/d1-client"
import { DigitalAsset } from "@/lib/types"

interface ProductFormProps {
    mode: "create" | "edit"
    productId?: string
}

const EMPTY = {
    title: "", description: "", price: "", originalPrice: "", category: "",
    tags: "", downloadUrl: "", isActive: true, images: [] as string[],
}

export function AdminProductForm({ mode, productId }: ProductFormProps) {
    const router = useRouter()
    const fileRef = useRef<HTMLInputElement>(null)
    const [form, setForm] = useState(EMPTY)
    const [categories, setCategories] = useState<any[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [imageStorageProvider, setImageStorageProvider] = useState<"vercel" | "tdrive">("vercel")
    const [digitalStorageProvider, setDigitalStorageProvider] = useState<"vercel" | "tdrive" | "external">("tdrive")
    const [digitalAssetType, setDigitalAssetType] = useState<DigitalAsset["type"]>("file")
    const [digitalAssetName, setDigitalAssetName] = useState("")
    const [digitalUploading, setDigitalUploading] = useState(false)
    const [digitalAssets, setDigitalAssets] = useState<DigitalAsset[]>([])
    const [loading, setLoading] = useState(mode === "edit")
    const digitalFileRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetchCategories().then((cats: any) => setCategories(Array.isArray(cats) ? cats : []))
    }, [])

    useEffect(() => {
        if (mode !== "edit" || !productId) return
        fetch(`/api/products/${productId}`)
            .then(r => r.json())
            .then(p => {
                let parsedAssets: DigitalAsset[] = []
                if (p.downloadUrl) {
                    try { parsedAssets = JSON.parse(p.downloadUrl) }
                    catch { parsedAssets = [{ id: crypto.randomUUID(), name: "Legacy Download", type: "file", provider: "external", url: p.downloadUrl }] }
                }

                setForm({
                    title: p.title || "",
                    description: p.description || "",
                    price: p.price?.toString() || "",
                    originalPrice: p.originalPrice?.toString() || "",
                    category: p.category || "",
                    tags: Array.isArray(p.tags) ? p.tags.join(", ") : "",
                    downloadUrl: p.downloadUrl || "",
                    isActive: p.isActive !== false,
                    images: Array.isArray(p.images) ? p.images : (p.imageUrl ? [p.imageUrl] : []),
                })
                setDigitalAssets(parsedAssets)
                setLoading(false)
            })
    }, [mode, productId])

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return
        setUploading(true)
        const uploaded: string[] = []
        for (const file of Array.from(files)) {
            try {
                const fd = new FormData(); fd.append("file", file)
                const endpoint = imageStorageProvider === "vercel" ? "/api/upload" : "/api/upload-tdrive"
                const res = await fetch(endpoint, { method: "POST", body: fd })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || "Upload failed")
                const imageUrl = imageStorageProvider === "vercel" ? data.url : data.preview_url
                uploaded.push(imageUrl)
            } catch (err: any) {
                toast({ title: `Upload failed: ${file.name}`, description: err.message, variant: "destructive" })
            }
        }
        setForm(f => ({ ...f, images: [...f.images, ...uploaded] }))
        setUploading(false)
        toast({ title: `✅ ${uploaded.length} image(s) uploaded!` })
    }

    const handleDigitalUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return
        if (!digitalAssetName.trim()) {
            toast({ title: "Asset name required", description: "Please enter a name for the digital asset before uploading.", variant: "destructive" })
            return
        }
        setDigitalUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", files[0])
            const endpoint = digitalStorageProvider === "vercel" ? "/api/upload" : "/api/upload-tdrive"
            const res = await fetch(endpoint, { method: "POST", body: formData })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Upload failed")

            const downloadUrl = digitalStorageProvider === "vercel" ? data.url : data.download_url

            const newAsset: DigitalAsset = {
                id: crypto.randomUUID(),
                name: digitalAssetName.trim(),
                type: digitalAssetType,
                provider: digitalStorageProvider as any,
                url: downloadUrl
            }

            setDigitalAssets(prev => [...prev, newAsset])
            setDigitalAssetName("")
            if (digitalFileRef.current) digitalFileRef.current.value = ""
            toast({ title: `✅ ${digitalAssetType.toUpperCase()} asset added via ${digitalStorageProvider === "tdrive" ? "T-Drive" : "Vercel"}!` })
        } catch (err: any) {
            toast({ title: "Upload failed", description: err.message, variant: "destructive" })
        } finally {
            setDigitalUploading(false)
        }
    }

    const addExternalDigitalLink = () => {
        if (!digitalAssetName.trim() || !form.downloadUrl.trim()) return
        const newAsset: DigitalAsset = {
            id: crypto.randomUUID(),
            name: digitalAssetName.trim(),
            type: digitalAssetType,
            provider: "external",
            url: form.downloadUrl.trim()
        }
        setDigitalAssets(prev => [...prev, newAsset])
        setDigitalAssetName("")
        setForm(f => ({ ...f, downloadUrl: "" }))
        toast({ title: "✅ External asset link added!" })
    }

    const removeDigitalAsset = (id: string) => {
        setDigitalAssets(prev => prev.filter(a => a.id !== id))
    }

    const removeImage = (idx: number) => setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return }
        if (!form.price || isNaN(Number(form.price))) { toast({ title: "Valid price required", variant: "destructive" }); return }

        setSubmitting(true)
        try {
            const body = {
                title: form.title.trim(),
                description: form.description,
                price: Number(form.price),
                originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
                category: form.category || "general",
                tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
                images: form.images,
                imageUrl: form.images[0] || "",
                downloadUrl: JSON.stringify(digitalAssets), // Store assets as JSON
                isActive: form.isActive,
                pageType: "shop",
            }
            const url = mode === "edit" ? `/api/products/${productId}` : "/api/products"
            const method = mode === "edit" ? "PUT" : "POST"
            const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast({ title: mode === "edit" ? "✅ Product updated!" : "✅ Product created!" })
            router.push("/admin/products")
        } catch (err: any) {
            toast({ title: "Failed", description: err.message, variant: "destructive" })
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Page Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/admin/products"><ArrowLeft className="h-5 w-5" /></Link>
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold">{mode === "edit" ? "Edit Product" : "Add New Product"}</h1>
                            <p className="text-xs text-gray-400">{mode === "edit" ? "Update product details" : "Fill in details to create a new product"}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" asChild><Link href="/admin/products">Cancel</Link></Button>
                        <Button type="submit" form="product-form" disabled={submitting || uploading || digitalUploading}>
                            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : mode === "edit" ? "Save Changes" : "Create Product"}
                        </Button>
                    </div>
                </div>
            </div>

            <form id="product-form" onSubmit={handleSubmit} className="container mx-auto px-6 py-6">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left: Main Info */}
                    <div className="lg:col-span-2 space-y-5">

                        {/* Basic Info Card */}
                        <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
                            <h2 className="font-semibold text-gray-800 border-b pb-2">Product Information</h2>
                            <div>
                                <Label>Product Title *</Label>
                                <Input
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="e.g. Samsung Galaxy S24 Ultra 256GB"
                                    className="mt-1 text-base"
                                    required
                                />
                                {form.title && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        URL: <span className="text-primary">/products/{form.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-')}-xxxxxx</span>
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Selling Price (₹) *</Label>
                                    <Input type="number" min="0" step="0.01" value={form.price}
                                        onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                                        placeholder="999" className="mt-1" required />
                                </div>
                                <div>
                                    <Label>Original Price (₹) <span className="text-gray-400 text-xs">for strikethrough</span></Label>
                                    <Input type="number" min="0" step="0.01" value={form.originalPrice}
                                        onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))}
                                        placeholder="1499" className="mt-1" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Category *</Label>
                                    <select
                                        value={form.category}
                                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                        className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="">-- Select Category --</option>
                                        {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                                        <option value="general">General</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>Tags <span className="text-gray-400 text-xs">comma separated</span></Label>
                                    <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                                        placeholder="electronics, gadget, phone" className="mt-1" />
                                </div>
                            </div>
                            {/* Digital Assets Section */}
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                                <div>
                                    <h3 className="font-semibold text-sm">Digital Assets ({digitalAssets.length})</h3>
                                    <p className="text-xs text-gray-400">Add PDFs, Videos, or Files to this product. They will be securely provided to buyers.</p>
                                </div>

                                {digitalAssets.length > 0 && (
                                    <div className="space-y-2">
                                        {digitalAssets.map(asset => (
                                            <div key={asset.id} className="flex items-center justify-between p-2 bg-white border rounded">
                                                <div className="flex items-center gap-2">
                                                    {asset.type === 'pdf' ? <FileText className="h-4 w-4 text-red-500" /> :
                                                        asset.type === 'video' ? <Video className="h-4 w-4 text-blue-500" /> :
                                                            asset.type === 'link' ? <LinkIcon className="h-4 w-4 text-green-500" /> :
                                                                <File className="h-4 w-4 text-gray-500" />}
                                                    <span className="text-sm font-medium">{asset.name}</span>
                                                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 uppercase">{asset.provider}</span>
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => removeDigitalAsset(asset.id)}>
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-3">
                                    <div className="grid grid-cols-2 gap-3 mt-1.5">
                                        <div>
                                            <Label className="text-xs">Asset Name *</Label>
                                            <Input value={digitalAssetName} onChange={e => setDigitalAssetName(e.target.value)} placeholder="e.g. Chapter 1 Video" className="h-8 text-xs mt-1" />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Asset Type</Label>
                                            <select
                                                value={digitalAssetType}
                                                onChange={e => setDigitalAssetType(e.target.value as any)}
                                                className="w-full h-8 mt-1 border border-gray-200 rounded-md px-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                                            >
                                                <option value="file">Generic File</option>
                                                <option value="pdf">PDF Document</option>
                                                <option value="video">Video</option>
                                                <option value="link">External Link</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="flex justify-between items-center text-xs mb-1">
                                            <span>Upload / Link Source</span>
                                            <select
                                                value={digitalStorageProvider}
                                                onChange={e => setDigitalStorageProvider(e.target.value as any)}
                                                className="border border-gray-200 rounded-md px-2 py-0.5 text-[10px] bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                                            >
                                                <option value="tdrive">T-Drive API (Secure)</option>
                                                <option value="vercel">Vercel Blob</option>
                                                <option value="external">Enter External URL</option>
                                            </select>
                                        </Label>

                                        {digitalStorageProvider === 'external' ? (
                                            <div className="flex gap-2">
                                                <Input value={form.downloadUrl} onChange={e => setForm(f => ({ ...f, downloadUrl: e.target.value }))}
                                                    placeholder="https://..." type="url" className="flex-1 h-8 text-xs" />
                                                <Button type="button" size="sm" className="h-8 text-xs" onClick={addExternalDigitalLink} disabled={!digitalAssetName || !form.downloadUrl}>
                                                    Add Link
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <Button type="button" variant="outline" className="w-full text-xs h-8" onClick={() => {
                                                    if (!digitalAssetName.trim()) {
                                                        toast({ title: "Name required", description: "Enter a name first", variant: "destructive" })
                                                    } else {
                                                        digitalFileRef.current?.click()
                                                    }
                                                }} disabled={digitalUploading}>
                                                    {digitalUploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                                                    {digitalUploading ? "Uploading..." : `Upload to ${digitalStorageProvider === 'tdrive' ? 'T-Drive' : 'Vercel'}`}
                                                </Button>
                                                <input ref={digitalFileRef} type="file" className="hidden" onChange={e => handleDigitalUpload(e.target.files)} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description Card */}
                        <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-3">
                            <h2 className="font-semibold text-gray-800 border-b pb-2">Product Description</h2>
                            <p className="text-xs text-gray-400">Use the toolbar to format: bold, lists, colors, highlights. This shows on the product page.</p>
                            <RichTextEditor
                                value={form.description}
                                onChange={val => setForm(f => ({ ...f, description: val }))}
                                placeholder="Write a detailed, formatted product description..."
                                minHeight={280}
                            />
                        </div>
                    </div>

                    {/* Right: Images + Status */}
                    <div className="space-y-5">
                        {/* Images Card */}
                        <div className="bg-white rounded-2xl p-5 border shadow-sm space-y-4">
                            <h2 className="font-semibold text-gray-800 border-b pb-2">Product Images</h2>
                            <p className="text-xs text-gray-400">First image = main image. Hover on product card will cycle through all images.</p>

                            {/* Image Grid */}
                            <div className="grid grid-cols-2 gap-2">
                                {form.images.map((url, i) => (
                                    <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square bg-gray-50">
                                        <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-contain p-1" />
                                        {i === 0 && (
                                            <div className="absolute top-1 left-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Main</div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeImage(i)}
                                            className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                {form.images.length === 0 && (
                                    <div className="col-span-2 h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400">
                                        <ImageIcon className="h-8 w-8" />
                                        <p className="text-xs">No images yet</p>
                                    </div>
                                )}
                            </div>

                            {/* URL input */}
                            <div>
                                <Label className="text-xs">Add image by URL</Label>
                                <div className="flex gap-2 mt-1">
                                    <Input
                                        placeholder="https://..."
                                        id="img-url-input"
                                        className="text-xs"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault()
                                                const val = (e.target as HTMLInputElement).value.trim()
                                                if (val) { setForm(f => ({ ...f, images: [...f.images, val] })); (e.target as HTMLInputElement).value = "" }
                                            }
                                        }}
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={() => {
                                        const inp = document.getElementById("img-url-input") as HTMLInputElement
                                        if (inp?.value.trim()) { setForm(f => ({ ...f, images: [...f.images, inp.value.trim()] })); inp.value = "" }
                                    }}>
                                        <Plus className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>

                            {/* File Upload */}
                            <div>
                                <div className="flex gap-2 items-center justify-between mb-2">
                                    <Label className="text-xs">Storage Provider:</Label>
                                    <select
                                        value={imageStorageProvider}
                                        onChange={e => setImageStorageProvider(e.target.value as any)}
                                        className="border border-gray-200 rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="vercel">Vercel Blob</option>
                                        <option value="tdrive">T-Drive API</option>
                                    </select>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => fileRef.current?.click()}
                                    disabled={uploading}
                                >
                                    {uploading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Uploading...</> : <><Upload className="h-4 w-4 mr-2" />Upload Images</>}
                                </Button>
                                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                                    onChange={e => handleUpload(e.target.files)} />
                                <p className="text-[10px] text-gray-400 mt-1 text-center">Select multiple images at once</p>
                            </div>
                        </div>

                        {/* Status Card */}
                        <div className="bg-white rounded-2xl p-5 border shadow-sm space-y-3">
                            <h2 className="font-semibold text-gray-800 border-b pb-2">Product Status</h2>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Active</p>
                                    <p className="text-xs text-gray-400">Visible in store when active</p>
                                </div>
                                <Switch
                                    checked={form.isActive}
                                    onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))}
                                />
                            </div>
                            <div className={`text-xs font-semibold px-3 py-1.5 rounded-full text-center ${form.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                {form.isActive ? "🟢 Published" : "⚫ Draft"}
                            </div>
                        </div>


                    </div>
                </div>
            </form>
        </div>
    )
}
