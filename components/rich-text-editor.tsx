"use client"

import { useRef, useEffect, useCallback } from "react"
import { Bold, Italic, Underline, List, Highlighter, Type } from "lucide-react"

interface RichTextEditorProps {
    value: string
    onChange: (html: string) => void
    placeholder?: string
    minHeight?: number
}

const COLORS = ["#000000", "#e53e3e", "#2b6cb0", "#276749", "#b7791f", "#6b46c1", "#c05621"]
const HIGHLIGHTS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fde68a", "#fce7f3"]

export function RichTextEditor({ value, onChange, placeholder = "Write description...", minHeight = 200 }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || ""
        }
    }, [])

    const exec = useCallback((cmd: string, val?: string) => {
        document.execCommand(cmd, false, val)
        editorRef.current?.focus()
        onChange(editorRef.current?.innerHTML || "")
    }, [onChange])

    const handleInput = () => onChange(editorRef.current?.innerHTML || "")

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden ring-offset-0 focus-within:ring-2 focus-within:ring-primary/30">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
                <ToolBtn onClick={() => exec("bold")} title="Bold"><Bold className="h-3.5 w-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec("italic")} title="Italic"><Italic className="h-3.5 w-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec("underline")} title="Underline"><Underline className="h-3.5 w-3.5" /></ToolBtn>
                <div className="w-px h-4 bg-gray-300 mx-1" />
                <ToolBtn onClick={() => exec("insertUnorderedList")} title="Bullet List"><List className="h-3.5 w-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec("insertOrderedList")} title="Numbered List"><span className="text-[11px] font-bold">1.</span></ToolBtn>
                <div className="w-px h-4 bg-gray-300 mx-1" />
                {/* Font size */}
                <select
                    title="Font Size"
                    className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white"
                    onChange={(e) => exec("fontSize", e.target.value)}
                    defaultValue=""
                >
                    <option value="" disabled>Size</option>
                    <option value="2">Small</option>
                    <option value="3">Normal</option>
                    <option value="4">Large</option>
                    <option value="5">X-Large</option>
                </select>
                <div className="w-px h-4 bg-gray-300 mx-1" />
                {/* Text colors */}
                <div className="flex gap-0.5 items-center" title="Text Color">
                    <Type className="h-3 w-3 text-gray-400" />
                    {COLORS.map((c) => (
                        <button
                            key={c}
                            type="button"
                            title={c}
                            onClick={() => exec("foreColor", c)}
                            className="h-4 w-4 rounded border border-gray-300 hover:scale-110 transition-transform"
                            style={{ background: c }}
                        />
                    ))}
                </div>
                <div className="w-px h-4 bg-gray-300 mx-1" />
                {/* Highlights */}
                <div className="flex gap-0.5 items-center" title="Highlight">
                    <Highlighter className="h-3 w-3 text-gray-400" />
                    {HIGHLIGHTS.map((c) => (
                        <button
                            key={c}
                            type="button"
                            title={`Highlight ${c}`}
                            onClick={() => exec("hiliteColor", c)}
                            className="h-4 w-4 rounded border border-gray-300 hover:scale-110 transition-transform"
                            style={{ background: c }}
                        />
                    ))}
                </div>
                <div className="w-px h-4 bg-gray-300 mx-1" />
                <ToolBtn onClick={() => exec("removeFormat")} title="Clear Formatting"><span className="text-[10px]">Tx</span></ToolBtn>
            </div>

            {/* Editable area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                data-placeholder={placeholder}
                className="p-3 focus:outline-none text-sm leading-relaxed min-h-[var(--editor-min-h)] prose max-w-none"
                style={{ minHeight: `${minHeight}px`, "--editor-min-h": `${minHeight}px` } as any}
            />
            <style>{`[contenteditable]:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; }`}</style>
        </div>
    )
}

function ToolBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
    return (
        <button
            type="button"
            title={title}
            onMouseDown={(e) => { e.preventDefault(); onClick() }}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
        >
            {children}
        </button>
    )
}
