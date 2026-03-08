"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { fetchProducts, createD1Product, updateD1Product, deleteD1Product, fetchCategories } from "@/lib/d1-client"
import { Plus, Search, Trash2, Edit, Loader2, Upload, ImageIcon } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Product } from "@/lib/types"
import Image from "next/image"

const EMPTY_FORM = {
  title: "",
  description: "",
  price: "",
  originalPrice: "",
  category: "",
  imageUrl: "",
  downloadUrl: "",
  tags: "",
  isActive: true,
}

type FormData = typeof EMPTY_FORM & { isActive: boolean }

function ProductForm({
  initial,
  categories,
  onSubmit,
  submitting,
  mode,
}: {
  initial: FormData
  categories: any[]
  onSubmit: (data: FormData) => void
  submitting: boolean
  mode: "create" | "edit"
}) {
  const [form, setForm] = useState<FormData>(initial)
  const [uploading, setUploading] = useState(false)
  const [digitalUploading, setDigitalUploading] = useState(false)
  const [storageProvider, setStorageProvider] = useState<"vercel" | "tdrive">("vercel")
  const [preview, setPreview] = useState(initial.imageUrl || "")
  const fileRef = useRef<HTMLInputElement>(null)
  const digitalFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setForm(initial); setPreview(initial.imageUrl || "") }, [initial])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const endpoint = storageProvider === "vercel" ? "/api/upload" : "/api/upload-tdrive"
      const res = await fetch(endpoint, { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")

      const imageUrl = storageProvider === "vercel" ? data.url : data.preview_url

      setForm({ ...form, imageUrl: imageUrl })
      setPreview(imageUrl)
      toast({ title: "✅ Image uploaded!" })
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  const handleDigitalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setDigitalUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload-tdrive", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")

      setForm({ ...form, downloadUrl: data.download_url })
      toast({ title: "✅ Digital file uploaded to T-Drive!" })
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" })
    } finally {
      setDigitalUploading(false)
    }
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form) }}
      className="space-y-4 max-h-[70vh] overflow-y-auto pr-1"
    >
      {/* Image Upload */}
      <div>
        <Label>Product Image</Label>
        <div className="mt-1 border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center gap-3">
          {preview ? (
            <div className="relative w-32 h-32">
              <Image src={preview} alt="preview" fill className="object-contain rounded-lg" />
            </div>
          ) : (
            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <ImageIcon className="h-10 w-10 text-gray-300" />
            </div>
          )}
          <div className="flex gap-2 items-center">
            <Select value={storageProvider} onValueChange={(v: "vercel" | "tdrive") => setStorageProvider(v)}>
              <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="vercel">Vercel Blob</SelectItem>
                <SelectItem value="tdrive">T-Drive API</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
              {uploading ? "Uploading..." : "Upload Image"}
            </Button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <Input
            className="text-xs"
            placeholder="Or paste image URL..."
            value={form.imageUrl}
            onChange={(e) => { setForm({ ...form, imageUrl: e.target.value }); setPreview(e.target.value) }}
          />
        </div>
      </div>

      <div>
        <Label>Title *</Label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Price (₹) *</Label>
          <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
        </div>
        <div>
          <Label>Original Price (₹)</Label>
          <Input type="number" min="0" step="0.01" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} placeholder="For discount display" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Category *</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
              ))}
              <SelectItem value="software">Software</SelectItem>
              <SelectItem value="template">Template</SelectItem>
              <SelectItem value="course">Course</SelectItem>
              <SelectItem value="ebook">E-Book</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tags (comma separated)</Label>
          <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="e.g. popular, new, sale" />
        </div>
      </div>

      <div>
        <Label>Download URL <span className="text-gray-400 text-xs">(Digital Product)</span></Label>
        <div className="flex gap-2 mt-1">
          <Input value={form.downloadUrl} onChange={(e) => setForm({ ...form, downloadUrl: e.target.value })} placeholder="https://..." className="flex-1" />
          <Button type="button" variant="outline" onClick={() => digitalFileRef.current?.click()} disabled={digitalUploading}>
            {digitalUploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
            {digitalUploading ? "Uploading..." : "Upload File"}
          </Button>
          <input ref={digitalFileRef} type="file" className="hidden" onChange={handleDigitalUpload} />
        </div>
        <p className="text-xs text-gray-400 mt-1">Upload files to T-Drive to automatically generate a secure download link.</p>
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} id="isActive" />
        <Label htmlFor="isActive">Active (visible in store)</Label>
      </div>

      <Button type="submit" className="w-full" disabled={submitting || uploading || digitalUploading}>
        {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : mode === "create" ? "Create Product" : "Save Changes"}
      </Button>
    </form>
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [prods, cats] = await Promise.all([fetchProducts(), fetchCategories()])
      setProducts(prods)
      setCategories(cats)
    } catch {
      toast({ title: "Error loading data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleCreate = async (form: FormData) => {
    setSubmitting(true)
    try {
      await createD1Product({
        ...form,
        price: parseFloat(form.price),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
        tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
        isActive: form.isActive,
      })
      toast({ title: "✅ Product created!" })
      setIsCreateOpen(false)
      loadData()
    } catch (err: any) {
      toast({ title: "Failed to create product", description: err.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (form: FormData) => {
    if (!editProduct) return
    setSubmitting(true)
    try {
      await updateD1Product(editProduct.id, {
        ...form,
        price: parseFloat(form.price),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
        tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
        isActive: form.isActive,
      })
      toast({ title: "✅ Product updated!" })
      setEditProduct(null)
      loadData()
    } catch (err: any) {
      toast({ title: "Failed to update product", description: err.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return
    try {
      await deleteD1Product(id)
      toast({ title: "Product deleted" })
      loadData()
    } catch {
      toast({ title: "Failed to delete product", variant: "destructive" })
    }
  }

  const filtered = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const editFormInitial = editProduct
    ? {
      title: editProduct.title,
      description: editProduct.description || "",
      price: String(editProduct.price),
      originalPrice: (editProduct as any).originalPrice ? String((editProduct as any).originalPrice) : "",
      category: editProduct.category,
      imageUrl: editProduct.imageUrl || "",
      downloadUrl: editProduct.downloadUrl || "",
      tags: Array.isArray(editProduct.tags) ? editProduct.tags.join(", ") : "",
      isActive: editProduct.isActive,
    }
    : EMPTY_FORM as FormData

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">{products.length} total products</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new"><Plus className="mr-2 h-4 w-4" />Add Product</Link>
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editProduct} onOpenChange={(open) => { if (!open) setEditProduct(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Product</DialogTitle></DialogHeader>
          <ProductForm
            initial={editFormInitial}
            categories={categories}
            onSubmit={handleUpdate}
            submitting={submitting}
            mode="edit"
          />
        </DialogContent>
      </Dialog>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-md border max-w-sm">
        <Search className="h-4 w-4 text-gray-500" />
        <Input
          className="border-0 focus-visible:ring-0 h-8"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-gray-500">No products found</TableCell></TableRow>
            ) : (
              filtered.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="relative h-10 w-10 rounded overflow-hidden bg-gray-50">
                      <Image
                        src={product.imageUrl || "/placeholder.svg"}
                        alt={product.title}
                        fill
                        className="object-contain"
                        sizes="40px"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium max-w-xs">
                    <span className="line-clamp-2">{product.title}</span>
                  </TableCell>
                  <TableCell className="capitalize">{product.category}</TableCell>
                  <TableCell>₹{product.price.toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${product.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {product.isActive ? "Active" : "Hidden"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Edit className="h-4 w-4 text-blue-500" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>

                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}