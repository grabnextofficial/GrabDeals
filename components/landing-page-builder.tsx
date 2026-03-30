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
    MessageSquare, HelpCircle, Zap, AlignCenter, Image, Type,
    Bot, Loader2, Undo, Redo, Sparkles, FormInput, Wand2, ArrowLeft, MousePointerClick, GripVertical
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { RenderSection } from "@/app/products/[id]/landing-page-view"

const SECTION_LABELS: Record<LandingSectionType, { label: string; icon: any; desc: string }> = {
    hero: { label: "Hero Banner", icon: Layout, desc: "Big headline + CTA button" },
    features: { label: "Features", icon: Zap, desc: "Feature highlight grid" },
    text: { label: "Text Block", icon: Type, desc: "Rich text / HTML content" },
    "image-text": { label: "Image + Text", icon: Image, desc: "Side-by-side layout" },
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
                    <Label className="text-xs">Padding</Label>
                    <select value={section.paddingY || 'md'} onChange={e => update({ paddingY: e.target.value as any })}
                        className="mt-1 w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs bg-white">
                        <option value="sm">Small</option>
                        <option value="md">Medium</option>
                        <option value="lg">Large</option>
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
                    <Label className="text-xs">BG Color</Label>
                    <div className="flex gap-1 mt-1">
                        <input type="color" value={section.bgColor || '#ffffff'} onChange={e => update({ bgColor: e.target.value })}
                            className="h-7 w-8 rounded border border-gray-200 cursor-pointer p-0.5" />
                        <Input value={section.bgColor || '#ffffff'} onChange={e => update({ bgColor: e.target.value })} className="h-7 text-xs flex-1" />
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
                    <div className="grid grid-cols-2 gap-3">
                        <div><Label className="text-xs">Button Text</Label>
                            <Input value={section.buttonText || ''} onChange={e => update({ buttonText: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Buy Now" /></div>
                        <div><Label className="text-xs">Text Color</Label>
                            <div className="flex gap-1 mt-1">
                                <input type="color" value={section.textColor || '#ffffff'} onChange={e => update({ textColor: e.target.value })} className="h-8 w-10 rounded border p-0.5" />
                                <Input value={section.textColor || '#ffffff'} onChange={e => update({ textColor: e.target.value })} className="h-8 text-xs flex-1" />
                            </div></div>
                    </div>
                    <div><Label className="text-xs">Hero Image URL</Label>
                        <Input value={section.imageUrl || ''} onChange={e => update({ imageUrl: e.target.value })} className="mt-1 h-8 text-xs" placeholder="https://..." /></div>
                </div>
            )}

            {/* Features */}
            {section.type === 'features' && (
                <div className="space-y-3">
                    <div><Label className="text-xs">Section Heading</Label>
                        <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Why Choose Us?" /></div>
                    <div><Label className="text-xs">Subheading</Label>
                        <Input value={section.subheading || ''} onChange={e => update({ subheading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Everything you need..." /></div>
                    <div className="space-y-2 mt-4">
                        <Label className="text-xs font-semibold">Features Items (max 6)</Label>
                        {(section.features || []).map((f, i) => (
                            <div key={i} className="p-2 border border-gray-100 rounded-lg bg-gray-50 space-y-2 relative">
                                <button type="button" onClick={() => update({ features: (section.features || []).filter((_, j) => j !== i) })} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                                <div className="grid grid-cols-4 gap-2 pr-6">
                                    <Input value={f.icon || ''} onChange={e => { const u = [...(section.features || [])]; u[i] = { ...u[i], icon: e.target.value }; update({ features: u }) }} className="h-7 text-xs" placeholder="🚀" title="Emoji Icon" />
                                    <Input value={f.title} onChange={e => { const u = [...(section.features || [])]; u[i] = { ...u[i], title: e.target.value }; update({ features: u }) }} className="h-7 text-xs col-span-3" placeholder="Feature Title" />
                                </div>
                                <Textarea value={f.description} onChange={e => { const u = [...(section.features || [])]; u[i] = { ...u[i], description: e.target.value }; update({ features: u }) }} className="text-xs min-h-[50px]" placeholder="Brief description..." />
                            </div>
                        ))}
                        {(section.features || []).length < 6 && (
                            <Button type="button" variant="outline" size="sm" className="w-full h-8 text-xs border-dashed"
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
                        <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Section Title" /></div>
                    <div><Label className="text-xs">Content (HTML supported)</Label>
                        <Textarea value={section.content || ''} onChange={e => update({ content: e.target.value })} className="mt-1 text-xs min-h-[150px]" placeholder="<p>Your content here...</p>" /></div>
                </div>
            )}

            {/* Image + Text */}
            {section.type === 'image-text' && (
                <div className="space-y-3">
                    <div><Label className="text-xs">Heading</Label>
                        <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs" /></div>
                    <div><Label className="text-xs">Image URL</Label>
                        <Input value={section.imageUrl || ''} onChange={e => update({ imageUrl: e.target.value })} className="mt-1 h-8 text-xs" placeholder="https://..." /></div>
                    <div><Label className="text-xs">Content</Label>
                        <Textarea value={section.content || ''} onChange={e => update({ content: e.target.value })} className="mt-1 text-xs min-h-[120px]" /></div>
                </div>
            )}

            {/* Testimonials */}
            {section.type === 'testimonials' && (
                <div className="space-y-3">
                    <div><Label className="text-xs">Section Heading</Label>
                        <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="What Our Customers Say" /></div>
                    <div className="space-y-2 mt-4">
                        <Label className="text-xs font-semibold">Customer Reviews</Label>
                        {(section.testimonials || []).map((t, i) => (
                            <div key={i} className="p-2 border border-gray-100 rounded-lg bg-gray-50 space-y-2 relative">
                                <button type="button" onClick={() => update({ testimonials: (section.testimonials || []).filter((_, j) => j !== i) })} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                                <div className="grid grid-cols-4 gap-2 pr-6">
                                    <Input value={t.name} onChange={e => { const u = [...(section.testimonials || [])]; u[i] = { ...u[i], name: e.target.value }; update({ testimonials: u }) }} className="h-7 text-xs col-span-3" placeholder="Customer Name" />
                                    <select value={t.rating || 5} onChange={e => { const u = [...(section.testimonials || [])]; u[i] = { ...u[i], rating: Number(e.target.value) }; update({ testimonials: u }) }} className="h-7 text-xs border rounded bg-white">
                                        {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r}★</option>)}
                                    </select>
                                </div>
                                <Textarea value={t.text} onChange={e => { const u = [...(section.testimonials || [])]; u[i] = { ...u[i], text: e.target.value }; update({ testimonials: u }) }} className="text-xs min-h-[60px]" placeholder="Review text..." />
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" className="w-full h-8 text-xs border-dashed"
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
                        <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Frequently Asked Questions" /></div>
                    <div className="space-y-2 mt-4">
                        <Label className="text-xs font-semibold">Q&A Pairs</Label>
                        {(section.faqs || []).map((f, i) => (
                            <div key={i} className="p-2 border border-gray-100 rounded-lg bg-gray-50 space-y-2 relative">
                                <button type="button" onClick={() => update({ faqs: (section.faqs || []).filter((_, j) => j !== i) })} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                                <Input value={f.question} onChange={e => { const u = [...(section.faqs || [])]; u[i] = { ...u[i], question: e.target.value }; update({ faqs: u }) }} className="h-7 text-xs pr-6" placeholder="Question" />
                                <Textarea value={f.answer} onChange={e => { const u = [...(section.faqs || [])]; u[i] = { ...u[i], answer: e.target.value }; update({ faqs: u }) }} className="text-xs min-h-[50px]" placeholder="Answer" />
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" className="w-full h-8 text-xs border-dashed"
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
                        <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Ready to Buy?" /></div>
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
                        <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Get In Touch" /></div>
                    <div><Label className="text-xs">Submit Button Text</Label>
                        <Input value={(section as any).formButtonText || ''} onChange={e => update({ formButtonText: e.target.value } as any)} className="mt-1 h-8 text-xs" placeholder="Submit" /></div>
                    <div className="space-y-2 mt-4">
                        <Label className="text-xs font-semibold">Form Fields</Label>
                        {((section as any).formFields || []).map((f: any, i: number) => (
                            <div key={i} className="p-2 border border-gray-100 rounded-lg bg-gray-50 flex flex-col gap-2 relative">
                                <button type="button" onClick={() => update({ formFields: ((section as any).formFields || []).filter((_: any, j: number) => j !== i) } as any)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                                <div className="grid grid-cols-2 gap-2 pr-6">
                                    <Input value={f.label} onChange={e => { const u = [...((section as any).formFields || [])]; u[i] = { ...u[i], label: e.target.value }; update({ formFields: u } as any) }} className="h-7 text-xs" placeholder="Label (e.g. Email)" />
                                    <select value={f.type} onChange={e => { const u = [...((section as any).formFields || [])]; u[i] = { ...u[i], type: e.target.value }; update({ formFields: u } as any) }} className="h-7 text-xs border rounded px-1 bg-white">
                                        <option value="text">Text (Single Line)</option>
                                        <option value="email">Email</option>
                                        <option value="tel">Phone</option>
                                        <option value="textarea">Textarea (Multi Line)</option>
                                    </select>
                                </div>
                                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                                    <input type="checkbox" checked={f.required} onChange={e => { const u = [...((section as any).formFields || [])]; u[i] = { ...u[i], required: e.target.checked }; update({ formFields: u } as any) }} className="h-3 w-3 rounded text-indigo-600" />
                                    Required Field
                                </label>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" className="w-full h-8 text-xs border-dashed"
                            onClick={() => update({ formFields: [...((section as any).formFields || []), { label: 'New Field', type: 'text', required: false, placeholder: '' }] } as any)}>
                            <Plus className="h-3 w-3 mr-1" /> Add Field
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Main Builder ─────────────────────────────────────────────────────────────
interface LandingPageBuilderProps {
    sections: LandingSection[]
    onChange: (sections: LandingSection[]) => void
    productTitle?: string
    productPrice?: number
    productDescription?: string
}

export function LandingPageBuilder({ sections, onChange, productTitle, productPrice, productDescription }: LandingPageBuilderProps) {
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
            const prev = historyRef.current[historyIdx.current]
            onChange(prev)
            setCanUndo(historyIdx.current > 0)
            setCanRedo(true)
        }
    }

    const redo = () => {
        if (historyIdx.current < historyRef.current.length - 1) {
            historyIdx.current += 1
            const next = historyRef.current[historyIdx.current]
            onChange(next)
            setCanUndo(true)
            setCanRedo(historyIdx.current < historyRef.current.length - 1)
        }
    }

    const add = (type: LandingSectionType) => {
        const id = crypto.randomUUID()
        const newSection: LandingSection = {
            id,
            type,
            bgColor: '#ffffff',
            textColor: '#1a1a2e',
            align: 'center',
            paddingY: 'md',
            animation: 'fadeIn' as any,
        }
        if (type === 'hero') { newSection.heading = 'Stunning Headline Here'; newSection.buttonText = 'Buy Now'; newSection.bgColor = '#1e3a8a'; newSection.textColor = '#ffffff'; }
        if (type === 'features') newSection.features = [{ icon: '✨', title: 'Feature 1', description: 'Description here.' }, { icon: '🚀', title: 'Feature 2', description: 'Description here.' }, { icon: '🛡️', title: 'Feature 3', description: 'Description here.' }]
        if (type === 'testimonials') newSection.testimonials = [{ name: 'John Doe', text: 'Amazing purchase. Highly recommended!', rating: 5 }]
        if (type === 'faq') newSection.faqs = [{ question: 'How do I download the files?', answer: 'Immediately after purchase, check your dashboard downloads.' }]
        if (type === 'cta') { newSection.heading = 'Ready to upgrade?'; newSection.buttonText = 'Get Access'; newSection.bgColor = '#f59e0b'; }
        if (type === 'form') (newSection as any).formFields = [
            { label: 'Name', type: 'text', required: true, placeholder: 'Your name' },
            { label: 'Email', type: 'email', required: true, placeholder: 'your@email.com' }
        ]
        pushHistory([...sections, newSection])
        setActiveSectionId(id) // Auto-select new section
    }

    const update = (id: string, updated: LandingSection) =>
        pushHistory(sections.map(s => s.id === id ? updated : s))

    const remove = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (activeSectionId === id) setActiveSectionId(null)
        pushHistory(sections.filter(s => s.id !== id))
    }

    const moveUp = (idx: number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (idx === 0) return
        const next = [...sections]
        ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
        pushHistory(next)
    }

    const moveDown = (idx: number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (idx === sections.length - 1) return
        const next = [...sections]
        ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
        pushHistory(next)
    }

    const handleAIGenerate = async () => {
        if (!aiPrompt.trim() && !productTitle) {
            toast({ title: "Enter a prompt or product name first", variant: "destructive" })
            return
        }
        setAiLoading("full")
        try {
            const res = await fetch("/api/ai/generate-landing-page", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: "full", prompt: aiPrompt, productTitle, productPrice, productDescription }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "AI generation failed")
            pushHistory(data.sections)
            setAiModalOpen(false)
            setActiveSectionId(null)
            setAiPrompt("")
            toast({ title: "✅ Landing page generated by AI!" })
        } catch (err: any) {
            toast({ title: "AI Error", description: err.message, variant: "destructive" })
        } finally {
            setAiLoading(null)
        }
    }

    const handleAIFill = async (sectionId: string, type: LandingSectionType) => {
        setAiLoading(sectionId)
        try {
            const res = await fetch("/api/ai/generate-landing-page", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: "section", sectionType: type, productTitle, productPrice, productDescription }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "AI fill failed")
            if (data.sections?.[0]) {
                const generated = data.sections[0]
                pushHistory(sections.map(s =>
                    s.id === sectionId ? { ...generated, id: sectionId, type, bgColor: s.bgColor, textColor: s.textColor, align: s.align, paddingY: s.paddingY } : s
                ))
                toast({ title: "✅ Section filled by AI!" })
            }
        } catch (err: any) {
            toast({ title: "AI Error", description: err.message, variant: "destructive" })
        } finally {
            setAiLoading(null)
        }
    }

    const [draggedIdx, setDraggedIdx] = useState<number | null>(null)

    const handleDragStart = (e: React.DragEvent, idx: number) => {
        setDraggedIdx(idx)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = (e: React.DragEvent, dropIdx: number) => {
        e.preventDefault()
        if (draggedIdx === null || draggedIdx === dropIdx) return
        const next = [...sections]
        const [moved] = next.splice(draggedIdx, 1)
        next.splice(dropIdx, 0, moved)
        pushHistory(next)
        setDraggedIdx(null)
    }

    const activeSection = sections.find(s => s.id === activeSectionId)

    return (
        <div className="flex h-[calc(100vh-73px)] overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm -mx-6 mb-[-24px]">

            {/* ─── LEFT SIDEBAR (Controls & Settings) ─── */}
            <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col h-full overflow-hidden shadow-[2px_0_8px_rgba(0,0,0,0.02)] z-10 relative">
                
                {/* Global Toolbar */}
                <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 relative z-20">
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} className="h-8 w-8 text-gray-500"><Undo className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} className="h-8 w-8 text-gray-500"><Redo className="h-4 w-4" /></Button>
                    </div>
                    <Button size="sm" onClick={() => setAiModalOpen(true)} className="h-8 bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold text-xs border-0 px-3 shadow-sm hover:from-violet-600 hover:to-indigo-600">
                        <Wand2 className="h-3.5 w-3.5 mr-1.5" /> AI Build
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto w-full custom-scrollbar pb-6 relative z-10 bg-white" id="sidebar-scroll">
                    {activeSection ? (
                        /* Selected Section Details */
                        <div className="p-4 animate-in slide-in-from-right-4 duration-300 relative bg-white min-h-full">
                            <Button variant="ghost" size="sm" onClick={() => setActiveSectionId(null)} className="mb-4 text-xs font-semibold text-gray-500 hover:text-gray-900 -ml-2 h-8 px-2">
                                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Blocks
                            </Button>
                            <ActiveSectionEditor
                                section={activeSection}
                                onChange={(updated) => update(activeSection.id, updated)}
                                onAIFill={handleAIFill}
                                aiLoading={aiLoading}
                            />
                        </div>
                    ) : (
                        /* Dashboard Blocks & Structure */
                        <div className="p-4 space-y-6 animate-in fade-in duration-300 bg-white min-h-full">
                            {/* Blocks Palette */}
                            <div>
                                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Add Blocks</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {(Object.keys(SECTION_LABELS) as LandingSectionType[]).map(type => {
                                        const { label, icon: Icon } = SECTION_LABELS[type]
                                        return (
                                            <button key={type} onClick={() => add(type)}
                                                className="flex flex-col items-center gap-1.5 p-3 bg-white border border-gray-100 rounded-lg hover:border-indigo-300 hover:bg-slate-50 hover:shadow-sm transition-all text-center group">
                                                <div className="bg-indigo-50 p-2 rounded-full text-indigo-500 group-hover:bg-indigo-100 group-hover:scale-110 transition-transform">
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <span className="text-[11px] font-semibold text-gray-600">{label}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Current Page Structure */}
                            {sections.length > 0 && (
                                <div>
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Page Structure Layout</h3>
                                    <div className="space-y-1.5">
                                        {sections.map((sec, idx) => {
                                            const meta = SECTION_LABELS[sec.type]
                                            return (
                                                <div key={sec.id} onClick={() => setActiveSectionId(sec.id)}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, idx)}
                                                    onDragOver={(e) => handleDragOver(e, idx)}
                                                    onDrop={(e) => handleDrop(e, idx)}
                                                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                                                        activeSectionId === sec.id ? 'border-indigo-400 bg-indigo-50/50' : 'border-gray-100 bg-white hover:border-gray-300'
                                                    } ${draggedIdx === idx ? 'opacity-50' : ''}`}>
                                                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                                                        <GripVertical className="h-4 w-4 text-gray-400 cursor-grab shrink-0 active:cursor-grabbing hover:text-gray-600" />
                                                        <meta.icon className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                                        <span className="text-xs font-semibold text-gray-700 truncate">{sec.heading || meta.label}</span>
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
            <div className="flex-1 bg-slate-100 h-full overflow-y-auto relative p-6 md:p-10 custom-scrollbar" id="canvas-scroll">
                
                {sections.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                        <div className="h-20 w-20 bg-white shadow-xl rounded-2xl flex items-center justify-center animate-bounce">
                            <Layout className="h-8 w-8 text-indigo-300" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-600">Your Canvas is Empty</h2>
                        <p className="text-sm">Select a block from the left or generate with AI.</p>
                        <Button onClick={() => setAiModalOpen(true)} className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-bold mt-2 shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                            ✨ Build with AI
                        </Button>
                    </div>
                ) : (
                    <div className="max-w-5xl mx-auto space-y-0 shadow-2xl rounded-2xl overflow-hidden bg-white ring-1 ring-gray-200 min-h-full">
                        {sections.map(section => (
                            <div key={section.id} 
                                onClick={() => setActiveSectionId(section.id)}
                                className={`relative group transition-all duration-200 cursor-pointer outline-dashed outline-2 outline-offset-[-2px] ${
                                    activeSectionId === section.id ? 'outline-indigo-500 z-10' : 'outline-transparent hover:outline-indigo-300 z-0'
                                }`}>
                                
                                {/* Overlay hover/active labels */}
                                <div className={`absolute top-0 right-0 m-2 px-2 py-1 rounded bg-indigo-500 text-white text-[10px] font-bold shadow-md uppercase tracking-wider transition-opacity z-20 pointer-events-none ${
                                    activeSectionId === section.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                }`}>
                                    {SECTION_LABELS[section.type].label}
                                </div>

                                <div className="pointer-events-none">
                                    <RenderSection section={section} product={fauxProduct} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
