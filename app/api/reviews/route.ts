export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/reviews?productId=xxx
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')

        if (!productId) {
            return NextResponse.json({ error: 'productId is required' }, { status: 400 })
        }

        const reviews = await executeQuery(
            'SELECT * FROM reviews WHERE productId = ? ORDER BY createdAt DESC LIMIT 50',
            [productId]
        )

        // Also get aggregate stats
        const stats = await executeQuery(
            'SELECT COUNT(*) as count, AVG(rating) as avgRating FROM reviews WHERE productId = ?',
            [productId]
        )

        return NextResponse.json({
            reviews,
            stats: {
                count: Number(stats[0]?.count || 0),
                avgRating: Number(stats[0]?.avgRating || 0).toFixed(1),
            }
        })
    } catch (error: any) {
        console.error('[Reviews GET Error]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST /api/reviews
export async function POST(request: NextRequest) {
    try {
        const data = await request.json()

        if (!data.productId || !data.userName || !data.rating) {
            return NextResponse.json({ error: 'productId, userName, and rating are required' }, { status: 400 })
        }

        if (data.rating < 1 || data.rating > 5) {
            return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
        }

        const id = crypto.randomUUID()
        const now = Date.now()

        await executeQuery(
            'INSERT INTO reviews (id, productId, userId, userName, rating, comment, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, data.productId, data.userId || null, data.userName, data.rating, data.comment || '', now]
        )

        return NextResponse.json({ success: true, id }, { status: 201 })
    } catch (error: any) {
        console.error('[Reviews POST Error]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
