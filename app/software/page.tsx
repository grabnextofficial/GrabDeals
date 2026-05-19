"use client";
import { useState, useEffect } from "react";
import { PRODUCT_BUY_URL, INCLUDED_SOFTWARE, TESTIMONIALS, FAQS, FEATURES } from "./data";
import { useCart } from "@/contexts/cart-context";
import { useRouter } from "next/navigation";
import { trackAddToCart } from "@/lib/pixel";

/* ── Animated CTA Button (matches Elementor .btn class) ── */
const BTN_STYLE: React.CSSProperties = {
  backgroundImage: "linear-gradient(135deg, #15803d 0%, #22c55e 100%)",
  backgroundSize: "200% 200%",
  borderRadius: "10px",
  boxShadow: "0px 6px 15px 0px rgba(21, 128, 61, 0.35)",
  color: "#fff",
  fontFamily: "Poppins, sans-serif",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  display: "inline-block",
  textDecoration: "none",
  textAlign: "center" as const,
  cursor: "pointer",
  border: "none",
  transition: "transform 0.1s, box-shadow 0.2s",
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
        <div key={l} className="bg-emerald-600 text-white rounded-lg px-3 py-2 min-w-[64px] text-center shadow-lg">
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
    <div className="border border-green-100 rounded-xl overflow-hidden mb-3 bg-white shadow-sm transition-all hover:border-green-200">
      <button onClick={() => setOpen(!open)} className="w-full text-left px-5 py-4 font-bold text-gray-800 flex justify-between items-center hover:bg-green-50/20" style={{ fontFamily: "Poppins, sans-serif" }}>
        <span className="text-sm sm:text-base">{q}</span>
        <span className="text-xl ml-4 shrink-0 text-green-600">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-50 pt-3">{a}</div>}
    </div>
  );
}

