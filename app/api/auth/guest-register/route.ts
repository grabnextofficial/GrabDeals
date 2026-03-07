export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { encrypt } from '@/lib/session'
import { cookies } from 'next/headers'

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
// Creates a guest account and auto-logs-in the user via session cookie
export async function POST(request: NextRequest) {
    try {
        const { email, displayName, phone } = await request.json()

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        // Check if user already exists
        const existing = await executeQuery(
            'SELECT uid, email, displayName, isGuest FROM users WHERE email = ? LIMIT 1',
            [email]
        )

        if (existing && existing.length > 0) {
            const existingUser = existing[0] as any
            // User already exists — auto-login them and return info
            const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            const session = await encrypt({
                uid: existingUser.uid,
                email: existingUser.email,
                role: 'user',
                expires
            })
            cookies().set('session', session, { expires, httpOnly: true })

            return NextResponse.json({
                user: {
                    uid: existingUser.uid,
                    email: existingUser.email,
                    displayName: existingUser.displayName,
                    isGuest: existingUser.isGuest === 1
                },
                isExisting: true,
                temporaryPassword: null,
                message: 'Existing account found. You are now logged in.'
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

        // Auto-login: set session cookie
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        const session = await encrypt({
            uid,
            email,
            role: 'user',
            expires
        })
        cookies().set('session', session, { expires, httpOnly: true })

        return NextResponse.json({
            user: { uid, email, displayName: name, isGuest: true },
            isExisting: false,
            temporaryPassword,
            message: `Welcome to Grabnext! A guest account has been created for you. Please save your temporary password to access your downloads: ${temporaryPassword}`
        }, { status: 201 })
    } catch (error: any) {
        console.error('[Guest Register Error]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
