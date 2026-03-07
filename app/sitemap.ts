import { MetadataRoute } from 'next'
import { executeQuery } from '@/lib/db'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Cache for 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://grabnext.in'

    let productEntries: any[] = []
    let categoryEntries: any[] = []

    try {
        // Attempt to fetch active products
        // Wrapped in try-catch because DB might not be available during build/prerender
        const products = await executeQuery('SELECT slug, id, updatedAt FROM products WHERE isActive = 1')
        if (Array.isArray(products)) {
            productEntries = products.map((p: any) => ({
                url: `${baseUrl}/products/${p.slug || p.id}`,
                lastModified: new Date(p.updatedAt || Date.now()),
                changeFrequency: 'daily' as const,
                priority: 0.8,
            }))
        }

        // Attempt to fetch active categories
        const categories = await executeQuery('SELECT slug, updatedAt FROM categories WHERE isActive = 1')
        if (Array.isArray(categories)) {
            categoryEntries = categories.map((c: any) => ({
                url: `${baseUrl}/products?category=${c.slug}`,
                lastModified: new Date(c.updatedAt || Date.now()),
                changeFrequency: 'weekly' as const,
                priority: 0.6,
            }))
        }
    } catch (error) {
        console.error("Sitemap generation error (expected during build if DB is internal):", error)
        // We continue with empty entries to allow the build to succeed
    }

    // Static pages - always included
    const staticPages = [
        '',
        '/products',
        '/about',
        '/contact',
        '/privacy',
        '/terms',
        '/refund',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.5,
    }))

    return [...staticPages, ...productEntries, ...categoryEntries] as MetadataRoute.Sitemap
}
