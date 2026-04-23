"use client"
 
import { useRef, useEffect, useCallback, useState } from "react"
import { 
    Bold, Italic, Underline, List, ListOrdered, Highlighter, Type, 
    AlignLeft, AlignCenter, AlignRight, AlignJustify, 
    Link as LinkIcon, Undo, Redo, Minus, Heading1, Heading2, Heading3, 
    Eraser, ChevronDown
} from "lucide-react"
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

interface RichTextEditorProps {
    value: string
    onChange: (html: string) => void
    placeholder?: string
    minHeight?: number
}

const COLORS = ["#000000", "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"]
const HIGHLIGHTS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#ffedd5", "#fce7f3"]

export function RichTextEditor({ value, onChange, placeholder = "Write description...", minHeight = 280 }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || ""
        }
    }, [])

    const exec = useCallback((cmd: string, val?: string) => {
        if (cmd === "createLink") {
            const url = window.prompt("Enter URL:")
            if (url) document.execCommand(cmd, false, url)
        } else {
            document.execCommand(cmd, false, val)
        }
        editorRef.current?.focus()
        onChange(editorRef.current?.innerHTML || "")
    }, [onChange])

    const handleInput = () => onChange(editorRef.current?.innerHTML || "")

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden ring-offset-0 focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-white shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50/50 border-b border-gray-200">
                <div className="flex bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                    <ToolBtn onClick={() => exec("undo")} title="Undo"><Undo className="h-3.5 w-3.5" /></ToolBtn>
                    <ToolBtn onClick={() => exec("redo")} title="Redo"><Redo className="h-3.5 w-3.5" /></ToolBtn>
                </div>

                <div className="w-px h-5 bg-gray-300 mx-1" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button type="button" className="flex items-center gap-1 px-2 py-1 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50">
                            Styles <ChevronDown className="h-3 w-3" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => exec("formatBlock", "p")}>Paragraph</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exec("formatBlock", "h1")} className="font-bold text-lg">Heading 1</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exec("formatBlock", "h2")} className="font-bold text-md">Heading 2</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exec("formatBlock", "h3")} className="font-bold text-sm">Heading 3</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="w-px h-5 bg-gray-300 mx-1" />

                <div className="flex bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                    <ToolBtn onClick={() => exec("bold")} title="Bold"><Bold className="h-3.5 w-3.5" /></ToolBtn>
                    <ToolBtn onClick={() => exec("italic")} title="Italic"><Italic className="h-3.5 w-3.5" /></ToolBtn>
                    <ToolBtn onClick={() => exec("underline")} title="Underline"><Underline className="h-3.5 w-3.5" /></ToolBtn>
                </div>

                <div className="flex bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                    <ToolBtn onClick={() => exec("insertUnorderedList")} title="Bullet List"><List className="h-3.5 w-3.5" /></ToolBtn>
                    <ToolBtn onClick={() => exec("insertOrderedList")} title="Numbered List"><ListOrdered className="h-3.5 w-3.5" /></ToolBtn>
                </div>

                <div className="w-px h-5 bg-gray-300 mx-1" />

                <div className="flex bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                    <ToolBtn onClick={() => exec("justifyLeft")} title="Align Left"><AlignLeft className="h-3.5 w-3.5" /></ToolBtn>
                    <ToolBtn onClick={() => exec("justifyCenter")} title="Align Center"><AlignCenter className="h-3.5 w-3.5" /></ToolBtn>
                    <ToolBtn onClick={() => exec("justifyRight")} title="Align Right"><AlignRight className="h-3.5 w-3.5" /></ToolBtn>
                    <ToolBtn onClick={() => exec("justifyFull")} title="Justify"><AlignJustify className="h-3.5 w-3.5" /></ToolBtn>
                </div>

                <div className="w-px h-5 bg-gray-300 mx-1" />

                <div className="flex bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                    <ToolBtn onClick={() => exec("createLink")} title="Insert Link"><LinkIcon className="h-3.5 w-3.5" /></ToolBtn>
                    <ToolBtn onClick={() => exec("insertHorizontalRule")} title="Horizontal Rule"><Minus className="h-3.5 w-3.5" /></ToolBtn>
                </div>

                <div className="w-px h-5 bg-gray-300 mx-1" />

                {/* Text colors & Highlights */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button type="button" className="flex items-center gap-1 px-1.5 py-1 text-xs border border-gray-200 rounded-lg bg-white hover:bg-gray-50">
                            <Type className="h-3.5 w-3.5" /> <ChevronDown className="h-3 w-3" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="p-2">
                        <div className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Text Color</div>
                        <div className="flex gap-1 mb-3">
                            {COLORS.map((c) => (
                                <button key={c} type="button" onClick={() => exec("foreColor", c)} className="h-6 w-6 rounded-md border border-gray-200" style={{ background: c }} />
                            ))}
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Highlight</div>
                        <div className="flex gap-1">
                            {HIGHLIGHTS.map((c) => (
                                <button key={c} type="button" onClick={() => exec("hiliteColor", c)} className="h-6 w-6 rounded-md border border-gray-200" style={{ background: c }} />
                            ))}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="w-px h-5 bg-gray-300 mx-1" />

                <ToolBtn onClick={() => exec("removeFormat")} title="Clear Formatting"><Eraser className="h-3.5 w-3.5" /></ToolBtn>
            </div>

            {/* Editable area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                data-placeholder={placeholder}
                className="p-6 focus:outline-none text-base leading-relaxed min-h-[var(--editor-min-h)] prose max-w-none prose-sm sm:prose-base prose-blue prose-img:rounded-xl"
                style={{ minHeight: `${minHeight}px`, "--editor-min-h": `${minHeight}px` } as any}
            />
            <style>{`
                [contenteditable]:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; }
                [contenteditable] { font-family: inherit; }
                [contenteditable] h1 { font-size: 2em; font-weight: bold; margin-bottom: 0.5em; }
                [contenteditable] h2 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.5em; }
                [contenteditable] h3 { font-size: 1.25em; font-weight: bold; margin-bottom: 0.5em; }
                [contenteditable] ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
                [contenteditable] ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1em; }
                [contenteditable] a { color: #3b82f6; text-decoration: underline; }
                [contenteditable] blockquote { border-left: 4px solid #e5e7eb; padding-left: 1em; color: #4b5563; font-style: italic; }
            `}</style>
        </div>
    )
}

function ToolBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
    return (
        <button
            type="button"
            title={title}
            onMouseDown={(e) => { e.preventDefault(); onClick() }}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
        >
            {children}
        </button>
    )
}
