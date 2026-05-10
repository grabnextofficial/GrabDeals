export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ─── NVIDIA config is now loaded from DB settings (nvidia_api_key, nvidia_model) ──
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

// ─── FALLBACK: Gemini ─────────────────────────────────────────────────────────
async function callGemini(apiKey: string, model: string, systemPrompt: string, contents: any[]) {
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents,
                generationConfig: { temperature: 0.75, maxOutputTokens: 600 }
            })
        }
    )
    return res
}

// ─── Parse PRODUCT_IDS & ACTION from streamed text ────────────────────────────
function parseReply(rawReply: string, products: any[]) {
    let reply = rawReply

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
            return `[ID:${p.id}|SLUG:${p.slug || ''}] ${p.title} | Category: ${p.category} | Price: ${price}${origPrice}${discount} | ${p.description?.slice(0, 100) || ''}`
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
- Match the user's energy and language!

STRICT SCOPE:
- ONLY answer about GrabNext products, shopping, orders, payments, delivery, returns, and the GrabNext platform
- If off-topic (politics, recipes, general knowledge etc.): "I'm GrabNext AI and I only help with shopping here! Ask me about our amazing products 🛍️"
- Never make up product details not in the catalog

EVERY REPLY MUST:
1. Mention "GrabNext" naturally 
2. Be concise — 2-3 sentences max (unless explaining something)
3. Use emojis naturally ✨🛍️⚡
4. End with PRODUCT_IDS:[id1,id2] on a NEW LINE if you're recommending products (max 3)
5. If user says "add to cart" / "cart mein dalo" / "add kar do" → end with ACTION:ADD_TO_CART on new line
6. If user says "buy now" / "checkout" / "kharidna hai" → end with ACTION:CHECKOUT on new line
7. Never include PRODUCT_IDS if no products match
8. Actions always go after PRODUCT_IDS

GRABNEXT INFO:
- Payment: Razorpay, UPI, Credit/Debit Cards, Net Banking
- Delivery: Digital products → instant; Physical → as per seller
- Returns: 7-day return policy
- Support: grabnext.in/contact

PRODUCT CATALOG:
${productList || 'No products available right now. Check back soon!'}

Be the BEST shopping assistant — make every user feel valued! 🚀`

        // ── STEP 1: Try NVIDIA with STREAMING ────────────────────────────────────
        const nvidiaKey = settings.nvidia_api_key?.trim()
        const nvidiaModel = settings.nvidia_model?.trim() || NVIDIA_MODEL_DEFAULT

        if (nvidiaKey) {
            try {
                const nvidiaMessages = [
                    { role: 'system', content: SYSTEM_PROMPT },
                    ...(history || []).map((m: any) => ({
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
                        temperature: 0.75,
                        top_p: 0.95,
                        max_tokens: 500,
                        stream: true,   // ← STREAMING ON
                    }),
                })

                if (nvidiaRes.ok && nvidiaRes.body) {
                    // ── Stream SSE response to client ──────────────────────────
                    const encoder = new TextEncoder()
                    let fullText = ''

                    const stream = new ReadableStream({
                        async start(controller) {
                            const reader = nvidiaRes.body!.getReader()
                            const decoder = new TextDecoder()

                            try {
                                while (true) {
                                    const { done, value } = await reader.read()
                                    if (done) break

                                    const chunk = decoder.decode(value, { stream: true })
                                    const lines = chunk.split('\n')

                                    for (const line of lines) {
                                        if (!line.startsWith('data: ')) continue
                                        const data = line.slice(6).trim()
                                        if (data === '[DONE]') continue

                                        try {
                                            const parsed = JSON.parse(data)
                                            const token = parsed?.choices?.[0]?.delta?.content
                                            if (token) {
                                                fullText += token
                                                // Send token to client
                                                controller.enqueue(
                                                    encoder.encode(`data: ${JSON.stringify({ token })}\n\n`)
                                                )
                                            }
                                        } catch {}
                                    }
                                }

                                // Done streaming — parse products & action, send final metadata
                                const { reply, suggestedProducts, action } = parseReply(fullText, products)
                                controller.enqueue(
                                    encoder.encode(`data: ${JSON.stringify({ done: true, reply, products: suggestedProducts, action })}\n\n`)
                                )
                            } catch (e) {
                                console.warn('[ShopChat] Stream read error:', e)
                            } finally {
                                controller.close()
                            }
                        }
                    })

                    return new Response(stream, {
                        headers: {
                            'Content-Type': 'text/event-stream',
                            'Cache-Control': 'no-cache',
                            'X-Accel-Buffering': 'no',
                        },
                    })
                } else {
                    const errText = await nvidiaRes.text()
                    console.warn('[ShopChat] NVIDIA failed:', nvidiaRes.status, errText.slice(0, 200))
                }
            } catch (e) {
                console.warn('[ShopChat] NVIDIA error:', e)
            }
        } else {
            console.warn('[ShopChat] NVIDIA API key not configured in settings — skipping NVIDIA')
        }

        // ── STEP 2: Fallback to Gemini (non-streaming) ────────────────────────
        let rawReply = ''
        if (!rawReply) {
            const geminiKey = settings.gemini_api_key?.trim()
            if (geminiKey) {
                const preferredModel = settings.gemini_model?.trim() || 'gemini-2.5-flash'
                const fallbackModel = 'gemini-2.5-pro'

                const contents: any[] = []
                if (Array.isArray(history)) {
                    for (const msg of history) {
                        if (msg.role && msg.text) {
                            contents.push({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] })
                        }
                    }
                }
                contents.push({ role: 'user', parts: [{ text: message }] })

                let geminiRes = await callGemini(geminiKey, preferredModel, SYSTEM_PROMPT, contents)
                if (!geminiRes.ok) {
                    console.warn(`[ShopChat] Gemini ${preferredModel} failed, trying ${fallbackModel}`)
                    geminiRes = await callGemini(geminiKey, fallbackModel, SYSTEM_PROMPT, contents)
                }

                if (geminiRes.ok) {
                    const geminiData = await geminiRes.json()
                    rawReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
                }
            }
        }

        // ── STEP 3: Final fallback message if all models failed ───────────────
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
