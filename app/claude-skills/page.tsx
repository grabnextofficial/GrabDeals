"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { 
  Zap, 
  Check, 
  X, 
  Star, 
  ArrowRight, 
  Lock, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  ChevronRight, 
  AlertTriangle,
  FileText,
  TrendingUp,
  Briefcase,
  Video,
  Code2,
  Brush,
  DollarSign,
  Users,
  Target
} from "lucide-react"

// Infinite sliding marquee CSS animation
const marqueeStyle = `
  @keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .animate-marquee {
    display: flex;
    width: max-content;
    animation: marquee 35s linear infinite;
  }
  .animate-marquee:hover {
    animation-play-state: paused;
  }
`

// Standard product configuration matching the SQLite insert
const CLAUDE_PRODUCT = {
  id: "claude-skills-pro",
  title: "Claude Skills Pro",
  price: 499,
  originalPrice: 1999,
  category: "digital",
  slug: "claude-skills-pro",
  imageUrl: "https://bizboxpro.in/wp-content/uploads/2026/05/AD12-1024x1024.png",
}

// 20 Carousel slide image paths
const carouselImages = [
  "https://bizboxpro.in/wp-content/uploads/2026/05/Analytics-Data-1.png",
  "https://bizboxpro.in/wp-content/uploads/2026/05/Social-Media.png",
  "https://bizboxpro.in/wp-content/uploads/2026/05/SEO-Search.png",
  "https://bizboxpro.in/wp-content/uploads/2026/05/Sales-Funnels.png",
  "https://bizboxpro.in/wp-content/uploads/2026/05/Operations-Systems.png",
  "https://bizboxpro.in/wp-content/uploads/2026/05/Legal-Compliance.png",
  "https://bizboxpro.in/wp-content/uploads/2026/05/Launch-Growth.png",
  "https://bizboxpro.in/wp-content/uploads/2026/05/Industry-Specific-1.png",
  "https://bizboxpro.in/wp-content/uploads/2026/05/Industry-Specific.png",
  "https://bizboxpro.in/wp-content/uploads/2026/05/HR-Team.png",
  "https://bizboxpro.in/wp-content/uploads/2026/05/Finance-Pricing.png",
  "https://bizboxpro.in/wp-content/uploads/2026/05/Analytics-Data.png",
  "https://bizboxpro.in/wp-content/uploads/2026/05/Ads-Paid-Media.png",
  "https://bizboxpro.in/wp-content/uploads/2026/05/Events-Speaking.png",
  "https://bizboxpro.in/wp-content/uploads/2026/05/Email-Marketing-Automation.png",
  "https://bizboxpro.in/wp-content/uploads/2026/05/E-commerce-Products.png",
  "https://bizboxpro.in/wp-content/uploads/2026/05/Courses-Education.png",
  "https://bizboxpro.in/wp-content/uploads/2026/05/Content-Copywriting.png",
  "https://bizboxpro.in/wp-content/uploads/2026/05/Branding-Design.png",
  "https://bizboxpro.in/wp-content/uploads/2026/05/1-.-2.png"
]

