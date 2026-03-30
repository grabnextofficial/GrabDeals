export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

async function ensureTable() {
    await executeQuery(`CREATE TABLE IF NOT EXISTS lp_form_submissions (
        id TEXT PRIMARY KEY, productId TEXT NOT NULL, productTitle TEXT,
        fields TEXT NOT NULL, ip TEXT, createdAt INTEGER
    )`)
}

// POST /api/lp/form-submit
export async function POST(request: NextRequest) {
    try {
        await ensureTable()
        const { productId, productTitle, fields } = await request.json()
        if (!productId || !fields) return NextResponse.json({ error: 'productId and fields required' }, { status: 400 })
        const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown'
        const id = crypto.randomUUID()
        await executeQuery(
            'INSERT INTO lp_form_submissions (id, productId, productTitle, fields, ip, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
            [id, productId, productTitle || '', JSON.stringify(fields), ip, Date.now()]
        )
        return NextResponse.json({ ok: true, id })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// GET /api/lp/form-submit — list submissions (admin)
export async function GET(request: NextRequest) {
    try {
        await ensureTable()
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')
        const page = parseInt(searchParams.get('page') || '0')
        const limit = 50

        const rows = productId
            ? await executeQuery(
                'SELECT * FROM lp_form_submissions WHERE productId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
                [productId, limit, page * limit]
            )
            : await executeQuery(
                'SELECT * FROM lp_form_submissions ORDER BY createdAt DESC LIMIT ? OFFSET ?',
                [limit, page * limit]
            )

        return NextResponse.json({
            submissions: (rows || []).map((r: any) => ({
                ...r,
                fields: typeof r.fields === 'string' ? JSON.parse(r.fields) : r.fields,
            }))
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
