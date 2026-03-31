"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/cart-context"
import { Zap, ShoppingCart, Star, Loader2 } from "lucide-react"
import { LandingSection } from "@/lib/types"
import type { Product } from "@/lib/types"

// ─── CSS animations (injected once) ─────────────────────────────────────────
const ANIM_CSS = `
@keyframes lp-fadeIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
@keyframes lp-slideLeft { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: none; } }
@keyframes lp-slideRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: none; } }
@keyframes lp-zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: none; } }
.lp-anim-fadeIn { animation: lp-fadeIn 0.7s ease forwards; }
.lp-anim-slideLeft { animation: lp-slideLeft 0.7s ease forwards; }
.lp-anim-slideRight { animation: lp-slideRight 0.7s ease forwards; }
.lp-anim-zoomIn { animation: lp-zoomIn 0.6s ease forwards; }
.lp-hidden { opacity: 0; }
`

function AnimatedWrapper({ animation, children }: { animation?: string; children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null)
    const [visible, setVisible] = useState(!animation || animation === 'none')

    useEffect(() => {
        if (!animation || animation === 'none') { setVisible(true); return }
        const el = ref.current
        if (!el) return
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) { setVisible(true); obs.disconnect() }
        }, { threshold: 0.1 })
        obs.observe(el)
        return () => obs.disconnect()
    }, [animation])

    const cls = animation && animation !== 'none' && visible ? `lp-anim-${animation}` : (!visible ? 'lp-hidden' : '')
    return <div ref={ref} className={cls}>{children}</div>
}

function getSpacingStyles(section: LandingSection) {
    const basePadding = section.paddingY === 'sm' ? '2rem' : section.paddingY === 'lg' ? '6rem' : '3.5rem'
    return {
        paddingTop: section.paddingTop || basePadding,
        paddingBottom: section.paddingBottom || basePadding,
        marginTop: section.marginTop || '0px',
        marginBottom: section.marginBottom || '0px',
        backgroundColor: section.bgColor || 'transparent',
        color: section.textColor || 'inherit'
    }
}

