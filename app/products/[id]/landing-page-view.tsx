"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/cart-context"
import { Zap, ShoppingCart, Star } from "lucide-react"
import { LandingSection } from "@/lib/types"
import type { Product } from "@/lib/types"

// ─── Section Renderers ─────────────────────────────────────────────────────
function HeroSection({ section, product }: { section: LandingSection; product: Product }) {
    const router = useRouter()
    const { addToCart, setDrawerOpen } = useCart()
    const formatPrice = (p: number) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p)

    const padding = section.paddingY === 'sm' ? 'py-10' : section.paddingY === 'lg' ? 'py-24' : 'py-16'
    return (
        <section
            style={{ backgroundColor: section.bgColor || '#1e40af', color: section.textColor || '#ffffff' }}
            className={`${padding} px-4`}
        >
            <div className={`container mx-auto max-w-5xl flex flex-col ${section.imageUrl ? 'md:flex-row gap-10 items-center' : 'items-center'}`}>
                <div className={`flex-1 text-${section.align || 'center'} ${!section.imageUrl ? 'text-center' : ''}`}>
                    {section.heading && (
                        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4" style={{ color: section.textColor || '#fff' }}>
                            {section.heading}
                        </h1>
                    )}
                    {section.subheading && (
                        <p className="text-lg md:text-xl mb-8 opacity-90" style={{ color: section.textColor || '#fff' }}>
                            {section.subheading}
                        </p>
                    )}
                    {/* Price + Buy buttons */}
                    <div className={`flex flex-col sm:flex-row gap-3 ${section.align === 'center' || !section.imageUrl ? 'justify-center' : 'justify-start'}`}>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold">{formatPrice(product.price)}</span>
                            {(product as any).originalPrice && (
                                <span className="text-lg opacity-60 line-through">{formatPrice((product as any).originalPrice)}</span>
                            )}
                        </div>
                        <Button
                            size="lg"
                            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-8"
                            onClick={() => { addToCart(product); setDrawerOpen(true) }}
                        >
                            <ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart
                        </Button>
                        <Button
                            size="lg"
                            className="bg-white hover:bg-gray-100 text-blue-700 font-bold px-8"
                            onClick={() => { addToCart(product); router.push("/checkout") }}
                        >
                            <Zap className="h-5 w-5 mr-2" />
                            {section.buttonText || "Buy Now"}
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
    )
}

function FeaturesSection({ section }: { section: LandingSection }) {
    const padding = section.paddingY === 'sm' ? 'py-8' : section.paddingY === 'lg' ? 'py-20' : 'py-14'
    return (
        <section style={{ backgroundColor: section.bgColor || '#f8fafc', color: section.textColor || '#1a1a2e' }} className={`${padding} px-4`}>
            <div className={`container mx-auto max-w-5xl text-${section.align || 'center'}`}>
                {section.heading && <h2 className="text-2xl md:text-4xl font-bold mb-3">{section.heading}</h2>}
                {section.subheading && <p className="text-gray-500 mb-10 text-lg">{section.subheading}</p>}
                <div className={`grid grid-cols-1 md:grid-cols-${Math.min(section.features?.length || 3, 3)} gap-6`}>
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
    )
}

function TextSection({ section }: { section: LandingSection }) {
    const padding = section.paddingY === 'sm' ? 'py-8' : section.paddingY === 'lg' ? 'py-20' : 'py-12'
    return (
        <section style={{ backgroundColor: section.bgColor || '#ffffff', color: section.textColor || '#1a1a2e' }} className={`${padding} px-4`}>
            <div className={`container mx-auto max-w-3xl text-${section.align || 'center'}`}>
                {section.heading && <h2 className="text-2xl md:text-3xl font-bold mb-6">{section.heading}</h2>}
                {section.content && (
                    <div className="prose max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: section.content }} />
                )}
            </div>
        </section>
    )
}

function ImageTextSection({ section }: { section: LandingSection }) {
    const padding = section.paddingY === 'sm' ? 'py-8' : section.paddingY === 'lg' ? 'py-20' : 'py-14'
    return (
        <section style={{ backgroundColor: section.bgColor || '#ffffff', color: section.textColor || '#1a1a2e' }} className={`${padding} px-4`}>
            <div className="container mx-auto max-w-5xl flex flex-col md:flex-row gap-10 items-center">
                {section.imageUrl && (
                    <div className="flex-1">
                        <img src={section.imageUrl} alt={section.heading || 'Product'} className="w-full rounded-2xl shadow-lg object-contain max-h-80" />
                    </div>
                )}
                <div className={`flex-1 text-${section.align || 'left'}`}>
                    {section.heading && <h2 className="text-2xl md:text-3xl font-bold mb-4">{section.heading}</h2>}
                    {section.content && (
                        <div className="prose max-w-none text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: section.content }} />
                    )}
                </div>
            </div>
        </section>
    )
}

