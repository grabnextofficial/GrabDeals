export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const { amount, currency = 'INR', receipt } = await request.json()

        let keyId: string | undefined
        let keySecret: string | undefined
        try {
            const ctx = getRequestContext()
            keyId = (ctx?.env as any)?.NEXT_PUBLIC_RAZORPAY_KEY_ID
            keySecret = (ctx?.env as any)?.RAZORPAY_KEY_SECRET
        } catch { }
        if (!keyId) keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
        if (!keySecret) keySecret = process.env.RAZORPAY_KEY_SECRET

        if (!keyId || !keySecret) {
            return NextResponse.json({ error: 'Razorpay keys not configured' }, { status: 500 })
        }

        // Create Razorpay order via their API
        const auth = btoa(`${keyId}:${keySecret}`)
        const isZeroDecimal = currency === 'JPY'
        const finalAmount = isZeroDecimal ? Math.round(amount) : Math.round(amount * 100)

        const res = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: finalAmount,
                currency,
                receipt: receipt || `rcpt_${Date.now()}`,
            }),
        })

        if (!res.ok) {
            const err = await res.text()
            return NextResponse.json({ error: `Razorpay error: ${err}` }, { status: 500 })
        }

        const order = await res.json()
        return NextResponse.json({ orderId: order.id, keyId })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
