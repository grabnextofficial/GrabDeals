"use client"

import Link from "next/link"
import { Code, FileText, GraduationCap, Palette } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function CategoriesSection() {
  const categories = [
    {
      name: "Software",
      description: "Professional tools and applications",
      icon: Code,
      count: "150+ products",
      href: "/products?category=software",
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20",
    },
    {
      name: "Templates",
      description: "Ready-to-use designs and layouts",
      icon: Palette,
      count: "200+ products",
      href: "/products?category=template",
      gradient: "from-green-500 to-green-600",
      bgGradient: "from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20",
    },
    {
      name: "Courses",
      description: "Learn new skills with expert guidance",
      icon: GraduationCap,
      count: "80+ products",
      href: "/products?category=course",
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-100 to-purple-200 dark:from-purple-900/20 dark:to-purple-800/20",
    },
    {
      name: "Documents",
      description: "Professional documents and resources",
      icon: FileText,
      count: "120+ products",
      href: "/products?category=document",
      gradient: "from-orange-500 to-orange-600",
      bgGradient: "from-orange-100 to-orange-200 dark:from-orange-900/20 dark:to-orange-800/20",
    },
  ]

  return (
    <section className="py-16 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-gradient-accent opacity-10 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-0 right-1/4 w-64 h-64 bg-gradient-secondary opacity-10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center space-y-4 mb-12 animate-fade-in-up">
          <h2 className="text-3xl lg:text-4xl font-bold">
            Browse by <span className="text-gradient-primary">Category</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Find exactly what you need from our carefully organized product categories.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon
            return (
              <Link key={category.name} href={category.href} className="block">
                <Card
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border-0 bg-gradient-to-br from-card to-card/80 hover:from-card hover:to-muted/50 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6 text-center space-y-4">
                    <div
                      className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${category.bgGradient} flex items-center justify-center transition-all duration-300 group-hover:scale-110 animate-glow`}
                    >
                      <Icon className={`h-8 w-8 bg-gradient-to-r ${category.gradient} bg-clip-text text-transparent`} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-xl group-hover:text-gradient-primary transition-all duration-300">
                        {category.name}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{category.description}</p>
                      <p className="text-primary font-medium text-sm bg-gradient-primary bg-clip-text text-transparent">
                        {category.count}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        <div className="text-center mt-12 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
          <Button
            asChild
            size="lg"
            className="bg-gradient-primary hover:bg-gradient-secondary transition-all duration-300 hover:scale-105 hover:shadow-lg animate-glow"
          >
            <Link href="/categories">
              View All Categories
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}