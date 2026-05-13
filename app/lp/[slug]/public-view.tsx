"use client"

import { useEffect } from 'react'
import { useCart, CartProvider } from '@/contexts/cart-context'
import { RenderSection } from '@/app/products/[id]/landing-page-view'

interface Props {
    sections: any[]
    product: any
}

export default function LandingPagePublicView({ sections, product }: Props) {
    const { addToCart, setDrawerOpen } = useCart()

    useEffect(() => {
        if (typeof sections !== 'string') return

        const handleBuyClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (target && (target.id === 'lp-buy-button' || target.closest('#lp-buy-button'))) {
                e.preventDefault()
                addToCart(product)
                setDrawerOpen(true)
            }
        }

        document.addEventListener('click', handleBuyClick)
        return () => document.removeEventListener('click', handleBuyClick)
    }, [sections, addToCart, product, setDrawerOpen])

    if (!sections || (Array.isArray(sections) && sections.length === 0)) {
        return (
            <div className="flex items-center justify-center py-24 text-gray-400">
                <p className="text-lg">This landing page has no content yet.</p>
            </div>
        )
    }

    if (typeof sections === 'string') {
        return (
            <div className="w-full lp-preview-container" dangerouslySetInnerHTML={{ __html: sections }} />
        )
    }

    return (
        <>
            {sections.map((sec: any) => (
                <RenderSection key={sec.id} section={sec} product={product} />
            ))}
        </>
    )
}

// Wrapper to provide Cart Context
export function LandingPagePublicWrapper(props: Props) {
    return (
        <CartProvider>
            <LandingPagePublicView {...props} />
        </CartProvider>
    )
}
