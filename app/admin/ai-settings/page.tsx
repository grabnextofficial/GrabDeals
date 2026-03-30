"use client"

export const runtime = 'edge'

import { useState, useEffect } from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { Bot, Loader2, Save, CheckCircle2, Eye, EyeOff, Zap, Shield } from "lucide-react"

const GEMINI_MODELS = [
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", desc: "Fast & smart (recommended)" },
    { id: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite", desc: "Very fast, lower cost" },
    { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash", desc: "Reliable & fast" },
    { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", desc: "Most capable" },
    { id: "gemini-2.0-pro-exp", label: "Gemini 2.0 Pro (Exp)", desc: "Experimental, most powerful" },
    { id: "custom", label: "Custom Model", desc: "Enter your own model name" },
]

export default function AISettingsPage() {
    const [apiKey, setApiKey] = useState("")
    const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash")
    const [customModel, setCustomModel] = useState("")
    const [showKey, setShowKey] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [testing, setTesting] = useState(false)
    const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

    useEffect(() => {
        fetch("/api/settings")
            .then(r => r.json())
            .then(data => {
                if (data.gemini_api_key) setApiKey(data.gemini_api_key)
                if (data.gemini_model) {
                    const known = GEMINI_MODELS.find(m => m.id === data.gemini_model)
                    if (known) setSelectedModel(data.gemini_model)
                    else { setSelectedModel("custom"); setCustomModel(data.gemini_model) }
                }
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const handleSave = async () => {
        if (!apiKey.trim()) { toast({ title: "API key required", variant: "destructive" }); return }
        const model = selectedModel === "custom" ? customModel.trim() : selectedModel
        if (!model) { toast({ title: "Model required", variant: "destructive" }); return }
        setSaving(true)
        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gemini_api_key: apiKey.trim(), gemini_model: model }),
            })
            if (!res.ok) throw new Error("Save failed")
            toast({ title: "✅ AI Settings saved!" })
        } catch {
            toast({ title: "Failed to save", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const handleTest = async () => {
        if (!apiKey.trim()) { toast({ title: "Enter API key first", variant: "destructive" }); return }
        const model = selectedModel === "custom" ? customModel.trim() : selectedModel
        setTesting(true)
        setTestResult(null)
        try {
            const res = await fetch("/api/ai/generate-landing-page", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: "test", apiKey: apiKey.trim(), model }),
            })
            const data = await res.json()
            if (res.ok && data.ok) {
                setTestResult({ ok: true, msg: `✅ Connection successful! Model "${model}" is working.` })
            } else {
                setTestResult({ ok: false, msg: `❌ Failed: ${data.error || "Unknown error"}` })
            }
        } catch (e: any) {
            setTestResult({ ok: false, msg: `❌ Error: ${e.message}` })
        } finally {
            setTesting(false)
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
                            Configure Gemini AI for the landing page builder. Admins can generate full pages and section content using AI.
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* API Key Card */}
                            <Card className="border-indigo-100">
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

                            {/* Model Selector Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-yellow-500" />
                                        AI Model
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
                                                {model.id === "gemini-2.0-flash" && (
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

                            {/* Test Result */}
                            {testResult && (
                                <div className={`p-4 rounded-xl border text-sm font-medium ${testResult.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                    {testResult.msg}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button onClick={handleSave} disabled={saving}
                                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8">
                                    {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save Settings</>}
                                </Button>
                                <Button onClick={handleTest} disabled={testing} variant="outline">
                                    {testing ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Testing...</> : <><CheckCircle2 className="h-4 w-4 mr-2" />Test Connection</>}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
