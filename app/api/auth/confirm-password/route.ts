export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// POST /api/auth/confirm-password
// Lets a guest user set a permanent password (removes guest status)
export async function POST(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const { newPassword } = await request.json()

        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
        }

        const passwordHash = await hashPassword(newPassword)
        const now = Date.now()

        await executeQuery(
            'UPDATE users SET passwordHash = ?, isGuest = 0, updatedAt = ? WHERE uid = ?',
            [passwordHash, now, session.uid]
        )

        return NextResponse.json({ success: true, message: 'Password confirmed. Your account is now permanent.' })
    } catch (error: any) {
        console.error('[Confirm Password Error]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
