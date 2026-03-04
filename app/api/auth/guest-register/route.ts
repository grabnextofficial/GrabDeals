export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

export const dynamic = 'force-dynamic'

function generatePassword(length = 10): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let password = ''
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
}

async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// POST /api/auth/guest-register
export async function POST(request: NextRequest) {
    try {
        const { email, displayName, phone } = await request.json()

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        // Check if user already exists
        const existing = await executeQuery(
            'SELECT uid, email FROM users WHERE email = ? LIMIT 1',
            [email]
        )

        if (existing && existing.length > 0) {
            // User already exists — return their info (they can login normally)
            return NextResponse.json({
                user: { uid: existing[0].uid, email: existing[0].email },
                isExisting: true,
                temporaryPassword: null,
                message: 'Account already exists. Please login to access your account.'
            })
        }

        // Create new guest account
        const uid = crypto.randomUUID()
        const temporaryPassword = generatePassword(10)
        const passwordHash = await hashPassword(temporaryPassword)
        const now = Date.now()
        const name = displayName || email.split('@')[0]

        await executeQuery(
            `INSERT INTO users (uid, email, passwordHash, displayName, role, phone, isGuest, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 'user', ?, 1, ?, ?)`,
            [uid, email, passwordHash, name, phone || '', now, now]
        )

        return NextResponse.json({
            user: { uid, email, displayName: name },
            isExisting: false,
            temporaryPassword,
            message: `Account created! Save your password: ${temporaryPassword}`
        }, { status: 201 })
    } catch (error: any) {
        console.error('[Guest Register Error]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