export default function ClaudeSkillsLandingPage() {
  const { addToCart, setDrawerOpen } = useCart()
  const router = useRouter()
  
  // Accordion active index state
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  
  // Evergreen countdown state
  const [timeLeft, setTimeLeft] = useState({ hours: 7, minutes: 59, seconds: 0 })

  // Initialize evergreen countdown timer (persists in localStorage per user session)
  useEffect(() => {
    const evergreenDuration = 28740 * 1000 // 7 hrs 59 mins in ms
    const storedTarget = localStorage.getItem("claude-skills-target")
    let targetTime = 0

    if (storedTarget) {
      targetTime = parseInt(storedTarget, 10)
      if (Date.now() > targetTime) {
        targetTime = Date.now() + evergreenDuration
        localStorage.setItem("claude-skills-target", targetTime.toString())
      }
    } else {
      targetTime = Date.now() + evergreenDuration
      localStorage.setItem("claude-skills-target", targetTime.toString())
    }

    const interval = setInterval(() => {
      const difference = targetTime - Date.now()
      if (difference <= 0) {
        const newTarget = Date.now() + evergreenDuration
        localStorage.setItem("claude-skills-target", newTarget.toString())
      } else {
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
        const minutes = Math.floor((difference / 1000 / 60) % 60)
        const seconds = Math.floor((difference / 1000) % 60)
        setTimeLeft({ hours, minutes, seconds })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Cart handling action helper
  const handlePurchase = () => {
    addToCart(CLAUDE_PRODUCT as any)
    setDrawerOpen(true)
  }

  // FAQ contents
  const faqs = [
    {
      question: "Do I need a paid Claude plan to use these skills?",
      answer: "No. The skills work perfectly with both free and paid Claude plans (Claude Pro). Some advanced workflows may perform better on higher-tier plans or with Projects features, but they are fully compatible with the free version as well."
    },
    {
      question: "How do I use the Claude skills?",
      answer: "Simply upload the skill system file into Claude (or paste the context script), type your task, and watch Claude instantly assume the persona, guidelines, formatting requirements, and advanced workflows embedded in that specific skill."
    },
    {
      question: "Is this a one-time payment or subscription?",
      answer: "This is a one-time payment of only ₹499. There are absolutely no monthly fees, hidden charges, or recurring subscriptions. You get lifetime access."
    },
    {
      question: "What exactly is included in the bundle?",
      answer: "You will get instant access to 2,000+ Claude skills categorized across 20+ core business domains, advanced prompt frameworks, developer/coder systems, step-by-step PDF usage guides, and future updates sent directly to you."
    },
    {
      question: "Will beginners be able to use this?",
      answer: "Yes, 100%. The bundle is organized logically and is extremely beginner-friendly. You do not need any coding, prompt engineering, or technical background. It is a true plug-and-play solution."
    },
    {
      question: "Does this work with Claude Code too?",
      answer: "Yes. The prompt framework files and advanced persona parameters are fully optimized to work across the Claude.ai Web Interface, Projects, and CLI tools like Claude Code."
    },
    {
      question: "How will I receive the files after purchase?",
      answer: "Immediately after checkout and payment confirmation, you will receive a secure download link on your screen and via email to access your entire library instantly."
    }
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-yellow-400 selection:text-slate-900">
      <style dangerouslySetInnerHTML={{ __html: marqueeStyle }} />
      
      {/* 1. TOP ALERT BANNER */}
      <div className="bg-gradient-to-r from-red-600 via-orange-600 to-red-600 text-white py-2.5 px-4 text-center text-xs sm:text-sm font-extrabold tracking-wide uppercase shadow-lg sticky top-0 z-50 animate-pulse">
        🔥 MEGA LAUNCH OFFER <span className="opacity-70 mx-1">|</span> Up to 85% OFF <span className="opacity-70 mx-1">—</span> Limited Time Only!
      </div>

      {/* 2. HERO SECTION */}
      <header className="relative py-20 px-4 md:px-8 max-w-6xl mx-auto text-center flex flex-col items-center overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-20 left-1/3 w-60 h-60 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-yellow-400 font-bold text-xs sm:text-sm shadow-md mb-8 animate-bounce">
          <Sparkles className="h-4 w-4 fill-yellow-400" />
          <span>MEGA LAUNCH OFFER</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
          2,000+ Ready-to-Use Claude Skills for <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500">Every Business Need.</span>
        </h1>

        {/* Subhead */}
        <p className="text-slate-400 text-lg sm:text-xl max-w-3xl leading-relaxed mb-10">
          Stop writing prompts from scratch. Upload a skill file and watch Claude transform into an expert consultant in seconds. Includes a <span className="text-white font-bold underline decoration-yellow-400">free usage guide</span>.
        </p>

        {/* Big Preview Product Image */}
        <div className="relative max-w-lg w-full mb-12 group">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-yellow-500 to-purple-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-45 transition duration-700" />
          <img 
            src="https://bizboxpro.in/wp-content/uploads/2026/05/AD12-1024x1024.png" 
            alt="Claude Skills Pro Bundle Preview" 
            className="relative rounded-2xl border border-slate-800 shadow-2xl object-cover w-full aspect-square"
          />
        </div>

        {/* Subtitle statement */}
        <p className="text-slate-300 font-semibold text-sm sm:text-md mb-8 tracking-wide uppercase">
          ⚡ Get Expert-Level Outputs Without Writing Complex Prompts
        </p>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 max-w-2xl w-full mb-10 text-center">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-center items-center shadow-sm">
            <span className="text-2xl sm:text-3xl font-black text-white">2,000+</span>
            <span className="text-[10px] sm:text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">Skills Included</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-center items-center shadow-sm">
            <span className="text-2xl sm:text-3xl font-black text-white">20+ Areas</span>
            <span className="text-[10px] sm:text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">All-in-One Bundle</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-center items-center shadow-sm">
            <span className="text-2xl sm:text-3xl font-black text-yellow-400">4.9★</span>
            <span className="text-[10px] sm:text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">Satisfaction</span>
          </div>
        </div>

        {/* Action Button */}
        <Button 
          size="lg" 
          onClick={handlePurchase}
          className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 hover:from-yellow-500 hover:to-orange-500 text-slate-950 font-extrabold text-md sm:text-lg px-10 py-7 rounded-xl shadow-glow hover:shadow-glow-lg transition-all duration-300 transform hover:scale-[1.02]"
        >
          🔥 Buy Now for Just ₹499
        </Button>

        {/* Checklist horizontal list */}
        <div className="flex gap-6 items-center justify-center mt-6 text-xs text-slate-400 font-semibold uppercase tracking-wider">
          <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-500 stroke-[3]" /> One-time payment</span>
          <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-500 stroke-[3]" /> Instant delivery</span>
        </div>
      </header>

      {/* 3. BUILT FOR CLAUDE ECOSYSTEM */}
      <section className="bg-slate-900/40 border-y border-slate-900 py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-xs tracking-widest text-slate-500 font-black uppercase mb-3">Engineered for Perfection</h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-12">BUILT FOR THE CLAUDE ECOSYSTEM</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { src: "https://bizboxpro.in/wp-content/uploads/2026/05/1-1.jpg", title: "Custom Personas" },
              { src: "https://bizboxpro.in/wp-content/uploads/2026/05/2-2.jpg", title: "Format Instructions" },
              { src: "https://bizboxpro.in/wp-content/uploads/2026/05/4-1.jpg", title: "Workflow Checklists" },
              { src: "https://bizboxpro.in/wp-content/uploads/2026/05/5-2.jpg", title: "Plug-and-Play Output" },
            ].map((img, i) => (
              <div key={i} className="bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden p-2 group hover:border-slate-800 transition duration-300">
                <img 
                  src={img.src} 
                  alt={img.title} 
                  className="rounded-xl w-full object-cover aspect-square mb-3 grayscale group-hover:grayscale-0 transition duration-500" 
                />
                <span className="block text-slate-400 group-hover:text-white font-bold text-xs sm:text-sm pb-1.5">{img.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. WHAT'S INSIDE CAROUSEL SECTION */}
      <section className="py-24 px-4 md:px-8 overflow-hidden bg-slate-950">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest bg-yellow-400/10 border border-yellow-400/20 px-3 py-1 rounded-full">
            What&apos;s Inside the
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4">All-in-One Claude Skills Bundle.</h2>
        </div>

        {/* Carousel Marquee container */}
        <div className="relative w-full overflow-hidden py-4 select-none">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />
          
          <div className="animate-marquee gap-5">
            {/* First Set */}
            {carouselImages.map((src, i) => (
              <div key={`marquee-1-${i}`} className="w-[180px] sm:w-[220px] shrink-0 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md transform hover:scale-[1.03] transition duration-300">
                <img src={src} alt="Category Mockup" className="w-full aspect-[4/3] object-cover" />
              </div>
            ))}
            {/* Duplicate for Infinite Scroll */}
            {carouselImages.map((src, i) => (
              <div key={`marquee-2-${i}`} className="w-[180px] sm:w-[220px] shrink-0 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md transform hover:scale-[1.03] transition duration-300">
                <img src={src} alt="Category Mockup" className="w-full aspect-[4/3] object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <Button 
            onClick={handlePurchase}
            className="bg-slate-900 border border-slate-800 text-yellow-400 hover:text-yellow-500 font-extrabold px-8 py-5 text-sm uppercase rounded-xl tracking-wider hover:border-yellow-400/30 transition-all shadow-sm"
          >
            Get Instant Access!
          </Button>
        </div>
      </section>

      {/* 5. EVERY DEPARTMENT VALUE PROP SECTION */}
      <section className="bg-slate-900/20 border-t border-slate-900 py-24 px-4 md:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-600/5 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 text-xs text-red-500 font-extrabold uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-3.5 py-1 rounded-full mb-4">
              <Zap className="h-3 w-3 fill-red-500" /> MEGA LAUNCH OFFER
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
              Everything You Need to Turn Claude Into a Business Powerhouse — Faster &amp; Smarter
            </h2>
            <p className="text-slate-400 text-md sm:text-lg">
              🎁 Get <span className="text-red-500 font-bold">85% OFF</span> Today Only — <span className="line-through text-slate-650">₹1,999</span> value for just <span className="text-yellow-400 font-black">₹499!</span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mb-16">
            {/* Card 1 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col hover:border-slate-700 transition duration-300">
              <div className="rounded-2xl overflow-hidden mb-6 bg-slate-950 border border-slate-800">
                <img 
                  src="https://bizboxpro.in/wp-content/uploads/2026/05/ChatGPT-Image-May-28-2026-01_41_57-PM-1024x1024.png" 
                  alt="Complete Claude Skills Library" 
                  className="w-full h-auto aspect-square object-cover"
                />
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white mb-4">1. Complete Claude Skills Library</h3>
              <ul className="space-y-4 text-sm text-slate-400 flex-1">
                <li className="flex gap-2">
                  <Check className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                  <span><strong>Content Copywriting:</strong> Create blogs, ads, email sequences, video scripts &amp; viral posts instantly.</span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                  <span><strong>Growth Marketing:</strong> Generate funnel architectures, SEO strategies &amp; paid ads templates.</span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                  <span><strong>Sales &amp; Outreach:</strong> Pitch decks, cold email templates, objection guides &amp; lead gen workflows.</span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                  <span><strong>Business SOPs:</strong> Document standard operations, automate workflow templates &amp; assign tasks.</span>
                </li>
              </ul>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col hover:border-slate-700 transition duration-300">
              <div className="rounded-2xl overflow-hidden mb-6 bg-slate-950 border border-slate-800">
                <img 
                  src="https://bizboxpro.in/wp-content/uploads/2026/05/ChatGPT-Image-May-28-2026-01_42_02-PM-1024x1024.png" 
                  alt="Advanced Prompt Systems" 
                  className="w-full h-auto aspect-square object-cover"
                />
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white mb-4">2. Advanced Prompt Workflows</h3>
              <ul className="space-y-4 text-sm text-slate-400 flex-1">
                <li className="flex gap-2">
                  <Check className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                  <span><strong>Expert-Level Frameworks:</strong> Pre-built meta prompts that program Claude to output premium quality results.</span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                  <span><strong>Department Hubs:</strong> Target custom workflows in legal, HR, administration, customer support &amp; finance.</span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                  <span><strong>Organized Structure:</strong> Zero clutter. Find the exact department script you need in under 10 seconds.</span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                  <span><strong>Plug-and-Play Setup:</strong> Drag-and-drop system. Import into Claude.ai Project or CLI workspace and start.</span>
                </li>
              </ul>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col hover:border-slate-700 transition duration-300">
              <div className="rounded-2xl overflow-hidden mb-6 bg-slate-950 border border-slate-800">
                <img 
                  src="https://bizboxpro.in/wp-content/uploads/2026/05/ChatGPT-Image-May-28-2026-01_43_24-PM-1024x1024.png" 
                  alt="Automation & Bonus Resources" 
                  className="w-full h-auto aspect-square object-cover"
                />
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white mb-4">3. Scaling &amp; Bonus Resources</h3>
              <ul className="space-y-4 text-sm text-slate-400 flex-1">
                <li className="flex gap-2">
                  <Check className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                  <span><strong>Claude Code Ready:</strong> Compatible with CLI interfaces, developer extensions, and Claude API architectures.</span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                  <span><strong>Chained Automations:</strong> Combine multiple prompts to automate complex, multi-step business objectives.</span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                  <span><strong>Free Usage Guide:</strong> Complete ebook tutorial demonstrating how to program, load, and adapt skills.</span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                  <span><strong>Lifetime Updates:</strong> Lifetime Claude upgrading service. Get new prompt packages emailed at zero extra cost.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center flex flex-col items-center">
            <Button 
              size="lg"
              onClick={handlePurchase}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-slate-950 font-black text-md px-10 py-6 rounded-xl shadow-glow transition duration-300"
            >
              GET INSTANT ACCESS!
            </Button>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-4">
              ⚡ One click, fully organized, permanently yours.
            </p>
          </div>
        </div>
      </section>

      {/* 6. EVERYTHING YOU NEED TO TURN CLAUDE INTO A COMPLETE AI BUSINESS SYSTEM */}
      <section className="bg-slate-950 py-24 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">
            Everything You Need to Turn Claude Into a <span className="text-red-500">Complete AI Business System.</span>
          </h2>
          <Button 
            size="lg"
            onClick={handlePurchase}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-extrabold px-10 py-6 rounded-xl shadow-lg mt-4 uppercase tracking-wider"
          >
            GET INSTANT ACCESS!
          </Button>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-4">
            ⚡ One click, fully organized, permanently yours.
          </p>
        </div>
      </section>

      {/* 7. COMPARISON SECTION: WITH VS WITHOUT SKILLS */}
      <section className="py-24 px-4 md:px-8 bg-slate-900/30 border-y border-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs tracking-widest text-slate-500 font-black uppercase mb-3">Work Smarter</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">Same Claude. Turned Into a Business Machine.</h3>
            <p className="text-slate-400 text-md sm:text-lg mt-3">
              You&apos;re <span className="text-red-500 font-bold underline decoration-red-500">Not Slow</span> — Your Claude Workflow Is.
            </p>
            <p className="text-slate-400 text-sm max-w-xl mx-auto mt-4 leading-relaxed">
              Most Claude users only extract 10% of its real potential. A structured, contextual skill file programs Claude from a simple utility into an extraordinary teammate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Without Skills Column */}
            <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 sm:p-8 flex flex-col">
              <h4 className="text-lg sm:text-xl font-bold text-red-500 flex items-center gap-2 mb-6">
                <X className="h-5 w-5 text-red-500 stroke-[3]" /> Without Skills
              </h4>
              <ul className="space-y-4 text-sm text-slate-400 flex-1">
                <li className="flex gap-2">
                  <X className="h-4 w-4 text-red-500/80 shrink-0 mt-0.5" />
                  <span>Rewriting similar instructions and rules every time you open a chat.</span>
                </li>
                <li className="flex gap-2">
                  <X className="h-4 w-4 text-red-500/80 shrink-0 mt-0.5" />
                  <span>Inconsistent quality, robotic replies, and off-brand styling.</span>
                </li>
                <li className="flex gap-2">
                  <X className="h-4 w-4 text-red-500/80 shrink-0 mt-0.5" />
                  <span>Wasting time debugging inputs to get the output formatting right.</span>
                </li>
                <li className="flex gap-2">
                  <X className="h-4 w-4 text-red-500/80 shrink-0 mt-0.5" />
                  <span>Paying hundreds of dollars monthly for multiple specialized SaaS utilities.</span>
                </li>
                <li className="flex gap-2">
                  <X className="h-4 w-4 text-red-500/80 shrink-0 mt-0.5" />
                  <span>No standardized business operations or consistent output across projects.</span>
                </li>
              </ul>
            </div>

            {/* With Skills Column */}
            <div className="bg-slate-950 border border-yellow-500/30 rounded-3xl p-6 sm:p-8 flex flex-col relative">
              <div className="absolute top-4 right-4 bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full">
                Highly Recommended
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-yellow-400 flex items-center gap-2 mb-6">
                <Check className="h-5 w-5 text-yellow-400 stroke-[3]" /> With Claude Skills Pro
              </h4>
              <ul className="space-y-4 text-sm text-slate-300 flex-1">
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                  <span>Upload your prebuilt skill script file once and repeat usage seamlessly.</span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                  <span>Reliable, tailored, human-like outputs matching expert formatting templates.</span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                  <span>Load, verify, and start executing files in under 60 seconds.</span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                  <span>Consolidate multiple specialized digital tools under one unified interface.</span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                  <span>Speed up content production, templates, code structure &amp; reports.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-12">
            <h5 className="text-xl font-extrabold text-white mb-6">
              One-Time Price. <span className="text-red-500">Lifetime Claude Upgrades..</span>
            </h5>
            <Button 
              size="lg"
              onClick={handlePurchase}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-slate-950 font-black px-10 py-6 rounded-xl shadow-glow transition duration-300"
            >
              GET INSTANT ACCESS!
            </Button>
          </div>
        </div>
      </section>

      {/* 8. COUNTDOWN & PRICING CARD SECTION */}
      <section className="py-24 px-4 md:px-8 bg-slate-950 flex flex-col items-center">
        <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 md:p-12 max-w-2xl w-full text-center relative overflow-hidden">
          {/* Subtle gradient light */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-yellow-400/5 rounded-full blur-[60px] pointer-events-none" />
          
          <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2">
            One-Time Price. Lifetime Upgrades.
          </h3>
          <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-6">
            Get instant access to the entire bundle
          </p>

          <div className="text-5xl sm:text-6xl font-black text-white mb-2">
            ₹499<span className="text-slate-500 text-xl font-semibold">/-</span>
          </div>

          <div className="inline-flex bg-red-600/15 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6">
            85% OFF
          </div>

          <div className="flex flex-col items-center">
            {/* Interactive countdown component */}
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">Offer expires in:</div>
            
            <div className="flex gap-3 justify-center items-center mb-8">
              <div className="flex flex-col items-center bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 min-w-[60px] shadow-sm">
                <span className="text-xl font-extrabold text-yellow-400">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mt-0.5">Hour</span>
              </div>
              <span className="text-lg font-bold text-slate-700">:</span>
              <div className="flex flex-col items-center bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 min-w-[60px] shadow-sm">
                <span className="text-xl font-extrabold text-yellow-400">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mt-0.5">Min</span>
              </div>
              <span className="text-lg font-bold text-slate-700">:</span>
              <div className="flex flex-col items-center bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 min-w-[60px] shadow-sm">
                <span className="text-xl font-extrabold text-yellow-400">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mt-0.5">Sec</span>
              </div>
            </div>

            <Button 
              size="lg"
              onClick={handlePurchase}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-slate-950 font-black text-md sm:text-lg py-7 rounded-xl shadow-glow hover:shadow-glow-lg transition duration-300"
            >
              GET INSTANT ACCESS!
            </Button>

            {/* Payment security options image */}
            <div className="mt-8 flex justify-center w-full max-w-[280px]">
              <img 
                src="https://bizboxpro.in/wp-content/uploads/2026/05/payment-moguj-1-1.webp" 
                alt="Safe & Secure Payments via UPI & Cards" 
                className="w-full object-contain filter brightness-95 opacity-80"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQ ACCORDION SECTION */}
      <section className="py-24 px-4 md:px-8 bg-slate-900/10 border-t border-slate-900">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest bg-yellow-400/10 border border-yellow-400/20 px-3.5 py-1 rounded-full">
              ❓ GOT QUESTIONS ❓
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 mb-3">Still Have Questions? We&apos;ve Got Answers.</h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto">
              Everything you need to know about Claude Skills Pro — answered in seconds
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index
              return (
                <div 
                  key={index} 
                  className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden transition duration-300"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left text-white hover:text-yellow-400 focus:outline-none transition duration-200"
                  >
                    <span className="font-bold text-md sm:text-lg">{faq.question}</span>
                    <ChevronRight 
                      className={`h-5 w-5 text-slate-500 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-90 text-yellow-400" : ""}`} 
                    />
                  </button>
                  
                  {/* Expanding body with smooth height transition */}
                  <div 
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? "max-h-[250px] border-t border-slate-800/50" : "max-h-0"
                    }`}
                  >
                    <div className="p-6 text-sm sm:text-md text-slate-400 leading-relaxed bg-slate-950/40">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 10. FINAL PUSH / CALL TO ACTION */}
      <section className="py-24 px-4 md:px-8 bg-slate-950 text-center relative overflow-hidden">
        {/* Glow light bottom */}
        <div className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Still deciding?</h2>
          <p className="text-slate-400 text-md max-w-xl mx-auto mb-8 leading-relaxed">
            Join thousands of professionals, developers, and creators who upgraded their workflow with Claude Skills Pro — download and start boosting your productivity today.
          </p>

          <Button 
            size="lg"
            onClick={handlePurchase}
            className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 hover:from-yellow-500 hover:to-orange-500 text-slate-950 font-black text-md px-12 py-7 rounded-xl shadow-glow transition duration-300"
          >
            GET INSTANT ACCESS!
          </Button>

          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-4">
            ⚡ One click, fully organized, permanently yours.
          </p>
        </div>
      </section>

      {/* 11. DISCLAIMER FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-900 py-16 px-4 md:px-8 text-slate-500 text-[10px] sm:text-xs">
        <div className="max-w-4xl mx-auto text-center">
          <div className="font-extrabold uppercase tracking-widest text-slate-400 mb-3 flex items-center justify-center gap-1">
            <AlertTriangle className="h-4 w-4 text-slate-400 stroke-[2]" /> IMPORTANT
          </div>
          <p className="leading-relaxed mb-8 max-w-3xl mx-auto">
            This site is not a part of the Facebook™ website or Facebook™ Inc. Additionally, This site is NOT endorsed by Facebook™ in any way. FACEBOOK™ is a trademark of FACEBOOK™, Inc. As stipulated by law, we cannot and do not make any guarantees about your ability to get results or earn any money with our ideas, information, tools, or strategies. We want to help you by providing excellent templates, guidance, and workflows that we believe can assist you in moving forward. All terms, privacy policies, and disclaimers for this program can be accessed via the links below.
          </p>

          {/* Links grid */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center font-bold tracking-wide uppercase text-slate-400 mb-4">
            <Link href="/privacy" className="hover:text-yellow-400 transition">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-yellow-400 transition">Contact Us</Link>
            <Link href="/about" className="hover:text-yellow-400 transition">About Us</Link>
            <Link href="/terms" className="hover:text-yellow-400 transition">Terms &amp; Conditions</Link>
            <Link href="/refund" className="hover:text-yellow-400 transition">Refund &amp; Return Policy</Link>
          </div>

          <div className="text-[10px] text-slate-600 mt-6">
            &copy; {new Date().getFullYear()} Grabnext. All rights reserved. Registered digital seller.
          </div>
        </div>
      </footer>
    </div>
  )
}
