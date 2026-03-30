export const runtime = 'edge'
import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

export async function GET() {
    try {
        await executeQuery('ALTER TABLE products ADD COLUMN pageCode TEXT;')
        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message })
    }
}
