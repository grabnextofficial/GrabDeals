"use client"

export const runtime = 'edge'

import { useState, useEffect } from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { Bot, Loader2, Save, CheckCircle2, Eye, EyeOff, Zap, Shield, Cpu, Activity } from "lucide-react"

const GEMINI_MODELS = [
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", desc: "Stable June 2025 (Fast & Smart)" },
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", desc: "Stable release (Most capable)" },
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", desc: "Reliable & fast multimodal" },
    { id: "gemini-2.0-flash-001", label: "Gemini 2.0 Flash 001", desc: "Stable Jan 2025" },
    { id: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash-Lite", desc: "Very fast, cost efficient" },
    { id: "gemini-2.0-flash-lite-001", label: "Gemini 2.0 Flash-Lite 001", desc: "Stable 2.0 Lite" },
    { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite", desc: "Stable July 2025" },
    { id: "custom", label: "Custom Model", desc: "Enter your own model name" },
]

const NVIDIA_MODELS = [
    { id: "minimaxai/minimax-m1-40k", label: "MiniMax M1 (40K)", desc: "Fast, 40K context window — Recommended" },
    { id: "minimaxai/minimax-m1", label: "MiniMax M1", desc: "Standard context window" },
    { id: "deepseek-ai/deepseek-v4-pro", label: "DeepSeek V4 Pro", desc: "Powerful reasoning model, 16K output" },
    { id: "deepseek-ai/deepseek-r1", label: "DeepSeek R1", desc: "Advanced reasoning & coding" },
    { id: "meta/llama-3.3-70b-instruct", label: "Llama 3.3 70B Instruct", desc: "Meta's flagship open model" },
    { id: "meta/llama-3.1-8b-instruct", label: "Llama 3.1 8B Instruct", desc: "Lightweight & fast" },
    { id: "mistralai/mistral-7b-instruct-v0.3", label: "Mistral 7B Instruct", desc: "Efficient multilingual model" },
    { id: "microsoft/phi-3-mini-128k-instruct", label: "Phi-3 Mini (128K)", desc: "Microsoft, ultra-long context" },
    { id: "google/gemma-3-27b-it", label: "Gemma 3 27B IT", desc: "Google's open model via NVIDIA" },
    { id: "nvidia/llama-3.1-nemotron-70b-instruct", label: "Nemotron 70B Instruct", desc: "NVIDIA's fine-tuned Llama" },
    { id: "custom", label: "Custom Model", desc: "Enter your own NVIDIA model ID" },
]

export default function AISettingsPage() {
    // Gemini
    const [apiKey, setApiKey] = useState("")
    const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash")
    const [customModel, setCustomModel] = useState("")
    const [showKey, setShowKey] = useState(false)

    // NVIDIA
    const [nvidiaKey, setNvidiaKey] = useState("")
    const [selectedNvidiaModel, setSelectedNvidiaModel] = useState("minimaxai/minimax-m1-40k")
    const [customNvidiaModel, setCustomNvidiaModel] = useState("")
    const [showNvidiaKey, setShowNvidiaKey] = useState(false)

    // UI state
    const [loading, setLoading] = useState(true)
    const [savingGemini, setSavingGemini] = useState(false)
    const [savingNvidia, setSavingNvidia] = useState(false)
    const [testingNvidia, setTestingNvidia] = useState(false)
    const [nvidiaTestResult, setNvidiaTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
    const [geminiTestResult, setGeminiTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
    const [testingGemini, setTestingGemini] = useState(false)

    useEffect(() => {
        fetch("/api/settings")
            .then(r => r.json())
            .then(data => {
                // Gemini
                if (data.gemini_api_key) setApiKey(data.gemini_api_key)
                if (data.gemini_model) {
                    const known = GEMINI_MODELS.find(m => m.id === data.gemini_model)
                    if (known) setSelectedModel(data.gemini_model)
                    else { setSelectedModel("custom"); setCustomModel(data.gemini_model) }
                }
                // NVIDIA
                if (data.nvidia_api_key) setNvidiaKey(data.nvidia_api_key)
                if (data.nvidia_model) {
                    const known = NVIDIA_MODELS.find(m => m.id === data.nvidia_model)
                    if (known) setSelectedNvidiaModel(data.nvidia_model)
                    else { setSelectedNvidiaModel("custom"); setCustomNvidiaModel(data.nvidia_model) }
                }
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    // ── Save Gemini ────────────────────────────────────────────────────────────
    const handleSaveGemini = async () => {
        if (!apiKey.trim()) { toast({ title: "API key required", variant: "destructive" }); return }
        const model = selectedModel === "custom" ? customModel.trim() : selectedModel
        if (!model) { toast({ title: "Model required", variant: "destructive" }); return }
        setSavingGemini(true)
        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gemini_api_key: apiKey.trim(), gemini_model: model }),
            })
            if (!res.ok) throw new Error("Save failed")
            toast({ title: "✅ Gemini settings saved!" })
        } catch {
            toast({ title: "Failed to save", variant: "destructive" })
        } finally {
            setSavingGemini(false)
        }
    }

    // ── Save NVIDIA ────────────────────────────────────────────────────────────
    const handleSaveNvidia = async () => {
        if (!nvidiaKey.trim()) { toast({ title: "NVIDIA API key required", variant: "destructive" }); return }
        const model = selectedNvidiaModel === "custom" ? customNvidiaModel.trim() : selectedNvidiaModel
        if (!model) { toast({ title: "NVIDIA model required", variant: "destructive" }); return }
        setSavingNvidia(true)
        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nvidia_api_key: nvidiaKey.trim(), nvidia_model: model }),
            })
            if (!res.ok) throw new Error("Save failed")
            toast({ title: "✅ NVIDIA settings saved!" })
        } catch {
            toast({ title: "Failed to save", variant: "destructive" })
        } finally {
            setSavingNvidia(false)
        }
    }

    // ── Test NVIDIA — via backend to avoid CORS ────────────────────────────────
    const handleTestNvidia = async () => {
        if (!nvidiaKey.trim()) { toast({ title: "Enter NVIDIA API key first", variant: "destructive" }); return }
        const model = selectedNvidiaModel === "custom" ? customNvidiaModel.trim() : selectedNvidiaModel
        setTestingNvidia(true)
        setNvidiaTestResult(null)
        try {
            // First save the key & model to DB, then test via backend route
            await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nvidia_api_key: nvidiaKey.trim(), nvidia_model: model }),
            })
            // Now call server-side test route (no CORS issue)
            const res = await fetch("/api/ai/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Hello! Say OK if you are working." }),
            })
            const data = await res.json()
            if (data?.nvidia?.ok) {
                const reply = data.nvidia.reply || "(no content)"
                setNvidiaTestResult({ ok: true, msg: `✅ NVIDIA connected! Model "${model}" is working. Reply: "${reply.slice(0, 100)}"` })
            } else {
                const err = data?.nvidia?.error || "Unknown error"
                setNvidiaTestResult({ ok: false, msg: `❌ Failed: ${err}` })
            }
        } catch (e: any) {
            setNvidiaTestResult({ ok: false, msg: `❌ Network error: ${e.message}` })
        } finally {
            setTestingNvidia(false)
        }
    }

    // ── Test Gemini ────────────────────────────────────────────────────────────
    const handleTestGemini = async () => {
        if (!apiKey.trim()) { toast({ title: "Enter API key first", variant: "destructive" }); return }
        const model = selectedModel === "custom" ? customModel.trim() : selectedModel
        setTestingGemini(true)
        setGeminiTestResult(null)
        try {
            const res = await fetch("/api/ai/generate-landing-page", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: "test", apiKey: apiKey.trim(), model }),
            })
            const data = await res.json()
            if (res.ok && data.ok) {
                setGeminiTestResult({ ok: true, msg: `✅ Gemini connected! Model "${model}" is working.` })
            } else {
                setGeminiTestResult({ ok: false, msg: `❌ Failed: ${data.error || "Unknown error"}` })
            }
        } catch (e: any) {
            setGeminiTestResult({ ok: false, msg: `❌ Error: ${e.message}` })
        } finally {
            setTestingGemini(false)
        }
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <AdminSidebar />
            <main className="flex-1 overflow-auto p-8">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Bot className="h-8 w-8 text-indigo-600" />
                            AI Settings
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Configure NVIDIA (primary chatbot AI) and Gemini (fallback + landing page builder).
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : (
                        <div className="space-y-8">

                            {/* ─── NVIDIA Section ───────────────────────────────────────────────── */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-7 w-7 rounded-lg bg-green-600 flex items-center justify-center">
                                        <Cpu className="h-4 w-4 text-white" />
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-800">NVIDIA AI <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-1 font-semibold">Primary Chatbot</span></h2>
                                </div>

                                {/* NVIDIA API Key */}
                                <Card className="border-green-100 mb-4">
                                    <div className="h-1 w-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-t-lg" />
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Shield className="h-5 w-5 text-green-600" />
                                            NVIDIA API Key
                                        </CardTitle>
                                        <CardDescription>
                                            Get your free API key from{" "}
                                            <a href="https://build.nvidia.com" target="_blank" rel="noopener noreferrer"
                                                className="text-green-600 underline hover:text-green-800">
                                                build.nvidia.com
                                            </a>{" "}
                                            → Sign in → Get API Key
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label>NVIDIA API Key</Label>
                                            <div className="flex gap-2 mt-1.5">
                                                <Input
                                                    type={showNvidiaKey ? "text" : "password"}
                                                    value={nvidiaKey}
                                                    onChange={e => setNvidiaKey(e.target.value)}
                                                    placeholder="nvapi-..."
                                                    className="font-mono flex-1"
                                                />
                                                <Button variant="outline" size="icon" onClick={() => setShowNvidiaKey(!showNvidiaKey)}>
                                                    {showNvidiaKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">Stored securely in database — not in code or env vars.</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* NVIDIA Model Selector */}
                                <Card className="mb-4">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Zap className="h-5 w-5 text-green-500" />
                                            NVIDIA Model
                                        </CardTitle>
                                        <CardDescription>Choose which NVIDIA model to use for the shop chatbot.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-2">
                                            {NVIDIA_MODELS.map(model => (
                                                <label key={model.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedNvidiaModel === model.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                                    <input type="radio" name="nvidia_model" value={model.id} className="hidden"
                                                        checked={selectedNvidiaModel === model.id}
                                                        onChange={() => setSelectedNvidiaModel(model.id)} />
                                                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedNvidiaModel === model.id ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                                                        {selectedNvidiaModel === model.id && <div className="h-2 w-2 rounded-full bg-white" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-gray-800">{model.label}</p>
                                                        <p className="text-xs text-gray-500">{model.desc}</p>
                                                    </div>
                                                    {model.id === "minimaxai/minimax-m1-40k" && (
                                                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Recommended</span>
                                                    )}
                                                </label>
                                            ))}
                                            {selectedNvidiaModel === "custom" && (
                                                <Input
                                                    value={customNvidiaModel}
                                                    onChange={e => setCustomNvidiaModel(e.target.value)}
                                                    placeholder="e.g. mistralai/mistral-large"
                                                    className="mt-1 font-mono text-sm"
                                                />
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* NVIDIA Test Result */}
                                {nvidiaTestResult && (
                                    <div className={`p-4 rounded-xl border text-sm font-medium mb-4 ${nvidiaTestResult.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                        {nvidiaTestResult.msg}
                                    </div>
                                )}

                                {/* NVIDIA Actions */}
                                <div className="flex gap-3">
                                    <Button onClick={handleSaveNvidia} disabled={savingNvidia}
                                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8">
                                        {savingNvidia ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save NVIDIA Settings</>}
                                    </Button>
                                    <Button onClick={handleTestNvidia} disabled={testingNvidia} variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                                        {testingNvidia ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Testing...</> : <><Activity className="h-4 w-4 mr-2" />Test Connection</>}
                                    </Button>
                                </div>
                            </div>

                            <div className="border-t border-gray-200" />

                            {/* ─── Gemini Section ───────────────────────────────────────────────── */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                                        <Bot className="h-4 w-4 text-white" />
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-800">Gemini AI <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full ml-1 font-semibold">Fallback + Page Builder</span></h2>
                                </div>

                                {/* Gemini API Key Card */}
                                <Card className="border-indigo-100 mb-4">
                                    <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-lg" />
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Shield className="h-5 w-5 text-indigo-500" />
                                            Gemini API Key
                                        </CardTitle>
                                        <CardDescription>
                                            Get your API key from{" "}
                                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
                                                className="text-indigo-600 underline hover:text-indigo-800">
                                                Google AI Studio
                                            </a>{" "}
                                            (free tier available)
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label>API Key</Label>
                                            <div className="flex gap-2 mt-1.5">
                                                <Input
                                                    type={showKey ? "text" : "password"}
                                                    value={apiKey}
                                                    onChange={e => setApiKey(e.target.value)}
                                                    placeholder="AIzaSy..."
                                                    className="font-mono flex-1"
                                                />
                                                <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)}>
                                                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">Stored securely in your database — not in code or env vars.</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Gemini Model Selector Card */}
                                <Card className="mb-4">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Zap className="h-5 w-5 text-yellow-500" />
                                            Gemini Model
                                        </CardTitle>
                                        <CardDescription>Choose which Gemini model to use for generation.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-2">
                                            {GEMINI_MODELS.map(model => (
                                                <label key={model.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedModel === model.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                                    <input type="radio" name="model" value={model.id} className="hidden"
                                                        checked={selectedModel === model.id}
                                                        onChange={() => setSelectedModel(model.id)} />
                                                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedModel === model.id ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
                                                        {selectedModel === model.id && <div className="h-2 w-2 rounded-full bg-white" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-gray-800">{model.label}</p>
                                                        <p className="text-xs text-gray-500">{model.desc}</p>
                                                    </div>
                                                    {model.id === "gemini-2.5-flash" && (
                                                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Recommended</span>
                                                    )}
                                                </label>
                                            ))}
                                            {selectedModel === "custom" && (
                                                <Input
                                                    value={customModel}
                                                    onChange={e => setCustomModel(e.target.value)}
                                                    placeholder="e.g. gemini-2.0-flash-exp"
                                                    className="mt-1 font-mono text-sm"
                                                />
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Gemini Test Result */}
                                {geminiTestResult && (
                                    <div className={`p-4 rounded-xl border text-sm font-medium mb-4 ${geminiTestResult.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                        {geminiTestResult.msg}
                                    </div>
                                )}

                                {/* Gemini Actions */}
                                <div className="flex gap-3">
                                    <Button onClick={handleSaveGemini} disabled={savingGemini}
                                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8">
                                        {savingGemini ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save Gemini Settings</>}
                                    </Button>
                                    <Button onClick={handleTestGemini} disabled={testingGemini} variant="outline">
                                        {testingGemini ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Testing...</> : <><CheckCircle2 className="h-4 w-4 mr-2" />Test Connection</>}
                                    </Button>
                                </div>
                            </div>

                            {/* Info box */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <p className="text-xs font-semibold text-blue-700 mb-1">ℹ️ How the chatbot works</p>
                                <p className="text-xs text-blue-600 leading-relaxed">
                                    <strong>Primary:</strong> NVIDIA (key from above) → <strong>Fallback:</strong> Gemini (key from above) → <strong>Final:</strong> Offline message.
                                    Both keys are stored in the database — no code changes needed to update them.
                                </p>
                            </div>

                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
