export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const results: string[] = []

    try {
        // 1. Add isGuest to users
        try {
            await executeQuery('ALTER TABLE users ADD COLUMN isGuest BOOLEAN DEFAULT 0', [])
            results.push('Added isGuest to users')
        } catch (e: any) {
            results.push('isGuest already exists or error: ' + e.message)
        }

        // 2. Add isGuestOrder to orders
        try {
            await executeQuery('ALTER TABLE orders ADD COLUMN isGuestOrder BOOLEAN DEFAULT 0', [])
            results.push('Added isGuestOrder to orders')
        } catch (e: any) {
            results.push('isGuestOrder already exists or error: ' + e.message)
        }

        // 3. Add guestEmail to orders 
        try {
            await executeQuery('ALTER TABLE orders ADD COLUMN guestEmail TEXT', [])
            results.push('Added guestEmail to orders')
        } catch (e: any) {
            results.push('guestEmail already exists or error: ' + e.message)
        }

        return NextResponse.json({ success: true, results })
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message, results })
    }
}
