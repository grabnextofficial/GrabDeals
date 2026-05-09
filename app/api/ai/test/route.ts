export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const NVIDIA_API_KEY = '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'
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1'
const NVIDIA_MODEL = 'minimaxai/minimax-m1-40k'

export async function POST(request: NextRequest) {
    const { message = 'Hello! Are you working?' } = await request.json().catch(() => ({}))

    const results: Record<string, any> = {}

    // ── Test NVIDIA MiniMax ────────────────────────────────────────────────────
    const nvidiaStart = Date.now()
    try {
        const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${NVIDIA_API_KEY}`,
            },
            body: JSON.stringify({
                model: NVIDIA_MODEL,
                messages: [
                    { role: 'system', content: 'You are a helpful assistant. Reply very briefly.' },
                    { role: 'user', content: message },
                ],
                temperature: 0.5,
                max_tokens: 100,
                stream: false,
            }),
        })

        const latency = Date.now() - nvidiaStart
        if (res.ok) {
            const data = await res.json()
            const reply = data?.choices?.[0]?.message?.content || '(no content)'
            results.nvidia = {
                ok: true,
                model: NVIDIA_MODEL,
                latency,
                reply,
                usage: data?.usage || null,
            }
        } else {
            const errText = await res.text()
            results.nvidia = {
                ok: false,
                model: NVIDIA_MODEL,
                latency,
                error: `HTTP ${res.status}: ${errText.slice(0, 200)}`,
            }
        }
    } catch (e: any) {
        results.nvidia = {
            ok: false,
            model: NVIDIA_MODEL,
            latency: Date.now() - nvidiaStart,
            error: e.message,
        }
    }

    return NextResponse.json(results)
}
