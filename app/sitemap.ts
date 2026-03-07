import { MetadataRoute } from 'next'
import { executeQuery } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://grabnext.in'

    // Fetch all active products
    const products = await executeQuery('SELECT slug, id, updatedAt FROM products WHERE isActive = 1')
    const productEntries = products.map((p: any) => ({
        url: `${baseUrl}/products/${p.slug || p.id}`,
        lastModified: new Date(p.updatedAt || Date.now()),
        changeFrequency: 'daily' as const,
        priority: 0.8,
    }))

    // Fetch all active categories
    const categories = await executeQuery('SELECT slug, updatedAt FROM categories WHERE isActive = 1')
    const categoryEntries = categories.map((c: any) => ({
        url: `${baseUrl}/products?category=${c.slug}`,
        lastModified: new Date(c.updatedAt || Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
    }))

    // Static pages
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

    return [...staticPages, ...productEntries, ...categoryEntries]
}
