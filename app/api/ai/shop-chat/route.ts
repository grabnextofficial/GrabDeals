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
            'SELECT id, title, description, price, originalPrice, category, tags, imageUrl, slug, downloadUrl, isActive, salesCount, createdAt, updatedAt, createdBy FROM products WHERE isActive = 1 ORDER BY createdAt DESC LIMIT 60'
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

        const settings = await getSettings()
        const apiKey = settings.gemini_api_key
        const model = settings.gemini_model || 'gemini-2.0-flash'

        if (!apiKey) {
            return NextResponse.json({
                reply: "Hello! I'm GrabNext AI Assistant. AI configuration hasn't been set up yet. Please contact admin. 🙏",
                products: [],
                action: null
            })
        }

        const products = await getProducts()
        const productList = products.map((p: any) => {
            const price = `₹${Number(p.price).toLocaleString('en-IN')}`
            const origPrice = p.originalPrice ? ` | Original: ₹${Number(p.originalPrice).toLocaleString('en-IN')}` : ''
            const discount = p.originalPrice ? ` | ${Math.round((1 - p.price / p.originalPrice) * 100)}% OFF` : ''
            const slug = p.slug || ''
            return `[ID:${p.id}|SLUG:${slug}] ${p.title} | Category: ${p.category} | Price: ${price}${origPrice}${discount} | ${p.description?.slice(0, 100) || ''}`
        }).join('\n')

        const SYSTEM_PROMPT = `You are GrabNext AI — a premium, intelligent shopping assistant for GrabNext, India's leading online store.

PERSONALITY:
- Friendly, smart, helpful — like a knowledgeable shopping companion
- Confident and enthusiastic about GrabNext's products
- Modern, trendy tone — not robotic or overly formal

LANGUAGE RULES (VERY IMPORTANT):
- Default language: English
- If user writes in Hinglish (Hindi + English mix) → reply in Hinglish naturally
- If user writes in pure Hindi → reply in Hindi
- If user writes in English → reply in English only
- Match the user's vibe and energy!

STRICT SCOPE:
- ONLY answer about GrabNext products, shopping, orders, payments, delivery, returns, and the GrabNext platform
- If asked anything off-topic (politics, recipes, general knowledge, etc.), say: "I'm GrabNext AI and I only help with shopping on GrabNext! Ask me about our amazing products 🛍️"
- Never make up product details not in the catalog

RESPONSE FORMAT RULES:
1. Always mention "GrabNext" naturally in every reply
2. Keep replies concise — 2-3 sentences max unless explaining something complex
3. Use emojis naturally ✨🛍️⚡
4. If recommending products, list product IDs at the END in this EXACT format (hidden from user): PRODUCT_IDS:[id1,id2,id3]
5. If no products match the query, do NOT include PRODUCT_IDS
6. If user asks to add a product to cart, include ACTION:ADD_TO_CART in your response (only when user explicitly asks)
7. If user asks to go to checkout or buy now, include ACTION:CHECKOUT in your response
8. Actions go at the very end after PRODUCT_IDS on a new line

CART COMMANDS (user may say things like):
- "add this to cart" / "cart mein add karo" / "add kar do" → include ACTION:ADD_TO_CART
- "buy now" / "checkout" / "buy karna hai" → include ACTION:CHECKOUT
- "show me products" / "kya available hai" → recommmend products with PRODUCT_IDS

GRABNEXT INFO:
- Platform: GrabNext — India's trusted digital products store
- Payment: Razorpay, UPI, Credit/Debit Cards, Net Banking
- Delivery: Digital products — instant delivery after payment
- Returns: 7-day return policy — contact support
- Support: Available on grabnext.com

CURRENT PRODUCT CATALOG:
${productList || 'No products available currently. Check back soon!'}

Be the best shopping assistant — make every user feel valued and excited to shop at GrabNext! 🚀`

        const contents: any[] = []

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

        contents.push({ role: 'user', parts: [{ text: message }] })

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                    contents,
                    generationConfig: { temperature: 0.75, maxOutputTokens: 600 }
                })
            }
        )

        if (!geminiRes.ok) {
            const err = await geminiRes.json()
            console.error('[ShopChat Gemini Error]', err)
            return NextResponse.json({
                reply: "GrabNext AI is temporarily unavailable. Please try again in a moment! 🙏",
                products: [],
                action: null
            })
        }

        const data = await geminiRes.json()
        let rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "GrabNext AI couldn't respond. Please try again."

        // Extract product IDs
        let suggestedProducts: any[] = []
        const productIdsMatch = rawReply.match(/PRODUCT_IDS:\[([^\]]*)\]/)
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
            rawReply = rawReply.replace(/PRODUCT_IDS:\[[^\]]*\]/g, '').trim()
        }

        // Extract action
        let action: string | null = null
        if (rawReply.includes('ACTION:ADD_TO_CART')) {
            action = 'add_to_cart'
            rawReply = rawReply.replace(/ACTION:ADD_TO_CART/g, '').trim()
        } else if (rawReply.includes('ACTION:CHECKOUT')) {
            action = 'checkout'
            rawReply = rawReply.replace(/ACTION:CHECKOUT/g, '').trim()
        }

        return NextResponse.json({ reply: rawReply, products: suggestedProducts, action })
    } catch (error: any) {
        console.error('[ShopChat Error]', error)
        return NextResponse.json({
            reply: "GrabNext AI ran into a technical issue. Please try again! 🙏",
            products: [],
            action: null
        })
    }
}
