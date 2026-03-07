
export const runtime = 'edge'
import { Metadata, ResolvingMetadata } from 'next'
import { executeQuery } from '@/lib/db'
import { ProductDetailView } from './product-detail-view'
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
        }
    }

    const images = Array.isArray((product as any).images) ? (product as any).images : (product.imageUrl ? [product.imageUrl] : [])
    const previousImages = (await parent).openGraph?.images || []

    return {
        title: `${product.title} - Grabnext`,
        description: product.description?.substring(0, 160) || `Buy ${product.title} at the best price on Grabnext.`,
        openGraph: {
            title: product.title,
            description: product.description?.substring(0, 160),
            images: [...images, ...previousImages],
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: product.title,
            description: product.description?.substring(0, 160),
            images: images,
        },
        alternates: {
            canonical: `https://grabnext.in/products/${(product as any).slug || product.id}`,
        },
        other: {
            'product:price:amount': product.price.toString(),
            'product:price:currency': 'INR',
        }
    }
}

export default async function Page({ params }: Props) {
    const product = await getProduct(params.id)

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
                            "image": Array.isArray((product as any).images) ? (product as any).images : [product.imageUrl],
                            "description": product.description,
                            "sku": product.id,
                            "offers": {
                                "@type": "Offer",
                                "url": `https://grabnext.in/products/${(product as any).slug || product.id}`,
                                "priceCurrency": "INR",
                                "price": product.price,
                                "availability": product.isActive ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
                            }
                        })
                    }}
                />
            )}
            <ProductDetailView product={product as Product} id={params.id} />
        </>
    )
}
