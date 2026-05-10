"use client"

import { CartProvider } from '@/contexts/cart-context'
import { RenderSection } from '@/app/products/[id]/landing-page-view'

interface Props {
    sections: any[]
    product: any
}

export default function LandingPagePublicView({ sections, product }: Props) {
    if (!sections || sections.length === 0) {
        return (
            <div className="flex items-center justify-center py-24 text-gray-400">
                <p className="text-lg">This landing page has no content yet.</p>
            </div>
        )
    }

    return (
        <CartProvider>
            {sections.map((sec: any) => (
                <RenderSection key={sec.id} section={sec} product={product} />
            ))}
        </CartProvider>
    )
}
