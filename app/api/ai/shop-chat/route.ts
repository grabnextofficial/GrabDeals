export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

export const dynamic = 'force-dynamic'

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
            'SELECT id, title, description, price, originalPrice, category, tags, imageUrl, slug FROM products WHERE isActive = 1 ORDER BY createdAt DESC LIMIT 50'
        )
        return Array.isArray(rows) ? rows : []
    } catch { return [] }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { message, history } = body

        if (!message?.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        }

        // Get Gemini API key from settings
        const settings = await getSettings()
        const apiKey = settings.gemini_api_key
        const model = settings.gemini_model || 'gemini-2.0-flash'

        if (!apiKey) {
            return NextResponse.json({
                reply: 'Namaskar! Main GrabNext AI Assistant hoon. Abhi AI configuration complete nahi hui hai. Please admin se contact karein. 🙏'
            })
        }

        // Fetch product catalog to give AI product knowledge
        const products = await getProducts()
        const productList = products.map((p: any) => {
            const price = `₹${Number(p.price).toLocaleString('en-IN')}`
            const originalPrice = p.originalPrice ? ` (Original: ₹${Number(p.originalPrice).toLocaleString('en-IN')})` : ''
            const discount = p.originalPrice
                ? ` | ${Math.round((1 - p.price / p.originalPrice) * 100)}% OFF`
                : ''
            return `- ${p.title} | Category: ${p.category} | Price: ${price}${originalPrice}${discount} | ${p.description?.slice(0, 120) || ''}`
        }).join('\n')

        const SYSTEM_PROMPT = `You are GrabNext AI Shopping Assistant — a friendly, helpful, and knowledgeable assistant for the GrabNext online shopping platform.

Your name is "GrabNext AI" and you always represent GrabNext proudly.

RULES (follow strictly):
1. ONLY answer questions related to GrabNext products, shopping, orders, payments, delivery, returns, and the GrabNext platform.
2. For EVERY reply, start or end with "GrabNext" mentioned naturally (e.g., "At GrabNext, ...", "GrabNext mein...", "GrabNext ki taraf se...", etc.)
3. If asked anything unrelated (politics, general knowledge, cooking recipes, etc.), politely say: "Main sirf GrabNext shopping se related sawaalon ke jawab de sakta hoon. Koi bhi product ya shopping related sawaal puchein! 😊"
4. Be conversational — reply in the same language the user uses (Hindi/English/Hinglish).
5. Keep replies concise but helpful — max 3-4 sentences unless detailed info is needed.
6. Use emojis naturally to be friendly 🛍️✨.
7. If user asks about a product, check the catalog below and recommend relevant ones with prices.
8. For order/payment issues, ask them to visit their Dashboard or contact support at grabnext.com.
9. Never make up prices or product details not in the catalog.
10. Always be positive about GrabNext — never say anything negative about the platform.

GRABNEXT PLATFORM INFO:
- Website: GrabNext (grabnext.com)
- Payment: Razorpay, UPI, Cards accepted
- Delivery: Digital products delivered instantly, physical products as per seller
- Returns: Contact support within 7 days 
- Support: Available through website

CURRENT PRODUCT CATALOG:
${productList || 'No products available currently. New products coming soon!'}

Remember: You are GrabNext AI — shopping ka sabse accha dost! 🛍️`

        // Build conversation history for multi-turn chat
        const contents = []

        if (Array.isArray(history)) {
            for (const msg of history) {
                if (msg.role && msg.text) {
                    contents.push({
                        role: msg.role === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.text }]
                    })
                }
            }
        }

        // Add current message
        contents.push({
            role: 'user',
            parts: [{ text: message }]
        })

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                    contents,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 512,
                    }
                })
            }
        )

        if (!geminiRes.ok) {
            const err = await geminiRes.json()
            console.error('[ShopChat Gemini Error]', err)
            return NextResponse.json({
                reply: 'GrabNext AI abhi thodi der ke liye unavailable hai. Please thodi der baad try karein. 🙏'
            })
        }

        const data = await geminiRes.json()
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'GrabNext AI se koi response nahi mila. Please dobara try karein.'

        return NextResponse.json({ reply })
    } catch (error: any) {
        console.error('[ShopChat Error]', error)
        return NextResponse.json({
            reply: 'GrabNext AI mein kuch technical issue aa gaya. Please thodi der baad try karein. 🙏'
        })
    }
}