function TestimonialsSection({ section }: { section: LandingSection }) {
    const padding = section.paddingY === 'sm' ? 'py-8' : section.paddingY === 'lg' ? 'py-20' : 'py-14'
    return (
        <section style={{ backgroundColor: section.bgColor || '#f0f4ff', color: section.textColor || '#1a1a2e' }} className={`${padding} px-4`}>
            <div className={`container mx-auto max-w-5xl text-${section.align || 'center'}`}>
                {section.heading && <h2 className="text-2xl md:text-4xl font-bold mb-10">{section.heading}</h2>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(section.testimonials || []).map((t, i) => (
                        <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-left">
                            <div className="flex mb-3">
                                {Array.from({ length: t.rating || 5 }).map((_, j) => (
                                    <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
                            <p className="font-bold text-gray-800 text-sm">— {t.name}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function FAQSection({ section }: { section: LandingSection }) {
    const padding = section.paddingY === 'sm' ? 'py-8' : section.paddingY === 'lg' ? 'py-20' : 'py-12'
    return (
        <section style={{ backgroundColor: section.bgColor || '#ffffff', color: section.textColor || '#1a1a2e' }} className={`${padding} px-4`}>
            <div className={`container mx-auto max-w-3xl text-${section.align || 'center'}`}>
                {section.heading && <h2 className="text-2xl md:text-4xl font-bold mb-8">{section.heading}</h2>}
                <div className="space-y-4 text-left">
                    {(section.faqs || []).map((f, i) => (
                        <details key={i} className="group border border-gray-200 rounded-xl overflow-hidden">
                            <summary className="flex items-center justify-between px-5 py-4 font-semibold cursor-pointer hover:bg-gray-50 list-none">
                                <span>{f.question}</span>
                                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-3">
                                {f.answer}
                            </div>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    )
}

function CTASection({ section, product }: { section: LandingSection; product: Product }) {
    const { addToCart, setDrawerOpen } = useCart()
    const router = useRouter()
    const padding = section.paddingY === 'sm' ? 'py-8' : section.paddingY === 'lg' ? 'py-20' : 'py-14'
    const link = section.buttonLink || '#'
    const isCheckout = link === '/checkout'
    return (
        <section style={{ backgroundColor: section.bgColor || '#1e3a8a', color: section.textColor || '#fff' }} className={`${padding} px-4 text-${section.align || 'center'}`}>
            <div className="container mx-auto max-w-3xl">
                {section.heading && <h2 className="text-2xl md:text-4xl font-extrabold mb-4">{section.heading}</h2>}
                {section.subheading && <p className="text-lg opacity-90 mb-8">{section.subheading}</p>}
                {section.buttonText && (
                    <Button
                        size="lg"
                        className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-10 py-4 text-lg rounded-xl shadow-lg"
                        onClick={isCheckout ? () => { addToCart(product); router.push("/checkout") } : undefined}
                        asChild={!isCheckout}
                    >
                        {isCheckout ? (
                            <span><Zap className="h-5 w-5 mr-2 inline" />{section.buttonText}</span>
                        ) : (
                            <Link href={link}><Zap className="h-5 w-5 mr-2 inline" />{section.buttonText}</Link>
                        )}
                    </Button>
                )}
            </div>
        </section>
    )
}

// ─── Section Router ─────────────────────────────────────────────────────────
function RenderSection({ section, product }: { section: LandingSection; product: Product }) {
    switch (section.type) {
        case 'hero': return <HeroSection section={section} product={product} />
        case 'features': return <FeaturesSection section={section} />
        case 'text': return <TextSection section={section} />
        case 'image-text': return <ImageTextSection section={section} />
        case 'testimonials': return <TestimonialsSection section={section} />
        case 'faq': return <FAQSection section={section} />
        case 'cta': return <CTASection section={section} product={product} />
        default: return null
    }
}

// ─── Landing Page View ────────────────────────────────────────────────────────
export function LandingPageView({ product }: { product: Product }) {
    let sections: LandingSection[] = []
    try {
        if (product.pageCode) sections = JSON.parse(product.pageCode)
    } catch { }

    if (sections.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <StoreHeader />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center py-20 text-gray-400">
                        <p className="text-lg font-medium">Landing page has no sections yet.</p>
                        <Link href={`/products/${(product as any).slug || product.id}`} className="text-blue-500 underline text-sm mt-2 inline-block">
                            View shop page instead
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col">
            <StoreHeader />
            <main className="flex-1">
                {sections.map(section => (
                    <RenderSection key={section.id} section={section} product={product} />
                ))}
            </main>
            <Footer />
        </div>
    )
}
