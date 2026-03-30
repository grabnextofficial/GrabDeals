export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { getSession } from '@/lib/session'

// GET /api/user/product-assets?productId=xxx
// Returns the digital asset list for a purchased product
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')
        if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 })

        const auth = await getSession()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const isAdmin = auth.role === 'admin'

        if (!isAdmin) {
            // Verify user has purchased this product
            const orders = await executeQuery(
                "SELECT items FROM orders WHERE userId = ? AND (status = 'completed' OR status = 'paid')",
                [auth.uid]
            )
            let hasPurchased = false
            for (const order of orders || []) {
                try {
                    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
                    if (Array.isArray(items) && items.some((item: any) => item.productId === productId || item.id === productId)) {
                        hasPurchased = true; break
                    }
                } catch { }
            }
            if (!hasPurchased) return NextResponse.json({ error: 'Not purchased' }, { status: 403 })
        }

        const products = await executeQuery('SELECT downloadUrl, title FROM products WHERE id = ? LIMIT 1', [productId])
        if (!products || products.length === 0) return NextResponse.json({ assets: [] })

        const product = products[0]
        let assets = []
        try { assets = JSON.parse(product.downloadUrl) } catch { assets = [] }

        return NextResponse.json({ assets, productTitle: product.title })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
