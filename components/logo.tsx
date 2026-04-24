import { ShoppingCart } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
    className?: string;
    iconContainerClassName?: string;
    iconClassName?: string;
    textClassName?: string;
    href?: string;
}

export function Logo({ 
    className, 
    iconContainerClassName, 
    iconClassName,
    textClassName,
    href = "/"
}: LogoProps = {}) {
    return (
        <Link href={href} className={cn("flex items-center gap-2 shrink-0 group w-fit", className)}>
            <div className={cn("bg-yellow-400 text-slate-900 p-1.5 rounded-lg flex items-center justify-center shadow-sm border border-yellow-500/20 transition-transform group-hover:scale-105", iconContainerClassName)}>
                <ShoppingCart className={cn("h-6 w-6", iconClassName)} />
            </div>
            <span className={cn("text-2xl font-black tracking-tight text-slate-900 drop-shadow-sm group-hover:text-blue-700 transition-colors", textClassName)}>
                Grab<span className="text-yellow-500">Next</span>
            </span>
        </Link>
    )
}
