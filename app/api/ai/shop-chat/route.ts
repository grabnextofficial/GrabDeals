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

async function getProducts() {
    try {
        const rows = await executeQuery(
            'SELECT id, title, description, price, originalPrice, category, tags, imageUrl, slug, downloadUrl, isActive, salesCount, createdAt, updatedAt, createdBy FROM products WHERE isActive = 1 ORDER BY createdAt DESC LIMIT 60'
        )
        return Array.isArray(rows) ? rows : []
    } catch { return [] }
}

async function callGemini(apiKey: string, model: string, systemPrompt: string, contents: any[]) {
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents,
                generationConfig: { temperature: 0.75, maxOutputTokens: 500 }
            })
        }
    )
    return res
}

function parseReply(rawReply: string, products: any[]) {
    let reply = rawReply.trim()

    let suggestedProducts: any[] = []
    const productIdsMatch = reply.match(/PRODUCT_IDS:\[([^\]]*)\]/)
    if (productIdsMatch) {
        const ids = productIdsMatch[1].split(',').map((id: string) => id.trim()).filter(Boolean)
        suggestedProducts = products
            .filter((p: any) => ids.includes(String(p.id)))
            .slice(0, 3)
            .map((p: any) => ({
                id: p.id,
                title: p.title,
                description: p.description || '',
                price: Number(p.price),
                originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
                category: p.category,
                imageUrl: p.imageUrl || '',
                slug: p.slug || '',
                downloadUrl: p.downloadUrl || '',
                isActive: true,
                salesCount: Number(p.salesCount || 0),
                tags: [],
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
                createdBy: p.createdBy || 'admin',
            }))
        reply = reply.replace(/PRODUCT_IDS:\[[^\]]*\]/g, '').trim()
    }

    let action: string | null = null
    if (reply.includes('ACTION:ADD_TO_CART')) {
        action = 'add_to_cart'
        reply = reply.replace(/ACTION:ADD_TO_CART/g, '').trim()
    } else if (reply.includes('ACTION:CHECKOUT')) {
        action = 'checkout'
        reply = reply.replace(/ACTION:CHECKOUT/g, '').trim()
    }

    return { reply, suggestedProducts, action }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { message, history } = body

        if (!message?.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        }

        const settings = await getSettings()
        const products = await getProducts()

        const productList = products.map((p: any) => {
            const price = `₹${Number(p.price).toLocaleString('en-IN')}`
            const origPrice = p.originalPrice ? ` | Original: ₹${Number(p.originalPrice).toLocaleString('en-IN')}` : ''
            const discount = p.originalPrice ? ` | ${Math.round((1 - p.price / p.originalPrice) * 100)}% OFF` : ''
            return `[ID:${p.id}|SLUG:${p.slug || ''}] ${p.title} | Category: ${p.category} | Price: ${price}${origPrice}${discount} | ${p.description?.slice(0, 80) || ''}`
        }).join('\n')

        const SYSTEM_PROMPT = `You are GrabNext AI — a premium, intelligent shopping assistant for GrabNext, India's trusted online store.

PERSONALITY & TONE:
- Friendly, smart, enthusiastic — like a knowledgeable shopping companion
- Modern and trendy — not robotic or stiff
- Always make users excited to shop at GrabNext!

LANGUAGE RULES (follow strictly):
- DEFAULT language: English
- If user writes in Hinglish → reply in Hinglish naturally and warmly
- If user writes in Hindi → reply in Hindi
- If user writes in English → reply in English only

STRICT SCOPE:
- ONLY answer about GrabNext products, shopping, orders, payments, delivery, returns
- If off-topic: "I'm GrabNext AI and I only help with shopping here! Ask me about our amazing products 🛍️"

EVERY REPLY MUST:
1. Be concise — 2-3 sentences max
2. Use emojis naturally ✨🛍️⚡
3. End with PRODUCT_IDS:[id1,id2] on a NEW LINE if recommending products (max 3)
4. If user says "add to cart" → end with ACTION:ADD_TO_CART on new line
5. If user says "buy now" / "checkout" → end with ACTION:CHECKOUT on new line

GRABNEXT INFO:
- Payment: Razorpay, UPI, Credit/Debit Cards
- Delivery: Digital → instant; Physical → as per seller
- Returns: 7-day return policy

PRODUCT CATALOG:
${productList || 'No products available right now.'}

Be the BEST shopping assistant! 🚀`

        let rawReply = ''

        // ── STEP 1: NVIDIA (non-streaming, fast) ─────────────────────────────
        const nvidiaKey = settings.nvidia_api_key?.trim()
        const nvidiaModel = settings.nvidia_model?.trim() || NVIDIA_MODEL_DEFAULT

        if (nvidiaKey) {
            try {
                const nvidiaMessages = [
                    { role: 'system', content: SYSTEM_PROMPT },
                    ...(history || []).slice(-8).map((m: any) => ({
                        role: m.role === 'user' ? 'user' : 'assistant',
                        content: m.text,
                    })),
                    { role: 'user', content: message },
                ]

                const nvidiaRes = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${nvidiaKey}`,
                    },
                    body: JSON.stringify({
                        model: nvidiaModel,
                        messages: nvidiaMessages,
                        temperature: 0.7,
                        top_p: 0.9,
                        max_tokens: 300,   // short = fast = no timeout
                        stream: false,
                    }),
                })

                if (nvidiaRes.ok) {
                    const nvidiaData = await nvidiaRes.json()
                    rawReply = nvidiaData?.choices?.[0]?.message?.content || ''
                    if (rawReply) console.log('[ShopChat] Responded via NVIDIA:', nvidiaModel)
                } else {
                    const errText = await nvidiaRes.text()
                    console.warn('[ShopChat] NVIDIA failed:', nvidiaRes.status, errText.slice(0, 150))
                }
            } catch (e) {
                console.warn('[ShopChat] NVIDIA error:', e)
            }
        }

        // ── STEP 2: Gemini fallback ───────────────────────────────────────────
        if (!rawReply) {
            const geminiKey = settings.gemini_api_key?.trim()
            if (geminiKey) {
                const preferredModel = settings.gemini_model?.trim() || 'gemini-2.5-flash'
                const contents: any[] = []
                if (Array.isArray(history)) {
                    for (const msg of history.slice(-8)) {
                        if (msg.role && msg.text) {
                            contents.push({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] })
                        }
                    }
                }
                contents.push({ role: 'user', parts: [{ text: message }] })

                try {
                    const geminiRes = await callGemini(geminiKey, preferredModel, SYSTEM_PROMPT, contents)
                    if (geminiRes.ok) {
                        const geminiData = await geminiRes.json()
                        rawReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
                        if (rawReply) console.log('[ShopChat] Responded via Gemini:', preferredModel)
                    }
                } catch (e) {
                    console.warn('[ShopChat] Gemini error:', e)
                }
            }
        }

        // ── STEP 3: Final fallback ────────────────────────────────────────────
        if (!rawReply) {
            return NextResponse.json({
                reply: "GrabNext AI is taking a quick break 🙏 Please try again in a moment!",
                products: [],
                action: null
            })
        }

        const { reply, suggestedProducts, action } = parseReply(rawReply, products)
        return NextResponse.json({ reply, products: suggestedProducts, action })

    } catch (error: any) {
        console.error('[ShopChat Error]', error)
        return NextResponse.json({
            reply: "GrabNext AI ran into an issue. Please try again! 🙏",
            products: [],
            action: null
        })
    }
}
