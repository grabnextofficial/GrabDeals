export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const results = await executeQuery(
      "SELECT * FROM orders ORDER BY createdAt DESC"
    )

    const orders = results.map((o: any) => ({
      ...o,
      items: o.items ? JSON.parse(o.items) : []
    }))

    return NextResponse.json(orders)
  } catch (error: any) {
    console.error("[v0] Orders API Error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const id = "ORD-" + crypto.randomUUID().slice(0, 8).toUpperCase()
    const now = Date.now()

    await executeQuery(`
      INSERT INTO orders (id, userId, items, totalAmount, status, paymentId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      data.userId || 'guest',
      JSON.stringify(data.items || []),
      data.totalAmount || 0,
      data.status || 'pending',
      data.paymentId || null,
      now,
      now
    ])

    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Create Order Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, status, paymentId } = data

    if (!id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    const now = Date.now()
    await executeQuery(`
      UPDATE orders 
      SET status = ?, paymentId = ?, updatedAt = ?
      WHERE id = ?
    `, [status || 'paid', paymentId || null, now, id])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Update Order Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

