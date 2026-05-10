export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
    // Proxy to landing-pages API by slug lookup
    const { executeQuery } = await import('@/lib/db')
    try {
        const rows = await executeQuery(
            'SELECT * FROM landing_pages WHERE slug = ? AND isPublished = 1',
            [params.slug]
        )
        const page = Array.isArray(rows) ? rows[0] : null
        if (!page) return NextResponse.json({ error: 'Page not found or not published' }, { status: 404 })
        return NextResponse.json(page)
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
