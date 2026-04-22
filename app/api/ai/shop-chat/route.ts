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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { message, history } = body

        if (!message?.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        }

        const settings = await getSettings()
        const apiKey = settings.gemini_api_key?.trim()

        if (!apiKey) {
            return NextResponse.json({
                reply: "Hey! I'm GrabNext AI. 👋 It looks like the AI hasn't been configured yet. Please contact the admin to set up the Gemini API key in Admin → Settings.",
                products: [],
                action: null
            })
        }

        // gemini-2.5-flash (fast) → fallback to gemini-2.5-pro
        const preferredModel = settings.gemini_model?.trim() || 'gemini-2.5-flash'
        const fallbackModel  = 'gemini-2.5-pro'

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
- Support: grabnext.com

PRODUCT CATALOG:
${productList || 'No products available right now. Check back soon!'}

Be the BEST shopping assistant — make every user feel valued! 🚀`

        const contents: any[] = []
        if (Array.isArray(history)) {
            for (const msg of history) {
                if (msg.role && msg.text) {
                    contents.push({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] })
                }
            }
        }
        contents.push({ role: 'user', parts: [{ text: message }] })

        // Try preferred model first, then fallback
        let geminiRes = await callGemini(apiKey, preferredModel, SYSTEM_PROMPT, contents)

        if (!geminiRes.ok) {
            console.warn(`[ShopChat] Model ${preferredModel} failed, trying ${fallbackModel}`)
            geminiRes = await callGemini(apiKey, fallbackModel, SYSTEM_PROMPT, contents)
        }

        if (!geminiRes.ok) {
            let errMsg = 'Unknown error'
            try { const errData = await geminiRes.json(); errMsg = errData?.error?.message || errMsg } catch {}
            console.error('[ShopChat] Both models failed:', errMsg)
            return NextResponse.json({
                reply: `GrabNext AI couldn't respond right now. (${errMsg.slice(0, 80)}) Please try again! 🙏`,
                products: [],
                action: null
            })
        }

        const data = await geminiRes.json()
        let rawReply: string = data.candidates?.[0]?.content?.parts?.[0]?.text || "Couldn't get a response. Please try again."

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
            reply: "GrabNext AI ran into an issue. Please try again! 🙏",
            products: [],
            action: null
        })
    }
}
