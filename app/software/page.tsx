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
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-3 bg-white shadow-sm transition-all hover:border-gray-300">
      <button onClick={() => setOpen(!open)} className="w-full text-left px-5 py-4 font-bold text-gray-800 flex justify-between items-center hover:bg-gray-50" style={{ fontFamily: "Poppins, sans-serif" }}>
        <span className="text-sm sm:text-base">{q}</span>
        <span className="text-xl ml-4 shrink-0 text-blue-600">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-50 pt-3">{a}</div>}
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

        {/* ── 6. SPECIAL LAUNCH OFFER BONUSES (Light-Themed Premium Section) ── */}
        <section className="bg-gradient-to-b from-slate-50 via-slate-100 to-white py-16 px-4 text-slate-800 border-y border-slate-200">
          <div className="max-w-6xl mx-auto">
            {/* Main Header */}
            <div className="text-center mb-14">
              <span className="bg-yellow-400 text-black px-5 py-2 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg">
                💥 Special Launch Offer Bonuses
              </span>
              <h2 className="font-black mt-5 text-[#FF3E3E]" style={{ fontSize: "clamp(26px,4vw,44px)", fontFamily: "Poppins, sans-serif", lineHeight: 1.25 }}>
                🎁 Get the Ultimate Graphic Designing Bundle & Video Editing Bundle For <span className="bg-yellow-400 text-black px-4 py-1.5 rounded-xl inline-block transform hover:scale-105 transition-transform shadow-[0px_4px_10px_rgba(255,200,0,0.4)] border border-yellow-500 uppercase tracking-widest text-[1.05em] font-extrabold rotate-[-1deg] ml-2">FREE!</span>
              </h2>
              <p className="text-slate-650 max-w-3xl mx-auto mt-5 text-base sm:text-lg font-extrabold" style={{ fontFamily: "Poppins, sans-serif" }}>
                Claim lifetime access to over <span className="text-red-650 font-black">₹34,999</span> worth of premium editing presets, vector files, video courses, and templates when you buy the Adobe CC Bundle today.
              </p>
            </div>

            {/* Spotlight Bonus 1: Graphic Designing Bundle (800+ GB Plan) */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-10 mb-10 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-green-600 text-white font-black px-6 py-2 rounded-bl-2xl text-xs uppercase tracking-wider z-10 border-l border-b border-slate-200/30">
                Bonus #1 Included
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Left: Box Mockup */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <div className="relative group max-w-[310px] w-full">
                    <div className="absolute -inset-1.5 bg-gradient-to-r from-yellow-400 to-green-400 rounded-2xl blur opacity-25 group-hover:opacity-45 transition duration-500"></div>
                    <div className="relative bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                      <img src="/images/graphic-bundle-675gb.png" alt="675 GB Graphics Bundle Box Mockup" className="w-full h-auto object-cover transform hover:scale-103 transition-transform duration-300" />
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 mt-3 font-extrabold uppercase tracking-wider">
                    800+ GB Plan Graphic Designing Bundle
                  </span>
                </div>

                {/* Right: Asset List */}
                <div className="md:col-span-7">
                  <h3 className="text-2xl font-black text-emerald-700 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
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
                      <div key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="text-green-600 font-extrabold shrink-0">✓</span>
                        <span className="font-bold">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Access Instructions */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-900">
                    <span className="text-2xl shrink-0">ℹ️</span>
                    <div>
                      <p className="text-xs font-black uppercase text-amber-800 tracking-wider mb-1">
                        How to Access Your Graphic Bundle
                      </p>
                      <p className="text-xs leading-relaxed text-amber-900 font-bold">
                        Download link for the Ultimate Graphic Designing Bundle is sent directly to your <strong className="text-amber-950 font-black">email invoice</strong> immediately post-payment. Simply click <strong className="text-amber-850 font-black">“Click here to Download Graphic designing Bundle”</strong> on the invoice you receive.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Spotlight Bonus 2: Video Editing Bundle (Detailed Grid with Images) */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-10 mb-14 shadow-xl relative overflow-hidden">
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
                  <div key={item.name} className="bg-white border border-slate-200/85 rounded-2xl overflow-hidden flex flex-col shadow-md hover:shadow-xl hover:border-green-400 transition-all duration-300">
                    <div className="w-full aspect-video bg-black/10 overflow-hidden relative border-b border-slate-100">
                      <img src={item.img} alt={item.name} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300" onError={(e) => { (e.target as HTMLImageElement).src = "https://grabnext.pages.dev/api/placeholder?w=400&h=250&text=" + encodeURIComponent(item.name); }} />
                      <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                        Worth {item.worth}
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm leading-snug mb-1">{item.name}</h4>
                        <p className="text-slate-500 text-xs leading-relaxed font-semibold">{item.desc}</p>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
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

            {/* 11 Mega Creative Collections Grid */}
            <div className="mb-14">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>
                  11 Mega Creative Collections Included
                </h3>
                <p className="text-slate-550 text-xs sm:text-sm mt-1 font-bold">
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
                  <div key={col.num} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-green-400 hover:shadow-lg transition-all shadow-md">
                    <span className="text-xs font-black text-green-600 uppercase tracking-wider block mb-1">
                      Collection {col.num}
                    </span>
                    <h4 className="font-extrabold text-slate-800 text-sm mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>
                      {col.name}
                    </h4>
                    <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                      {col.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Store Products secondary list */}
            {products.length > 0 && (
              <div className="border-t border-slate-200 pt-10">
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

        {/* ── 10. PRICING / BUY (Original Dark Blue Theme) ── */}
        <section id="buy" className="bg-[#00114E] py-16 px-4 text-white">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-block bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-black mb-4 animate-pulse uppercase tracking-wider">⏰ LIMITED TIME OFFER</div>
            <h2 className="font-black mb-2" style={{ fontSize: "clamp(24px,5vw,44px)" }}>Get The Full Bundle NOW</h2>
            <CountdownTimer />
            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-6">
              <div className="text-white/50 line-through text-lg mb-1 font-bold">Regular Price: ₹2,499</div>
              <div className="font-black text-[#FFC800]" style={{ fontSize: "clamp(48px,8vw,80px)", lineHeight: 1 }}>₹249</div>
              <div className="text-[#05FF00] font-black text-lg">ONE-TIME PAYMENT — 90% OFF!</div>
              <div className="text-white/80 text-sm sm:text-base mt-3 font-extrabold">✅ 20+ Creative Apps &nbsp;|&nbsp; ✅ 8 Free Bonuses &nbsp;|&nbsp; ✅ Lifetime Access</div>
            </div>
            <button onClick={handleBuyClick} className="block animate-[animatedgradient_3s_ease_infinite_alternate] hover:-translate-y-0.5 hover:shadow-[0px_8px_15px_rgba(255,200,0,0.5)] transition-all duration-200" style={{ ...BTN_STYLE, width: "100%", fontSize: "clamp(18px,3vw,34px)", padding: "16px 20px" }}>
              🚀 YES! GET INSTANT ACCESS AT ₹249/- 🚀
            </button>
            <p className="text-white/60 text-xs mt-4 font-bold">🔒 Secure Checkout &nbsp;|&nbsp; ⚡ Instant Delivery &nbsp;|&nbsp; 🛡️ Support Guaranteed</p>
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

        {/* ── 12. FAQ ── */}
        <section className="bg-gray-50 py-14 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-center font-black text-3xl text-gray-800 mb-8">Frequently Asked Questions</h2>
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
      </div>
    </>
  );
}
