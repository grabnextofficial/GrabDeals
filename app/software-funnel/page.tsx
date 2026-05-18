"use client";
import { useState, useEffect, useRef } from "react";
import { PRODUCT_BUY_URL, INCLUDED_SOFTWARE, BONUS_PRODUCTS, TESTIMONIALS, FAQS, FEATURES } from "./data";

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
          <img src={img} alt={name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
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

  useEffect(() => {
    fetch("/api/products").then(r => r.json()).then(d => {
      const list = Array.isArray(d) ? d : (d.products || []);
      setProducts(list.slice(0, 12));
    }).catch(() => {});
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        @keyframes animatedgradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          75% { background-position: 0% 50%; }
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        body { font-family: 'Poppins', sans-serif; }
        .section-dark { background-color: #00114E; }
        .highlight { color: rgba(255,168,0,1); }
        .highlight-bg { background: white; color: black; box-shadow: 5px 5px 0 0 rgba(255,168,0,1); padding: 0 6px; }
        .text-cyan { color: #00FFFF; }
        .light { background: linear-gradient(180deg, #FFC800 0%, #01F7F7 85%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .btn-cta:hover { transform: translateY(2px); box-shadow: 0px 4px 6px rgba(0,0,0,0.5) !important; }
      `}</style>

      <div style={{ fontFamily: "Poppins, sans-serif" }}>

        {/* ── 1. TOP URGENCY BAR ── */}
        <div style={{ backgroundColor: "#05FF00" }} className="text-black text-center py-2 px-4 font-bold text-sm sticky top-0 z-50">
          🔥 Adobe All Premium Software Bundle 2026! &nbsp;|&nbsp; Launch Sale: <strong>90% OFF</strong> &nbsp;|&nbsp;
          <a href="#buy" className="underline font-black">Grab Now →</a>
        </div>

        {/* ── 2. HERO ── */}
        <section className="section-dark text-white text-center py-10 px-4 relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: "rgba(0,17,78,0.6)" }} />
          {/* glow orbs */}
          <div className="absolute" style={{ width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(175,255,61,0.21) 0%, rgba(242,41,91,0) 70%)", top: -273, left: -230, pointerEvents: "none" }} />
          <div className="relative z-10 max-w-5xl mx-auto">
            <h1 style={{ fontSize: "clamp(26px,5vw,46px)", fontWeight: 800, lineHeight: 1.4, marginBottom: 12 }}>
              Discover The <span className="highlight">Ultimate Creative Software Bundle</span> To{" "}
              <u>Skyrocket Your Creativity</u> With{" "}
              <span className="highlight-bg">&nbsp;Adobe All Premium 2026!&nbsp;</span>
            </h1>
            <p style={{ fontSize: "clamp(14px,2.5vw,26px)", fontWeight: 500, fontStyle: "italic", textDecoration: "underline", color: "#00FFFF", marginBottom: 20 }}>
              All 15+ Adobe CC Apps — Windows & Mac — Pre-Activated for Lifetime!
            </p>
            {/* Video placeholder */}
            <div className="mx-auto mb-6 rounded-lg overflow-hidden border border-gray-600" style={{ maxWidth: 700, aspectRatio: "16/9", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <img src="https://grabnext.pages.dev/api/placeholder?w=700&h=394" alt="Adobe Bundle Preview" className="w-full h-full object-cover absolute inset-0" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                  <span className="text-3xl ml-1">▶</span>
                </div>
                <p className="text-white/70 text-sm">Click to Watch Demo</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <a href="#buy" className="btn-cta" style={{ ...BTN_STYLE, fontSize: "clamp(16px,3vw,32px)", padding: "12px 40px", width: "min(80%,560px)" }}>
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
              {INCLUDED_SOFTWARE.map((s) => (
                <ProductCard key={s.name} name={s.name} img="" bg="white" />
              ))}
            </div>
            <div className="flex justify-center mt-8">
              <a href="#buy" className="btn-cta" style={{ ...BTN_STYLE, fontSize: "clamp(14px,2.5vw,28px)", padding: "10px 36px", width: "min(80%,520px)" }}>
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
              {INCLUDED_SOFTWARE.map(s => (
                <div key={s.name} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
                  <span className="text-xl">{s.emoji}</span>
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
          <div className="max-w-3xl mx-auto">
            <h2 className="text-center font-black text-3xl text-gray-800 mb-8">Grabnext vs. Adobe Subscription</h2>
            <div className="overflow-x-auto">
              <table className="w-full rounded-2xl overflow-hidden shadow-lg">
                <thead>
                  <tr className="bg-[#00114E] text-white">
                    <th className="py-3 px-4 text-left font-bold">Feature</th>
                    <th className="py-3 px-4 text-center font-bold text-[#afff3d]">Grabnext Bundle</th>
                    <th className="py-3 px-4 text-center font-bold text-red-300">Adobe Official</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {[
                    ["Price", "₹249 One-Time", "₹5,500/month"],
                    ["All 15+ Apps", "✅ Yes", "✅ Yes"],
                    ["Pre-Activated", "✅ Instant", "❌ Subscription Required"],
                    ["Lifetime Access", "✅ Forever", "❌ Monthly Renewal"],
                    ["Windows & Mac", "✅ Both", "✅ Both"],
                    ["M1/M2/M3/M4 Support", "✅ Yes", "✅ Yes"],
                    ["Instant Download", "✅ Seconds", "⏳ Slow Install"],
                    ["Total Cost/Year", "₹249 (ONCE!)", "₹66,000+/year"],
                  ].map(([feat, g, a], i) => (
                    <tr key={feat} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="py-3 px-4 text-gray-700 font-medium text-sm">{feat}</td>
                      <td className="py-3 px-4 text-center text-green-600 font-bold text-sm">{g}</td>
                      <td className="py-3 px-4 text-center text-red-500 text-sm">{a}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── 8. FREE BONUS PRODUCTS ── */}
        <section className="section-dark py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center font-black text-white mb-1" style={{ fontSize: "clamp(22px,4vw,40px)", fontFamily: "Poppins, sans-serif" }}>
              🎁 FREE Bonus Products Worth ₹3,000+
            </h2>
            <p className="text-center text-[#00FFFF] italic underline mb-6" style={{ fontFamily: "Poppins, sans-serif", fontSize: "clamp(13px,2vw,20px)" }}>
              Exclusively For Today's Purchase — Limited Time Only!
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {BONUS_PRODUCTS.map(b => (
                <ProductCard key={b.name} name={b.name} img={b.img} value={b.value} bg="white" />
              ))}
              {/* Live products from API */}
              {products.slice(0, 4).map((p: any) => (
                <ProductCard key={p.id} name={p.name || p.title} img={p.imageUrl || p.image || ""} value={p.price ? `₹${p.price}` : undefined} bg="white" />
              ))}
            </div>
            <div className="flex justify-center mt-8">
              <a href="#buy" className="btn-cta" style={{ ...BTN_STYLE, fontSize: "clamp(14px,2.5vw,28px)", padding: "10px 36px", width: "min(80%,520px)" }}>
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
        <section id="buy" className="section-dark py-12 px-4">
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
            <a href={PRODUCT_BUY_URL} className="btn-cta block" style={{ ...BTN_STYLE, fontSize: "clamp(16px,3vw,34px)", padding: "14px 20px" }}>
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

        {/* ── 13. FINAL CTA ── */}
        <section className="section-dark py-12 px-4 text-center text-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-black mb-4" style={{ fontSize: "clamp(22px,4vw,38px)" }}>Don't Miss This Limited Time Offer!</h2>
            <p className="text-[#00FFFF] mb-6 text-lg">Join 3,929+ professionals who already own the ultimate Adobe bundle.</p>
            <a href={PRODUCT_BUY_URL} className="btn-cta inline-block" style={{ ...BTN_STYLE, fontSize: "clamp(16px,3vw,32px)", padding: "14px 40px" }}>
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
