export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

export const dynamic = 'force-dynamic'

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1'
const NVIDIA_MODEL_DEFAULT = 'minimaxai/minimax-m1-40k'

async function getSettings() {
    try {
        const rows = await executeQuery('SELECT key, value FROM settings')
        const s: Record<string, string> = {}
        if (Array.isArray(rows)) for (const r of rows) s[r.key] = r.value
        return s
    } catch { return {} }
}

export async function POST(request: NextRequest) {
    const { message = 'Hello! Are you working?' } = await request.json().catch(() => ({}))

    const settings = await getSettings()
    const nvidiaKey = settings.nvidia_api_key?.trim()
    const nvidiaModel = settings.nvidia_model?.trim() || NVIDIA_MODEL_DEFAULT

    const results: Record<string, any> = {}

    // ── Test NVIDIA ────────────────────────────────────────────────────────────
    const nvidiaStart = Date.now()

    if (!nvidiaKey) {
        results.nvidia = {
            ok: false,
            model: nvidiaModel,
            latency: 0,
            error: 'NVIDIA API key not configured. Please add it in Admin → AI Settings.',
        }
    } else {
        try {
            const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${nvidiaKey}`,
                },
                body: JSON.stringify({
                    model: nvidiaModel,
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
                    model: nvidiaModel,
                    latency,
                    reply,
                    usage: data?.usage || null,
                }
            } else {
                const errText = await res.text()
                results.nvidia = {
                    ok: false,
                    model: nvidiaModel,
                    latency,
                    error: `HTTP ${res.status}: ${errText.slice(0, 300)}`,
                }
            }
        } catch (e: any) {
            results.nvidia = {
                ok: false,
                model: nvidiaModel,
                latency: Date.now() - nvidiaStart,
                error: e.message,
            }
        }
    }

    return NextResponse.json(results)
}
