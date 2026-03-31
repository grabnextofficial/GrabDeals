"use client"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LandingSection, LandingSectionType } from "@/lib/types"
import {
    Plus, Trash2, ChevronUp, ChevronDown, Layout, Star,
    MessageSquare, HelpCircle, Zap, AlignCenter, Image as ImageIcon, Type,
    Bot, Loader2, Undo, Redo, Sparkles, FormInput, Wand2, ArrowLeft, GripVertical,
    Monitor, Tablet, Smartphone, PanelLeftClose, PanelLeftOpen, Bold, Italic, Type as TypeIcon, Link as LinkIcon
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { RenderSection } from "@/app/products/[id]/landing-page-view"

const SECTION_LABELS: Record<LandingSectionType, { label: string; icon: any; desc: string }> = {
    hero: { label: "Hero Banner", icon: Layout, desc: "Big headline + CTA button" },
    features: { label: "Features", icon: Zap, desc: "Feature highlight grid" },
    text: { label: "Text Block", icon: Type, desc: "Rich text / HTML content" },
    "image-text": { label: "Image + Text", icon: ImageIcon, desc: "Side-by-side layout" },
    testimonials: { label: "Testimonials", icon: MessageSquare, desc: "Customer reviews" },
    faq: { label: "FAQ", icon: HelpCircle, desc: "Accordion questions" },
    cta: { label: "CTA Banner", icon: AlignCenter, desc: "Call-to-action strip" },
    form: { label: "Lead Form", icon: FormInput, desc: "Capture visitor info" },
}

const ANIMATIONS = [
    { id: "none", label: "None" },
    { id: "fadeIn", label: "Fade In" },
    { id: "slideLeft", label: "Slide Left" },
    { id: "slideRight", label: "Slide Right" },
    { id: "zoomIn", label: "Zoom In" },
]

// ─── Reusable Image Upload Input ─────────────────────────────────────────────
function ImageUploadInput({ value, onChange, placeholder = "https://..." }: { value: string; onChange: (url: string) => void; placeholder?: string }) {
    const [uploading, setUploading] = useState(false)
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        const fd = new FormData()
        fd.append('file', file)
        try {
            const res = await fetch('/api/upload-tdrive', { method: 'POST', body: fd })
            const data = await res.json()
            if (res.ok && data.url) {
                onChange(data.url)
                toast({ title: "Image uploaded!" })
            } else {
                throw new Error(data.error || "Upload failed")
            }
        } catch (err: any) {
            toast({ title: "Upload Failed", description: err.message, variant: "destructive" })
        } finally {
            setUploading(false)
        }
    }
    return (
        <div className="flex gap-2 mt-1">
            <Input value={value} onChange={e => onChange(e.target.value)} className="h-8 text-xs flex-1" placeholder={placeholder} />
            <label className="relative cursor-pointer h-8 px-3 rounded text-xs font-semibold flex items-center bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors whitespace-nowrap">
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Upload"}
                <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
            </label>
        </div>
    )
}

// ─── Simple Rich Text Formatting Toolbar ────────────────────────────────────
function RichTextarea({ value, onChange, placeholder }: { value: string, onChange: (v: string) => void, placeholder?: string }) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const insertFormat = (prefix: string, suffix: string) => {
        const txt = textareaRef.current
        if (!txt) return
        const start = txt.selectionStart
        const end = txt.selectionEnd
        const sel = value.substring(start, end)
        if (!sel) return // Require selection
        const before = value.substring(0, start)
        const after = value.substring(end)
        onChange(`${before}${prefix}${sel}${suffix}${after}`)
        setTimeout(() => { txt.focus(); txt.setSelectionRange(start + prefix.length, end + prefix.length) }, 10)
    }

    return (
        <div className="border border-gray-200 rounded-md overflow-hidden bg-white mt-1">
            <div className="flex bg-gray-50 border-b border-gray-100 p-1 gap-1">
                <button type="button" onClick={() => insertFormat('<b>', '</b>')} className="p-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded" title="Bold"><Bold className="h-3 w-3" /></button>
                <button type="button" onClick={() => insertFormat('<i>', '</i>')} className="p-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded" title="Italic"><Italic className="h-3 w-3" /></button>
                <button type="button" onClick={() => insertFormat('<a href="#" className="underline text-indigo-500">', '</a>')} className="p-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded" title="Link"><LinkIcon className="h-3 w-3" /></button>
                <div className="w-px bg-gray-300 mx-1 my-1"></div>
                <button type="button" onClick={() => insertFormat('<span className="text-xl font-bold">', '</span>')} className="p-1.5 text-gray-600 hover:bg-bg-gray-200 hover:text-gray-900 rounded text-[10px] font-bold" title="Larger Text">H</button>
                <button type="button" onClick={() => insertFormat('<span className="bg-yellow-200 text-yellow-900 px-1 rounded">', '</span>')} className="p-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded text-[10px] font-bold bg-yellow-100" title="Highlight">HL</button>
            </div>
            <Textarea ref={textareaRef} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="border-0 rounded-none shadow-none focus-visible:ring-0 min-h-[120px] text-xs resize-y" />
        </div>
    )
}

