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

const SYSTEM_PROMPT = `You are an expert landing page designer and copywriter. 
When asked to create a landing page, return ONLY a valid JSON array of landing page sections.
Each section must follow this TypeScript type:
{
  id: string (use short unique ids like "s1", "s2"),
  type: "hero" | "features" | "text" | "image-text" | "testimonials" | "faq" | "cta" | "form",
  heading?: string,
  subheading?: string,
  buttonText?: string,
  buttonLink?: string,
  bgColor?: string (hex),
  textColor?: string (hex),
  imageUrl?: string (leave empty string "" for hero - user will add AI image),
  features?: [{icon: string (emoji), title: string, description: string}],
  content?: string,
  testimonials?: [{name: string, text: string, rating: number}],
  faqs?: [{question: string, answer: string}],
  formFields?: [{label: string, type: "text"|"email"|"tel"|"textarea", required: boolean, placeholder?: string}],
  formButtonText?: string,
  align?: "left" | "center" | "right",
  paddingY?: "sm" | "md" | "lg",
  animation?: "none" | "fadeIn" | "slideLeft" | "slideRight" | "zoomIn"
}
Use attractive colors, gradients. Always start with a hero section. 
For a sales funnel: hero → features → image-text → testimonials → faq → cta.
Return ONLY the JSON array, no markdown, no explanation.`

async function callNvidia(apiKey: string, model: string, systemPrompt: string, userPrompt: string) {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.8,
            max_tokens: 3000,
            stream: false,
        })
    })
    return res
}

async function callGemini(apiKey: string, model: string, systemPrompt: string, userPrompt: string, jsonMode = true) {
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ parts: [{ text: userPrompt }] }],
                generationConfig: {
                    temperature: 0.8,
                    ...(jsonMode ? { responseMimeType: 'application/json' } : {})
                }
            })
        }
    )
    return res
}

function extractJSON(text: string): any {
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(clean)
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { mode, prompt, productTitle, productPrice, productDescription, sectionType, currentSection, apiKey: bodyApiKey, model: bodyModel } = body

        const settings = await getSettings()
        const nvidiaKey = settings.nvidia_api_key?.trim()
        const nvidiaModel = settings.nvidia_model?.trim() || 'minimaxai/minimax-m1-40k'
        const geminiKey = bodyApiKey || settings.gemini_api_key?.trim()
        const geminiModel = bodyModel || settings.gemini_model?.trim() || 'gemini-2.5-flash'

        // ── TEST MODE ──────────────────────────────────────────────────────────
        if (mode === 'test') {
            if (!geminiKey) return NextResponse.json({ error: 'Gemini API key not configured.' }, { status: 400 })
            const testRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
                { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: 'Say ok.' }] }] }) }
            )
            if (!testRes.ok) { const err = await testRes.json(); return NextResponse.json({ error: err?.error?.message }, { status: 400 }) }
            return NextResponse.json({ ok: true })
        }

        // ── BANNER IMAGE MODE ──────────────────────────────────────────────────
        if (mode === 'banner-image') {
            const imagePrompt = prompt || `professional product banner for ${productTitle || 'a product'}, marketing photography, studio lighting, clean background, high quality`
            const encodedPrompt = encodeURIComponent(imagePrompt)
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=500&nologo=true&seed=${Date.now()}`
            return NextResponse.json({ imageUrl })
        }

        // ── Build user prompt ──────────────────────────────────────────────────
        let userPrompt = ''
        if (mode === 'full') {
            userPrompt = `Create a complete, high-converting sales funnel landing page for:
Product: ${productTitle || 'Product'}
Price: ${productPrice ? `₹${productPrice}` : 'Premium'}
Description: ${productDescription || ''}
Extra Instructions: ${prompt || 'Make it professional, modern, and conversion-focused'}

Structure: hero → features (5-6 items) → image-text → testimonials (3) → FAQ (4-5) → strong CTA
Use attractive gradient colors. Make it premium. Use Indian Rupee ₹ for pricing.
For hero imageUrl, leave it as empty string "".`

        } else if (mode === 'section') {
            userPrompt = `Create a single "${sectionType}" section for a landing page:
Product: ${productTitle || 'Product'}
${prompt ? `Instructions: ${prompt}` : ''}
Return ONLY a JSON array with exactly 1 section of type "${sectionType}".`

        } else if (mode === 'edit-section') {
            // AI edits one specific section with a custom prompt
            userPrompt = `Edit this landing page section based on the instruction below.
Current section data:
${JSON.stringify(currentSection, null, 2)}

Edit instruction: ${prompt}
Product: ${productTitle || 'Product'}

Return ONLY a JSON array with exactly 1 updated section of type "${sectionType}". Keep the same section type and id.`

        } else if (mode === 'copy') {
            const copyRes = await callGemini(geminiKey || '', geminiModel, 'You are a copywriter.', `Generate 3 headline + CTA pairs for: ${productTitle}. Return JSON: [{headline, subheadline, cta}]`, false)
            if (!copyRes.ok) return NextResponse.json({ error: 'AI error' }, { status: 500 })
            const copyData = await copyRes.json()
            const text = copyData.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
            return NextResponse.json({ suggestions: extractJSON(text) })
        }

        // ── Call AI: NVIDIA first, Gemini fallback ─────────────────────────────
        let rawText = ''

        if (nvidiaKey) {
            try {
                const nvidiaRes = await callNvidia(nvidiaKey, nvidiaModel, SYSTEM_PROMPT, userPrompt)
                if (nvidiaRes.ok) {
                    const nvidiaData = await nvidiaRes.json()
                    rawText = nvidiaData?.choices?.[0]?.message?.content || ''
                } else {
                    console.warn('[LP Gen] NVIDIA failed:', nvidiaRes.status)
                }
            } catch (e) {
                console.warn('[LP Gen] NVIDIA error:', e)
            }
        }

        if (!rawText && geminiKey) {
            const geminiRes = await callGemini(geminiKey, geminiModel, SYSTEM_PROMPT, userPrompt)
            if (!geminiRes.ok) {
                const err = await geminiRes.json()
                return NextResponse.json({ error: err?.error?.message || 'Gemini error' }, { status: 500 })
            }
            const geminiData = await geminiRes.json()
            rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
        }

        if (!rawText) {
            return NextResponse.json({ error: 'No AI configured. Add NVIDIA or Gemini key in AI Settings.' }, { status: 400 })
        }

        const sections = extractJSON(rawText)
        return NextResponse.json({ sections })

    } catch (error: any) {
        console.error('[LP Gen Error]', error)
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
    }
}
