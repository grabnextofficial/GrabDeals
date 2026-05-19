"use client";
import { useState, useEffect, useRef } from "react";
import { PRODUCT_BUY_URL, INCLUDED_SOFTWARE, TESTIMONIALS, FAQS, FEATURES } from "./data";
import { useCart } from "@/contexts/cart-context";
import { useRouter } from "next/navigation";
import { trackAddToCart } from "@/lib/pixel";
/* ── Animated CTA Button (matches Elementor .btn class) ── */
const BTN_STYLE: React.CSSProperties = {
  backgroundImage: "linear-gradient(130deg, #FFC800 0%, #afff3d 100%)",
  backgroundSize: "200% 200%",
  borderRadius: "10px",
  boxShadow: "0px 8px 10px 0px rgba(0,0,0,0.5)",
  animation: "animatedgradient 3s ease infinite alternate",
  color: "#000",
  fontFamily: "Poppins, sans-serif",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  display: "inline-block",
  textDecoration: "none",
  textAlign: "center" as const,
  cursor: "pointer",
  border: "none",
  transition: "transform 0.1s",
};

function CountdownTimer() {
  const [t, setT] = useState({ h: 5, m: 59, s: 59 });
  useEffect(() => {
    const id = setInterval(() => setT(p => {
      if (p.s > 0) return { ...p, s: p.s - 1 };
      if (p.m > 0) return { ...p, m: p.m - 1, s: 59 };
      if (p.h > 0) return { h: p.h - 1, m: 59, s: 59 };
      return { h: 5, m: 59, s: 59 };
    }), 1000);
    return () => clearInterval(id);
  }, []);
  const p2 = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex justify-center gap-2 my-4">
      {[["HRS", p2(t.h)], ["MIN", p2(t.m)], ["SEC", p2(t.s)]].map(([l, v]) => (
        <div key={l} className="bg-red-600 text-white rounded-lg px-3 py-2 min-w-[64px] text-center shadow-lg">
          <div className="text-3xl font-black font-mono leading-none">{v}</div>
          <div className="text-[10px] font-bold opacity-80 mt-1">{l}</div>
        </div>
      ))}
    </div>
  );
}

function StarRating({ n }: { n: number }) {
  return <div className="flex gap-0.5 justify-center mb-2">{Array(n).fill(0).map((_, i) => <span key={i} className="text-yellow-400 text-lg">★</span>)}</div>;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-2">
      <button onClick={() => setOpen(!open)} className="w-full text-left px-5 py-4 font-semibold text-gray-800 flex justify-between items-center hover:bg-gray-50" style={{ fontFamily: "Poppins, sans-serif" }}>
        <span>{q}</span>
        <span className="text-xl ml-4 shrink-0">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-3">{a}</div>}
    </div>
  );
}

/* Product image card — matches Elementor image-box widget */
function ProductCard({ name, img, value, bg = "white" }: { name: string; img?: string; value?: string; bg?: string }) {
  return (
    <div className="flex flex-col items-center text-center rounded-[7px] overflow-hidden" style={{ background: bg, boxShadow: "0 1px 5px 0 rgba(0,0,0,0.4)", padding: 6 }}>
      <div className="w-full aspect-square relative overflow-hidden rounded-[4px] bg-gray-100 flex items-center justify-center">
        {img ? (
          <img src={img} alt={name} className="w-full h-full object-contain p-2" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <span className="text-4xl">{name.split(" ")[0]}</span>
        )}
      </div>
      <p className="text-black font-semibold mt-1 text-sm leading-tight px-1" style={{ fontFamily: "Poppins, sans-serif" }}>{name}</p>
      {value && <span className="text-[11px] text-green-700 font-bold">Worth {value}</span>}
    </div>
  );
}

