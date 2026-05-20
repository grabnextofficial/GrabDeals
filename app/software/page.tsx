"use client";
import { useState, useEffect } from "react";
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
  color: "#000",
  fontFamily: "Poppins, sans-serif",
  fontWeight: 850,
  textTransform: "uppercase" as const,
  display: "inline-block",
  textDecoration: "none",
  textAlign: "center" as const,
  cursor: "pointer",
  border: "none",
  transition: "transform 0.15s, box-shadow 0.2s",
};

const VIDEO_BUNDLE_ITEMS = [
  {
    name: "800+ Transitions Pack",
    worth: "₹1,999",
    desc: "Smooth, professional transitions including camera zooms, glides, splits, and motion pans.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/1.webp"
  },
  {
    name: "100+ After Effects Plugins",
    worth: "₹2,499",
    desc: "Speed up your workflow with ready-made plugins and presets to generate complex effects quickly.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/19.webp"
  },
  {
    name: "200+ Animated Emoji Pack",
    worth: "₹999",
    desc: "3D animotions, expressive animated icons, and emojis to instantly boost user engagement.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/23.webp"
  },
  {
    name: "2000+ FX Presets Pack",
    worth: "₹2,999",
    desc: "A giant suite of Adobe Premiere, After Effects, and DaVinci Resolve template presets.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/7.webp"
  },
  {
    name: "3000+ Sound Effects (SFX)",
    worth: "₹1,499",
    desc: "Cinematic risers, impacts, swooshes, nature sounds, typing keys, and transition audios.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/22.webp"
  },
  {
    name: "1000+ Royalty Free Music",
    worth: "₹1,299",
    desc: "Premium background tracks, loops, and instrumental melodies spanning multiple genres.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/29.webp"
  },
  {
    name: "200+ Cinematic LUTs",
    worth: "₹999",
    desc: "Hollywood-grade color lookup tables for professional cinematic grading in one click.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/21.webp"
  },
  {
    name: "70+ Wedding Video Invitation Templates",
    worth: "₹2,999",
    desc: "Beautiful video invitation templates for high-end digital invites and save-the-dates.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/14.webp"
  },
  {
    name: "Wedding Title Animation Pack",
    worth: "₹999",
    desc: "Calligraphy, floral titles, and elegant typography animations for wedding memories.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/18.webp"
  },
  {
    name: "4K Cinematic Film Grain",
    worth: "₹1,499",
    desc: "Add classic film grain textures, dust, scratches, and organic film look overlays.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/8.webp"
  },
  {
    name: "Glitch Transitions & Effects Pack",
    worth: "₹999",
    desc: "Digital glitch elements, error sweeps, and digital video distortions.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/4.webp"
  },
  {
    name: "Light Leak Overlays Pack",
    worth: "₹999",
    desc: "Realistic flares, light leaks, burn frames, and colorful retro glow sweeps.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/16.webp"
  },
  {
    name: "10,000+ Fonts Collection",
    worth: "₹1,999",
    desc: "Massive text typography library with localized, script, display, and modern fonts.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/9.webp"
  },
  {
    name: "Rain Overlays Pack",
    worth: "₹999",
    desc: "High-definition looping rain fall overlays, splash overlays, and wet atmospheric effects.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/11-1.webp"
  },
  {
    name: "Smoke Overlays Pack",
    worth: "₹999",
    desc: "Moody slow-motion looping smoke trails, mist, and cloud effects.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/12.webp"
  },
  {
    name: "Dust & Snow Particle Overlays",
    worth: "₹1,499",
    desc: "Organic dust specks, atmospheric lint particles, and realistic snowfall loops.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/13.webp"
  },
  {
    name: "YouTube Creator Essential Pack",
    worth: "₹2,499",
    desc: "Subscribers bar, bell icons, likes, info sliders, end screen links, and graphics.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/6.webp"
  },
  {
    name: "Lens & Bokeh Overlays",
    worth: "₹1,299",
    desc: "Organic glass flares, warm sun flares, and colorful bokeh circles.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/15.webp"
  },
  {
    name: "Logo Animation Pack",
    worth: "₹1,999",
    desc: "Professional templates for business intros. Plug your logo in and render.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/17.webp"
  },
  {
    name: "100+ Video Backgrounds",
    worth: "₹999",
    desc: "3D animation patterns, grids, lines, abstracts, and studio loops.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/20.webp"
  },
  {
    name: "Full Video Editing Masterclass",
    worth: "₹4,999",
    desc: "Premium video training from basics to advanced keyframing and tracking.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/5.webp"
  },
  {
    name: "Camera Rig View Overlays",
    worth: "₹999",
    desc: "Camera lens indicators, record lights, gridlines, and DSLR status screens.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/3.webp"
  },
  {
    name: "100+ Callout Graphics",
    worth: "₹999",
    desc: "Arrow lines, text pointer boxes, target indicators, and focus badges.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/24.webp"
  },
  {
    name: "1500+ Lower Third Pack",
    worth: "₹1,499",
    desc: "Clean minimal texts, social media handles, guest names, and branding ribbons.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/25.webp"
  },
  {
    name: "500+ High Quality Stock Videos",
    worth: "₹1,999",
    desc: "Royalty free footage, cinematic nature, business office, and city landscape loops.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/26.webp"
  },
  {
    name: "Motion Graphic Pack",
    worth: "₹2,499",
    desc: "Shape overlays, comic sparks, pop bursts, hand-drawn lines, and animation accents.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/27.webp"
  },
  {
    name: "Animated Title Pack",
    worth: "₹999",
    desc: "Stunning text layouts, kinetic typography, slide-ins, and modern header intros.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/28.webp"
  },
  {
    name: "1500+ Motivational Reels",
    worth: "₹3,999",
    desc: "Ready-to-upload HD viral videos for Instagram, TikTok, and YouTube Shorts.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/2-1.webp"
  },
  {
    name: "Premium E-books Bundle",
    worth: "₹1,999",
    desc: "In-depth PDF guides on digital marketing, copywriting, freelancing, and monetization.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/4-1.webp"
  },
  {
    name: "ChatGPT Prompts Collection",
    worth: "₹999",
    desc: "Pro prompts for writing email copies, scriptwriting, and automating workflows.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/3-1.webp"
  },
  {
    name: "Instagram Growth Masterclass",
    worth: "₹2,999",
    desc: "Exclusive video courses on Instagram virality, reel algorithms, and organic sales.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/8-1.webp"
  },
  {
    name: "Fire Spark Overlays",
    worth: "₹999",
    desc: "Cinematic embers, flame sparks, slow motion sparks, and burning particle overlays.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/10.webp"
  }
];

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
        <div key={l} className="bg-red-650 text-white rounded-lg px-3.5 py-2 min-w-[70px] text-center shadow-lg border border-red-500">
          <div className="text-3xl font-black font-mono leading-none">{v}</div>
          <div className="text-[10px] font-bold opacity-90 mt-1">{l}</div>
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
    <div className={`border rounded-2xl overflow-hidden mb-4 bg-white shadow-sm transition-all duration-200 ${open ? "border-green-400 ring-2 ring-green-50/50" : "border-gray-200 hover:border-gray-300"}`}>
      <button onClick={() => setOpen(!open)} className="w-full text-left px-6 py-4.5 font-extrabold text-gray-800 flex justify-between items-center hover:bg-gray-50/50" style={{ fontFamily: "Poppins, sans-serif" }}>
        <span className={`text-[15px] sm:text-base transition-colors ${open ? "text-green-700" : "text-gray-800"}`}>{q}</span>
        <span className={`text-2xl ml-4 shrink-0 font-bold transition-all duration-200 ${open ? "text-green-600 rotate-180" : "text-gray-400"}`}>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-50 pt-4 bg-slate-50/50 font-medium">
          {a}
        </div>
      )}
    </div>
  );
}