// ─── Section Editor (Active State) ──────────────────────────────────────────
function ActiveSectionEditor({ section, onChange, onAIFill, aiLoading }: {
    section: LandingSection
    onChange: (s: LandingSection) => void
    onAIFill: (sectionId: string, type: LandingSectionType) => void
    aiLoading: string | null
}) {
    const meta = SECTION_LABELS[section.type]
    const update = (patch: Partial<LandingSection>) => onChange({ ...section, ...patch })
    const isLoadingThis = aiLoading === section.id

    return (
        <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex justify-between items-center">
                <div className="flex items-center gap-2 text-indigo-700">
                    <meta.icon className="h-4 w-4" />
                    <span className="font-semibold text-sm">{meta.label} Settings</span>
                </div>
                <button type="button" onClick={() => onAIFill(section.id, section.type)}
                    disabled={!!aiLoading}
                    className="h-7 px-3 text-xs font-bold rounded flex items-center gap-1 bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-600 hover:to-indigo-600 disabled:opacity-50 transition-all shadow-sm">
                    {isLoadingThis ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    AI Fill
                </button>
            </div>

            {/* Common style controls */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <Label className="text-xs">Text Align</Label>
                    <select value={section.align || 'center'} onChange={e => update({ align: e.target.value as any })}
                        className="mt-1 w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs bg-white">
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                    </select>
                </div>
                <div>
                    <Label className="text-xs">Animation</Label>
                    <select value={(section as any).animation || 'none'} onChange={e => update({ animation: e.target.value as any } as any)}
                        className="mt-1 w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs bg-white">
                        {ANIMATIONS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                    </select>
                </div>
                <div>
                    <Label className="text-xs">Margin Top</Label>
                    <select value={section.marginTop || '0px'} onChange={e => update({ marginTop: e.target.value })}
                        className="mt-1 w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs bg-white">
                        <option value="0px">None</option>
                        <option value="1rem">Small</option>
                        <option value="2rem">Medium</option>
                        <option value="4rem">Large</option>
                        <option value="-2rem">Negative (Pull Up)</option>
                    </select>
                </div>
                <div>
                    <Label className="text-xs">Margin Bottom</Label>
                    <select value={section.marginBottom || '0px'} onChange={e => update({ marginBottom: e.target.value })}
                        className="mt-1 w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs bg-white">
                        <option value="0px">None</option>
                        <option value="1rem">Small</option>
                        <option value="2rem">Medium</option>
                        <option value="4rem">Large</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                    <Label className="text-xs">Inner Padding (Y-axis)</Label>
                    <select value={section.paddingY || 'md'} onChange={e => update({ paddingY: e.target.value as any })}
                        className="mt-1 w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs bg-white">
                        <option value="sm">Small Padding</option>
                        <option value="md">Medium Padding</option>
                        <option value="lg">Large Padding</option>
                    </select>
                </div>
                <div>
                    <Label className="text-xs">Background Color</Label>
                    <div className="flex gap-1 mt-1">
                        <input type="color" value={section.bgColor || '#ffffff'} onChange={e => update({ bgColor: e.target.value })}
                            className="h-7 w-8 rounded border border-gray-200 cursor-pointer p-0.5 bg-white" />
                        <Input value={section.bgColor || '#ffffff'} onChange={e => update({ bgColor: e.target.value })} className="h-7 text-xs flex-1" />
                    </div>
                </div>
                <div>
                    <Label className="text-xs">Text Color</Label>
                    <div className="flex gap-1 mt-1">
                        <input type="color" value={section.textColor || '#1a1a2e'} onChange={e => update({ textColor: e.target.value })}
                            className="h-7 w-8 rounded border border-gray-200 cursor-pointer p-0.5 bg-white" />
                        <Input value={section.textColor || '#1a1a2e'} onChange={e => update({ textColor: e.target.value })} className="h-7 text-xs flex-1" />
                    </div>
                </div>
            </div>

            <hr className="border-gray-100" />

            {/* Hero */}
            {section.type === 'hero' && (
                <div className="space-y-3">
                    <div><Label className="text-xs">Heading *</Label>
                        <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Your Amazing Product" /></div>
                    <div><Label className="text-xs">Subheading</Label>
                        <Textarea value={section.subheading || ''} onChange={e => update({ subheading: e.target.value })} className="mt-1 text-xs min-h-[60px]" placeholder="Limited time offer..." /></div>
                    <div><Label className="text-xs">Button Text</Label>
                        <Input value={section.buttonText || ''} onChange={e => update({ buttonText: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Buy Now" /></div>
                    <div>
                        <Label className="text-xs">Hero Image</Label>
                        <ImageUploadInput value={section.imageUrl || ''} onChange={v => update({ imageUrl: v })} />
                    </div>
                </div>
            )}

            {/* Features */}
            {section.type === 'features' && (
                <div className="space-y-3">
                    <div><Label className="text-xs">Section Heading</Label>
                        <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Why Choose Us?" /></div>
                    <div><Label className="text-xs">Subheading</Label>
                        <Input value={section.subheading || ''} onChange={e => update({ subheading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Everything you need..." /></div>
                    <div className="space-y-2 mt-4 border-t border-gray-100 pt-3">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Features Items (max 6)</Label>
                        {(section.features || []).map((f, i) => (
                            <div key={i} className="p-2 border border-gray-100 rounded-lg bg-gray-50/50 space-y-2 relative">
                                <button type="button" onClick={() => update({ features: (section.features || []).filter((_, j) => j !== i) })} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                                <div className="grid grid-cols-4 gap-2 pr-6">
                                    <Input value={f.icon || ''} onChange={e => { const u = [...(section.features || [])]; u[i] = { ...u[i], icon: e.target.value }; update({ features: u }) }} className="h-7 text-xs" placeholder="🚀" title="Emoji Icon" />
                                    <Input value={f.title} onChange={e => { const u = [...(section.features || [])]; u[i] = { ...u[i], title: e.target.value }; update({ features: u }) }} className="h-7 text-xs col-span-3 font-semibold" placeholder="Feature Title" />
                                </div>
                                <Textarea value={f.description} onChange={e => { const u = [...(section.features || [])]; u[i] = { ...u[i], description: e.target.value }; update({ features: u }) }} className="text-xs min-h-[50px] bg-white" placeholder="Brief description..." />
                            </div>
                        ))}
                        {(section.features || []).length < 6 && (
                            <Button type="button" variant="outline" size="sm" className="w-full h-8 text-xs border-dashed text-indigo-600 bg-indigo-50/20 hover:bg-indigo-50"
                                onClick={() => update({ features: [...(section.features || []), { icon: '✨', title: '', description: '' }] })}>
                                <Plus className="h-3 w-3 mr-1" /> Add Feature
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Text Block */}
            {section.type === 'text' && (
                <div className="space-y-3">
                    <div><Label className="text-xs">Heading</Label>
                        <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs font-bold" placeholder="Section Title" /></div>
                    <div>
                        <Label className="text-xs">Content (Live Format Allowed)</Label>
                        <RichTextarea value={section.content || ''} onChange={v => update({ content: v })} placeholder="Your content here..." />
                    </div>
                </div>
            )}

            {/* Image + Text */}
            {section.type === 'image-text' && (
                <div className="space-y-3">
                    <div><Label className="text-xs">Heading</Label>
                        <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs font-bold" /></div>
                    <div>
                        <Label className="text-xs">Image Displayed</Label>
                        <ImageUploadInput value={section.imageUrl || ''} onChange={v => update({ imageUrl: v })} />
                    </div>
                    <div>
                        <Label className="text-xs">Rich Content</Label>
                        <RichTextarea value={section.content || ''} onChange={v => update({ content: v })} />
                    </div>
                </div>
            )}

            {/* Testimonials */}
            {section.type === 'testimonials' && (
                <div className="space-y-3">
                    <div><Label className="text-xs">Section Heading</Label>
                        <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs font-bold" placeholder="What Our Customers Say" /></div>
                    <div className="space-y-2 mt-4 border-t border-gray-100 pt-3">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Customer Reviews</Label>
                        {(section.testimonials || []).map((t, i) => (
                            <div key={i} className="p-2 border border-gray-100 rounded-lg bg-gray-50/50 space-y-2 relative">
                                <button type="button" onClick={() => update({ testimonials: (section.testimonials || []).filter((_, j) => j !== i) })} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                                <div className="grid grid-cols-4 gap-2 pr-6">
                                    <Input value={t.name} onChange={e => { const u = [...(section.testimonials || [])]; u[i] = { ...u[i], name: e.target.value }; update({ testimonials: u }) }} className="h-7 text-xs col-span-3 font-semibold" placeholder="Customer Name" />
                                    <select value={t.rating || 5} onChange={e => { const u = [...(section.testimonials || [])]; u[i] = { ...u[i], rating: Number(e.target.value) }; update({ testimonials: u }) }} className="h-7 text-xs border rounded bg-white text-yellow-600 font-bold">
                                        {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r}★</option>)}
                                    </select>
                                </div>
                                <Textarea value={t.text} onChange={e => { const u = [...(section.testimonials || [])]; u[i] = { ...u[i], text: e.target.value }; update({ testimonials: u }) }} className="text-xs min-h-[60px] bg-white italic" placeholder="Review text..." />
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" className="w-full h-8 text-xs border-dashed text-indigo-600 bg-indigo-50/20 hover:bg-indigo-50"
                            onClick={() => update({ testimonials: [...(section.testimonials || []), { name: '', text: '', rating: 5 }] })}>
                            <Plus className="h-3 w-3 mr-1" /> Add Review
                        </Button>
                    </div>
                </div>
            )}

            {/* FAQ */}
            {section.type === 'faq' && (
                <div className="space-y-3">
                    <div><Label className="text-xs">Section Heading</Label>
                        <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs font-bold" placeholder="Frequently Asked Questions" /></div>
                    <div className="space-y-2 mt-4 border-t border-gray-100 pt-3">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Q&A Pairs</Label>
                        {(section.faqs || []).map((f, i) => (
                            <div key={i} className="p-2 border border-gray-100 rounded-lg bg-gray-50/50 space-y-2 relative">
                                <button type="button" onClick={() => update({ faqs: (section.faqs || []).filter((_, j) => j !== i) })} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                                <Input value={f.question} onChange={e => { const u = [...(section.faqs || [])]; u[i] = { ...u[i], question: e.target.value }; update({ faqs: u }) }} className="h-7 text-xs pr-6 font-semibold" placeholder="Question" />
                                <Textarea value={f.answer} onChange={e => { const u = [...(section.faqs || [])]; u[i] = { ...u[i], answer: e.target.value }; update({ faqs: u }) }} className="text-xs min-h-[50px] bg-white" placeholder="Answer" />
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" className="w-full h-8 text-xs border-dashed text-indigo-600 bg-indigo-50/20 hover:bg-indigo-50"
                            onClick={() => update({ faqs: [...(section.faqs || []), { question: '', answer: '' }] })}>
                            <Plus className="h-3 w-3 mr-1" /> Add FAQ
                        </Button>
                    </div>
                </div>
            )}

            {/* CTA */}
            {section.type === 'cta' && (
                <div className="space-y-3">
                    <div><Label className="text-xs">Heading *</Label>
                        <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs font-bold" placeholder="Ready to Buy?" /></div>
                    <div><Label className="text-xs">Subheading</Label>
                        <Input value={section.subheading || ''} onChange={e => update({ subheading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Don't miss out!" /></div>
                    <div><Label className="text-xs">Button Text</Label>
                        <Input value={section.buttonText || ''} onChange={e => update({ buttonText: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Get It Now" /></div>
                    <div><Label className="text-xs">Button Link</Label>
                        <Input value={section.buttonLink || ''} onChange={e => update({ buttonLink: e.target.value })} className="mt-1 h-8 text-xs" placeholder="#buy or /checkout" /></div>
                </div>
            )}

            {/* Form */}
            {section.type === 'form' && (
                <div className="space-y-3">
                    <div><Label className="text-xs">Form Heading</Label>
                        <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs font-bold" placeholder="Get In Touch" /></div>
                    <div><Label className="text-xs">Submit Button Text</Label>
                        <Input value={(section as any).formButtonText || ''} onChange={e => update({ formButtonText: e.target.value } as any)} className="mt-1 h-8 text-xs" placeholder="Submit" /></div>
                    <div className="space-y-2 mt-4 border-t border-gray-100 pt-3">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Form Fields</Label>
                        {((section as any).formFields || []).map((f: any, i: number) => (
                            <div key={i} className="p-2 border border-blue-100/50 rounded-lg bg-blue-50/30 flex flex-col gap-2 relative">
                                <button type="button" onClick={() => update({ formFields: ((section as any).formFields || []).filter((_: any, j: number) => j !== i) } as any)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                                <div className="grid grid-cols-2 gap-2 pr-6">
                                    <Input value={f.label} onChange={e => { const u = [...((section as any).formFields || [])]; u[i] = { ...u[i], label: e.target.value }; update({ formFields: u } as any) }} className="h-7 text-xs bg-white font-semibold" placeholder="Label (e.g. Email)" />
                                    <select value={f.type} onChange={e => { const u = [...((section as any).formFields || [])]; u[i] = { ...u[i], type: e.target.value }; update({ formFields: u } as any) }} className="h-7 text-xs border rounded px-1 bg-white">
                                        <option value="text">Text (Single Line)</option>
                                        <option value="email">Email</option>
                                        <option value="tel">Phone</option>
                                        <option value="textarea">Textarea (Multi Line)</option>
                                    </select>
                                </div>
                                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer w-max pl-1">
                                    <input type="checkbox" checked={f.required} onChange={e => { const u = [...((section as any).formFields || [])]; u[i] = { ...u[i], required: e.target.checked }; update({ formFields: u } as any) }} className="h-3 w-3 rounded text-indigo-600" />
                                    Make this field Required
                                </label>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" className="w-full h-8 text-xs border-dashed text-blue-600 bg-blue-50/20 hover:bg-blue-50"
                            onClick={() => update({ formFields: [...((section as any).formFields || []), { label: 'New Field', type: 'text', required: false, placeholder: '' }] } as any)}>
                            <Plus className="h-3 w-3 mr-1" /> Add Field
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Main Builder (Elementor Clone) ──────────────────────────────────────────
export function LandingPageBuilder({ sections, onChange, productTitle, productPrice, productDescription, onSave, saving, exitLink, previewLink }: any) {
    // Layout State
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
    
    // UI State
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null)

    // Undo/Redo history
    const historyRef = useRef<LandingSection[][]>([sections])
    const historyIdx = useRef(0)
    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)

    // AI state
    const [aiModalOpen, setAiModalOpen] = useState(false)
    const [aiPrompt, setAiPrompt] = useState("")
    const [aiLoading, setAiLoading] = useState<string | null>(null)

    const fauxProduct: any = {
        title: productTitle || "Product Name",
        price: productPrice || 99,
        originalPrice: productPrice ? productPrice * 1.5 : 149,
        description: productDescription || "A great product."
    }

    const pushHistory = useCallback((next: LandingSection[]) => {
        const history = historyRef.current.slice(0, historyIdx.current + 1)
        history.push(next)
        if (history.length > 25) history.shift()
        historyRef.current = history
        historyIdx.current = history.length - 1
        setCanUndo(historyIdx.current > 0)
        setCanRedo(false)
        onChange(next)
    }, [onChange])

    const undo = () => {
        if (historyIdx.current > 0) {
            historyIdx.current -= 1
            onChange(historyRef.current[historyIdx.current])
            setCanUndo(historyIdx.current > 0)
            setCanRedo(true)
        }
    }

    const redo = () => {
        if (historyIdx.current < historyRef.current.length - 1) {
            historyIdx.current += 1
            onChange(historyRef.current[historyIdx.current])
            setCanUndo(true)
            setCanRedo(historyIdx.current < historyRef.current.length - 1)
        }
    }

    const add = (type: LandingSectionType) => {
        const id = crypto.randomUUID()
        const newSection: LandingSection = { id, type, bgColor: '#ffffff', textColor: '#1a1a2e', align: 'center', paddingY: 'md', animation: 'fadeIn' as any }
        if (type === 'hero') { newSection.heading = 'Stunning Headline Here'; newSection.buttonText = 'Buy Now'; newSection.bgColor = '#1e3a8a'; newSection.textColor = '#ffffff'; }
        if (type === 'features') newSection.features = [{ icon: '✨', title: 'Feature 1', description: 'Desc...' }, { icon: '🚀', title: 'Feature 2', description: 'Desc...' }, { icon: '🛡️', title: 'Feature 3', description: 'Desc...' }]
        if (type === 'testimonials') newSection.testimonials = [{ name: 'John Doe', text: 'Amazing purchase. Highly recommended!', rating: 5 }]
        if (type === 'faq') newSection.faqs = [{ question: 'How do I download?', answer: 'Immediately after purchase.' }]
        if (type === 'cta') { newSection.heading = 'Ready to upgrade?'; newSection.buttonText = 'Get Access'; newSection.bgColor = '#f59e0b'; }
        if (type === 'form') (newSection as any).formFields = [{ label: 'Name', type: 'text', required: true }, { label: 'Email', type: 'email', required: true }]
        
        pushHistory([...sections, newSection])
        setSidebarOpen(true)
        setActiveSectionId(id)
    }

    const update = (id: string, updated: LandingSection) => pushHistory(sections.map((s:any) => s.id === id ? updated : s))
    const remove = (id: string, e?: React.MouseEvent) => { if (e) e.stopPropagation(); if (activeSectionId === id) setActiveSectionId(null); pushHistory(sections.filter((s:any) => s.id !== id)) }
    const moveUp = (idx: number, e?: React.MouseEvent) => { if (e) e.stopPropagation(); if (idx === 0) return; const next = [...sections]; [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]; pushHistory(next) }
    const moveDown = (idx: number, e?: React.MouseEvent) => { if (e) e.stopPropagation(); if (idx === sections.length - 1) return; const next = [...sections]; [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]; pushHistory(next) }

    // Drag Drop state
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
    const handleDragStart = (e: React.DragEvent, idx: number) => { setDraggedIdx(idx); e.dataTransfer.effectAllowed = 'move' }
    const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
    const handleDrop = (e: React.DragEvent, dropIdx: number) => {
        e.preventDefault()
        if (draggedIdx === null || draggedIdx === dropIdx) return
        const next = [...sections]
        const [moved] = next.splice(draggedIdx, 1)
        next.splice(dropIdx, 0, moved)
        pushHistory(next)
        setDraggedIdx(null)
    }

    const handleAIGenerate = async () => {
        if (!aiPrompt.trim() && !productTitle) return toast({ title: "Enter a prompt or product name first", variant: "destructive" })
        setAiLoading("full")
        try {
            const res = await fetch("/api/ai/generate-landing-page", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "full", prompt: aiPrompt, productTitle, productPrice, productDescription }) })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "AI generation failed")
            pushHistory(data.sections)
            setAiModalOpen(false)
            setActiveSectionId(null)
            setAiPrompt("")
            toast({ title: "✅ Landing page generated by AI!" })
        } catch (err: any) { toast({ title: "AI Error", description: err.message, variant: "destructive" }) }
        finally { setAiLoading(null) }
    }

    const handleAIFill = async (sectionId: string, type: LandingSectionType) => {
        setAiLoading(sectionId)
        try {
            const res = await fetch("/api/ai/generate-landing-page", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "section", sectionType: type, productTitle, productPrice, productDescription }) })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "AI fill failed")
            if (data.sections?.[0]) {
                const generated = data.sections[0]
                pushHistory(sections.map((s:any) => s.id === sectionId ? { ...generated, id: sectionId, type, bgColor: s.bgColor, textColor: s.textColor, align: s.align, paddingY: s.paddingY } : s))
                toast({ title: "✅ Section filled by AI!" })
            }
        } catch (err: any) { toast({ title: "AI Error", description: err.message, variant: "destructive" }) }
        finally { setAiLoading(null) }
    }

    const activeSection = sections.find((s:any) => s.id === activeSectionId)
    
    // Desktop: full width. Tablet: 768px. Mobile: 375px. Includes transition.
    const canvasMaxWidth = previewMode === 'desktop' ? 'max-w-none' : previewMode === 'tablet' ? 'max-w-[768px]' : 'max-w-[375px]'

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-100 relative">
            
            {/* ─── BUILDER TOP BAR (Responsive Toggles & Actions) ─── */}
            <div className="h-[52px] bg-white border-b border-gray-200 flex items-center justify-between px-4 z-30 shrink-0 shadow-sm w-full">
                <div className="flex items-center gap-4">
                    {exitLink && (
                        <Button variant="ghost" size="sm" asChild className="h-8 -ml-2 text-gray-500 hover:text-gray-900 font-semibold px-2">
                            <a href={exitLink}><ArrowLeft className="h-4 w-4 mr-1" /> Exit</a>
                        </Button>
                    )}
                    <Button onClick={() => setSidebarOpen(!sidebarOpen)} variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Toggle Sidebar">
                        {sidebarOpen ? <PanelLeftClose className="h-4.5 w-4.5" /> : <PanelLeftOpen className="h-4.5 w-4.5" />}
                    </Button>
                    <div className="h-5 w-px bg-gray-200 hidden md:block" />
                    <div className="hidden md:flex bg-slate-100 p-1 rounded-lg border border-gray-200">
                        <button onClick={() => setPreviewMode('desktop')} className={`p-1.5 rounded-md transition-all ${previewMode === 'desktop' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}><Monitor className="h-4 w-4" /></button>
                        <button onClick={() => setPreviewMode('tablet')} className={`p-1.5 rounded-md transition-all ${previewMode === 'tablet' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}><Tablet className="h-4 w-4" /></button>
                        <button onClick={() => setPreviewMode('mobile')} className={`p-1.5 rounded-md transition-all ${previewMode === 'mobile' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}><Smartphone className="h-4 w-4" /></button>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="flex items-center gap-1 mr-1">
                        <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} className="h-8 w-8 text-gray-500"><Undo className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} className="h-8 w-8 text-gray-500"><Redo className="h-4 w-4" /></Button>
                    </div>
                    
                    <Button size="sm" onClick={() => setAiModalOpen(true)} className="h-8 bg-black text-white hover:bg-gray-800 font-semibold text-xs border-0 px-3 shadow-sm hidden md:flex">
                        <Wand2 className="h-3.5 w-3.5 mr-1.5" /> AI Build
                    </Button>

                    <div className="h-5 w-px bg-gray-200 hidden md:block" />

                    {previewLink && (
                        <Button variant="outline" size="sm" asChild className="h-8 hidden sm:flex text-xs font-semibold">
                            <a href={previewLink} target="_blank"><Layout className="h-3.5 w-3.5 mr-1.5" /> Preview</a>
                        </Button>
                    )}
                    {onSave && (
                        <Button size="sm" onClick={onSave} disabled={saving} className="h-8 bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-bold text-xs px-5 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                            {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Saving...</> : 'Save Page'}
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* ─── LEFT SIDEBAR (Controls & Settings) ─── */}
                <div className={`transition-all duration-300 ease-in-out shrink-0 border-r border-gray-200 bg-white flex flex-col h-full overflow-hidden shadow-[2px_0_8px_rgba(0,0,0,0.02)] z-20 ${sidebarOpen ? 'w-[320px] translate-x-0' : 'w-[0px] -translate-x-full border-r-0'}`}>
                    <div className="flex-1 overflow-y-auto w-full custom-scrollbar pb-6 relative z-10 bg-white h-full">
                        {activeSection ? (
                            /* Selected Section Details */
                            <div className="p-4 animate-in slide-in-from-right-4 duration-300 relative bg-white min-h-full">
                                <Button variant="ghost" size="sm" onClick={() => setActiveSectionId(null)} className="mb-4 text-xs font-semibold text-gray-500 hover:text-gray-900 -ml-2 h-8 px-2">
                                    <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Blocks
                                </Button>
                                <ActiveSectionEditor section={activeSection as any} onChange={(updated) => update(activeSection.id, updated)} onAIFill={handleAIFill} aiLoading={aiLoading} />
                            </div>
                        ) : (
                            /* Dashboard Blocks & Structure */
                            <div className="p-4 space-y-6 animate-in fade-in duration-300 bg-white min-h-full">
                                <div>
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Widgets Palette</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(Object.keys(SECTION_LABELS) as LandingSectionType[]).map(type => {
                                            const { label, icon: Icon } = SECTION_LABELS[type]
                                            return (
                                                <button key={type} onClick={() => add(type)} className="flex flex-col items-center gap-1.5 p-3 bg-white border border-gray-100 rounded-lg hover:border-indigo-300 hover:shadow-sm hover:-translate-y-0.5 transition-all text-center group">
                                                    <div className="bg-indigo-50 p-2 rounded-full text-indigo-500 group-hover:bg-indigo-100 transition-colors">
                                                        <Icon className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-gray-600">{label}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                                {sections.length > 0 && (
                                    <div>
                                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Page Structure Layout</h3>
                                        <div className="space-y-1.5">
                                            {sections.map((sec:any, idx:number) => {
                                                const meta = SECTION_LABELS[sec.type as LandingSectionType]
                                                return (
                                                    <div key={sec.id} onClick={() => setActiveSectionId(sec.id)}
                                                        draggable onDragStart={(e) => handleDragStart(e, idx)} onDragOver={(e) => handleDragOver(e, idx)} onDrop={(e) => handleDrop(e, idx)}
                                                        className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                                                            activeSectionId === sec.id ? 'border-indigo-400 bg-indigo-50/50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-300'
                                                        } ${draggedIdx === idx ? 'opacity-50 border-dashed' : ''}`}>
                                                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                                                            <GripVertical className="h-4 w-4 text-gray-400 cursor-grab shrink-0 active:cursor-grabbing hover:text-gray-600" />
                                                            <meta.icon className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                                            <span className="text-xs font-semibold text-gray-800 truncate">{sec.heading || meta.label}</span>
                                                        </div>
                                                        <div className="flex items-center gap-0.5 shrink-0 pl-2">
                                                            <button onClick={(e) => moveUp(idx, e)} disabled={idx === 0} className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30 rounded"><ChevronUp className="h-3.5 w-3.5" /></button>
                                                            <button onClick={(e) => moveDown(idx, e)} disabled={idx === sections.length - 1} className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30 rounded"><ChevronDown className="h-3.5 w-3.5" /></button>
                                                            <button onClick={(e) => remove(sec.id, e)} className="p-1 text-red-300 hover:text-red-500 rounded ml-1"><Trash2 className="h-3 w-3" /></button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── RIGHT CANVAS (Live Preview) ─── */}
                <div className="flex-1 bg-slate-200/60 h-full overflow-y-auto relative p-4 md:p-8 custom-scrollbar flex justify-center transition-all duration-300" id="canvas-scroll">
                    
                    {sections.length === 0 ? (
                        <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 space-y-4 max-w-2xl text-center">
                            <div className="h-20 w-20 bg-white shadow-xl rounded-2xl flex items-center justify-center animate-bounce">
                                <Layout className="h-8 w-8 text-indigo-300" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-600">Your Canvas is Empty</h2>
                            <p className="text-sm">Select a block from the left panel, or let our AI craft the complete layout for you instantly.</p>
                            <Button onClick={() => setAiModalOpen(true)} className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-bold mt-2 shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                                ✨ Build with AI
                            </Button>
                        </div>
                    ) : (
                        <div className={`w-full ${canvasMaxWidth} transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]`}>
                            <div className="shadow-2xl rounded-sm overflow-hidden bg-white ring-1 ring-gray-200 min-h-full">
                                {sections.map((section:any) => (
                                    <div key={section.id} 
                                        onClick={() => { setActiveSectionId(section.id); setSidebarOpen(true) }}
                                        className={`relative group transition-all duration-200 cursor-pointer outline-dashed outline-2 outline-offset-[-2px] ${
                                            activeSectionId === section.id ? 'outline-indigo-500 z-10' : 'outline-transparent hover:outline-indigo-300 z-0'
                                        }`}>
                                        
                                        <div className={`absolute top-0 right-0 m-2 px-2 py-1 rounded bg-indigo-500 text-white text-[10px] font-bold shadow-md uppercase tracking-wider transition-opacity z-20 pointer-events-none ${
                                            activeSectionId === section.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                        }`}>
                                            {SECTION_LABELS[section.type as LandingSectionType].label}
                                        </div>

                                        <div className="pointer-events-none">
                                            <RenderSection section={section} product={fauxProduct} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── MODALS ─── */}
            <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
                <DialogContent className="max-w-md border-0 p-0 overflow-hidden bg-white rounded-2xl">
                    <div className="px-6 py-5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white">
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white mb-1">
                            <Bot className="h-6 w-6" /> Elementor AI Builder
                        </DialogTitle>
                        <p className="text-indigo-100 text-xs">Instantly generate a high-converting landing page.</p>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex gap-3 items-center">
                            <div className="h-10 w-10 bg-white rounded-lg shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                                <Layout className="h-5 w-5 text-indigo-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-800 line-clamp-1">{fauxProduct.title}</p>
                                <p className="text-[11px] text-gray-500 font-medium">₹{fauxProduct.price}</p>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-gray-700 uppercase tracking-widest">Guidance (Optional)</Label>
                            <Textarea
                                value={aiPrompt}
                                onChange={e => setAiPrompt(e.target.value)}
                                placeholder="E.g. Make it dark themed. Add 5 feature highlights. Add a beautiful FAQ section at the bottom."
                                className="mt-2 min-h-[90px] text-sm bg-gray-50"
                            />
                        </div>
                        
                        <div className="flex gap-3 pt-2">
                            <Button variant="ghost" onClick={() => setAiModalOpen(false)} className="flex-1 border border-gray-200 font-semibold text-gray-600">Cancel</Button>
                            <Button onClick={handleAIGenerate} disabled={aiLoading === "full"} className="flex-1 bg-gray-900 hover:bg-black text-white font-bold shadow-lg">
                                {aiLoading === "full" ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Building...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Page</>}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
            `}} />
        </div>
    )
}
