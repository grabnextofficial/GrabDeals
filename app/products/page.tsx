export const runtime = 'edge'
import { Suspense } from "react"
import { ProductsContent } from "./products-content"

export const dynamic = "force-dynamic"

export default function ProductsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Loading products...</p>
                </div>
            </div>
        }>
            <ProductsContent />
        </Suspense>
    )
}
