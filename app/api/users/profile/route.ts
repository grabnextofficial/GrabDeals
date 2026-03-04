export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export const dynamic = 'force-dynamic'

async function getUserIdFromCookie(): Promise<string | null> {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('auth-token')?.value
        if (!token) return null

        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'grabnext-local-dev-secret-key-change-in-production')
        const { payload } = await jwtVerify(token, secret)
        return (payload as any).uid || null
    } catch {
        return null
    }
}

// GET /api/users/profile
export async function GET() {
    try {
        const uid = await getUserIdFromCookie()
        if (!uid) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const results = await executeQuery(
            'SELECT uid, email, displayName, role, phone, address, city, state, country, isGuest, createdAt FROM users WHERE uid = ? LIMIT 1',
            [uid]
        )

        if (!results || results.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({ user: results[0] })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PUT /api/users/profile
export async function PUT(request: NextRequest) {
    try {
        const uid = await getUserIdFromCookie()
        if (!uid) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { displayName, phone, address, city, state, country } = await request.json()
        const now = Date.now()

        await executeQuery(
            `UPDATE users SET displayName = ?, phone = ?, address = ?, city = ?, state = ?, country = ?, updatedAt = ? WHERE uid = ?`,
            [displayName || '', phone || '', address || '', city || '', state || '', country || '', now, uid]
        )

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
