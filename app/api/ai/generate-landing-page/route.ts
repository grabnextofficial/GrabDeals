export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

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
  imageUrl?: string,
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
Use attractive colors. Always start with a hero section. Return ONLY the JSON array, no markdown, no explanation.`

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { mode, prompt, productTitle, productPrice, productDescription, sectionType, apiKey: bodyApiKey, model: bodyModel } = body

        // Get settings from DB (or use provided keys for test mode)
        const settings = await getSettings()
        const apiKey = bodyApiKey || settings.gemini_api_key
        const model = bodyModel || settings.gemini_model || 'gemini-2.0-flash'

        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API key not configured. Go to Admin → AI Settings.' }, { status: 400 })
        }

        // Test mode — just verify API works
        if (mode === 'test') {
            const testRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: 'Say "ok" if you can hear me.' }] }]
                    })
                }
            )
            if (!testRes.ok) {
                const err = await testRes.json()
                return NextResponse.json({ error: err?.error?.message || 'API error' }, { status: 400 })
            }
            return NextResponse.json({ ok: true })
        }

        let userPrompt = ''

        if (mode === 'full') {
            // Generate complete landing page
            userPrompt = `Create a complete, professional landing page for the following product:
Product Name: ${productTitle || 'Product'}
Price: ${productPrice ? `₹${productPrice}` : 'Premium Price'}
Description: ${productDescription || ''}
Additional Instructions: ${prompt || ''}

Include: hero, features (at least 4), testimonials (at least 2), FAQ (at least 3), and a strong CTA section.
Make it look premium and conversion-focused. Use Indian Rupee (₹) for pricing mentions.`
        } else if (mode === 'section') {
            // Generate a single section
            userPrompt = `Create a single "${sectionType}" section for a landing page about:
Product: ${productTitle || 'Product'}
${prompt ? `Instructions: ${prompt}` : ''}
Return ONLY a JSON array with exactly 1 section of type "${sectionType}".`
        } else if (mode === 'copy') {
            // Generate copy suggestions (headline + CTA)
            const copyRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `Generate 3 compelling headline + CTA button text pairs for a product landing page.
Product: ${productTitle || 'Product'}
${prompt ? `Context: ${prompt}` : ''}
Return ONLY a JSON array: [{headline: string, subheadline: string, cta: string}]`
                            }]
                        }],
                        generationConfig: { temperature: 0.9 }
                    })
                }
            )
            if (!copyRes.ok) {
                const err = await copyRes.json()
                return NextResponse.json({ error: err?.error?.message || 'AI error' }, { status: 500 })
            }
            const copyData = await copyRes.json()
            let text = copyData.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
            text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            const suggestions = JSON.parse(text)
            return NextResponse.json({ suggestions })
        }

        // Call Gemini API
        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                    contents: [{ parts: [{ text: userPrompt }] }],
                    generationConfig: {
                        temperature: 0.8,
                        responseMimeType: 'application/json'
                    }
                })
            }
        )

        if (!geminiRes.ok) {
            const err = await geminiRes.json()
            return NextResponse.json({ error: err?.error?.message || 'Gemini API error' }, { status: 500 })
        }

        const geminiData = await geminiRes.json()
        let rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
        // Strip any markdown code fences just in case
        rawText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

        const sections = JSON.parse(rawText)
        return NextResponse.json({ sections })
    } catch (error: any) {
        console.error('AI generate error:', error)
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
    }
}
