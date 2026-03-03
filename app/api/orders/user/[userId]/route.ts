import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const results = await executeQuery(
      "SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC",
      [params.userId]
    )

    const orders = results.map((o: any) => ({
      ...o,
      items: o.items ? JSON.parse(o.items) : []
    }))

    return NextResponse.json(orders)
  } catch (error: any) {
    console.error("[v0] User Orders API Error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
