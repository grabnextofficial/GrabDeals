
export const runtime = 'edge'
import { Metadata, ResolvingMetadata } from 'next'
import { executeQuery } from '@/lib/db'
import { ProductDetailView } from './product-detail-view'
import { LandingPageView } from './landing-page-view'
import { Product } from '@/lib/types'

type Props = {
    params: { id: string }
    searchParams: { [key: string]: string | string[] | undefined }
}

function tryParse(str: string) { try { return JSON.parse(str) } catch { return [] } }

async function getProduct(id: string): Promise<Product | null> {
    try {
        // Try by slug first, then by id
        let results = await executeQuery('SELECT * FROM products WHERE slug = ? LIMIT 1', [id])
        if (!results || results.length === 0) {
            results = await executeQuery('SELECT * FROM products WHERE id = ? LIMIT 1', [id])
        }
        if (!results || results.length === 0) return null

        const row = results[0]
        return {
            ...row,
            tags: row.tags ? tryParse(row.tags) : [],
            images: row.images ? tryParse(row.images) : (row.imageUrl ? [row.imageUrl] : []),
            isActive: Boolean(row.isActive),
            price: Number(row.price),
            originalPrice: row.originalPrice ? Number(row.originalPrice) : null,
            salesCount: Number(row.salesCount),
            pageType: row.pageType || 'shop',
        } as Product
    } catch (error) {
        console.error("Error fetching product:", error)
        return null
    }
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const id = params.id
    const product = await getProduct(id)

    if (!product) {
        return {
            title: 'Product Not Found - Grabnext',
            description: 'The product you are looking for could not be found on Grabnext.',
        }
    }

    const images = Array.isArray((product as any).images) ? (product as any).images : (product.imageUrl ? [product.imageUrl] : [])
    const previousImages = (await parent).openGraph?.images || []

    // Strip HTML tags for clean description
    const cleanDescription = product.description
        ? product.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 160)
        : `Buy ${product.title} at the best price on Grabnext. Instant digital delivery. 100% secure payment.`

    // Build rich keyword list for AI and search discovery
    const keywordParts = [
        product.title,
        product.category,
        `buy ${product.title}`,
        `${product.title} price`,
        `${product.title} online`,
        `${product.category} digital download`,
        `best ${product.category}`,
        `${product.title} india`,
        'grabnext',
        'digital download',
        'instant delivery',
        'buy online india',
    ]
    if ((product as any).tags && Array.isArray((product as any).tags)) {
        keywordParts.push(...(product as any).tags)
    }
    const keywords = keywordParts.filter(Boolean).join(', ')

    const canonicalUrl = `https://grabnext.in/products/${(product as any).slug || product.id}`
    const priceStr = `₹${product.price}`

    return {
        title: `${product.title} - Buy Online at ₹${product.price} | Grabnext`,
        description: cleanDescription,
        keywords,
        authors: [{ name: 'Grabnext', url: 'https://grabnext.in' }],
        creator: 'Grabnext',
        publisher: 'Grabnext',
        category: product.category,
        openGraph: {
            title: `${product.title} | ${priceStr} - Grabnext`,
            description: cleanDescription,
            images: [...images, ...previousImages],
            type: 'website',
            url: canonicalUrl,
            siteName: 'Grabnext',
            locale: 'en_IN',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${product.title} | ${priceStr} - Grabnext`,
            description: cleanDescription,
            images: images,
            site: '@grabnext',
            creator: '@grabnext',
        },
        alternates: {
            canonical: canonicalUrl,
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-image-preview': 'large',
                'max-snippet': -1,
                'max-video-preview': -1,
            },
        },
        other: {
            'product:price:amount': product.price.toString(),
            'product:price:currency': 'INR',
            'product:availability': product.isActive ? 'in stock' : 'out of stock',
            'product:condition': 'new',
            'product:category': product.category || '',
            // AI assistant discovery tags
            'ai:summary': cleanDescription,
            'ai:price': priceStr,
            'ai:category': product.category || '',
        }
    }
}

export default async function Page({ params }: Props) {
    const product = await getProduct(params.id)

    // If pageType is 'landing', render the custom landing page instead of shop page
    if (product?.pageType === 'landing') {
        return <LandingPageView product={product} />
    }

    // Build clean description for structured data
    const cleanDesc = product?.description
        ? product.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        : ''

    const productImages = Array.isArray((product as any)?.images) ? (product as any).images : [product?.imageUrl].filter(Boolean)

    return (
        <>
            {product && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org/",
                            "@type": "Product",
                            "name": product.title,
                            "description": cleanDesc,
                            "image": productImages,
                            "sku": (product as any).slug || product.id,
                            "mpn": product.id,
                            "brand": {
                                "@type": "Brand",
                                "name": "Grabnext"
                            },
                            "category": product.category,
                            "url": `https://grabnext.in/products/${(product as any).slug || product.id}`,
                            "offers": {
                                "@type": "Offer",
                                "url": `https://grabnext.in/products/${(product as any).slug || product.id}`,
                                "priceCurrency": "INR",
                                "price": product.price,
                                "priceValidUntil": new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                "availability": product.isActive ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                                "itemCondition": "https://schema.org/NewCondition",
                                "seller": {
                                    "@type": "Organization",
                                    "name": "Grabnext",
                                    "url": "https://grabnext.in"
                                }
                            },
                            ...(product.tags && Array.isArray(product.tags) && product.tags.length > 0 ? {
                                "keywords": product.tags.join(', ')
                            } : {})
                        })
                    }}
                />
            )}
            <ProductDetailView product={product as Product} id={params.id} />
        </>
    )
}
