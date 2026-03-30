"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LandingSection, LandingSectionType } from "@/lib/types"
import {
  Plus, Trash2, ChevronUp, ChevronDown, Layout, Star,
  MessageSquare, HelpCircle, Zap, AlignCenter, Image, Type
} from "lucide-react"

const SECTION_LABELS: Record<LandingSectionType, { label: string; icon: any; desc: string }> = {
  hero: { label: "Hero Banner", icon: Layout, desc: "Big headline + CTA button" },
  features: { label: "Features", icon: Zap, desc: "3-column feature highlights" },
  text: { label: "Text Block", icon: Type, desc: "Rich text / HTML content" },
  "image-text": { label: "Image + Text", icon: Image, desc: "Side-by-side image and text" },
  testimonials: { label: "Testimonials", icon: MessageSquare, desc: "Customer reviews carousel" },
  faq: { label: "FAQ", icon: HelpCircle, desc: "Accordion questions" },
  cta: { label: "CTA Banner", icon: AlignCenter, desc: "Call-to-action strip" },
}

function SectionEditor({ section, onChange, onDelete, onUp, onDown, isFirst, isLast }: {
  section: LandingSection
  onChange: (s: LandingSection) => void
  onDelete: () => void
  onUp: () => void
  onDown: () => void
  isFirst: boolean
  isLast: boolean
}) {
  const meta = SECTION_LABELS[section.type]
  const Icon = meta.icon
  const [open, setOpen] = useState(true)

  const update = (patch: Partial<LandingSection>) => onChange({ ...section, ...patch })

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

      {/* Content */}
      {open && (
        <div className="p-4 space-y-3">
          {/* Common alignment + bg */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Text Align</Label>
              <select value={section.align || 'center'} onChange={e => update({ align: e.target.value as any })}
                className="mt-1 w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Background Color</Label>
              <div className="flex gap-1 mt-1">
                <input type="color" value={section.bgColor || '#ffffff'} onChange={e => update({ bgColor: e.target.value })}
                  className="h-8 w-10 rounded border border-gray-200 cursor-pointer p-0.5" />
                <Input value={section.bgColor || '#ffffff'} onChange={e => update({ bgColor: e.target.value })} className="h-8 text-xs flex-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Text Color</Label>
              <div className="flex gap-1 mt-1">
                <input type="color" value={section.textColor || '#1a1a2e'} onChange={e => update({ textColor: e.target.value })}
                  className="h-8 w-10 rounded border border-gray-200 cursor-pointer p-0.5" />
                <Input value={section.textColor || '#1a1a2e'} onChange={e => update({ textColor: e.target.value })} className="h-8 text-xs flex-1" />
              </div>
            </div>
          </div>

          {/* Hero */}
          {section.type === 'hero' && (<>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Heading *</Label>
                <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Grab the Best Deal Today!" />
              </div>
              <div>
                <Label className="text-xs">Subheading</Label>
                <Input value={section.subheading || ''} onChange={e => update({ subheading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Limited time offer..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Button Text</Label>
                <Input value={section.buttonText || ''} onChange={e => update({ buttonText: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Buy Now" />
              </div>
              <div>
                <Label className="text-xs">Button Link</Label>
                <Input value={section.buttonLink || ''} onChange={e => update({ buttonLink: e.target.value })} className="mt-1 h-8 text-xs" placeholder="#buy or /checkout" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Hero Image URL</Label>
              <Input value={section.imageUrl || ''} onChange={e => update({ imageUrl: e.target.value })} className="mt-1 h-8 text-xs" placeholder="https://..." />
            </div>
          </>)}

          {/* Features */}
          {section.type === 'features' && (<>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Section Heading</Label>
                <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Why Choose Us?" />
              </div>
              <div>
                <Label className="text-xs">Subheading</Label>
                <Input value={section.subheading || ''} onChange={e => update({ subheading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Everything you need..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Features (max 6)</Label>
              {(section.features || []).map((f, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 items-center">
                  <Input value={f.icon || ''} onChange={e => {
                    const upd = [...(section.features || [])]
                    upd[i] = { ...upd[i], icon: e.target.value }
                    update({ features: upd })
                  }} className="h-7 text-xs" placeholder="🚀 emoji" />
                  <Input value={f.title} onChange={e => {
                    const upd = [...(section.features || [])]
                    upd[i] = { ...upd[i], title: e.target.value }
                    update({ features: upd })
                  }} className="h-7 text-xs col-span-2" placeholder="Feature title" />
                  <Input value={f.description} onChange={e => {
                    const upd = [...(section.features || [])]
                    upd[i] = { ...upd[i], description: e.target.value }
                    update({ features: upd })
                  }} className="h-7 text-xs" placeholder="Short description" />
                  <button type="button" onClick={() => {
                    const upd = [...(section.features || [])].filter((_, j) => j !== i)
                    update({ features: upd })
                  }} className="h-7 w-7 flex items-center justify-center text-red-400 hover:text-red-600 rounded">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {(section.features || []).length < 6 && (
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs"
                  onClick={() => update({ features: [...(section.features || []), { icon: '✨', title: '', description: '' }] })}>
                  <Plus className="h-3 w-3 mr-1" /> Add Feature
                </Button>
              )}
            </div>
          </>)}

          {/* Text Block */}
          {section.type === 'text' && (<>
            <div>
              <Label className="text-xs">Heading (optional)</Label>
              <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Section Title" />
            </div>
            <div>
              <Label className="text-xs">Content (HTML supported)</Label>
              <Textarea value={section.content || ''} onChange={e => update({ content: e.target.value })} className="mt-1 text-xs min-h-[100px]" placeholder="<p>Write your content here...</p>" />
            </div>
          </>)}

          {/* Image + Text */}
          {section.type === 'image-text' && (<>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Heading</Label>
                <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Heading" />
              </div>
              <div>
                <Label className="text-xs">Image URL</Label>
                <Input value={section.imageUrl || ''} onChange={e => update({ imageUrl: e.target.value })} className="mt-1 h-8 text-xs" placeholder="https://..." />
              </div>
            </div>
            <div>
              <Label className="text-xs">Content</Label>
              <Textarea value={section.content || ''} onChange={e => update({ content: e.target.value })} className="mt-1 text-xs min-h-[80px]" placeholder="Describe the product..." />
            </div>
          </>)}

          {/* Testimonials */}
          {section.type === 'testimonials' && (<>
            <div>
              <Label className="text-xs">Section Heading</Label>
              <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="What Our Customers Say" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Testimonials</Label>
              {(section.testimonials || []).map((t, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 items-center">
                  <Input value={t.name} onChange={e => {
                    const upd = [...(section.testimonials || [])]
                    upd[i] = { ...upd[i], name: e.target.value }
                    update({ testimonials: upd })
                  }} className="h-7 text-xs" placeholder="Name" />
                  <Input value={t.text} onChange={e => {
                    const upd = [...(section.testimonials || [])]
                    upd[i] = { ...upd[i], text: e.target.value }
                    update({ testimonials: upd })
                  }} className="h-7 text-xs col-span-2" placeholder="Review text" />
                  <select value={t.rating || 5} onChange={e => {
                    const upd = [...(section.testimonials || [])]
                    upd[i] = { ...upd[i], rating: Number(e.target.value) }
                    update({ testimonials: upd })
                  }} className="h-7 text-xs border border-gray-200 rounded-md px-1 bg-white">
                    {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r}★</option>)}
                  </select>
                  <button type="button" onClick={() => {
                    update({ testimonials: (section.testimonials || []).filter((_, j) => j !== i) })
                  }} className="h-7 w-7 flex items-center justify-center text-red-400 hover:text-red-600 rounded">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs"
                onClick={() => update({ testimonials: [...(section.testimonials || []), { name: '', text: '', rating: 5 }] })}>
                <Plus className="h-3 w-3 mr-1" /> Add Testimonial
              </Button>
            </div>
          </>)}

          {/* FAQ */}
          {section.type === 'faq' && (<>
            <div>
              <Label className="text-xs">Section Heading</Label>
              <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Frequently Asked Questions" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Q&A Pairs</Label>
              {(section.faqs || []).map((f, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex gap-2">
                    <Input value={f.question} onChange={e => {
                      const upd = [...(section.faqs || [])]
                      upd[i] = { ...upd[i], question: e.target.value }
                      update({ faqs: upd })
                    }} className="h-7 text-xs flex-1" placeholder="Question" />
                    <button type="button" onClick={() => update({ faqs: (section.faqs || []).filter((_, j) => j !== i) })}
                      className="h-7 w-7 flex items-center justify-center text-red-400 hover:text-red-600 rounded shrink-0">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <Textarea value={f.answer} onChange={e => {
                    const upd = [...(section.faqs || [])]
                    upd[i] = { ...upd[i], answer: e.target.value }
                    update({ faqs: upd })
                  }} className="text-xs min-h-[56px]" placeholder="Answer" />
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs"
                onClick={() => update({ faqs: [...(section.faqs || []), { question: '', answer: '' }] })}>
                <Plus className="h-3 w-3 mr-1" /> Add FAQ
              </Button>
            </div>
          </>)}

          {/* CTA */}
          {section.type === 'cta' && (<>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Heading *</Label>
                <Input value={section.heading || ''} onChange={e => update({ heading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Ready to Buy?" />
              </div>
              <div>
                <Label className="text-xs">Subheading</Label>
                <Input value={section.subheading || ''} onChange={e => update({ subheading: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Don't miss out!" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Button Text</Label>
                <Input value={section.buttonText || ''} onChange={e => update({ buttonText: e.target.value })} className="mt-1 h-8 text-xs" placeholder="Get It Now" />
              </div>
              <div>
                <Label className="text-xs">Button Link</Label>
                <Input value={section.buttonLink || ''} onChange={e => update({ buttonLink: e.target.value })} className="mt-1 h-8 text-xs" placeholder="#buy or /checkout" />
              </div>
            </div>
          </>)}
        </div>
      )}
    </div>
  )
}

interface LandingPageBuilderProps {
  sections: LandingSection[]
  onChange: (sections: LandingSection[]) => void
}

export function LandingPageBuilder({ sections, onChange }: LandingPageBuilderProps) {
  const add = (type: LandingSectionType) => {
    const newSection: LandingSection = {
      id: crypto.randomUUID(),
      type,
      bgColor: '#ffffff',
      textColor: '#1a1a2e',
      align: 'center',
    }
    if (type === 'features') newSection.features = [{ icon: '✨', title: '', description: '' }]
    if (type === 'testimonials') newSection.testimonials = [{ name: '', text: '', rating: 5 }]
    if (type === 'faq') newSection.faqs = [{ question: '', answer: '' }]
    onChange([...sections, newSection])
  }

  const update = (id: string, updated: LandingSection) =>
    onChange(sections.map(s => s.id === id ? updated : s))

  const remove = (id: string) => onChange(sections.filter(s => s.id !== id))

  const moveUp = (idx: number) => {
    if (idx === 0) return
    const next = [...sections]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    onChange(next)
  }

  const moveDown = (idx: number) => {
    if (idx === sections.length - 1) return
    const next = [...sections]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    onChange(next)
  }

  return (
    <div className="space-y-4">
      {/* Sections list */}
      {sections.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400">
          <Layout className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No sections yet. Add sections below to build your landing page.</p>
        </div>
      )}

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
        />
      ))}

      {/* Add section buttons */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">+ Add Section</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(SECTION_LABELS) as LandingSectionType[]).map(type => {
            const { label, icon: Icon, desc } = SECTION_LABELS[type]
            return (
              <button
                key={type}
                type="button"
                onClick={() => add(type)}
                className="flex flex-col items-center gap-1.5 p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-sm transition-all text-center"
              >
                <Icon className="h-5 w-5 text-indigo-500" />
                <span className="text-xs font-semibold text-gray-700">{label}</span>
                <span className="text-[10px] text-gray-400 leading-tight">{desc}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
