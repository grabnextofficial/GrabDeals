export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

async function ensureTables() {
    await executeQuery(`CREATE TABLE IF NOT EXISTS lp_analytics (
        id TEXT PRIMARY KEY, productId TEXT NOT NULL, productSlug TEXT,
        event TEXT NOT NULL, data TEXT, ip TEXT, createdAt INTEGER
    )`)
    await executeQuery(`CREATE TABLE IF NOT EXISTS lp_form_submissions (
        id TEXT PRIMARY KEY, productId TEXT NOT NULL, productTitle TEXT,
        fields TEXT NOT NULL, ip TEXT, createdAt INTEGER
    )`)
}

// POST /api/lp/analytics — record event
export async function POST(request: NextRequest) {
    try {
        await ensureTables()
        const { productId, productSlug, event, data } = await request.json()
        if (!productId || !event) return NextResponse.json({ error: 'productId and event required' }, { status: 400 })
        const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown'
        const id = crypto.randomUUID()
        await executeQuery(
            'INSERT INTO lp_analytics (id, productId, productSlug, event, data, ip, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, productId, productSlug || '', event, data ? JSON.stringify(data) : null, ip, Date.now()]
        )
        return NextResponse.json({ ok: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// GET /api/lp/analytics?productId=xxx — get stats (admin)
export async function GET(request: NextRequest) {
    try {
        await ensureTables()
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')

        if (productId) {
            // Stats for one product
            const views = await executeQuery(
                "SELECT COUNT(*) as count FROM lp_analytics WHERE productId = ? AND event = 'view'",
                [productId]
            )
            const clicks = await executeQuery(
                "SELECT COUNT(*) as count FROM lp_analytics WHERE productId = ? AND event = 'click'",
                [productId]
            )
            const submissions = await executeQuery(
                "SELECT COUNT(*) as count FROM lp_form_submissions WHERE productId = ?",
                [productId]
            )
            return NextResponse.json({
                views: views?.[0]?.count || 0,
                clicks: clicks?.[0]?.count || 0,
                formSubmissions: submissions?.[0]?.count || 0,
            })
        }

        // All products summary
        const summary = await executeQuery(`
            SELECT p.id, p.title, p.slug,
                (SELECT COUNT(*) FROM lp_analytics WHERE productId = p.id AND event = 'view') as views,
                (SELECT COUNT(*) FROM lp_analytics WHERE productId = p.id AND event = 'click') as clicks,
                (SELECT COUNT(*) FROM lp_form_submissions WHERE productId = p.id) as formSubmissions
            FROM products p
            WHERE p.pageType = 'landing'
            ORDER BY views DESC
        `)
        return NextResponse.json({ products: summary || [] })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
