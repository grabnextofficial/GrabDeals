"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Eye, Loader2, Maximize2 } from "lucide-react"

export function DigitalProductViewer({ downloadUrl, title }: { downloadUrl: string; title: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(true)

    // Convert T-Drive download/preview URL to view URL 
    // Format: https://t-drive.pages.dev//api/download/abc-123 => https://t-drive.pages.dev//view/abc-123
    let viewUrl = downloadUrl
    if (viewUrl?.includes('t-drive.pages.dev')) {
        viewUrl = viewUrl.replace('/api/download/', '/view/').replace('/api/preview/', '/view/')
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                >
                    <Eye className="h-4 w-4" /> View File
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 overflow-hidden flex flex-col">
                <DialogHeader className="p-4 border-b bg-gray-50 flex flex-row items-center justify-between space-y-0">
                    <DialogTitle className="text-lg font-semibold line-clamp-1 pr-8">{title}</DialogTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild>
                            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" title="Open in new tab">
                                <Maximize2 className="h-4 w-4 text-gray-500" />
                            </a>
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 relative bg-gray-100 flex items-center justify-center">
                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50/80 z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            <p className="text-sm font-medium text-gray-500">Loading document viewer...</p>
                        </div>
                    )}

                    <iframe
                        src={viewUrl}
                        className="w-full h-full border-0 absolute inset-0 z-0 bg-white"
                        onLoad={() => setLoading(false)}
                        allow="fullscreen; autoplay; encrypted-media"
                        title={title}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
