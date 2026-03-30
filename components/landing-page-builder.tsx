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
    Bot, Loader2, Undo, Redo, Sparkles, FormInput, Wand2
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

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

// ─── Section Editor ─────────────────────────────────────────────────────────
function SectionEditor({ section, onChange, onDelete, onUp, onDown, isFirst, isLast, onAIFill, aiLoading }: {
    section: LandingSection
    onChange: (s: LandingSection) => void
    onDelete: () => void
    onUp: () => void
    onDown: () => void
    isFirst: boolean
    isLast: boolean
    onAIFill: (sectionId: string, type: LandingSectionType) => void
    aiLoading: string | null
}) {
    const meta = SECTION_LABELS[section.type]
    const Icon = meta.icon
    const [open, setOpen] = useState(true)
    const update = (patch: Partial<LandingSection>) => onChange({ ...section, ...patch })
    const isLoadingThis = aiLoading === section.id

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <Icon className="h-4 w-4 text-indigo-600 shrink-0" />
                <div className="flex-1">
                    <span className="font-semibold text-sm text-gray-800">{meta.label}</span>
                    <p className="text-[11px] text-gray-500">{meta.desc}</p>
                </div>
                <div className="flex items-center gap-1">
                    {/* AI Fill */}
                    <button type="button" onClick={() => onAIFill(section.id, section.type)}
                        disabled={!!aiLoading}
                        className="h-6 px-2 text-[11px] font-bold rounded flex items-center gap-1 bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-600 hover:to-indigo-600 disabled:opacity-50 transition-all">
                        {isLoadingThis ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                        AI Fill
                    </button>
                    <button type="button" disabled={isFirst} onClick={onUp}
                        className="h-6 w-6 rounded flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-white disabled:opacity-30 transition-colors">
                        <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" disabled={isLast} onClick={onDown}
                        className="h-6 w-6 rounded flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-white disabled:opacity-30 transition-colors">
                        <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => setOpen(!open)}
                        className="h-6 px-2 text-xs rounded bg-white border border-gray-200 text-gray-500 hover:text-blue-600 transition-colors">
                        {open ? "Collapse" : "Expand"}
                    </button>
                    <button type="button" onClick={onDelete}
                        className="h-6 w-6 rounded flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {open && (
                <div className="p-4 space-y-3">
                    {/* Common style controls */}
                    <div className="grid grid-cols-4 gap-3">
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
                                    className="h-8 w-10 rounded border border-gray-200 cursor-pointer p-0.5" />
                                <Input value={section.bgColor || '#ffffff'} onChange={e => update({ bgColor: e.target.value })} className="h-8 text-xs flex-1" />
                            </div>
                        </div>
                    </div>

                    {/* Hero */}
                    {section.type === 'hero' && (
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div><Label className="text-xs">Heading *</Label>
                                    <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Your Amazing Product" /></div>
                                <div><Label className="text-xs">Subheading</Label>
                                    <Input value={section.subheading || ''} onChange={e => update({ subheading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Limited time offer..." /></div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div><Label className="text-xs">Button Text</Label>
                                    <Input value={section.buttonText || ''} onChange={e => update({ buttonText: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Buy Now" /></div>
                                <div><Label className="text-xs">Button Link</Label>
                                    <Input value={section.buttonLink || ''} onChange={e => update({ buttonLink: e.target.value })} className="mt-1 h-8 text-xs" placeholder="#buy or /checkout" /></div>
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
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div><Label className="text-xs">Section Heading</Label>
                                    <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Why Choose Us?" /></div>
                                <div><Label className="text-xs">Subheading</Label>
                                    <Input value={section.subheading || ''} onChange={e => update({ subheading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Everything you need..." /></div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Features (max 6)</Label>
                                {(section.features || []).map((f, i) => (
                                    <div key={i} className="grid grid-cols-5 gap-2 items-center">
                                        <Input value={f.icon || ''} onChange={e => { const u = [...(section.features || [])]; u[i] = { ...u[i], icon: e.target.value }; update({ features: u }) }} className="h-7 text-xs" placeholder="🚀" />
                                        <Input value={f.title} onChange={e => { const u = [...(section.features || [])]; u[i] = { ...u[i], title: e.target.value }; update({ features: u }) }} className="h-7 text-xs col-span-2" placeholder="Title" />
                                        <Input value={f.description} onChange={e => { const u = [...(section.features || [])]; u[i] = { ...u[i], description: e.target.value }; update({ features: u }) }} className="h-7 text-xs" placeholder="Description" />
                                        <button type="button" onClick={() => update({ features: (section.features || []).filter((_, j) => j !== i) })} className="h-7 w-7 flex items-center justify-center text-red-400 hover:text-red-600 rounded"><Trash2 className="h-3 w-3" /></button>
                                    </div>
                                ))}
                                {(section.features || []).length < 6 && (
                                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs"
                                        onClick={() => update({ features: [...(section.features || []), { icon: '✨', title: '', description: '' }] })}>
                                        <Plus className="h-3 w-3 mr-1" /> Add Feature
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Text Block */}
                    {section.type === 'text' && (
                        <div className="space-y-2">
                            <div><Label className="text-xs">Heading</Label>
                                <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Section Title" /></div>
                            <div><Label className="text-xs">Content (HTML supported)</Label>
                                <Textarea value={section.content || ''} onChange={e => update({ content: e.target.value })} className="mt-1 text-xs min-h-[80px]" placeholder="<p>Your content here...</p>" /></div>
                        </div>
                    )}

                    {/* Image + Text */}
                    {section.type === 'image-text' && (
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div><Label className="text-xs">Heading</Label>
                                    <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs" /></div>
                                <div><Label className="text-xs">Image URL</Label>
                                    <Input value={section.imageUrl || ''} onChange={e => update({ imageUrl: e.target.value })} className="mt-1 h-8 text-xs" placeholder="https://..." /></div>
                            </div>
                            <div><Label className="text-xs">Content</Label>
                                <Textarea value={section.content || ''} onChange={e => update({ content: e.target.value })} className="mt-1 text-xs min-h-[80px]" /></div>
                        </div>
                    )}

                    {/* Testimonials */}
                    {section.type === 'testimonials' && (
                        <div className="space-y-2">
                            <div><Label className="text-xs">Section Heading</Label>
                                <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="What Our Customers Say" /></div>
                            <div className="space-y-2">
                                <Label className="text-xs">Reviews</Label>
                                {(section.testimonials || []).map((t, i) => (
                                    <div key={i} className="grid grid-cols-5 gap-2 items-center">
                                        <Input value={t.name} onChange={e => { const u = [...(section.testimonials || [])]; u[i] = { ...u[i], name: e.target.value }; update({ testimonials: u }) }} className="h-7 text-xs" placeholder="Name" />
                                        <Input value={t.text} onChange={e => { const u = [...(section.testimonials || [])]; u[i] = { ...u[i], text: e.target.value }; update({ testimonials: u }) }} className="h-7 text-xs col-span-2" placeholder="Review" />
                                        <select value={t.rating || 5} onChange={e => { const u = [...(section.testimonials || [])]; u[i] = { ...u[i], rating: Number(e.target.value) }; update({ testimonials: u }) }} className="h-7 text-xs border rounded px-1 bg-white">
                                            {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r}★</option>)}
                                        </select>
                                        <button type="button" onClick={() => update({ testimonials: (section.testimonials || []).filter((_, j) => j !== i) })} className="h-7 w-7 flex items-center justify-center text-red-400 hover:text-red-600 rounded"><Trash2 className="h-3 w-3" /></button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" className="h-7 text-xs"
                                    onClick={() => update({ testimonials: [...(section.testimonials || []), { name: '', text: '', rating: 5 }] })}>
                                    <Plus className="h-3 w-3 mr-1" /> Add Review
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* FAQ */}
                    {section.type === 'faq' && (
                        <div className="space-y-2">
                            <div><Label className="text-xs">Section Heading</Label>
                                <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Frequently Asked Questions" /></div>
                            <div className="space-y-2">
                                <Label className="text-xs">Q&A Pairs</Label>
                                {(section.faqs || []).map((f, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="flex gap-2">
                                            <Input value={f.question} onChange={e => { const u = [...(section.faqs || [])]; u[i] = { ...u[i], question: e.target.value }; update({ faqs: u }) }} className="h-7 text-xs flex-1" placeholder="Question" />
                                            <button type="button" onClick={() => update({ faqs: (section.faqs || []).filter((_, j) => j !== i) })} className="h-7 w-7 flex items-center justify-center text-red-400 rounded shrink-0"><Trash2 className="h-3 w-3" /></button>
                                        </div>
                                        <Textarea value={f.answer} onChange={e => { const u = [...(section.faqs || [])]; u[i] = { ...u[i], answer: e.target.value }; update({ faqs: u }) }} className="text-xs min-h-[50px]" placeholder="Answer" />
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" className="h-7 text-xs"
                                    onClick={() => update({ faqs: [...(section.faqs || []), { question: '', answer: '' }] })}>
                                    <Plus className="h-3 w-3 mr-1" /> Add FAQ
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* CTA */}
                    {section.type === 'cta' && (
                        <div className="grid grid-cols-2 gap-3">
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
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div><Label className="text-xs">Form Heading</Label>
                                    <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Get In Touch" /></div>
                                <div><Label className="text-xs">Submit Button Text</Label>
                                    <Input value={(section as any).formButtonText || ''} onChange={e => update({ formButtonText: e.target.value } as any)} className="mt-1 h-8 text-xs" placeholder="Submit" /></div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Form Fields</Label>
                                {((section as any).formFields || []).map((f: any, i: number) => (
                                    <div key={i} className="grid grid-cols-5 gap-2 items-center">
                                        <Input value={f.label} onChange={e => { const u = [...((section as any).formFields || [])]; u[i] = { ...u[i], label: e.target.value }; update({ formFields: u } as any) }} className="h-7 text-xs" placeholder="Label" />
                                        <select value={f.type} onChange={e => { const u = [...((section as any).formFields || [])]; u[i] = { ...u[i], type: e.target.value }; update({ formFields: u } as any) }} className="h-7 text-xs border rounded px-1 bg-white col-span-2">
                                            <option value="text">Text</option>
                                            <option value="email">Email</option>
                                            <option value="tel">Phone</option>
                                            <option value="textarea">Textarea</option>
                                        </select>
                                        <label className="flex items-center gap-1 text-xs">
                                            <input type="checkbox" checked={f.required} onChange={e => { const u = [...((section as any).formFields || [])]; u[i] = { ...u[i], required: e.target.checked }; update({ formFields: u } as any) }} className="h-3 w-3" />
                                            Required
                                        </label>
                                        <button type="button" onClick={() => update({ formFields: ((section as any).formFields || []).filter((_: any, j: number) => j !== i) } as any)} className="h-7 w-7 flex items-center justify-center text-red-400 rounded"><Trash2 className="h-3 w-3" /></button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" className="h-7 text-xs"
                                    onClick={() => update({ formFields: [...((section as any).formFields || []), { label: 'Name', type: 'text', required: true, placeholder: '' }] } as any)}>
                                    <Plus className="h-3 w-3 mr-1" /> Add Field
                                </Button>
                            </div>
                        </div>
                    )}
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
    // Undo/Redo history
    const historyRef = useRef<LandingSection[][]>([sections])
    const historyIdx = useRef(0)
    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)

    // AI state
    const [aiModalOpen, setAiModalOpen] = useState(false)
    const [aiPrompt, setAiPrompt] = useState("")
    const [aiLoading, setAiLoading] = useState<string | null>(null) // "full" | sectionId
    const [copySuggestions, setCopySuggestions] = useState<any[]>([])

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
        const newSection: LandingSection = {
            id: crypto.randomUUID(),
            type,
            bgColor: '#ffffff',
            textColor: '#1a1a2e',
            align: 'center',
            paddingY: 'md',
            animation: 'none' as any,
        }
        if (type === 'features') newSection.features = [{ icon: '✨', title: '', description: '' }]
        if (type === 'testimonials') newSection.testimonials = [{ name: '', text: '', rating: 5 }]
        if (type === 'faq') newSection.faqs = [{ question: '', answer: '' }]
        if (type === 'form') (newSection as any).formFields = [
            { label: 'Name', type: 'text', required: true, placeholder: 'Your name' },
            { label: 'Email', type: 'email', required: true, placeholder: 'your@email.com' },
            { label: 'Phone', type: 'tel', required: false, placeholder: '+91 XXXXX XXXXX' },
        ]
        pushHistory([...sections, newSection])
    }

    const update = (id: string, updated: LandingSection) =>
        pushHistory(sections.map(s => s.id === id ? updated : s))

    const remove = (id: string) => pushHistory(sections.filter(s => s.id !== id))

    const moveUp = (idx: number) => {
        if (idx === 0) return
        const next = [...sections]
        ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
        pushHistory(next)
    }

    const moveDown = (idx: number) => {
        if (idx === sections.length - 1) return
        const next = [...sections]
        ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
        pushHistory(next)
    }

    // Generate full page with AI
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
                body: JSON.stringify({
                    mode: "full",
                    prompt: aiPrompt,
                    productTitle,
                    productPrice,
                    productDescription,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "AI generation failed")
            pushHistory(data.sections)
            setAiModalOpen(false)
            setAiPrompt("")
            toast({ title: "✅ Landing page generated by AI!" })
        } catch (err: any) {
            toast({ title: "AI Error", description: err.message, variant: "destructive" })
        } finally {
            setAiLoading(null)
        }
    }

    // AI fill a single section
    const handleAIFill = async (sectionId: string, type: LandingSectionType) => {
        setAiLoading(sectionId)
        try {
            const res = await fetch("/api/ai/generate-landing-page", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "section",
                    sectionType: type,
                    productTitle,
                    productPrice,
                    productDescription,
                }),
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

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                    <button type="button" onClick={undo} disabled={!canUndo}
                        className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                        title="Undo">
                        <Undo className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={redo} disabled={!canRedo}
                        className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                        title="Redo">
                        <Redo className="h-4 w-4" />
                    </button>
                    <div className="h-5 w-px bg-gray-200" />
                    <span className="text-xs text-gray-500">{sections.length} section{sections.length !== 1 ? 's' : ''}</span>
                </div>
                <button
                    type="button"
                    onClick={() => setAiModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white text-sm font-bold transition-all shadow-sm"
                >
                    <Wand2 className="h-4 w-4" />
                    ✨ Generate with AI
                </button>
            </div>

            {/* Empty state */}
            {sections.length === 0 && (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400">
                    <Layout className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm mb-3">No sections yet. Add sections below or generate a full page with AI.</p>
                    <button type="button" onClick={() => setAiModalOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-sm font-bold">
                        <Wand2 className="h-4 w-4" /> Generate with AI
                    </button>
                </div>
            )}

            {/* Sections */}
            {sections.map((section, idx) => (
                <SectionEditor
                    key={section.id}
                    section={section}
                    onChange={updated => update(section.id, updated)}
                    onDelete={() => remove(section.id)}
                    onUp={() => moveUp(idx)}
                    onDown={() => moveDown(idx)}
                    isFirst={idx === 0}
                    isLast={idx === sections.length - 1}
                    onAIFill={handleAIFill}
                    aiLoading={aiLoading}
                />
            ))}

            {/* Add section palette */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">+ Add Section</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(Object.keys(SECTION_LABELS) as LandingSectionType[]).map(type => {
                        const { label, icon: Icon, desc } = SECTION_LABELS[type]
                        return (
                            <button key={type} type="button" onClick={() => add(type)}
                                className="flex flex-col items-center gap-1.5 p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-sm transition-all text-center">
                                <Icon className="h-5 w-5 text-indigo-500" />
                                <span className="text-xs font-semibold text-gray-700">{label}</span>
                                <span className="text-[10px] text-gray-400 leading-tight">{desc}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* AI Generate Modal */}
            <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Bot className="h-6 w-6 text-violet-500" />
                            Generate Landing Page with AI
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-xs text-violet-700">
                            <strong>Product:</strong> {productTitle || 'Not set'} {productPrice ? `• ₹${productPrice}` : ''}
                        </div>
                        <div>
                            <Label className="text-sm font-semibold">Describe your vision (optional)</Label>
                            <Textarea
                                value={aiPrompt}
                                onChange={e => setAiPrompt(e.target.value)}
                                placeholder="E.g. Make it look premium with a dark blue theme. Include 5 features about speed, security, and ease of use. Add 3 customer testimonials and a strong FAQ section."
                                className="mt-2 min-h-[110px] text-sm"
                            />
                            <p className="text-xs text-gray-400 mt-1">Leave empty to generate a standard conversion-focused page for your product.</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={handleAIGenerate}
                                disabled={aiLoading === "full"}
                                className="flex-1 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-bold"
                            >
                                {aiLoading === "full"
                                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating...</>
                                    : <><Sparkles className="h-4 w-4 mr-2" />Generate Full Page</>}
                            </Button>
                            <Button variant="outline" onClick={() => setAiModalOpen(false)}>Cancel</Button>
                        </div>
                        <p className="text-[11px] text-gray-400 text-center">
                            Uses your Gemini API key from Admin → AI Settings
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