/* Product image card */
function ProductCard({ name, img, value, bg = "white" }: { name: string; img?: string; value?: string; bg?: string }) {
  return (
    <div className="flex flex-col items-center text-center rounded-xl overflow-hidden border border-gray-100/80 transition-transform duration-200 hover:-translate-y-0.5" style={{ background: bg, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.04), 0 2px 4px -1px rgba(0,0,0,0.02)", padding: 8 }}>
      <div className="w-full aspect-square relative overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center">
        {img ? (
          <img src={img} alt={name} className="w-full h-full object-contain p-2" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <span className="text-4xl text-green-600 font-bold">{name.split(" ")[0]}</span>
        )}
      </div>
      <p className="text-gray-900 font-bold mt-2 text-xs sm:text-sm leading-tight px-1" style={{ fontFamily: "Poppins, sans-serif" }}>{name}</p>
      {value && <span className="text-[11px] text-green-600 font-extrabold mt-1">Worth {value}</span>}
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
      <div style={{ fontFamily: "Poppins, sans-serif" }} className="bg-white">

        {/* ── 1. TOP URGENCY BAR ── */}
        <div className="bg-green-600 text-white text-center py-2.5 px-4 font-bold text-xs sm:text-sm sticky top-0 z-50 shadow-md">
          🔥 Adobe All Premium Software Bundle 2026! &nbsp;|&nbsp; Launch Sale: <strong>90% OFF</strong> &nbsp;|&nbsp;
          <a href="/checkout" onClick={handleBuyClick} className="underline font-black hover:text-green-100 transition-colors ml-1">Grab Now →</a>
        </div>

        {/* ── 2. HERO (Clean White/Green theme) ── */}
        <section className="bg-gradient-to-b from-green-50/50 via-white to-white text-gray-900 text-center py-14 px-4 relative overflow-hidden border-b border-gray-100">
          <div className="absolute" style={{ width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.1) 0%, rgba(255,255,255,0) 70%)", top: -200, left: -100, pointerEvents: "none" }} />
          <div className="relative z-10 max-w-5xl mx-auto">
            <span className="bg-green-100 text-green-800 text-xs sm:text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm mb-4 inline-block">
              ⚡ Instant Download & Lifetime Access
            </span>
            <h1 className="leading-tight text-gray-900 mb-4" style={{ fontSize: "clamp(26px,4.5vw,46px)", fontWeight: 900 }}>
              Stop Paying Expensive Monthly Subscriptions! Get The <span className="text-green-700">Ultimate Creative Software Bundle</span> With{" "}
              <span className="bg-green-600 text-white shadow-[4px_4px_0_0_#15803d] px-2.5 rounded-sm">&nbsp;Adobe All Premium 2026!&nbsp;</span>
            </h1>
            <p className="font-bold underline text-green-600 mb-6" style={{ fontSize: "clamp(14px,2.2vw,24px)" }}>
              All 20+ Premium Creative Apps — Windows & Mac — Pre-Activated for Lifetime!
            </p>
            {/* Adobe Bundle Image */}
            <div className="mx-auto mb-8 rounded-2xl overflow-hidden border border-gray-150 shadow-2xl relative bg-gray-50" style={{ maxWidth: 800, aspectRatio: "16/9", display: "flex", alignItems: "center", justifyItems: "center" }}>
               <img src={banner?.imageUrl || "https://media.licdn.com/dms/image/D4D12AQGg4FhYvYlFwA/article-cover_image-shrink_720_1280/0/1689108390829?e=2147483647&v=beta&t=aI8jVq8vQZ3PZ4b1_O7m9L8-K_rTzJg5nL3x-5Qc4Kk"} alt="Adobe All Premium Software Bundle Collection 2026" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = "https://grabnext.pages.dev/api/placeholder?w=800&h=450&text=Adobe+All+Premium+Collection+2026"; }} />
               <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent flex items-end justify-center pb-4">
                  <span className="bg-green-600 text-white font-black px-5 py-1.5 rounded-full text-xs sm:text-sm shadow-lg flex items-center gap-1.5">
                    <span>⚡</span> Instant Delivery Included
                  </span>
               </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button onClick={handleBuyClick} className="hover:-translate-y-0.5 hover:shadow-[0px_8px_20px_rgba(21,128,61,0.5)] transition-all duration-200" style={{ ...BTN_STYLE, fontSize: "clamp(16px,2.8vw,30px)", padding: "14px 44px", width: "min(90%,560px)" }}>
                🚀 Get Instant Access At Just ₹249/- 🚀
              </button>
            </div>
            <p className="text-gray-500 text-xs sm:text-sm mt-4 font-semibold flex items-center justify-center flex-wrap gap-x-4 gap-y-1">
              <span>✅ Instant Email Delivery</span>
              <span>•</span>
              <span>✅ Pre-Activated (Pre-patched)</span>
              <span>•</span>
              <span>✅ Windows & Mac Support</span>
              <span>•</span>
              <span>✅ Lifetime Access</span>
            </p>
          </div>
        </section>

        {/* ── 3. TRUST STATS ── */}
        <section className="bg-green-50/20 py-8 px-4 border-b border-gray-100">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            {[["3,929+", "Happy Customers"], ["20+", "Creative Software Tools"], ["24x7", "WhatsApp Support"], ["₹249", "One-Time Price"]].map(([n, l]) => (
              <div key={l} className="text-center py-4 px-3 bg-white rounded-xl border border-green-100 shadow-sm">
                <div className="text-2xl md:text-3xl font-black text-green-700">{n}</div>
                <div className="text-gray-600 text-xs sm:text-sm font-bold mt-1">{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. WHAT YOU GET ── */}
        <section className="bg-white py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center font-bold text-green-600 text-lg sm:text-xl mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>Here's What All You'll Get…</h2>
            <h3 className="text-center font-black text-3xl md:text-4xl text-gray-900 mb-8" style={{ fontFamily: "Poppins, sans-serif" }}>Adobe CC Bundle 2026</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {INCLUDED_SOFTWARE.map((s: any) => (
                <ProductCard key={s.name} name={s.name} img={s.logo} bg="white" />
              ))}
            </div>
            <div className="flex justify-center mt-10">
              <button onClick={handleBuyClick} className="hover:-translate-y-0.5 hover:shadow-[0px_8px_20px_rgba(21,128,61,0.5)] transition-all duration-200" style={{ ...BTN_STYLE, fontSize: "clamp(14px,2.5vw,26px)", padding: "12px 38px", width: "min(85%,500px)" }}>
                🚀 Get Instant Access At Just ₹249/- 🚀
              </button>
            </div>
          </div>
        </section>

        {/* ── 5. ALL SOFTWARE INCLUDED (Checklist) ── */}
        <section className="py-12 px-4 bg-green-50/15 border-y border-green-100/40">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center font-black text-2xl md:text-3xl text-gray-900 mb-2">Everything Included in One Bundle</h2>
            <p className="text-center text-gray-500 mb-8 text-sm">All 20+ creative tools and software programs — no monthly fees ever</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {INCLUDED_SOFTWARE.map((s: any) => (
                <div key={s.name} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-green-50/50 hover:border-green-200 transition-colors">
                  <img src={s.logo} alt={s.name} className="w-8 h-8 object-contain" />
                  <span className="font-bold text-gray-800 text-sm sm:text-base">{s.name}</span>
                  <span className="ml-auto text-green-600 font-extrabold text-xs bg-green-50 px-2.5 py-1 rounded-full border border-green-100">✓ Included</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. SPECIAL LAUNCH OFFER BONUSES (Placed right under included software list) ── */}
        <section className="bg-white py-16 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Main Header */}
            <div className="text-center mb-12">
              <span className="bg-green-600 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-md">
                💥 Special Launch Offer Bonuses
              </span>
              <h2 className="font-black mt-4 text-gray-900" style={{ fontSize: "clamp(26px,4vw,42px)", fontFamily: "Poppins, sans-serif", lineHeight: 1.2 }}>
                🎁 Get the Ultimate Graphic Designing Bundle, Video Editing Bundle & 11 Mega Collections For FREE!
              </h2>
              <p className="text-green-600 max-w-3xl mx-auto mt-3 text-sm sm:text-base font-medium" style={{ fontFamily: "Poppins, sans-serif" }}>
                Claim lifetime access to over ₹34,999 worth of premium editing presets, vector files, video courses, and outreach templates when you buy the Adobe CC Bundle today.
              </p>
            </div>

            {/* Spotlight Bonus 1: Graphic Designing Bundle (800+ GB Plan) */}
            <div className="bg-white border-2 border-green-500/20 rounded-3xl p-6 md:p-10 mb-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-green-600 text-white font-black px-6 py-2 rounded-bl-2xl text-xs uppercase tracking-wider z-10">
                Bonus #1 Included
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Left: Box Mockup */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <div className="relative group max-w-[300px] w-full">
                    <div className="absolute -inset-1.5 bg-gradient-to-r from-green-500 to-emerald-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                    <div className="relative bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-150">
                      <img src="/images/graphic-bundle-675gb.png" alt="675 GB Graphics Bundle Box Mockup" className="w-full h-auto object-cover transform hover:scale-102 transition-transform duration-300" />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 mt-3 font-bold uppercase tracking-wider">
                    800+ GB Plan Graphic Designing Bundle
                  </span>
                </div>

                {/* Right: Asset List */}
                <div className="md:col-span-7">
                  <h3 className="text-2xl font-black text-gray-900 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
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
                      <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-600 font-black shrink-0">✓</span>
                        <span className="font-medium">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Access Instructions */}
                  <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex gap-3 text-green-950">
                    <span className="text-xl shrink-0">ℹ️</span>
                    <div>
                      <p className="text-xs font-black uppercase text-green-800 tracking-wider mb-1">
                        How to Access Your Graphic Bundle
                      </p>
                      <p className="text-xs leading-relaxed text-gray-700">
                        Download link for the Ultimate Graphic Designing Bundle is sent directly to your <strong className="text-gray-900 font-bold">email invoice</strong> immediately post-payment. Simply click <strong className="text-green-700 font-bold">“Click here to Download Graphic designing Bundle”</strong> on the invoice you receive.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Spotlight Bonus 2: Video Editing Bundle (New Addition) */}
            <div className="bg-white border-2 border-green-500/20 rounded-3xl p-6 md:p-10 mb-12 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-green-600 text-white font-black px-6 py-2 rounded-bl-2xl text-xs uppercase tracking-wider z-10">
                Bonus #2 Included
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Left: Beautiful Vector/Mockup Container */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <div className="relative group max-w-[280px] w-full bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-8 border border-green-200/50 shadow-lg text-center">
                    <div className="text-6xl mb-3 filter drop-shadow-md">🎬</div>
                    <h4 className="text-lg font-black text-green-800 uppercase tracking-wide">
                      Video Editing Mega Bundle
                    </h4>
                    <p className="text-xs text-gray-500 mt-2 font-semibold">
                      Pro Transitions, Presets, Luts & VFX Elements
                    </p>
                    <div className="mt-4 bg-green-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                      100% Free
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 mt-3 font-bold uppercase tracking-wider">
                    Full Video Editing Assets & SFX Pack
                  </span>
                </div>

                {/* Right: Asset List */}
                <div className="md:col-span-7">
                  <h3 className="text-2xl font-black text-gray-900 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                    Mega Video Editing Bundle Pack
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {[
                      "4K Cinematic Film Grains",
                      "70+ Wedding Video Invitations",
                      "100+ After Effects Plugins",
                      "Adobe Collections Projects & Presets",
                      "Animated Emoji Pack",
                      "Background Music Loops",
                      "Background Video Animations",
                      "Call Outs & YouTube Graphic Templates",
                      "Camera Recording View Overlays",
                      "Premium Color Grading LUTs",
                      "Dust, Rain, Smoke & Snow Overlays",
                      "VFX Fire Sparks Overlay Pack",
                      "Fonts Collections & Logo Animations",
                      "Glitch & Lens Bokeh Transition Packs",
                      "Light Leak Overlay Elements",
                      "Lower Third & Title Animation Packs",
                      "Motion Graphic Elements",
                      "Premiere Pro Effects Presets",
                      "Sound Effects (SFX) Collection",
                      "Stock Video Collections & Video Courses",
                      "Viral Meme Videos & YouTube Motion Graphics",
                      "Wedding Title Animations"
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-600 font-black shrink-0">✓</span>
                        <span className="font-medium">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Access Instructions */}
                  <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex gap-3 text-green-950">
                    <span className="text-xl shrink-0">ℹ️</span>
                    <div>
                      <p className="text-xs font-black uppercase text-green-800 tracking-wider mb-1">
                        How to Access Your Video Editing Bundle
                      </p>
                      <p className="text-xs leading-relaxed text-gray-700">
                        The full download link for the Video Editing Bundle is embedded directly inside your post-checkout PDF invoice. You can download all templates instantly with a single click.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 11 Mega Creative Collections Grid */}
            <div className="mb-12">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
                  11 Mega Creative Collections Included
                </h3>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">
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
                  <div key={col.num} className="bg-white border border-green-100 rounded-2xl p-5 hover:bg-green-50/30 transition-colors shadow-sm">
                    <span className="text-xs font-bold text-green-700 uppercase tracking-wider block mb-1">
                      Collection {col.num}
                    </span>
                    <h4 className="font-bold text-gray-900 text-sm mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>
                      {col.name}
                    </h4>
                    <p className="text-gray-500 text-xs leading-relaxed">
                      {col.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Store Products secondary list */}
            {products.length > 0 && (
              <div className="border-t border-gray-100 pt-10">
                <h4 className="text-center font-bold text-gray-800 mb-6 text-sm sm:text-base uppercase tracking-wide">
                  🎁 Plus, Get All These Active Products from Our Catalog Free!
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {products.map((p: any) => (
                    <ProductCard key={p.id} name={p.name || p.title} img={p.imageUrl || p.image || ""} value={p.price ? `₹${p.price}` : undefined} bg="white" />
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center mt-12">
              <button onClick={handleBuyClick} className="hover:-translate-y-0.5 hover:shadow-[0px_8px_20px_rgba(21,128,61,0.5)] transition-all duration-200" style={{ ...BTN_STYLE, fontSize: "clamp(14px,2.5vw,28px)", padding: "12px 40px", width: "min(85%,500px)" }}>
                🚀 Get All Bonuses FREE — Only ₹249/- 🚀
              </button>
            </div>
          </div>
        </section>

        {/* ── 7. WHY CHOOSE GRABNEXT ── */}
        <section className="bg-green-50/15 py-14 px-4 border-t border-green-100/50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center font-black text-3xl md:text-4xl text-gray-900 mb-2">Why Choose Grabnext?</h2>
            <p className="text-center text-gray-500 mb-8">India's most trusted digital software store — 3,929+ satisfied customers</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {FEATURES.map(f => (
                <div key={f.title} className="text-center p-5 bg-white rounded-2xl border border-green-50 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-3">{f.icon}</div>
                  <div className="font-black text-gray-800 text-sm mb-1">{f.title}</div>
                  <div className="text-gray-500 text-xs leading-relaxed">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 8. COMPARISON TABLE ── */}
        <section className="py-14 px-4 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-center font-black text-3xl text-gray-900 mb-8">Grabnext vs. Adobe Subscription</h2>
            <div className="w-full max-w-2xl mx-auto overflow-x-auto rounded-2xl shadow-xl border border-green-100">
              <table className="w-full border-collapse" style={{ display: "table" }}>
                <thead>
                  <tr className="bg-green-700 text-white">
                    <th className="py-3.5 px-4 text-left font-bold text-xs sm:text-sm">Feature</th>
                    <th className="py-3.5 px-4 text-center font-bold text-yellow-300 text-xs sm:text-sm">Grabnext Bundle</th>
                    <th className="py-3.5 px-4 text-center font-bold text-red-200 text-xs sm:text-sm">Adobe Official</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {[
                    ["Price", "₹249 Once", "₹5,500/mo"],
                    ["All 20+ Apps & Packs", "✅ Yes", "✅ Yes"],
                    ["Pre-Activated", "✅ Instant", "❌ Sub Required"],
                    ["Lifetime Access", "✅ Lifetime", "❌ Monthly Fee"],
                    ["Windows & Mac", "✅ Both", "✅ Both"],
                    ["M1/M2/M3/M4 Support", "✅ Yes", "✅ Yes"],
                    ["Instant Download", "✅ Instant", "⏳ Slow Install"],
                    ["Total Cost/Year", "₹249 (Total)", "₹66,000+/yr"],
                  ].map(([feat, g, a], i) => (
                    <tr key={feat} className={`${i % 2 === 0 ? "bg-white" : "bg-green-50/5"} border-t border-gray-100 hover:bg-green-50/20 transition-colors`}>
                      <td className="py-3 px-4 text-gray-700 font-semibold text-xs sm:text-sm">{feat}</td>
                      <td className="py-3 px-4 text-center text-green-600 font-black text-xs sm:text-sm">{g}</td>
                      <td className="py-3 px-4 text-center text-red-500 font-semibold text-xs sm:text-sm">{a}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── 9. TESTIMONIALS (Moved below comparison) ── */}
        <section className="bg-green-50/20 py-14 px-4 border-t border-green-100/30">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center font-black text-3xl md:text-4xl text-gray-900 mb-8">⭐ What Our Customers Say</h2>
            <div className="grid md:grid-cols-2 gap-5">
              {TESTIMONIALS.map(t => (
                <div key={t.name} className="rounded-2xl p-6 border border-green-50 shadow-md bg-white">
                  <StarRating n={t.stars} />
                  <p className="text-gray-700 italic text-sm leading-relaxed mb-4">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-black">{t.name[0]}</div>
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

        {/* ── 10. PRICING / BUY (Dark green background contrast) ── */}
        <section id="buy" className="bg-gradient-to-br from-green-900 to-emerald-950 py-16 px-4 text-white">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-block bg-red-600 text-white px-4 py-1 rounded-full text-xs font-black mb-4 animate-pulse">⏰ LIMITED TIME OFFER</div>
            <h2 className="font-black mb-2" style={{ fontSize: "clamp(24px,5vw,44px)" }}>Get The Full Bundle NOW</h2>
            <CountdownTimer />
            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-6">
              <div className="text-white/50 line-through text-lg mb-1">Regular Price: ₹2,499</div>
              <div className="font-black text-yellow-300" style={{ fontSize: "clamp(48px,8vw,80px)", lineHeight: 1 }}>₹249</div>
              <div className="text-green-300 font-black text-lg">ONE-TIME PAYMENT — 90% OFF!</div>
              <div className="text-white/80 text-xs sm:text-sm mt-3">✅ 20+ Creative Apps &nbsp;|&nbsp; ✅ 8 Free Bonuses &nbsp;|&nbsp; ✅ Lifetime Access</div>
            </div>
            <button onClick={handleBuyClick} className="block hover:-translate-y-0.5 hover:shadow-[0px_8px_20px_rgba(21,128,61,0.5)] transition-all duration-200" style={{ ...BTN_STYLE, width: "100%", fontSize: "clamp(16px,3vw,32px)", padding: "14px 20px" }}>
              🚀 YES! GET INSTANT ACCESS AT ₹249/- 🚀
            </button>
            <p className="text-white/55 text-xs mt-4">🔒 Secure Checkout &nbsp;|&nbsp; ⚡ Instant Delivery &nbsp;|&nbsp; 🛡️ Support Guaranteed</p>
          </div>
        </section>

        {/* ── 11. GUARANTEE ── */}
        <section className="bg-white py-12 px-4 border-b border-gray-100">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-6xl mb-4">🛡️</div>
            <h2 className="font-black text-2xl text-gray-800 mb-3">100% Installation Support Guaranteed</h2>
            <p className="text-gray-600 leading-relaxed">If you face any issues during installation or the software doesn't work as described, our expert support team will help you resolve it — for free. Your satisfaction is our priority. We've helped 3,929+ customers successfully!</p>
          </div>
        </section>

        {/* ── 12. FAQ ── */}
        <section className="bg-green-50/15 py-14 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-center font-black text-3xl text-gray-800 mb-8">Frequently Asked Questions</h2>
            {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
          </div>
        </section>

        {/* ── 13. PRE-FOOTER CTA ── */}
        <section className="bg-green-900 text-white text-center py-14 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-black mb-4" style={{ fontSize: "clamp(22px,4vw,38px)" }}>Don't Miss This Limited Time Offer!</h2>
            <p className="text-green-300 mb-6 text-lg font-semibold">Join 3,929+ professionals who already own the ultimate Adobe bundle.</p>
            <button onClick={handleBuyClick} className="inline-block hover:-translate-y-0.5 hover:shadow-[0px_8px_20px_rgba(21,128,61,0.5)] transition-all duration-200" style={{ ...BTN_STYLE, fontSize: "clamp(16px,3vw,30px)", padding: "14px 44px" }}>
              🚀 GET INSTANT ACCESS — ONLY ₹249/- 🚀
            </button>
            <p className="text-white/60 text-xs mt-4">⚡ Instant Access &nbsp;|&nbsp; ✅ Pre-Activated &nbsp;|&nbsp; 🍎 Mac & 🪟 Windows</p>
          </div>
        </section>

        {/* ── 14. FOOTER ── */}
        <footer className="bg-gray-950 text-gray-400 text-center py-8 px-4 text-xs border-t border-gray-900">
          <div className="max-w-3xl mx-auto">
            <p className="mb-3 opacity-60">Disclaimer: Results may vary. This is a digital product. Please ensure your system meets the minimum requirements before purchasing. All trademarks belong to their respective owners.</p>
            <div className="flex flex-wrap justify-center gap-4 mb-3 text-gray-500 font-semibold">
              <a href="/privacy" className="hover:text-white">Privacy Policy</a>
              <a href="/terms" className="hover:text-white">Terms of Service</a>
              <a href="/refund" className="hover:text-white">Refund Policy</a>
              <a href="/contact" className="hover:text-white">Contact Us</a>
            </div>
            <p>© {new Date().getFullYear()} Grabnext. All rights reserved. | Payments secured securely 🔒</p>
          </div>
        </footer>
      </div>
    </>
  );
}
