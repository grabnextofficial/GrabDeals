"use client"

import { useSearchParams } from "next/navigation"
import { CheckCircle, Download, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StoreHeader } from "@/components/store-header"
import Link from "next/link"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const utr = searchParams.get("utr") || ""

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Payment Successful! 🎉</CardTitle>
              <p className="text-muted-foreground">
                Your order has been confirmed. Thank you for shopping with Grabnext!
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {utr && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <p className="text-sm text-green-700 font-medium mb-1">Payment Reference (UTR)</p>
                  <p className="font-mono text-lg font-bold text-green-800">{utr}</p>
                  <p className="text-xs text-green-600 mt-1">Save this for your records</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="flex-1">
                  <Link href="/dashboard/orders">
                    <Download className="h-4 w-4 mr-2" />
                    View My Orders
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1 bg-transparent">
                  <Link href="/products">
                    Continue Shopping
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>
                  Need help?{" "}
                  <Link href="/support" className="text-primary hover:underline">
                    Contact support
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}