import { Metadata } from 'next'
import { executeQuery } from '@/lib/db'
import { StoreHeader } from '@/components/store-header'
import { Footer } from '@/components/footer'
import { RenderSection } from '@/app/products/[id]/landing-page-view'

export const runtime = 'edge'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    try {
        const rows = await executeQuery('SELECT title, isPublished FROM landing_pages WHERE slug = ?', [params.slug])
        const page = Array.isArray(rows) ? rows[0] : null
        if (!page || !page.isPublished) return { title: 'Page Not Found | GrabNext' }
        return { title: `${page.title} | GrabNext` }
    } catch {
        return { title: 'GrabNext' }
    }
}

export default async function PublicLandingPage({ params }: { params: { slug: string } }) {
    let page = null
    try {
        const rows = await executeQuery('SELECT * FROM landing_pages WHERE slug = ? AND isPublished = 1', [params.slug])
        page = Array.isArray(rows) ? rows[0] : null
    } catch (e) {
        console.error('LP load error', e)
    }

    if (!page) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <StoreHeader />
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Page Not Found</h1>
                    <p className="text-gray-500 max-w-md">The landing page you are looking for does not exist or has been unpublished.</p>
                </div>
                <Footer />
            </div>
        )
    }

    let sections = []
    try {
        sections = typeof page.sections === 'string' ? JSON.parse(page.sections) : page.sections
    } catch { }

    let products = []
    try {
        if (page.productIds) {
            const ids = JSON.parse(page.productIds)
            if (ids.length > 0) {
                const placeholders = ids.map(() => '?').join(',')
                const prodRows = await executeQuery(`SELECT * FROM products WHERE id IN (${placeholders})`, ids)
                products = Array.isArray(prodRows) ? prodRows : []
            }
        }
    } catch { }

    // Use the first product as the main context for checkout links, or a dummy if none
    const mainProduct = products[0] || { id: 'lp-dummy', title: page.title, price: 0 }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <StoreHeader />
            <main className="flex-1">
                {sections.map((sec: any) => (
                    <RenderSection key={sec.id} section={sec} product={mainProduct} />
                ))}
            </main>
            <Footer />
        </div>
    )
}