export default function SoftwareFunnelPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [banner, setBanner] = useState<any>(null);
  const [adobeProduct, setAdobeProduct] = useState<any>(null);

  const router = useRouter();
  const { addToCart, clearCart } = useCart();

  useEffect(() => {
    // Fetch products
    fetch("/api/products?all=1").then(r => r.json()).then(d => {
      const list = Array.isArray(d) ? d : (d.products || []);
      const found = list.find((p: any) => p.title && p.title.toLowerCase().includes("adobe all"));
      if (found) {
        setAdobeProduct(found);
      }
      setProducts(list.filter((p: any) => p.title && !p.title.toLowerCase().includes("adobe all")));
    }).catch(() => {});

    // Fetch banners
    fetch("/api/banners").then(r => r.json()).then(d => {
      if (Array.isArray(d) && d.length > 0) {
        setBanner(d[0]); // Use first active banner
      }
    }).catch(() => {});
  }, []);

  const handleBuyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Find the Adobe product or fallback to a structured one
    const targetProduct = adobeProduct || {
      id: "adobe-all-premium-software-bundle-2026-for-windows-mac-420947", // Fallback ID
      title: "Adobe All Premium Software Bundle 2026",
      price: 249,
      category: "software",
      imageUrl: banner?.imageUrl || "https://media.licdn.com/dms/image/D4D12AQGg4FhYvYlFwA/article-cover_image-shrink_720_1280/0/1689108390829?e=2147483647&v=beta&t=aI8jVq8vQZ3PZ4b1_O7m9L8-K_rTzJg5nL3x-5Qc4Kk",
      downloadUrl: "[]",
      isActive: true,
      tags: ["adobe", "bundle", "lifetime"]
    };

    // Track AddToCart event in Meta Pixel
    trackAddToCart({
      content_name: targetProduct.title,
      content_ids: [targetProduct.id],
      value: targetProduct.price,
    });

    // Clear cart and add Adobe product
    clearCart();
    addToCart(targetProduct);
    
    // Redirect to checkout
    router.push("/checkout");
  };

  return (
    <>


      <div style={{ fontFamily: "Poppins, sans-serif" }}>

        {/* ── 1. TOP URGENCY BAR ── */}
        <div style={{ backgroundColor: "#05FF00" }} className="text-black text-center py-2 px-4 font-bold text-sm sticky top-0 z-50">
          🔥 Adobe All Premium Software Bundle 2026! &nbsp;|&nbsp; Launch Sale: <strong>90% OFF</strong> &nbsp;|&nbsp;
          <a href="/checkout" onClick={handleBuyClick} className="underline font-black">Grab Now →</a>
        </div>

        {/* ── 2. HERO ── */}
        <section className="bg-[#00114E] text-white text-center py-10 px-4 relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: "rgba(0,17,78,0.6)" }} />
          {/* glow orbs */}
          <div className="absolute" style={{ width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(175,255,61,0.21) 0%, rgba(242,41,91,0) 70%)", top: -273, left: -230, pointerEvents: "none" }} />
          <div className="relative z-10 max-w-5xl mx-auto">
            <h1 style={{ fontSize: "clamp(26px,5vw,46px)", fontWeight: 800, lineHeight: 1.4, marginBottom: 12 }}>
              Stop Paying Expensive Monthly Subscriptions! Get The <span className="text-[#FFA800]">Ultimate Creative Software Bundle</span> With{" "}
              <span className="bg-white text-black shadow-[5px_5px_0_0_#FFA800] px-1.5">&nbsp;Adobe All Premium 2026!&nbsp;</span>
            </h1>
            <p style={{ fontSize: "clamp(14px,2.5vw,26px)", fontWeight: 500, fontStyle: "italic", textDecoration: "underline", color: "#00FFFF", marginBottom: 20 }}>
              All 15+ Adobe CC Apps — Windows & Mac — Pre-Activated for Lifetime!
            </p>
            {/* Adobe Bundle Image */}
            <div className="mx-auto mb-6 rounded-lg overflow-hidden border border-gray-600 shadow-2xl relative" style={{ maxWidth: 800, aspectRatio: "16/9", background: "#111", display: "flex", alignItems: "center", justifyItems: "center" }}>
               <img src={banner?.imageUrl || "https://media.licdn.com/dms/image/D4D12AQGg4FhYvYlFwA/article-cover_image-shrink_720_1280/0/1689108390829?e=2147483647&v=beta&t=aI8jVq8vQZ3PZ4b1_O7m9L8-K_rTzJg5nL3x-5Qc4Kk"} alt="Adobe All Premium Software Bundle Collection 2026" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = "https://grabnext.pages.dev/api/placeholder?w=800&h=450&text=Adobe+All+Premium+Collection+2026"; }} />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-4">
                  <span className="bg-red-600 text-white font-bold px-4 py-1 rounded-full text-sm shadow-lg">⚡ Instant Download Included</span>
               </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <a href="/checkout" onClick={handleBuyClick} className="animate-[animatedgradient_3s_ease_infinite_alternate] hover:-translate-y-0.5 hover:shadow-[0px_4px_6px_rgba(0,0,0,0.5)] transition-all" style={{ ...BTN_STYLE, animation: undefined, fontSize: "clamp(16px,3vw,32px)", padding: "12px 40px", width: "min(80%,560px)" }}>
                🚀 Get Instant Access At Just ₹249/- 🚀
              </a>
            </div>
            <p className="text-white/60 text-xs mt-3">✅ Instant Delivery &nbsp;|&nbsp; ✅ Pre-Activated &nbsp;|&nbsp; ✅ Windows & Mac &nbsp;|&nbsp; ✅ Lifetime Access</p>
          </div>
        </section>

        {/* ── 3. TRUST STATS ── */}
        <section className="bg-white py-8 px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            {[["3,929+", "Happy Customers"], ["15+", "Adobe CC Apps"], ["24x7", "Live Support"], ["₹249", "One-Time Price"]].map(([n, l]) => (
              <div key={l} className="text-center py-4 px-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="text-2xl md:text-3xl font-black text-[#00114E]">{n}</div>
                <div className="text-gray-500 text-sm font-medium mt-1">{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. WHAT YOU GET ── */}
        <section className="bg-white py-10 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center font-semibold text-gray-700 text-xl mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>Here's What All You'll Get…</h2>
            <h3 className="text-center font-black text-3xl md:text-4xl text-black mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>Adobe CC Bundle 2026</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {INCLUDED_SOFTWARE.map((s: any) => (
                <ProductCard key={s.name} name={s.name} img={s.logo} bg="white" />
              ))}
            </div>
            <div className="flex justify-center mt-8">
              <a href="/checkout" onClick={handleBuyClick} className="animate-[animatedgradient_3s_ease_infinite_alternate] hover:-translate-y-0.5 hover:shadow-[0px_4px_6px_rgba(0,0,0,0.5)] transition-all" style={{ ...BTN_STYLE, animation: undefined, fontSize: "clamp(14px,2.5vw,28px)", padding: "10px 36px", width: "min(80%,520px)" }}>
                🚀 Get Instant Access At Just ₹249/- 🚀
              </a>
            </div>
          </div>
        </section>

        {/* ── 5. ALL SOFTWARE INCLUDED ── */}
        <section className="py-8 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center font-black text-2xl md:text-3xl text-gray-800 mb-2">Everything Included in One Bundle</h2>
            <p className="text-center text-gray-500 mb-6 text-sm">All 15+ Adobe Creative Cloud apps — no subscription needed</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {INCLUDED_SOFTWARE.map((s: any) => (
                <div key={s.name} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
                  <img src={s.logo} alt={s.name} className="w-8 h-8 object-contain" />
                  <span className="font-semibold text-gray-800">{s.name}</span>
                  <span className="ml-auto text-green-600 font-bold text-sm">✓ Included</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. FEATURES WHY CHOOSE ── */}
        <section className="bg-white py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center font-black text-3xl md:text-4xl text-[#00114E] mb-2">Why Choose Grabnext?</h2>
            <p className="text-center text-gray-500 mb-8">India's most trusted digital software store — 3,929+ satisfied customers</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {FEATURES.map(f => (
                <div key={f.title} className="text-center p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-3">{f.icon}</div>
                  <div className="font-black text-gray-800 text-sm mb-1">{f.title}</div>
                  <div className="text-gray-500 text-xs leading-relaxed">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. COMPARISON TABLE ── */}
        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-center font-black text-3xl text-gray-800 mb-8">Grabnext vs. Adobe Subscription</h2>
            <div className="w-full max-w-2xl mx-auto overflow-x-auto rounded-2xl shadow-xl border border-gray-200">
              <table className="w-full border-collapse" style={{ display: "table" }}>
                <thead>
                  <tr className="bg-[#00114E] text-white">
                    <th className="py-3 px-3 text-left font-bold text-xs sm:text-sm">Feature</th>
                    <th className="py-3 px-3 text-center font-bold text-[#afff3d] text-xs sm:text-sm">Grabnext Bundle</th>
                    <th className="py-3 px-3 text-center font-bold text-red-300 text-xs sm:text-sm">Adobe Official</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {[
                    ["Price", "₹249 Once", "₹5,500/mo"],
                    ["All 15+ Apps", "✅ Yes", "✅ Yes"],
                    ["Pre-Activated", "✅ Instant", "❌ Sub Required"],
                    ["Lifetime Access", "✅ Lifetime", "❌ Monthly Fee"],
                    ["Windows & Mac", "✅ Both", "✅ Both"],
                    ["M1/M2/M3/M4 Support", "✅ Yes", "✅ Yes"],
                    ["Instant Download", "✅ Instant", "⏳ Slow Install"],
                    ["Total Cost/Year", "₹249 (Total)", "₹66,000+/yr"],
                  ].map(([feat, g, a], i) => (
                    <tr key={feat} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} border-t border-gray-100 hover:bg-blue-50/20 transition-colors`}>
                      <td className="py-2.5 px-3 text-gray-700 font-semibold text-[11px] sm:text-sm">{feat}</td>
                      <td className="py-2.5 px-3 text-center text-green-600 font-bold text-[11px] sm:text-sm">{g}</td>
                      <td className="py-2.5 px-3 text-center text-red-500 font-medium text-[11px] sm:text-sm">{a}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── 8. FREE BONUS PRODUCTS ── */}
        <section className="bg-[#000d3b] py-16 px-4 text-white">
          <div className="max-w-6xl mx-auto">
            {/* Main Header */}
            <div className="text-center mb-12">
              <span className="bg-yellow-400 text-black px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-lg">
                💥 Special Launch Offer Bonuses
              </span>
              <h2 className="font-black mt-4 text-white" style={{ fontSize: "clamp(26px,4vw,44px)", fontFamily: "Poppins, sans-serif", lineHeight: 1.2 }}>
                🎁 Get the Ultimate Graphic Designing Bundle (800+ GB) & 11 Mega Collections For FREE!
              </h2>
              <p className="text-[#00FFFF] max-w-3xl mx-auto mt-3 text-sm sm:text-base leading-relaxed" style={{ fontFamily: "Poppins, sans-serif" }}>
                Claim lifetime access to over ₹24,999 worth of premium design assets, video courses, and business templates when you purchase the Adobe CC Bundle today.
              </p>
            </div>

            {/* Spotlight Bonus: Graphic Designing Bundle (800+ GB Plan) */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-10 mb-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-red-600 text-white font-black px-6 py-2 rounded-bl-2xl text-xs uppercase tracking-wider z-10 shadow-md">
                Included Free
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Left: Box Mockup */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <div className="relative group max-w-[320px] w-full">
                    <div className="absolute -inset-1.5 bg-gradient-to-r from-yellow-400 to-[#afff3d] rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-[#00114E] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                      <img src="/images/graphic-bundle-675gb.png" alt="675 GB Graphics Bundle Box Mockup" className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-300" />
                    </div>
                  </div>
                  <span className="text-xs text-white/50 mt-3 font-semibold uppercase tracking-wider">
                    800+ GB Plan Graphic Designing Bundle
                  </span>
                </div>

                {/* Right: Asset List */}
                <div className="md:col-span-7">
                  <h3 className="text-2xl font-black text-[#afff3d] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                    Ultimate Graphic Designing Bundle (800+ GB Plan)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {[
                      "8,000+ Lightroom Presets",
                      "20+ Free Video Courses",
                      "500+ Resume / CV Templates",
                      "1,000+ PSD Graphic Data & PSD Cards",
                      "300+ Social Media Premium Templates",
                      "CorelDraw (CDR) Pack (Visiting Cards, letterheads)",
                      "Visiting Cards, Letterheads, Logos, etc.",
                      "Wedding Collection & Wedding Album Templates",
                      "HD Icons & Motion Graphics",
                      "Banners: Real Estate, Grocery, Education, Dental, Lubricant Oil & 100+ Restaurant Banners",
                      "Sales Scripts Pack (Email, LinkedIn, Instagram DM, Pitching Scripts)",
                      "Social Media Calendar, Digital V-Cards & Clip Art"
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-sm text-white/90">
                        <span className="text-yellow-400 font-bold shrink-0 mt-0.5">✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Access / Download Instructions Note */}
                  <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-2xl p-4 flex gap-3 text-white/95">
                    <span className="text-2xl shrink-0 mt-0.5">ℹ️</span>
                    <div>
                      <p className="text-xs font-black uppercase text-yellow-400 tracking-wider mb-1">
                        How to Access Your Graphic Bundle
                      </p>
                      <p className="text-xs leading-relaxed text-white/80">
                        Download link for the Ultimate Graphic Designing Bundle is sent directly to your <strong className="text-white">email invoice</strong> immediately post-payment. Simply click <strong className="text-yellow-400">“Click here to Download Graphic designing Bundle”</strong> on the invoice you receive at your payment email.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 11 Mega Creative Collections Grid */}
            <div className="mb-12">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-white" style={{ fontFamily: "Poppins, sans-serif" }}>
                  11 Mega Creative Collections Included
                </h3>
                <p className="text-white/60 text-xs mt-1">
                  Ready-to-use project assets, templates, and libraries to speed up your workflow.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { num: "01", name: "Photoshop Collection", desc: "Premium brushes, actions, overlays, shapes, and tools." },
                  { num: "02", name: "Corel Draw Collection", desc: "Vector CDR files, designs, visiting cards, and letterheads." },
                  { num: "03", name: "Logos", desc: "10,000+ high-quality customizable logo templates." },
                  { num: "04", name: "Fonts", desc: "5,000+ premium localized and corporate font families." },
                  { num: "05", name: "Mockups", desc: "T-shirts, packaging, apparel, and branding templates." },
                  { num: "06", name: "PNG Images Collection", desc: "High-definition transparent assets for quick compositing." },
                  { num: "07", name: "Adobe Illustrator Collection", desc: "AI files, vectors, background patterns, and assets." },
                  { num: "08", name: "Adobe Premiere Collection", desc: "Transitions, title cards, overlays, and color LUTs." },
                  { num: "09", name: "Adobe After Effects Collection", desc: "Video templates, intro animations, and sound effects." },
                  { num: "10", name: "Adobe InDesign Collection", desc: "Books, magazines, resumes, and brochures layouts." },
                  { num: "11", name: "PowerPoint Collection", desc: "Slide decks, pitch templates, and business presentations." }
                ].map((col) => (
                  <div key={col.num} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors shadow-lg">
                    <span className="text-xs font-bold text-[#afff3d] uppercase tracking-wider block mb-1">
                      Collection {col.num}
                    </span>
                    <h4 className="font-bold text-white text-sm mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>
                      {col.name}
                    </h4>
                    <p className="text-white/60 text-xs leading-relaxed">
                      {col.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Store Products secondary list */}
            {products.length > 0 && (
              <div className="border-t border-white/10 pt-10">
                <h4 className="text-center font-bold text-white mb-6 text-sm sm:text-base uppercase tracking-wide">
                  🎁 Plus, Get All These Active Products from Our Catalog Free!
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {products.map((p: any) => (
                    <ProductCard key={p.id} name={p.name || p.title} img={p.imageUrl || p.image || ""} value={p.price ? `₹${p.price}` : undefined} bg="white" />
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center mt-10">
              <a href="/checkout" onClick={handleBuyClick} className="animate-[animatedgradient_3s_ease_infinite_alternate] hover:-translate-y-0.5 hover:shadow-[0px_4px_6px_rgba(0,0,0,0.5)] transition-all" style={{ ...BTN_STYLE, animation: undefined, fontSize: "clamp(14px,2.5vw,28px)", padding: "10px 36px", width: "min(80%,520px)" }}>
                🚀 Get All Bonuses FREE — Only ₹249/- 🚀
              </a>
            </div>
          </div>
        </section>

        {/* ── 9. TESTIMONIALS ── */}
        <section className="bg-white py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center font-black text-3xl md:text-4xl text-[#00114E] mb-8">⭐ What Our Customers Say</h2>
            <div className="grid md:grid-cols-2 gap-5">
              {TESTIMONIALS.map(t => (
                <div key={t.name} className="rounded-2xl p-6 border border-gray-100 shadow-md bg-gray-50">
                  <StarRating n={t.stars} />
                  <p className="text-gray-700 italic text-sm leading-relaxed mb-4">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#00114E] flex items-center justify-center text-white font-black">{t.name[0]}</div>
                    <div>
                      <div className="font-bold text-gray-800 text-sm">{t.name}</div>
                      <div className="text-gray-500 text-xs">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 10. PRICING / BUY ── */}
        <section id="buy" className="bg-[#00114E] py-12 px-4">
          <div className="max-w-2xl mx-auto text-center text-white">
            <div className="inline-block bg-red-500 text-white px-4 py-1 rounded-full text-sm font-bold mb-4 animate-pulse">⏰ LIMITED TIME OFFER</div>
            <h2 className="font-black mb-2" style={{ fontSize: "clamp(24px,5vw,44px)" }}>Get The Full Bundle NOW</h2>
            <CountdownTimer />
            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-6">
              <div className="text-white/50 line-through text-lg mb-1">Regular Price: ₹2,499</div>
              <div className="font-black text-[#FFC800]" style={{ fontSize: "clamp(48px,8vw,80px)", lineHeight: 1 }}>₹249</div>
              <div className="text-[#afff3d] font-bold text-lg">ONE-TIME PAYMENT — 90% OFF!</div>
              <div className="text-white/70 text-sm mt-3">✅ 15+ Adobe CC Apps &nbsp;|&nbsp; ✅ 8 Free Bonuses &nbsp;|&nbsp; ✅ Lifetime Access</div>
            </div>
            <a href="/checkout" onClick={handleBuyClick} className="block animate-[animatedgradient_3s_ease_infinite_alternate] hover:-translate-y-0.5 hover:shadow-[0px_4px_6px_rgba(0,0,0,0.5)] transition-all" style={{ ...BTN_STYLE, animation: undefined, fontSize: "clamp(16px,3vw,34px)", padding: "14px 20px" }}>
              🚀 YES! GET INSTANT ACCESS AT ₹249/- 🚀
            </a>
            <p className="text-white/50 text-xs mt-4">🔒 Secure Checkout &nbsp;|&nbsp; ⚡ Instant Delivery &nbsp;|&nbsp; 🛡️ Support Guaranteed</p>
          </div>
        </section>

        {/* ── 11. GUARANTEE ── */}
        <section className="bg-white py-10 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-6xl mb-4">🛡️</div>
            <h2 className="font-black text-2xl text-gray-800 mb-3">100% Installation Support Guaranteed</h2>
            <p className="text-gray-600 leading-relaxed">If you face any issues during installation or the software doesn't work as described, our expert support team will help you resolve it — for free. Your satisfaction is our priority. We've helped 3,929+ customers successfully!</p>
          </div>
        </section>

        {/* ── 12. FAQ ── */}
        <section className="bg-gray-50 py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-center font-black text-3xl text-gray-800 mb-8">Frequently Asked Questions</h2>
            {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
          </div>
        </section>

        <section className="bg-[#00114E] text-white text-center py-12 px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-black mb-4" style={{ fontSize: "clamp(22px,4vw,38px)" }}>Don't Miss This Limited Time Offer!</h2>
            <p className="text-[#00FFFF] mb-6 text-lg">Join 3,929+ professionals who already own the ultimate Adobe bundle.</p>
            <a href="/checkout" onClick={handleBuyClick} className="inline-block animate-[animatedgradient_3s_ease_infinite_alternate] hover:-translate-y-0.5 hover:shadow-[0px_4px_6px_rgba(0,0,0,0.5)] transition-all" style={{ ...BTN_STYLE, animation: undefined, fontSize: "clamp(16px,3vw,32px)", padding: "14px 40px" }}>
              🚀 GET INSTANT ACCESS — ONLY ₹249/- 🚀
            </a>
            <p className="text-white/50 text-xs mt-4">⚡ Instant Access &nbsp;|&nbsp; ✅ Pre-Activated &nbsp;|&nbsp; 🍎 Mac & 🪟 Windows</p>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="bg-gray-900 text-gray-400 text-center py-8 px-4 text-xs">
          <div className="max-w-3xl mx-auto">
            <p className="mb-3 opacity-60">Disclaimer: Results may vary. This is a digital product. Please ensure your system meets the minimum requirements before purchasing. All trademarks belong to their respective owners.</p>
            <div className="flex flex-wrap justify-center gap-4 mb-3 text-gray-500">
              <a href="/privacy" className="hover:text-white">Privacy Policy</a>
              <a href="/terms" className="hover:text-white">Terms of Service</a>
              <a href="/refund" className="hover:text-white">Refund Policy</a>
              <a href="/contact" className="hover:text-white">Contact Us</a>
            </div>
            <p>© {new Date().getFullYear()} Grabnext. All rights reserved. | Payments secured by XPay 🔒</p>
          </div>
        </footer>
      </div>
    </>
  );
}