/* Product image card */
function ProductCard({ name, img, value, bg = "white" }: { name: string; img?: string; value?: string; bg?: string }) {
  const [imageError, setImageError] = useState(false);

  // Helper to extract brand initials and colors dynamically matching Adobe's branding
  const getInitialsAndColors = (appName: string) => {
    const clean = appName.replace("Adobe ", "").replace(" Studio", "").replace(" Pro", "").trim();
    let initials = "";
    const parts = clean.split(" ");
    
    if (parts.length >= 2) {
      initials = parts[0][0] + (parts[1][0] || "");
    } else if (clean.length >= 2) {
      initials = clean.substring(0, 2);
    } else {
      initials = clean;
    }
    // E.g., Ps, Ai, Pr, Ae, Ch, Ic, etc.
    initials = initials.charAt(0).toUpperCase() + initials.slice(1).toLowerCase();

    // Default dark slate background
    let bgGradient = "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)";
    let textColor = "#ffffff";
    let borderColor = "#ffffff20";

    const nameLower = appName.toLowerCase();
    if (nameLower.includes("photoshop")) {
      bgGradient = "linear-gradient(135deg, #001c3a 0%, #002d5c 100%)";
      textColor = "#31a8ff";
      borderColor = "#31a8ff50";
      initials = "Ps";
    } else if (nameLower.includes("illustrator")) {
      bgGradient = "linear-gradient(135deg, #331b00 0%, #542d00 100%)";
      textColor = "#ff9a00";
      borderColor = "#ff9a0050";
      initials = "Ai";
    } else if (nameLower.includes("premiere")) {
      bgGradient = "linear-gradient(135deg, #220033 0%, #3e005c 100%)";
      textColor = "#ea77ff";
      borderColor = "#ea77ff50";
      initials = "Pr";
    } else if (nameLower.includes("after effects")) {
      bgGradient = "linear-gradient(135deg, #1d0033 0%, #32005c 100%)";
      textColor = "#d291ff";
      borderColor = "#d291ff50";
      initials = "Ae";
    } else if (nameLower.includes("acrobat")) {
      bgGradient = "linear-gradient(135deg, #380000 0%, #5c0000 100%)";
      textColor = "#ff4d4d";
      borderColor = "#ff4d4d50";
      initials = "Ac";
    } else if (nameLower.includes("indesign")) {
      bgGradient = "linear-gradient(135deg, #330018 0%, #540028 100%)";
      textColor = "#ff55b8";
      borderColor = "#ff55b850";
      initials = "Id";
    } else if (nameLower.includes("lightroom")) {
      bgGradient = "linear-gradient(135deg, #002b33 0%, #004754 100%)";
      textColor = "#3be2ff";
      borderColor = "#3be2ff50";
      initials = "Lr";
    } else if (nameLower.includes("xd")) {
      bgGradient = "linear-gradient(135deg, #330026 0%, #54003f 100%)";
      textColor = "#ff61d5";
      borderColor = "#ff61d550";
      initials = "Xd";
    } else if (nameLower.includes("audition")) {
      bgGradient = "linear-gradient(135deg, #003328 0%, #005442 100%)";
      textColor = "#00e5ba";
      borderColor = "#00e5ba50";
      initials = "Au";
    } else if (nameLower.includes("animate")) {
      bgGradient = "linear-gradient(135deg, #3d0500 0%, #5c0800 100%)";
      textColor = "#ff4f38";
      borderColor = "#ff4f3850";
      initials = "An";
    } else if (nameLower.includes("dreamweaver")) {
      bgGradient = "linear-gradient(135deg, #2b3300 0%, #455400 100%)";
      textColor = "#d4ff00";
      borderColor = "#d4ff0050";
      initials = "Dw";
    } else if (nameLower.includes("media encoder")) {
      bgGradient = "linear-gradient(135deg, #1c002b 0%, #2f0047 100%)";
      textColor = "#bc6eff";
      borderColor = "#bc6eff50";
      initials = "Me";
    } else if (nameLower.includes("character animator")) {
      bgGradient = "linear-gradient(135deg, #0b1a3d 0%, #112d69 100%)";
      textColor = "#5eb3ff";
      borderColor = "#5eb3ff50";
      initials = "Ch";
    } else if (nameLower.includes("incopy")) {
      bgGradient = "linear-gradient(135deg, #380720 0%, #5c0d35 100%)";
      textColor = "#ff57b2";
      borderColor = "#ff57b250";
      initials = "Ic";
    } else if (nameLower.includes("substance")) {
      bgGradient = "linear-gradient(135deg, #0b221e 0%, #153f38 100%)";
      textColor = "#3be5c4";
      borderColor = "#3be5c450";
      initials = "Sa";
    } else if (nameLower.includes("bridge")) {
      bgGradient = "linear-gradient(135deg, #332400 0%, #543b00 100%)";
      textColor = "#ffbe1a";
      borderColor = "#ffbe1a50";
      initials = "Br";
    } else if (nameLower.includes("resolve")) {
      bgGradient = "linear-gradient(135deg, #0a0f1d 0%, #111a2e 100%)";
      textColor = "#3b82f6";
      borderColor = "#3b82f640";
      initials = "Dr";
    } else if (nameLower.includes("elements")) {
      bgGradient = "linear-gradient(135deg, #1c002b 0%, #2f0047 100%)";
      textColor = "#bc6eff";
      borderColor = "#bc6eff40";
      initials = "El";
    } else if (nameLower.includes("winrar")) {
      bgGradient = "linear-gradient(135deg, #1b3d1b 0%, #2e692e 100%)";
      textColor = "#a3ffa3";
      borderColor = "#a3ffa340";
      initials = "Wr";
    } else if (nameLower.includes("vhs")) {
      bgGradient = "linear-gradient(135deg, #1a1a1a 0%, #333333 100%)";
      textColor = "#ffffff";
      borderColor = "#ffffff30";
      initials = "Vs";
    }

    return { initials, bgGradient, textColor, borderColor };
  };

  const { initials, bgGradient, textColor, borderColor } = getInitialsAndColors(name);

  return (
    <div className="flex flex-col items-center text-center rounded-xl overflow-hidden border border-gray-150 transition-transform duration-200 hover:-translate-y-0.5" style={{ background: bg, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)", padding: 8 }}>
      <div className="w-full aspect-square relative overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center">
        {img && !imageError ? (
          <img 
            src={img} 
            alt={name} 
            className="w-full h-full object-contain p-2" 
            onError={() => setImageError(true)} 
          />
        ) : (
          <div 
            className="w-16 h-16 rounded-xl flex items-center justify-center border font-black text-2xl tracking-tight select-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
            style={{ 
              background: bgGradient, 
              color: textColor, 
              borderColor: borderColor
            }}
          >
            {initials}
          </div>
        )}
      </div>
      <p className="text-gray-900 font-extrabold mt-2 text-xs sm:text-sm leading-tight px-1" style={{ fontFamily: "Poppins, sans-serif" }}>{name}</p>
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
      <div style={{ fontFamily: "Poppins, sans-serif" }}>

        {/* ── 1. TOP URGENCY BAR (High visibility green positive alert) ── */}
        <div style={{ backgroundColor: "#05FF00" }} className="text-black text-center py-2.5 px-4 font-black text-sm sm:text-base sticky top-0 z-50 shadow-md">
          🔥 Adobe All Premium Software Bundle 2026! &nbsp;|&nbsp; Launch Sale: <strong>90% OFF</strong> &nbsp;|&nbsp;
          <a href="/checkout" onClick={handleBuyClick} className="underline font-black hover:opacity-80 transition-opacity ml-1">Grab Now for ₹249 Only →</a>
        </div>

        {/* ── 2. HERO (Premium Dark Blue Theme) ── */}
        <section className="bg-[#00114E] text-white text-center py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/40" />
          {/* Glowing bright orbs */}
          <div className="absolute" style={{ width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(175,255,61,0.2) 0%, rgba(255,255,255,0) 70%)", top: -200, left: -100, pointerEvents: "none" }} />
          <div className="absolute" style={{ width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(5,255,0,0.15) 0%, rgba(255,255,255,0) 70%)", bottom: -200, right: -100, pointerEvents: "none" }} />
          <div className="relative z-10 max-w-5xl mx-auto">
            <span className="bg-green-600 text-white text-xs sm:text-sm font-black px-4.5 py-2 rounded-full uppercase tracking-wider shadow-md mb-5 inline-block">
              ⚡ Pre-Activated (Lifetime Access) Included
            </span>
            <h1 className="leading-tight text-white mb-6 font-black" style={{ fontSize: "clamp(28px,4.8vw,48px)" }}>
              Stop Paying Expensive Monthly Subscriptions! Get The <span className="text-[#FFA800]">Ultimate Creative Software Bundle</span> With{" "}
              <span className="bg-white text-black shadow-[6px_6px_0_0_#05FF00] px-2.5 rounded-sm inline-block">&nbsp;Adobe All Premium 2026!&nbsp;</span>
            </h1>
            <p className="font-extrabold underline mb-8" style={{ fontSize: "clamp(15px,2.4vw,26px)", color: "#00FFFF" }}>
              All 20+ Premium Creative Apps — Windows & Mac — Pre-Activated for Lifetime!
            </p>
            {/* Adobe Bundle Image */}
            <div className="mx-auto mb-10 rounded-2xl overflow-hidden border border-white/20 shadow-2xl relative bg-black/60" style={{ maxWidth: 840, aspectRatio: "16/9", display: "flex", alignItems: "center", justifyItems: "center" }}>
               <img src={banner?.imageUrl || "https://media.licdn.com/dms/image/D4D12AQGg4FhYvYlFwA/article-cover_image-shrink_720_1280/0/1689108390829?e=2147483647&v=beta&t=aI8jVq8vQZ3PZ4b1_O7m9L8-K_rTzJg5nL3x-5Qc4Kk"} alt="Adobe All Premium Software Bundle Collection 2026" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = "https://grabnext.pages.dev/api/placeholder?w=800&h=450&text=Adobe+All+Premium+Collection+2026"; }} />
               <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end justify-center pb-5">
                  <span className="bg-green-600 text-white font-black px-6 py-2 rounded-full text-sm sm:text-base shadow-xl flex items-center gap-2 border border-green-500">
                    <span className="text-yellow-300">⚡</span> Direct High-Speed Download Included
                  </span>
               </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button onClick={handleBuyClick} className="hover:-translate-y-0.5 active:translate-y-0 hover:shadow-[0px_10px_25px_rgba(5,255,0,0.4)] transition-all duration-200" style={{ ...BTN_STYLE, fontSize: "clamp(18px,2.8vw,32px)", padding: "16px 48px", width: "min(90%,580px)" }}>
                🚀 Get Instant Access At Just ₹249/- 🚀
              </button>
            </div>
            <p className="text-white/70 text-xs sm:text-sm mt-5 font-bold flex items-center justify-center flex-wrap gap-x-4 gap-y-1.5">
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

        {/* ── 3. TRUST STATS (Alternating White background) ── */}
        <section className="bg-white py-10 px-4 border-b border-gray-150">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            {[["3,929+", "Happy Customers"], ["20+", "Creative Software Tools"], ["24x7", "WhatsApp Support"], ["₹249", "One-Time Price"]].map(([n, l]) => (
              <div key={l} className="text-center py-5 px-3 bg-gray-50 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-2xl md:text-3xl font-black text-[#00114E]">{n}</div>
                <div className="text-gray-700 text-xs sm:text-sm font-extrabold mt-1">{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. WHAT YOU GET (Adobe CC Bundle 2026 Grid) ── */}
        <section className="bg-white py-14 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center font-extrabold text-[#00114E] text-lg sm:text-xl mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>Here's What All You'll Get…</h2>
            <h3 className="text-center font-black text-3xl md:text-4xl text-gray-900 mb-8" style={{ fontFamily: "Poppins, sans-serif" }}>Adobe CC Bundle 2026</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {INCLUDED_SOFTWARE.map((s: any) => (
                <ProductCard key={s.name} name={s.name} img={s.logo} bg="white" />
              ))}
            </div>
            <div className="flex justify-center mt-12">
              <button onClick={handleBuyClick} className="hover:-translate-y-0.5 hover:shadow-[0px_10px_20px_rgba(0,0,0,0.3)] transition-all duration-200" style={{ ...BTN_STYLE, fontSize: "clamp(16px,2.5vw,28px)", padding: "14px 44px", width: "min(85%,520px)" }}>
                🚀 Get Instant Access At Just ₹249/- 🚀
              </button>
            </div>
          </div>
        </section>

        {/* ── 10. PRICING / BUY (High Converting White Theme) ── */}
        <section id="buy" className="bg-white py-16 px-4 border-t border-gray-150 text-center">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            
            {/* Main Headline */}
            <h2 className="font-black text-gray-900 leading-tight mb-3" style={{ fontSize: "clamp(26px,4.5vw,42px)", fontFamily: "Poppins, sans-serif" }}>
              Download, Install And Thanks Me Later As You'll Find It <span className="text-[#FF0000] block sm:inline">Value For Time And Money</span>
            </h2>
            
            {/* Sub-headline */}
            <p className="text-gray-600 text-sm sm:text-base font-extrabold mb-8 max-w-3xl" style={{ fontFamily: "Poppins, sans-serif" }}>
              Get Lifetime Access To Done-For-You Premium Adobe CC Bundle & 8 Mega Bonuses With High-Speed Direct Downloads
            </p>

            {/* Offer Tier Details */}
            <div className="flex flex-col items-center gap-1.5 mb-6 text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
              <div className="text-lg sm:text-xl font-black uppercase tracking-wide text-gray-900">
                Launch Offer : <span className="text-green-600">90% OFF</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-gray-400 line-through">
                General Price : ₹24,651/-
              </div>
              <div className="text-base sm:text-lg font-bold text-red-500 line-through">
                Offer Price : ₹3,999/-
              </div>
              <div className="font-black text-[#22c55e] tracking-tight mt-2 animate-pulse" style={{ fontSize: "clamp(38px,7vw,60px)", lineHeight: 1.1 }}>
                Today Only : ₹249/-
              </div>
            </div>

            {/* Dashed Rating Badge */}
            <div className="inline-flex items-center gap-2 border border-dashed border-gray-300 rounded-xl px-4 py-2 bg-gray-50 mb-8 shadow-sm">
              <span className="text-yellow-400 text-sm sm:text-base flex select-none">⭐⭐⭐⭐⭐</span>
              <span className="text-gray-700 font-extrabold text-xs sm:text-sm">Rating: 4.9 | 3426 Reviews</span>
            </div>

            {/* Giant Green CTA Button */}
            <button 
              onClick={handleBuyClick} 
              className="w-full max-w-xl bg-[#00c853] hover:bg-[#00b24a] text-white font-black text-lg sm:text-2xl py-4 px-6 rounded-2xl shadow-[0_8px_25px_rgba(0,200,83,0.35)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-center uppercase tracking-wide animate-shake-cta"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Yes, I Want The Adobe All Premium Bundle
            </button>

            {/* Urgency */}
            <p className="text-gray-500 text-xs sm:text-sm font-extrabold mt-4 flex items-center justify-center gap-1">
              ⏰ Limited Time Offer Price Will Increase Soon
            </p>

            {/* Payment Logos Row */}
            <div className="flex flex-wrap items-center justify-center gap-5 mt-6 opacity-80 hover:opacity-100 transition-opacity">
              {/* WhatsApp Pay Icon */}
              <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                <svg className="w-4 h-4 fill-[#25D366]" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.248 8.477 3.517 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.781-1.455L0 24zm6.335-1.662c1.596.947 3.551 1.448 5.616 1.449h.006c5.824 0 10.563-4.73 10.566-10.546a10.5 10.5 0 00-3.102-7.466 10.547 10.547 0 00-7.481-3.095c-5.824 0-10.564 4.73-10.567 10.546a10.43 10.43 0 001.488 5.168l-.974 3.559 3.644-.956z"/></svg>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">WhatsApp</span>
              </div>
              {/* BHIM Pay Icon */}
              <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-[10px] font-black text-gray-700 tracking-wider">BHIM</span>
                <span className="w-1.5 h-3.5 bg-orange-500 transform rotate-12 inline-block rounded-xs"></span>
                <span className="w-1.5 h-3.5 bg-green-500 transform rotate-12 inline-block rounded-xs"></span>
              </div>
              {/* Google Pay Icon */}
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-[10px] font-black text-gray-600 tracking-wider flex items-center gap-1">
                  <span className="text-blue-500">G</span>
                  <span className="text-red-500">P</span>
                  <span className="text-yellow-500">a</span>
                  <span className="text-green-500">y</span>
                </span>
              </div>
              {/* PhonePe Icon */}
              <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                <span className="w-3.5 h-3.5 bg-purple-600 rounded flex items-center justify-center text-white text-[8px] font-black">₹</span>
                <span className="text-[10px] font-black text-purple-700 tracking-wider">PhonePe</span>
              </div>
              {/* Amazon Pay Icon */}
              <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-[10px] font-black text-gray-800 tracking-wider">amazon</span>
                <span className="text-[10px] font-black text-amber-500 tracking-wider">pay</span>
              </div>
              {/* Paytm Icon */}
              <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-[10px] font-black text-blue-600 tracking-wider">paytm</span>
              </div>
            </div>

          </div>
        </section>

        {/* ── 11. GUARANTEE (Selective green details) ── */}
        <section className="bg-white py-12 px-4 border-b border-gray-150">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-6xl mb-4">🛡️</div>
            <h2 className="font-black text-2xl text-gray-800 mb-3">100% Installation Support Guaranteed</h2>
            <p className="text-gray-600 leading-relaxed font-bold text-sm sm:text-base">
              If you face any issues during installation or the software doesn't work as described, our expert support team will help you resolve it — for free. <span className="text-green-600">Your satisfaction is our No.1 priority.</span> We've helped 3,929+ customers successfully!
            </p>
          </div>
        </section>

        {/* ── 5. ALL SOFTWARE INCLUDED (Checklist with green highlights) ── */}
        <section className="py-14 px-4 bg-gray-55 border-y border-gray-200">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center font-black text-2xl md:text-3xl text-gray-950 mb-2">Everything Included in One Bundle</h2>
            <p className="text-center text-gray-600 mb-8 text-sm sm:text-base font-medium">All 20+ creative tools and software programs — no monthly fees ever</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {INCLUDED_SOFTWARE.map((s: any) => (
                <div key={s.name} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200 hover:border-green-400 transition-colors">
                  <img src={s.logo} alt={s.name} className="w-8 h-8 object-contain" />
                  <span className="font-extrabold text-gray-800 text-sm sm:text-base">{s.name}</span>
                  <span className="ml-auto text-green-700 font-extrabold text-xs sm:text-sm bg-green-50 px-3 py-1.5 rounded-full border border-green-200 flex items-center gap-1">
                    <span className="text-green-600">✓</span> Included
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. SPECIAL LAUNCH OFFER BONUSES (Alternating Soft Light & Deep Navy Theme) ── */}
        <section className="bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 py-16 px-4 text-slate-800 border-y border-slate-200">
          <div className="max-w-6xl mx-auto relative z-10">
            {/* Main Header */}
            <div className="text-center mb-14">
              <span className="bg-yellow-400 text-black px-5 py-2 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg">
                💥 Special Launch Offer Bonuses
              </span>
              <h2 className="font-black mt-5 text-[#FF3E3E]" style={{ fontSize: "clamp(26px,4vw,44px)", fontFamily: "Poppins, sans-serif", lineHeight: 1.25 }}>
                🎁 Get the Ultimate Graphic Designing Bundle & Video Editing Bundle For <span className="bg-yellow-400 text-black px-4 py-1.5 rounded-xl inline-block transform hover:scale-105 transition-transform shadow-[0px_4px_10px_rgba(255,200,0,0.4)] border border-yellow-500 uppercase tracking-widest text-[1.05em] font-extrabold rotate-[-1deg] ml-2">FREE!</span>
              </h2>
              <p className="text-slate-700 max-w-3xl mx-auto mt-5 text-base sm:text-lg font-extrabold" style={{ fontFamily: "Poppins, sans-serif" }}>
                Claim lifetime access to over <span className="text-red-650 font-black">₹34,999</span> worth of premium editing presets, vector files, video courses, and templates when you buy the Adobe CC Bundle today.
              </p>
            </div>

            {/* Spotlight Bonus 1: Graphic Designing Bundle (800+ GB Plan) - Premium Navy Blue Card */}
            <div className="bg-[#00114E] border border-white/10 rounded-3xl p-6 md:p-10 mb-10 shadow-2xl relative overflow-hidden text-white">
              {/* Glowing internal orb for depth */}
              <div className="absolute" style={{ width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(5,255,0,0.08) 0%, rgba(255,255,255,0) 70%)", top: -100, right: -100, pointerEvents: "none" }} />
              
              <div className="absolute top-0 right-0 bg-green-600 text-white font-black px-6 py-2 rounded-bl-2xl text-xs uppercase tracking-wider z-10 border-l border-b border-white/15">
                Bonus #1 Included
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
                {/* Left: Box Mockup */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <div className="relative group max-w-[310px] w-full">
                    <div className="absolute -inset-1.5 bg-gradient-to-r from-yellow-400 to-green-400 rounded-2xl blur opacity-25 group-hover:opacity-45 transition duration-500"></div>
                    <div className="relative bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-white/10">
                      <img src="/images/graphic-bundle-675gb.png" alt="675 GB Graphics Bundle Box Mockup" className="w-full h-auto object-cover transform hover:scale-103 transition-transform duration-300" />
                    </div>
                  </div>
                  <span className="text-xs text-white/70 mt-3 font-extrabold uppercase tracking-wider">
                    800+ GB Plan Graphic Designing Bundle
                  </span>
                </div>

                {/* Right: Asset List */}
                <div className="md:col-span-7">
                  <h3 className="text-2xl sm:text-3xl font-black text-[#05FF00] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                    Ultimate Graphic Designing Bundle (800+ GB Plan)
                  </h3>
                  
                  {/* Single Column List with Green Tick Marks & Larger Fonts */}
                  <div className="grid grid-cols-1 gap-4 mb-6">
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
                      <div key={idx} className="flex items-start gap-3.5 text-base sm:text-lg text-white/95 leading-relaxed">
                        <span className="text-[#05FF00] font-black shrink-0 text-xl">✓</span>
                        <span className="font-extrabold">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Access Instructions */}
                  <div className="bg-yellow-400/10 border border-yellow-400/25 rounded-2xl p-4 flex gap-3 text-white">
                    <span className="text-2xl shrink-0">ℹ️</span>
                    <div>
                      <p className="text-xs font-black uppercase text-yellow-400 tracking-wider mb-1">
                        How to Access Your Graphic Bundle
                      </p>
                      <p className="text-xs leading-relaxed text-white/80 font-medium">
                        Download link for the Ultimate Graphic Designing Bundle is sent directly to your <strong className="text-yellow-400 font-black">email invoice</strong> immediately post-payment. Simply click <strong className="text-yellow-350 font-black">“Click here to Download Graphic designing Bundle”</strong> on the invoice you receive.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Spotlight Bonus 2: Video Editing Bundle (Detailed Grid with Images) - Clean High-Contrast White Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-10 mb-10 shadow-xl relative overflow-hidden text-slate-900">
              <div className="absolute top-0 right-0 bg-green-600 text-white font-black px-6 py-2 rounded-bl-2xl text-xs uppercase tracking-wider z-10 border-l border-b border-slate-200/30">
                Bonus #2 Included
              </div>
              
              <div className="text-center md:text-left mb-8">
                <span className="text-xs font-black text-green-600 uppercase tracking-wider block mb-1">
                  Premium Bonus Addition
                </span>
                <h3 className="text-3xl font-black text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>
                  Mega Video Editing Assets & Courses Bundle
                </h3>
                <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-3xl font-semibold">
                  Stop looking for assets online. Get lifetime access to this ultimate toolkit featuring premium transitions, LUTs, FX presets, overlays, templates, SFX, and full masterclass courses!
                </p>
              </div>

              {/* Detailed Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                {VIDEO_BUNDLE_ITEMS.map((item) => (
                  <div key={item.name} className="bg-slate-50 border border-slate-200/80 rounded-2xl overflow-hidden flex flex-col shadow-md hover:shadow-xl hover:border-green-500 transition-all duration-300">
                    <div className="w-full aspect-video bg-black/10 overflow-hidden relative border-b border-slate-150">
                      <img src={item.img} alt={item.name} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300" onError={(e) => { (e.target as HTMLImageElement).src = "https://grabnext.pages.dev/api/placeholder?w=400&h=250&text=" + encodeURIComponent(item.name); }} />
                      <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                        Worth {item.worth}
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-base sm:text-[17px] leading-snug mb-1">{item.name}</h4>
                        <p className="text-slate-650 text-sm leading-relaxed font-semibold">{item.desc}</p>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold">
                        <span className="text-green-600 font-extrabold">✓ Included FREE</span>
                        <span className="text-slate-400 line-through font-bold">{item.worth}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Access Instructions for Video Bundle */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3 text-amber-950">
                <span className="text-2xl shrink-0">ℹ️</span>
                <div>
                  <p className="text-xs font-black uppercase text-amber-800 tracking-wider mb-1">
                    How to Access Your Video Editing Bundle
                  </p>
                  <p className="text-xs leading-relaxed text-amber-900 font-bold">
                    The full direct high-speed download link for the Video Editing Bundle is embedded securely inside your post-checkout PDF invoice. You can download all collections with a single click instantly after completing the purchase.
                  </p>
                </div>
              </div>
            </div>

            {/* 11 Mega Creative Collections - Deep Navy Blue Panel */}
            <div className="bg-[#00114E] border border-white/10 rounded-3xl p-6 md:p-10 mb-14 shadow-2xl relative overflow-hidden text-white">
              {/* Glowing internal orb for depth */}
              <div className="absolute" style={{ width: 450, height: 450, borderRadius: "50%", background: "radial-gradient(circle, rgba(175,255,61,0.06) 0%, rgba(255,255,255,0) 70%)", bottom: -150, left: -100, pointerEvents: "none" }} />
              
              <div className="text-center mb-8 relative z-10">
                <h3 className="text-2xl sm:text-3xl font-black text-white" style={{ fontFamily: "Poppins, sans-serif" }}>
                  11 Mega Creative Collections Included
                </h3>
                <p className="text-white/75 text-sm sm:text-base mt-1 font-bold">
                  Ready-to-use project assets, templates, and libraries to speed up your workflow.
                </p>
              </div>
              
              {/* Two Column Layout list with Green Checkmarks and Images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto relative z-10">
                {[
                  { num: "01", name: "Photoshop Collection", desc: "Premium brushes, actions, overlays, shapes, and tools.", img: "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=400&q=80" },
                  { num: "02", name: "Corel Draw Collection", desc: "Vector CDR files, designs, visiting cards, and letterheads.", img: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&q=80" },
                  { num: "03", name: "Logos", desc: "10,000+ high-quality customizable logo templates.", img: "https://images.unsplash.com/photo-1627398225056-f3a48ff98e21?w=400&q=80" },
                  { num: "04", name: "Fonts", desc: "5,000+ premium localized and corporate font families.", img: "https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?w=400&q=80" },
                  { num: "05", name: "Mockups", desc: "T-shirts, packaging, apparel, and branding templates.", img: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=400&q=80" },
                  { num: "06", name: "PNG Images Collection", desc: "High-definition transparent assets for quick compositing.", img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80" },
                  { num: "07", name: "Adobe Illustrator Collection", desc: "AI files, vectors, background patterns, and assets.", img: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80" },
                  { num: "08", name: "Adobe Premiere Collection", desc: "Transitions, title cards, overlays, and color LUTs.", img: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400&q=80" },
                  { num: "09", name: "Adobe After Effects Collection", desc: "Video templates, intro animations, and sound effects.", img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80" },
                  { num: "10", name: "Adobe InDesign Collection", desc: "Books, magazines, resumes, and brochures layouts.", img: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80" },
                  { num: "11", name: "PowerPoint Collection", desc: "Slide decks, pitch templates, and business presentations.", img: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&q=80" }
                ].map((col) => (
                  <div key={col.num} className="bg-[#070f35] border border-white/10 rounded-2xl p-4 hover:border-green-400 hover:shadow-[0_0_15px_rgba(5,255,0,0.2)] transition-all shadow-lg flex items-center gap-4 group">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border-2 border-white/10 group-hover:border-[#05FF00] transition-colors relative">
                      <img src={col.img} alt={col.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-extrabold text-white text-base sm:text-[17px] mb-1 flex items-center gap-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                        <span className="text-[#05FF00] font-black text-lg">✓</span>
                        {col.name}
                      </h4>
                      <p className="text-white/70 text-xs sm:text-sm leading-relaxed font-semibold">
                        {col.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Store Products secondary list */}
            {products.length > 0 && (
              <div className="border-t border-slate-300 pt-10">
                <h4 className="text-center font-black text-slate-800 mb-6 text-sm sm:text-base uppercase tracking-wide">
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
              <button onClick={handleBuyClick} className="animate-[animatedgradient_3s_ease_infinite_alternate] hover:-translate-y-0.5 hover:shadow-[0px_8px_15px_rgba(255,200,0,0.4)] transition-all duration-200" style={{ ...BTN_STYLE, fontSize: "clamp(16px,2.5vw,28px)", padding: "14px 44px", width: "min(85%,520px)" }}>
                🚀 Get All Bonuses FREE — Only ₹249/- 🚀
              </button>
            </div>
          </div>
        </section>

        {/* ── 7. WHY CHOOSE GRABNEXT ── */}
        <section className="bg-white py-14 px-4 border-t border-gray-150">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center font-black text-3xl md:text-4xl text-[#00114E] mb-2">Why Choose Grabnext?</h2>
            <p className="text-center text-gray-500 mb-8 font-medium">India's most trusted digital software store — 3,929+ satisfied customers</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {FEATURES.map(f => (
                <div key={f.title} className="text-center p-5 bg-white rounded-2xl border border-gray-150 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-3">{f.icon}</div>
                  <div className="font-extrabold text-gray-800 text-sm mb-1">{f.title}</div>
                  <div className="text-gray-500 text-xs leading-relaxed">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 8. COMPARISON TABLE (Green highlights for victory) ── */}
        <section className="py-14 px-4 bg-gray-50 border-t border-gray-200">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-center font-black text-3xl text-gray-900 mb-8">Grabnext vs. Adobe Subscription</h2>
            <div className="w-full max-w-2xl mx-auto overflow-x-auto rounded-2xl shadow-xl border border-gray-200">
              <table className="w-full border-collapse" style={{ display: "table" }}>
                <thead>
                  <tr className="bg-[#00114E] text-white">
                    <th className="py-4 px-4 text-left font-extrabold text-xs sm:text-sm">Feature</th>
                    <th className="py-4 px-4 text-center font-black text-[#05FF00] text-xs sm:text-sm bg-[#000f45]">Grabnext Bundle</th>
                    <th className="py-4 px-4 text-center font-extrabold text-red-300 text-xs sm:text-sm">Adobe Official</th>
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
                    <tr key={feat} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} border-t border-gray-150 hover:bg-green-50/10 transition-colors`}>
                      <td className="py-3 px-4 text-gray-800 font-extrabold text-xs sm:text-sm">{feat}</td>
                      <td className="py-3 px-4 text-center text-green-700 font-black text-xs sm:text-sm bg-green-50/30 border-x border-green-100">{g}</td>
                      <td className="py-3 px-4 text-center text-red-500 font-bold text-xs sm:text-sm">{a}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── 9. TESTIMONIALS (Moved below comparison) ── */}
        <section className="bg-white py-14 px-4 border-t border-gray-150">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center font-black text-3xl md:text-4xl text-[#00114E] mb-8">⭐ What Our Customers Say</h2>
            <div className="grid md:grid-cols-2 gap-5">
              {TESTIMONIALS.map(t => (
                <div key={t.name} className="rounded-2xl p-6 border border-gray-150 shadow-md bg-gray-50 hover:shadow-lg transition-all">
                  <StarRating n={t.stars} />
                  <p className="text-gray-700 italic text-sm leading-relaxed mb-4 font-medium">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#00114E] flex items-center justify-center text-white font-black">{t.name[0]}</div>
                    <div>
                      <div className="font-extrabold text-gray-800 text-sm">{t.name}</div>
                      <div className="text-gray-500 text-xs font-bold">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 12. FAQ ── */}
        <section className="bg-gray-50 py-14 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-center font-black text-3xl text-gray-900 mb-8" style={{ fontFamily: "Poppins, sans-serif" }}>
              <span className="text-green-600">Frequently</span> Asked Questions
            </h2>
            {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
          </div>
        </section>

        {/* ── 13. PRE-FOOTER CTA ── */}
        <section className="bg-[#00114E] text-white text-center py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-black mb-4" style={{ fontSize: "clamp(22px,4vw,38px)" }}>Don't Miss This Limited Time Offer!</h2>
            <p className="text-[#00FFFF] mb-6 text-lg sm:text-xl font-bold">Join 3,929+ professionals who already own the ultimate Adobe bundle.</p>
            <button onClick={handleBuyClick} className="inline-block animate-[animatedgradient_3s_ease_infinite_alternate] hover:-translate-y-0.5 hover:shadow-[0px_8px_15px_rgba(255,200,0,0.5)] transition-all duration-200" style={{ ...BTN_STYLE, fontSize: "clamp(16px,3vw,30px)", padding: "14px 44px" }}>
              🚀 GET INSTANT ACCESS — ONLY ₹249/- 🚀
            </button>
            <p className="text-white/60 text-xs sm:text-sm mt-4 font-bold">⚡ Instant Access &nbsp;|&nbsp; ✅ Pre-Activated &nbsp;|&nbsp; 🍎 Mac & 🪟 Windows</p>
          </div>
        </section>

        {/* ── 14. FOOTER ── */}
        <footer className="bg-gray-900 text-gray-400 text-center py-8 px-4 text-xs">
          <div className="max-w-3xl mx-auto">
            <p className="mb-3 opacity-60">Disclaimer: Results may vary. This is a digital product. Please ensure your system meets the minimum requirements before purchasing. All trademarks belong to their respective owners.</p>
            <div className="flex flex-wrap justify-center gap-4 mb-3 text-gray-500 font-extrabold">
              <a href="/privacy" className="hover:text-white">Privacy Policy</a>
              <a href="/terms" className="hover:text-white">Terms of Service</a>
              <a href="/refund" className="hover:text-white">Refund Policy</a>
              <a href="/contact" className="hover:text-white">Contact Us</a>
            </div>
            <p>© {new Date().getFullYear()} Grabnext. All rights reserved. | Payments secured by XPay 🔒</p>
          </div>
        </footer>

        {/* ── 15. CONVERSION WIDGETS & PLUGINS ── */}
        <StickyCheckoutBar onBuy={handleBuyClick} />
        <WhatsAppWidget />
        {/* CSS Animations for sticky bar, shaking button, and pulsing WhatsApp widget */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .animate-slide-up {
            animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.5); }
            50% { box-shadow: 0 0 0 10px rgba(37, 211, 102, 0); }
          }
          .animate-pulse-glow {
            animation: pulseGlow 2s infinite;
          }
          @keyframes shakeCTA {
            0%, 100% { transform: scale(1); }
            10%, 20% { transform: scale(0.96) rotate(-1deg); }
            30%, 50%, 70%, 90% { transform: scale(1.04) rotate(1.5deg); }
            40%, 60%, 80% { transform: scale(1.04) rotate(-1.5deg); }
          }
          .animate-shake-cta {
            animation: shakeCTA 2.5s infinite ease-in-out;
          }
        ` }} />
      </div>
    </>
  );
}

/* Helper Component: Sticky Bottom Checkout Bar */
function StickyCheckoutBar({ onBuy }: { onBuy: (e: React.MouseEvent) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 600) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#00114E]/95 backdrop-blur-md border-t border-white/10 py-3.5 px-4 z-[99] shadow-[0_-8px_30px_rgba(0,0,0,0.45)] animate-slide-up">
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
          <p className="text-white text-xs sm:text-sm md:text-base font-black tracking-wide leading-tight">
            ⚡ Adobe CC Premium 2026 + Bonuses
          </p>
          <div className="flex items-center gap-2">
            <span className="text-white/40 line-through text-[11px] sm:text-xs font-bold">₹2,499</span>
            <span className="text-[#05FF00] font-black text-sm sm:text-lg">₹249</span>
            <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">90% OFF</span>
          </div>
        </div>
        <button 
          onClick={onBuy}
          className="bg-gradient-to-r from-[#FFC800] to-[#afff3d] text-black font-black uppercase text-xs sm:text-sm px-4 sm:px-8 py-2.5 sm:py-3.5 rounded-xl shadow-[0_4px_15px_rgba(255,200,0,0.35)] hover:scale-105 active:scale-95 transition-all duration-150 shrink-0 whitespace-nowrap animate-shake-cta"
        >
          Buy Now 🚀
        </button>
      </div>
    </div>
  );
}

/* Helper Component: Floating WhatsApp Support Widget */
function WhatsAppWidget() {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Show tooltip after 3 seconds to capture user attention
    const timer = setTimeout(() => setShowTooltip(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed bottom-20 right-6 z-[98] flex flex-col items-end">
      {showTooltip && (
        <div className="bg-white text-gray-800 text-[11px] sm:text-xs font-bold py-1.5 px-3 rounded-xl shadow-lg border border-gray-150 mb-2 relative animate-slide-up shrink-0 max-w-[200px] text-right flex items-center gap-1.5">
          <span>Need help? Chat with us!</span>
          <button onClick={() => setShowTooltip(false)} className="text-gray-400 hover:text-gray-600 font-extrabold text-[10px] ml-1">✕</button>
          <div className="absolute right-4 bottom-[-6px] w-3 h-3 bg-white rotate-45 border-r border-b border-gray-100" />
        </div>
      )}
      <a
        href="https://wa.me/917500167987?text=Hi%20Grabnext!%20I'm%20on%20the%20Adobe%20CC%20Bundle%20page%20and%20want%20to%20purchase.%20Can%20you%20help%20me%3F"
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform duration-200 animate-pulse-glow relative border border-[#25D366]/20"
      >
        <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
        </svg>
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
        </span>
      </a>
    </div>
  );
}

