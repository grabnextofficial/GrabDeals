"use client"

import { useState, useRef, useCallback } from "react"

interface ImageZoomProps {
    src: string
    alt: string
    zoomLevel?: number
}

export function ImageZoom({ src, alt, zoomLevel = 2.5 }: ImageZoomProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isHovering, setIsHovering] = useState(false)
    const [lensPos, setLensPos] = useState({ x: 0, y: 0 })   // lens center in px (relative to container)
    const [bgPos, setBgPos] = useState({ x: 0, y: 0 })       // background-position for zoomed panel

    // Lens size relative to container (% of container width)
    const LENS_PCT = 35  // lens is 35% of container width
    const PREVIEW_W = 450
    const PREVIEW_H = 450

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const el = containerRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()

        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        const containerW = rect.width
        const containerH = rect.height

        // Lens half-sizes in px
        const lensW = containerW * (LENS_PCT / 100)
        const lensH = containerH * (LENS_PCT / 100)
        const halfLW = lensW / 2
        const halfLH = lensH / 2

        // Clamp lens position so it stays inside the image
        const clampedX = Math.max(halfLW, Math.min(mouseX, containerW - halfLW))
        const clampedY = Math.max(halfLH, Math.min(mouseY, containerH - halfLH))

        setLensPos({ x: clampedX, y: clampedY })

        // Calculate the background-position for the zoomed preview panel
        // Ratio of cursor position within the image
        const ratioX = (clampedX - halfLW) / (containerW - lensW)
        const ratioY = (clampedY - halfLH) / (containerH - lensH)

        const bgX = ratioX * (PREVIEW_W * zoomLevel - PREVIEW_W)
        const bgY = ratioY * (PREVIEW_H * zoomLevel - PREVIEW_H)

        setBgPos({ x: bgX, y: bgY })
    }, [zoomLevel])

    const lensStyle = {
        width: `${LENS_PCT}%`,
        paddingBottom: `${LENS_PCT}%`,
        left: `${lensPos.x}px`,
        top: `${lensPos.y}px`,
        transform: "translate(-50%, -50%)",
    }

    const previewBgStyle = {
        backgroundImage: `url(${src})`,
        backgroundSize: `${PREVIEW_W * zoomLevel}px ${PREVIEW_H * zoomLevel}px`,
        backgroundPosition: `-${bgPos.x}px -${bgPos.y}px`,
        backgroundRepeat: "no-repeat",
        width: `${PREVIEW_W}px`,
        height: `${PREVIEW_H}px`,
    }

    return (
        <div className="relative flex gap-4 items-start">
            {/* Source Image Container */}
            <div
                ref={containerRef}
                className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-200 cursor-crosshair select-none"
                style={{ width: "100%" }}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onMouseMove={handleMouseMove}
            >
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-full object-contain p-3 pointer-events-none"
                    draggable={false}
                />

                {/* Lens overlay */}
                {isHovering && (
                    <div
                        className="absolute border-2 border-blue-400 bg-blue-100/30 pointer-events-none z-10"
                        style={lensStyle}
                    />
                )}
            </div>

            {/* Zoomed Preview Panel — absolutely positioned to the right */}
            {isHovering && (
                <div
                    className="absolute top-0 z-50 rounded-xl border-2 border-gray-200 shadow-2xl overflow-hidden pointer-events-none"
                    style={{
                        left: "calc(100% + 16px)",
                        ...previewBgStyle,
                    }}
                />
            )}
        </div>
    )
}
