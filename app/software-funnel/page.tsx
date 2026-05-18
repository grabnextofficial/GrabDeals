"use client";
import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, ShieldCheck, Award, Play, Star, ArrowRight, Lock, Gift, ChevronDown, Zap, TrendingUp, Users } from "lucide-react";
import { PAIN_POINTS, FEATURES, TESTIMONIALS, FAQS, BONUSES } from "./data";

function CountdownTimer() {
  const [time, setTime] = useState({ h: 5, m: 59, s: 59 });
  useEffect(() => {
    const t = setInterval(() => {
      setTime(p => {
        if (p.s > 0) return { ...p, s: p.s - 1 };
        if (p.m > 0) return { ...p, m: p.m - 1, s: 59 };
        if (p.h > 0) return { h: p.h - 1, m: 59, s: 59 };
        return { h: 5, m: 59, s: 59 };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex justify-center gap-3 my-6">
      {[["JAM", pad(time.h)], ["MENIT", pad(time.m)], ["DETIK", pad(time.s)]].map(([label, val]) => (
        <div key={label} className="bg-red-600 text-white rounded-xl px-4 py-3 text-center min-w-[72px] shadow-lg">
          <div className="text-3xl font-black font-mono">{val}</div>
          <div className="text-xs font-bold opacity-80 mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}

function FAQ({ q, a, open, onClick }: { q: string; a: string; open: boolean; onClick: () => void }) {
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      <button onClick={onClick} className="w-full flex justify-between items-center px-6 py-5 text-left font-bold text-slate-800 text-lg hover:bg-slate-50 transition-colors">
        <span>{q}</span>
        <ChevronDown className={`w-5 h-5 text-teal-500 shrink-0 ml-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-6 pb-5 text-slate-600 leading-relaxed border-t border-slate-100 pt-4">{a}</div>}
    </div>
  );
}

export default function SoftwareFunnelPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">

      {/* ── STICKY TOP BAR ── */}
      <div className="sticky top-0 z-50 bg-amber-400 text-amber-900 text-center py-2 px-4 font-bold text-sm shadow-md">
        🔥 PROMO TERBATAS! Diskon hingga 70% — Berakhir Hari Ini!&nbsp;
        <a href="#pricing" className="underline">Ambil Sekarang →</a>
      </div>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f4c5c] via-[#348b93] to-[#28c898] py-20 lg:py-28 text-white">
        <div className="absolute inset-0 opacity-[0.07]" style={{backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}}/>
        <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm text-sm font-semibold">
            <Zap className="w-4 h-4 text-yellow-300" fill="currentColor"/>
            Plugin #1 untuk Pebisnis Online Indonesia
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Lejitkan Omset Bisnis Online Anda<br/>
            <span className="text-[#ffe121] drop-shadow">Hingga 300% Lebih Cepat</span>
          </h1>
          <p className="text-xl text-white/85 max-w-2xl mx-auto mb-8 leading-relaxed">
            Plugin All-in-One dengan <strong>WhatsApp Notifikasi, Checkout Otomatis, Analitik Real-Time</strong> — semua yang Anda butuhkan untuk memenangkan persaingan di era digital.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <a href="#pricing" className="inline-flex items-center justify-center gap-2 bg-[#ffe121] hover:bg-[#fac02b] text-[#7a3e00] font-black text-xl py-5 px-10 rounded-full shadow-[0_6px_0_#c49400] hover:shadow-[0_2px_0_#c49400] hover:translate-y-1 transition-all duration-150">
              Dapatkan Plugin Sekarang <ArrowRight className="w-5 h-5"/>
            </a>
            <button className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-lg py-5 px-8 rounded-full backdrop-blur transition-all">
              <Play className="w-5 h-5" fill="white"/> Tonton Demo
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {[["✅","Mudah Digunakan"],["📊","Analitik Real-Time"],["🔒","Data Aman"],["💬","WA Notification"]].map(([ic,lb])=>(
              <div key={lb} className="bg-white/10 backdrop-blur border border-white/20 rounded-xl py-3 px-2 text-sm font-semibold">{ic} {lb}</div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full h-[60px] fill-slate-50"><path d="M0,60L1440,0L1440,60L0,60Z"/></svg>
        </div>
      </section>

      {/* ── SOCIAL PROOF NUMBERS ── */}
      <section className="py-12 bg-slate-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[["123.000+","Pengguna Aktif"],["98%","Tingkat Kepuasan"],["Rp 50M+","Omset Diproses"],["4.9 ★","Rating Rata-rata"]].map(([n,l])=>(
              <div key={l} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="text-3xl font-black text-[#28c898]">{n}</div>
                <div className="text-sm text-slate-500 font-medium mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ── */}
      <section className="py-20 bg-gradient-to-b from-[#28c898] to-[#1fa882]">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl text-center mb-10">
            <h2 className="text-3xl font-black text-slate-800 mb-2">Pernahkah Anda Mengalami Ini?</h2>
            <p className="text-slate-500 mb-8">Jika Anda menjawab "iya" pada salah satu poin berikut, Anda butuh solusi ini hari ini.</p>
            <div className="grid md:grid-cols-2 gap-3 text-left">
              {PAIN_POINTS.map(p=>(
                <div key={p} className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5"/>
                  <span className="text-slate-700 font-medium text-sm">{p}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center text-white">
            <p className="text-xl font-bold">Tenang — semua masalah ini bisa selesai dengan <span className="text-yellow-300">SATU plugin.</span></p>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-14">
            <span className="text-teal-600 font-bold text-sm uppercase tracking-widest">Fitur Unggulan</span>
            <h2 className="text-4xl font-black text-slate-800 mt-2">Semua Yang Anda Butuhkan,<br/>Dalam Satu Plugin</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(f=>(
              <div key={f.title} className="group bg-slate-50 hover:bg-teal-600 border border-slate-100 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-default">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-black text-slate-800 group-hover:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 group-hover:text-teal-100 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black">Apa Kata Mereka?</h2>
            <p className="text-slate-400 mt-3">Ribuan pebisnis sudah membuktikan hasilnya</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t=>(
              <div key={t.name} className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className="flex mb-4">
                  {Array(t.rating).fill(0).map((_,i)=><Star key={i} className="w-5 h-5 text-amber-400" fill="currentColor"/>)}
                </div>
                <p className="text-slate-300 italic leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center font-black text-white">{t.name[0]}</div>
                  <div><div className="font-bold">{t.name}</div><div className="text-xs text-slate-400">{t.role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BONUSES ── */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-14">
            <span className="bg-amber-100 text-amber-700 px-4 py-1 rounded-full font-bold text-sm">BONUS EKSKLUSIF</span>
            <h2 className="text-4xl font-black text-slate-800 mt-4">Gratis Bonus Senilai <span className="text-teal-600">Rp 2.000.000</span></h2>
            <p className="text-slate-500 mt-3">Khusus untuk pembelian hari ini saja</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {BONUSES.map((b,i)=>(
              <div key={b.title} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-shadow flex gap-5">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 font-black text-xl">0{i+1}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-slate-800">{b.title}</h3>
                    <span className="bg-teal-50 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full">Senilai {b.value}</span>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-[#0f4c5c] to-[#1a7a8a]">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-6 text-white">
            <h2 className="text-4xl font-black">Pilih Paket Anda</h2>
            <p className="text-teal-200 mt-3">Investasi sekali bayar, untung selamanya</p>
          </div>
          <CountdownTimer/>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-6">
            {/* Starter */}
            <div className="bg-white/10 border border-white/20 backdrop-blur rounded-3xl p-8 flex flex-col">
              <h3 className="text-xl font-black text-white mb-1">Paket Pemula</h3>
              <p className="text-teal-200 text-sm mb-6">Lisensi untuk 5 Website</p>
              <div className="mb-6">
                <span className="line-through text-white/40 text-sm">Rp 1.800.000</span>
                <div className="text-5xl font-black text-white">Rp 550<span className="text-2xl">.000</span></div>
                <span className="text-teal-300 text-sm font-bold">Sekali Bayar — Hemat 69%</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1 text-white/80 text-sm">
                {["5 Lisensi Website","Semua Fitur Plugin","Update Gratis","Bonus #1 & #2","Support Email"].map(f=>(
                  <li key={f} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400"/>{f}</li>
                ))}
              </ul>
              <a href="#" className="w-full text-center border-2 border-[#ffe121] text-[#ffe121] hover:bg-[#ffe121] hover:text-[#7a3e00] font-black py-4 rounded-xl transition-all duration-200 block">
                Beli Paket Pemula
              </a>
            </div>
            {/* Business - highlighted */}
            <div className="bg-white rounded-3xl p-8 flex flex-col shadow-2xl shadow-black/30 relative overflow-hidden border-4 border-[#ffe121]">
              <div className="absolute top-0 left-0 right-0 bg-[#ffe121] text-[#7a3e00] text-center py-1.5 text-xs font-black uppercase tracking-widest">
                ⭐ PALING LARIS & DIREKOMENDASIKAN
              </div>
              <div className="mt-6">
                <h3 className="text-xl font-black text-slate-800 mb-1">Paket Bisnis</h3>
                <p className="text-slate-500 text-sm mb-6">Unlimited Website — Tanpa Batas!</p>
                <div className="mb-6">
                  <span className="line-through text-red-400 text-sm font-medium">Rp 2.800.000</span>
                  <div className="text-5xl font-black text-slate-800">Rp 1.550<span className="text-2xl">.000</span></div>
                  <span className="text-red-500 text-sm font-bold">Sekali Bayar — Hemat 44%</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1 text-slate-600 text-sm">
                  {["Unlimited Website (Tanpa Batas)","Semua Fitur Plugin","Update Gratis Seumur Hidup","SEMUA Bonus Eksklusif (1-4)","Support VIP Priority","Akses Grup Mastermind"].map(f=>(
                    <li key={f} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500"/>{f}</li>
                  ))}
                </ul>
                <a href="#" className="w-full text-center bg-[#ffe121] hover:bg-[#fac02b] text-[#7a3e00] font-black text-lg py-4 rounded-xl shadow-[0_4px_0_#c49400] hover:shadow-[0_1px_0_#c49400] hover:translate-y-0.5 transition-all duration-150 block">
                  Beli Paket Bisnis Sekarang →
                </a>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-10 text-white/70 text-sm">
            <span className="flex items-center gap-2"><Lock className="w-4 h-4"/>Pembayaran Aman</span>
            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4"/>Garansi 30 Hari</span>
            <span className="flex items-center gap-2"><Award className="w-4 h-4"/>100% Uang Kembali</span>
          </div>
        </div>
      </section>

      {/* ── GUARANTEE ── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 text-amber-600 mb-6 shadow-inner">
            <Award className="w-10 h-10"/>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-4">Garansi 30 Hari Uang Kembali</h2>
          <p className="text-slate-600 leading-relaxed max-w-xl mx-auto">
            Jika dalam 30 hari Anda tidak puas atau plugin tidak berfungsi sesuai deskripsi, hubungi kami dan kami akan kembalikan uang Anda <strong>100% tanpa ditanya</strong>. Risiko nol untuk Anda!
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-slate-800">Pertanyaan yang Sering Ditanyakan</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((f,i)=>(
              <FAQ key={i} q={f.q} a={f.a} open={openFaq===i} onClick={()=>setOpenFaq(openFaq===i?null:i)}/>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 bg-gradient-to-br from-[#0f4c5c] to-[#28c898] text-white text-center">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-4xl font-black mb-4">Jangan Tunda Lagi!</h2>
          <p className="text-teal-100 text-lg mb-8 leading-relaxed">
            Setiap hari tanpa plugin ini = omset yang hilang. Ambil keputusan terbaik untuk bisnis Anda hari ini.
          </p>
          <a href="#pricing" className="inline-flex items-center gap-3 bg-[#ffe121] hover:bg-[#fac02b] text-[#7a3e00] font-black text-xl py-5 px-12 rounded-full shadow-[0_6px_0_#c49400] hover:shadow-[0_2px_0_#c49400] hover:translate-y-1 transition-all duration-150">
            Ya, Saya Mau Plugin Ini! <ArrowRight className="w-6 h-6"/>
          </a>
          <p className="mt-6 text-teal-200 text-sm">✅ Sekali Bayar &nbsp;|&nbsp; ✅ Update Gratis Seumur Hidup &nbsp;|&nbsp; ✅ Garansi 30 Hari</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 text-slate-400 py-10 text-center text-sm">
        <div className="container mx-auto px-4 max-w-3xl">
          <p className="text-xs opacity-50">Disclaimer: Hasil yang dicapai bisa berbeda-beda tergantung konsistensi dan faktor bisnis masing-masing pengguna. Plugin ini adalah alat bantu, bukan jaminan sukses instan.</p>
          <p className="mt-6">&copy; {new Date().getFullYear()} GrabNext. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