// ─── Section renderers ────────────────────────────────────────────────────────
function HeroSection({ section, product }: { section: LandingSection; product: Product }) {
    const router = useRouter()
    const { addToCart, setDrawerOpen } = useCart()
    const fmt = (p: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p)
    return (
        <AnimatedWrapper animation={(section as any).animation}>
            <section style={getSpacingStyles(section as LandingSection)} className="px-4">
                <div className={`container mx-auto max-w-5xl flex flex-col ${section.imageUrl ? 'md:flex-row gap-10 items-center' : 'items-center text-center'}`}>
                    <div className={`flex-1 text-${section.align || 'center'}`}>
                        {section.heading && <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4">{section.heading}</h1>}
                        {section.subheading && <p className="text-lg md:text-xl mb-8 opacity-90">{section.subheading}</p>}
                        <div className={`flex flex-col sm:flex-row gap-3 flex-wrap items-center ${section.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                            <span className="text-2xl font-extrabold">{fmt(product.price)}</span>
                            {(product as any).originalPrice && <span className="text-lg opacity-60 line-through">{fmt((product as any).originalPrice)}</span>}
                            <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-8"
                                onClick={() => { addToCart(product); setDrawerOpen(true) }}>
                                <ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart
                            </Button>
                            <Button size="lg" className="bg-white hover:bg-gray-100 text-blue-700 font-bold px-8"
                                onClick={() => { addToCart(product); router.push("/checkout") }}>
                                <Zap className="h-5 w-5 mr-2" />{section.buttonText || "Buy Now"}
                            </Button>
                        </div>
                    </div>
                    {section.imageUrl && (
                        <div className="flex-1 max-w-sm">
                            <img src={section.imageUrl} alt={product.title} className="w-full rounded-2xl shadow-2xl object-contain" />
                        </div>
                    )}
                </div>
            </section>
        </AnimatedWrapper>
    )
}

function FeaturesSection({ section }: { section: LandingSection }) {
    const cols = Math.min(section.features?.length || 3, 3)
    return (
        <AnimatedWrapper animation={(section as any).animation}>
            <section style={getSpacingStyles(section as LandingSection)} className="px-4">
                <div className={`container mx-auto max-w-5xl text-${section.align || 'center'}`}>
                    {section.heading && <h2 className="text-2xl md:text-4xl font-bold mb-3">{section.heading}</h2>}
                    {section.subheading && <p className="text-gray-500 mb-10 text-lg">{section.subheading}</p>}
                    <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-6`}>
                        {(section.features || []).map((f, i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                {f.icon && <div className="text-3xl mb-3">{f.icon}</div>}
                                <h3 className="font-bold text-lg mb-2 text-gray-800">{f.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </AnimatedWrapper>
    )
}

function TextSection({ section }: { section: LandingSection }) {
    return (
        <AnimatedWrapper animation={(section as any).animation}>
            <section style={getSpacingStyles(section as LandingSection)} className="px-4">
                <div className={`container mx-auto max-w-3xl text-${section.align || 'center'}`}>
                    {section.heading && <h2 className="text-2xl md:text-3xl font-bold mb-6">{section.heading}</h2>}
                    {section.content && <div className="prose max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: section.content }} />}
                </div>
            </section>
        </AnimatedWrapper>
    )
}

function ImageTextSection({ section }: { section: LandingSection }) {
    return (
        <AnimatedWrapper animation={(section as any).animation}>
            <section style={getSpacingStyles(section as LandingSection)} className="px-4">
                <div className="container mx-auto max-w-5xl flex flex-col md:flex-row gap-10 items-center">
                    {section.imageUrl && <div className="flex-1"><img src={section.imageUrl} alt={section.heading || ''} className="w-full rounded-2xl shadow-lg object-contain max-h-80" /></div>}
                    <div className={`flex-1 text-${section.align || 'left'}`}>
                        {section.heading && <h2 className="text-2xl md:text-3xl font-bold mb-4">{section.heading}</h2>}
                        {section.content && <div className="prose max-w-none text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: section.content }} />}
                    </div>
                </div>
            </section>
        </AnimatedWrapper>
    )
}

function TestimonialsSection({ section }: { section: LandingSection }) {
    return (
        <AnimatedWrapper animation={(section as any).animation}>
            <section style={getSpacingStyles(section as LandingSection)} className="px-4">
                <div className={`container mx-auto max-w-5xl text-${section.align || 'center'}`}>
                    {section.heading && <h2 className="text-2xl md:text-4xl font-bold mb-10">{section.heading}</h2>}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(section.testimonials || []).map((t, i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-left">
                                <div className="flex mb-3">{Array.from({ length: t.rating || 5 }).map((_, j) => <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}</div>
                                <p className="text-gray-600 text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
                                <p className="font-bold text-gray-800 text-sm">— {t.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </AnimatedWrapper>
    )
}

function FAQSection({ section }: { section: LandingSection }) {
    return (
        <AnimatedWrapper animation={(section as any).animation}>
            <section style={getSpacingStyles(section as LandingSection)} className="px-4">
                <div className={`container mx-auto max-w-3xl text-${section.align || 'center'}`}>
                    {section.heading && <h2 className="text-2xl md:text-4xl font-bold mb-8">{section.heading}</h2>}
                    <div className="space-y-4 text-left">
                        {(section.faqs || []).map((f, i) => (
                            <details key={i} className="group border border-gray-200 rounded-xl overflow-hidden">
                                <summary className="flex items-center justify-between px-5 py-4 font-semibold cursor-pointer hover:bg-gray-50 list-none">
                                    <span>{f.question}</span>
                                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-3">{f.answer}</div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>
        </AnimatedWrapper>
    )
}

function CTASection({ section, product }: { section: LandingSection; product: Product }) {
    const { addToCart } = useCart()
    const router = useRouter()
    const link = section.buttonLink || '/checkout'
    const isCheckout = link === '/checkout' || link === '#buy'
    return (
        <AnimatedWrapper animation={(section as any).animation}>
            <section style={getSpacingStyles(section as LandingSection)} className="px-4 text-${section.align || 'center'}">
                <div className="container mx-auto max-w-3xl">
                    {section.heading && <h2 className="text-2xl md:text-4xl font-extrabold mb-4">{section.heading}</h2>}
                    {section.subheading && <p className="text-lg opacity-90 mb-8">{section.subheading}</p>}
                    {section.buttonText && (
                        <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-10 py-4 text-lg rounded-xl shadow-lg"
                            onClick={isCheckout ? () => { addToCart(product); router.push("/checkout") } : undefined}
                            asChild={!isCheckout}>
                            {isCheckout ? <span><Zap className="h-5 w-5 mr-2 inline" />{section.buttonText}</span>
                                : <Link href={link}><Zap className="h-5 w-5 mr-2 inline" />{section.buttonText}</Link>}
                        </Button>
                    )}
                </div>
            </section>
        </AnimatedWrapper>
    )
}

function FormSection({ section, product }: { section: LandingSection; product: Product }) {
    const [values, setValues] = useState<Record<string, string>>({})
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const fields = (section as any).formFields || []

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await fetch('/api/lp/form-submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: product.id, productTitle: product.title, fields: values }),
            })
            setSubmitted(true)
        } catch { } finally { setSubmitting(false) }
    }

    return (
        <AnimatedWrapper animation={(section as any).animation}>
            <section style={getSpacingStyles(section as LandingSection)} className="px-4">
                <div className={`container mx-auto max-w-lg text-${section.align || 'center'}`}>
                    {section.heading && <h2 className="text-2xl md:text-3xl font-bold mb-6">{section.heading}</h2>}
                    {submitted ? (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                            <div className="text-4xl mb-3">✅</div>
                            <p className="text-green-800 font-semibold text-lg">Thank you! We'll be in touch soon.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4 text-left">
                            {fields.map((f: any, i: number) => (
                                <div key={i}>
                                    <label className="text-sm font-semibold text-gray-700 block mb-1">{f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}</label>
                                    {f.type === 'textarea' ? (
                                        <textarea required={f.required} placeholder={f.placeholder || ''} value={values[f.label] || ''}
                                            onChange={e => setValues(v => ({ ...v, [f.label]: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]" />
                                    ) : (
                                        <input type={f.type} required={f.required} placeholder={f.placeholder || ''} value={values[f.label] || ''}
                                            onChange={e => setValues(v => ({ ...v, [f.label]: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                    )}
                                </div>
                            ))}
                            <Button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3">
                                {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting...</> : (section as any).formButtonText || 'Submit'}
                            </Button>
                        </form>
                    )}
                </div>
            </section>
        </AnimatedWrapper>
    )
}

export function RenderSection({ section, product }: { section: LandingSection; product: Product }) {
    switch (section.type) {
        case 'hero': return <HeroSection section={section} product={product} />
        case 'features': return <FeaturesSection section={section} />
        case 'text': return <TextSection section={section} />
        case 'image-text': return <ImageTextSection section={section} />
        case 'testimonials': return <TestimonialsSection section={section} />
        case 'faq': return <FAQSection section={section} />
        case 'cta': return <CTASection section={section} product={product} />
        case 'form': return <FormSection section={section} product={product} />
        default: return null
    }
}

export function LandingPageView({ product }: { product: Product }) {
    let sections: LandingSection[] = []
    try { if (product.pageCode) sections = JSON.parse(product.pageCode) } catch { }

    // Track page view
    useEffect(() => {
        fetch('/api/lp/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: product.id, productSlug: (product as any).slug, event: 'view' }),
        }).catch(() => { })
    }, [product.id])

    if (sections.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <StoreHeader />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center py-20 text-gray-400">
                        <p className="text-lg font-medium">Landing page has no sections yet.</p>
                        <Link href={`/products/${(product as any).slug || product.id}?type=shop`} className="text-blue-500 underline text-sm mt-2 inline-block">View shop page</Link>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col">
            <style dangerouslySetInnerHTML={{ __html: ANIM_CSS }} />
            <StoreHeader />
            <main className="flex-1">
                {sections.map(section => <RenderSection key={section.id} section={section} product={product} />)}
            </main>
            <Footer />
        </div>
    )
}
