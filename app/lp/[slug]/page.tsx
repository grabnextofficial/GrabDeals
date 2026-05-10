import { Metadata } from 'next'
import { executeQuery } from '@/lib/db'
import { StoreHeader } from '@/components/store-header'
import { Footer } from '@/components/footer'
import LandingPagePublicView from './public-view'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    try {
        const rows = await executeQuery('SELECT title, isPublished FROM landing_pages WHERE slug = ?', [params.slug])
        const page = Array.isArray(rows) ? rows[0] : null
        if (!page || !page.isPublished) return { title: 'Page Not Found | GrabNext' }
        return {
            title: `${page.title} | GrabNext`,
            description: `${page.title} — exclusive offer on GrabNext`,
        }
    } catch {
        return { title: 'GrabNext' }
    }
}

export default async function PublicLandingPage({ params }: { params: { slug: string } }) {
    let page: any = null
    let sections: any[] = []
    let mainProduct: any = { id: 'lp-dummy', title: 'Product', price: 0 }

    try {
        const rows = await executeQuery('SELECT * FROM landing_pages WHERE slug = ? AND isPublished = 1', [params.slug])
        page = Array.isArray(rows) ? rows[0] : null
    } catch (e) {
        console.error('[LP Public] load error', e)
    }

    if (!page) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <StoreHeader />
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                    <div className="text-5xl mb-4">🔍</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
                    <p className="text-gray-500 max-w-sm">This landing page doesn&apos;t exist or has been unpublished.</p>
                </div>
                <Footer />
            </div>
        )
    }

    try {
        sections = typeof page.sections === 'string' ? JSON.parse(page.sections) : (page.sections || [])
    } catch { sections = [] }

    // Load linked products
    try {
        if (page.productIds) {
            const ids = JSON.parse(page.productIds)
            if (ids.length > 0) {
                const placeholders = ids.map(() => '?').join(',')
                const prodRows = await executeQuery(`SELECT * FROM products WHERE id IN (${placeholders})`, ids)
                const products = Array.isArray(prodRows) ? prodRows : []
                if (products[0]) mainProduct = products[0]
            }
        }
    } catch { }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <StoreHeader />
            <main className="flex-1">
                <LandingPagePublicView sections={sections} product={mainProduct} />
            </main>
            <Footer />
        </div>
    )
}
