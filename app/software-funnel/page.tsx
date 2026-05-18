"use client";

import React, { useState } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Award, 
  Play, 
  Star, 
  ArrowRight,
  MessageSquare,
  Lock,
  TrendingUp,
  Gift,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SoftwareFunnelPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "Apakah sekali bayar atau berlangganan?",
      a: "Sekali bayar saja. Anda tidak perlu membayar biaya bulanan atau tahunan lagi. Beli sekali, gunakan selamanya."
    },
    {
      q: "Apakah gratis update untuk kedepannya?",
      a: "Ya, Anda akan mendapatkan update gratis seumur hidup. Kami selalu memastikan plugin ini kompatibel dengan versi terbaru."
    },
    {
      q: "Adakah Garansi jika plugin tidak bekerja?",
      a: "Tentu, kami memberikan garansi 100% uang kembali dalam 30 hari jika plugin tidak berfungsi sesuai dengan yang dijanjikan."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-teal-200">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#348b93] to-[#28c898] py-20 lg:py-32 text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 relative z-10 max-w-5xl text-center">
          
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm text-sm font-semibold tracking-wider uppercase shadow-sm">
            WP Plugin yang akan membantu lejitkan pendapatan Anda
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold mb-8 leading-tight tracking-tight">
            Plugin Terbaik yang pernah ada untuk <br className="hidden md:block"/>
            <span className="text-[#ffe121] drop-shadow-sm">Lejitkan Bisnis Online Anda</span>
          </h1>

          {/* Video Placeholder */}
          <div className="relative mx-auto w-full max-w-3xl aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-2xl mb-12 group ring-4 ring-white/20">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop')] bg-cover bg-center opacity-60 group-hover:opacity-70 transition-opacity duration-500"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="w-20 h-20 bg-[#ffc350] hover:bg-white text-white hover:text-[#ffc350] rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-lg group-hover:shadow-[#ffc350]/50">
                <Play className="w-8 h-8 ml-1" fill="currentColor" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12 text-left">
            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
              <CheckCircle2 className="w-6 h-6 text-[#ffe121]" />
              <span className="font-semibold text-lg">Sangat Mudah Digunakan</span>
            </div>
            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
              <TrendingUp className="w-6 h-6 text-[#ffe121]" />
              <span className="font-semibold text-lg">Menganalisa Pengunjung</span>
            </div>
            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
              <ShieldCheck className="w-6 h-6 text-[#ffe121]" />
              <span className="font-semibold text-lg">Data Pribadi Aman</span>
            </div>
            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
              <MessageSquare className="w-6 h-6 text-[#ffe121]" />
              <span className="font-semibold text-lg">WhatsApp Notification</span>
            </div>
          </div>

          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed">
            Sistem cerdas yang dirancang khusus untuk mempermudah alur kerja Anda, mengotomatisasi proses bisnis, dan meningkatkan konversi secara drastis tanpa perlu keahlian teknis.
          </p>

          <Button size="lg" className="bg-[#ffe121] hover:bg-[#fac02b] text-[#985200] font-extrabold text-xl py-8 px-12 rounded-full shadow-[0_8px_0_0_#d49d10] hover:shadow-[0_4px_0_0_#d49d10] hover:translate-y-1 transition-all duration-200">
            Klik Disini untuk Pesan Sekarang <ArrowRight className="ml-2 w-6 h-6" />
          </Button>

          <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm font-medium text-white/80">
            <div className="flex items-center"><Lock className="w-4 h-4 mr-2"/> Informasi Pribadi Aman</div>
            <div className="flex items-center"><ShieldCheck className="w-4 h-4 mr-2"/> Proses Checkout Aman</div>
            <div className="flex items-center"><Award className="w-4 h-4 mr-2"/> 100% Garansi Uang Kembali</div>
          </div>
        </div>
        
        {/* Curved Shape Divider */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-0">
          <svg className="relative block w-full h-[60px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C73.8,25.4,149.9,39.6,224.2,49.2,257.6,53.6,290.7,56.2,321.39,56.44Z" className="fill-slate-50"></path>
          </svg>
        </div>
      </section>

      {/* 2. SOCIAL PROOF SECTION */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-10 text-slate-800">
            Dipercaya <span className="text-[#28C898]">123.000+ Marketers, Entrepreneurs, dan Brand Ternama</span> di Indonesia
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Logos Placeholders */}
            <div className="text-2xl font-black text-slate-400">LOGO BRAND</div>
            <div className="text-2xl font-black text-slate-400">LOGO BRAND</div>
            <div className="text-2xl font-black text-slate-400">LOGO BRAND</div>
            <div className="text-2xl font-black text-slate-400">LOGO BRAND</div>
          </div>
        </div>
      </section>

      {/* 3. PROBLEM AGITATION SECTION */}
      <section className="py-20 relative bg-[#28c898]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10 max-w-4xl">
          <div className="bg-[#82ffb3] p-1 rounded-2xl transform -translate-y-28 shadow-xl">
            <div className="bg-white p-8 md:p-12 rounded-xl text-center">
              <h2 className="text-3xl md:text-4xl font-black text-[#3a6a64] mb-8">Pernahkah Anda mengalami hal ini?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <XCircle className="w-6 h-6 text-red-500 mr-3 shrink-0 mt-0.5" />
                    <span className="text-lg font-medium text-slate-700">Penjualan yang tidak pernah meningkat</span>
                  </div>
                  <div className="flex items-start">
                    <XCircle className="w-6 h-6 text-red-500 mr-3 shrink-0 mt-0.5" />
                    <span className="text-lg font-medium text-slate-700">Tidak dipercaya oleh pelanggan potensial</span>
                  </div>
                  <div className="flex items-start">
                    <XCircle className="w-6 h-6 text-red-500 mr-3 shrink-0 mt-0.5" />
                    <span className="text-lg font-medium text-slate-700">Susahnya memasarkan produk digital/fisik</span>
                  </div>
                  <div className="flex items-start">
                    <XCircle className="w-6 h-6 text-red-500 mr-3 shrink-0 mt-0.5" />
                    <span className="text-lg font-medium text-slate-700">Sering ditipu pembeli abal-abal</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <XCircle className="w-6 h-6 text-red-500 mr-3 shrink-0 mt-0.5" />
                    <span className="text-lg font-medium text-slate-700">Capek balas chat satu per satu</span>
                  </div>
                  <div className="flex items-start">
                    <XCircle className="w-6 h-6 text-red-500 mr-3 shrink-0 mt-0.5" />
                    <span className="text-lg font-medium text-slate-700">Biaya iklan boncos tiap bulan</span>
                  </div>
                  <div className="flex items-start">
                    <XCircle className="w-6 h-6 text-red-500 mr-3 shrink-0 mt-0.5" />
                    <span className="text-lg font-medium text-slate-700">Sulit tracking konversi dan data</span>
                  </div>
                  <div className="flex items-start">
                    <XCircle className="w-6 h-6 text-red-500 mr-3 shrink-0 mt-0.5" />
                    <span className="text-lg font-medium text-slate-700">Website lemot dan susah di-manage</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center text-white space-y-6 mt-[-3rem]">
            <h3 className="text-2xl font-bold">Jika jawaban Anda "IYA", berarti Anda butuh solusi yang tepat!</h3>
            <p className="text-lg text-white/90">
              Jangan biarkan masalah ini terus menghambat pertumbuhan bisnis Anda. Sudah saatnya beralih ke sistem yang lebih cerdas dan otomatis.
            </p>
          </div>
        </div>
      </section>

      {/* 4. PRODUCT INTRODUCTION / SOLUTION */}
      <section className="py-24 bg-white relative">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-teal-50 text-teal-600 font-bold uppercase tracking-wider text-sm">
              Dan Tahukah Anda?
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-6 leading-tight">
              Maka dari itu kami mempersembahkan...
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Sebuah terobosan baru dalam dunia digital marketing yang dirancang khusus untuk memecahkan semua masalah Anda di atas.
            </p>
          </div>

          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-3xl p-8 md:p-12 border border-teal-100 shadow-xl shadow-teal-900/5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-extrabold text-[#3a6a64] mb-6">ProductiPress WP Plugin</h3>
                <p className="text-lg text-slate-700 mb-8 leading-relaxed">
                  Plugin All-in-One yang wajib Anda miliki untuk melejitkan omset bisnis online Anda tanpa ribet. Terintegrasi langsung dengan WhatsApp dan berbagai payment gateway lokal.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center text-slate-700 font-semibold"><CheckCircle2 className="w-6 h-6 text-emerald-500 mr-3"/> Fitur Checkout Instan yang responsif</li>
                  <li className="flex items-center text-slate-700 font-semibold"><CheckCircle2 className="w-6 h-6 text-emerald-500 mr-3"/> Manajemen order dan pelanggan rapi</li>
                  <li className="flex items-center text-slate-700 font-semibold"><CheckCircle2 className="w-6 h-6 text-emerald-500 mr-3"/> Notifikasi otomatis ke WhatsApp Pembeli</li>
                  <li className="flex items-center text-slate-700 font-semibold"><CheckCircle2 className="w-6 h-6 text-emerald-500 mr-3"/> Laporan analitik penjualan mendetail</li>
                </ul>
              </div>
              <div className="relative">
                <div className="aspect-square bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-white flex items-center justify-center p-8 relative">
                   <div className="absolute inset-0 bg-gradient-to-tr from-teal-100 to-emerald-50 opacity-50"></div>
                   <div className="relative z-10 text-center">
                      <div className="w-32 h-32 mx-auto bg-teal-500 text-white rounded-2xl flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-300 shadow-lg">
                        <span className="text-5xl font-black">P</span>
                      </div>
                      <h4 className="text-2xl font-black text-slate-800 mt-6">ProductiPress</h4>
                      <p className="text-teal-600 font-semibold">Pro Version</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BENEFITS SECTION */}
      <section className="py-24 bg-slate-900 text-white relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-6 text-[#82ffb3]">Keuntungan Membeli ProductiPress</h2>
            <p className="text-xl text-slate-300">
              Inilah alasan mengapa ribuan pebisnis online beralih menggunakan plugin kami.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { title: "Menganalisa Pengunjung", desc: "Ketahui darimana asal pembeli Anda dan produk mana yang paling diminati secara realtime." },
              { title: "WhatsApp Notification", desc: "Kirim invoice dan pengingat pembayaran langsung ke WhatsApp pembeli secara otomatis." },
              { title: "Metode Pembayaran Bank Indonesia", desc: "Tersedia opsi transfer bank lokal (BCA, Mandiri, BNI, BRI) dan e-Wallet (OVO, Dana, ShopeePay)." },
              { title: "Mendukung Sistem Kode Promo", desc: "Buat diskon khusus dan kupon berbatas waktu untuk memicu pembelian impulsif." },
              { title: "Dapat Meningkatkan Omzet", desc: "Desain checkout yang dioptimasi untuk mengurangi tingkat keranjang yang ditinggalkan (abandoned cart)." },
              { title: "Konfirmasi Pembayaran Otomatis", desc: "Tidak perlu lagi cek mutasi manual, sistem akan mendeteksi pembayaran masuk secara otomatis." },
              { title: "Fitur Checkout Lebih Aman", desc: "Keamanan terenkripsi standar industri untuk melindungi data sensitif pelanggan Anda." },
              { title: "Tool Marketing & Promosi", desc: "Terintegrasi dengan Facebook Pixel dan Google Analytics untuk retargeting super presisi." }
            ].map((benefit, idx) => (
              <div key={idx} className="bg-slate-800/50 backdrop-blur border border-slate-700 p-6 rounded-2xl hover:bg-slate-800 transition-colors">
                <div className="flex items-start">
                  <div className="bg-teal-500/20 p-3 rounded-lg mr-4 text-teal-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">{benefit.title}</h4>
                    <p className="text-slate-400">{benefit.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. TARGET AUDIENCE */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-12 flex flex-col justify-center">
                <h2 className="text-3xl font-black text-slate-800 mb-6">WP Plugin ini sangat cocok bagi Anda...</h2>
                <ul className="space-y-4">
                  {[
                    "Pebisnis Online & Pemilik Toko Online",
                    "Digital Marketer & Advertiser",
                    "Affiliate Marketer",
                    "Creator & Penjual Produk Digital",
                    "Pemilik Kursus Online",
                    "Freelancer & Agency Web Developer"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center text-lg text-slate-700 font-medium">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mr-4 shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-emerald-50 p-12 flex items-center justify-center relative">
                 <div className="absolute inset-0 bg-gradient-to-br from-[#348b93]/10 to-[#28c898]/20"></div>
                 <div className="relative z-10 w-full aspect-square max-w-sm bg-white rounded-full shadow-2xl border-8 border-white/50 flex items-center justify-center">
                    <div className="text-center">
                      <Star className="w-16 h-16 text-yellow-400 mx-auto mb-4" fill="currentColor"/>
                      <p className="text-2xl font-black text-slate-800">PERFECT<br/>FIT</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. BONUSES SECTION */}
      <section className="py-24 bg-gradient-to-b from-[#f0f5fb] to-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-[#3a6a64] mb-6">Dapatkan Bonus Eksklusif</h2>
            <p className="text-xl text-slate-600">
              Beli hari ini dan dapatkan semua bonus senilai total <span className="font-bold text-slate-800">Rp 2.000.000,-</span> secara GRATIS!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 flex flex-col items-center text-center group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-6 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                  <Gift className="w-10 h-10" />
                </div>
                <div className="bg-[#eaf9f3] text-[#40c995] font-black px-6 py-2 rounded-full text-sm uppercase tracking-widest mb-4 inline-block">
                  Bonus 0{num} Senilai 500rb
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Template Premium {num}</h3>
                <p className="text-slate-600 leading-relaxed">
                  Dapatkan akses eksklusif ke template desain profesional yang siap digunakan untuk meningkatkan konversi halaman sales Anda dalam sekejap.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. PRICING SECTION */}
      <section className="py-24 bg-[#008477] relative" id="pricing">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10 max-w-5xl">
          <div className="text-center mb-16">
             <div className="inline-block bg-[#ffc350] text-[#985200] font-black px-6 py-2 rounded-full mb-6 uppercase tracking-wider shadow-lg animate-pulse">
                Promo Berakhir Segera!
             </div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Pilih Paket Sesuai Kebutuhan Anda</h2>
            <p className="text-xl text-teal-100">
              Investasi terbaik untuk aset digital bisnis Anda. Pilih paket sekarang sebelum harga naik!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plan 1 */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col transform md:scale-95 hover:scale-100 transition-transform duration-300">
              <div className="bg-[#069b8d] p-8 text-center text-white">
                <h3 className="text-2xl font-black mb-2">Paket Pemula</h3>
                <p className="text-teal-100 font-medium">Lisensi untuk 5 Website</p>
              </div>
              <div className="p-8 text-center flex-1 flex flex-col">
                <div className="mb-6">
                  <span className="text-slate-400 line-through text-lg font-medium block mb-2">Rp 1.800.000</span>
                  <div className="text-5xl font-black text-slate-800">Rp 550.000</div>
                  <span className="text-sm font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full inline-block mt-4">Sekali Bayar</span>
                </div>
                
                <ul className="text-left space-y-4 mb-8 flex-1 text-slate-600 font-medium">
                  <li className="flex items-center"><CheckCircle2 className="w-5 h-5 text-teal-500 mr-3"/> Update Gratis Seumur Hidup</li>
                  <li className="flex items-center"><CheckCircle2 className="w-5 h-5 text-teal-500 mr-3"/> Dukungan Teknis Prioritas</li>
                  <li className="flex items-center"><CheckCircle2 className="w-5 h-5 text-teal-500 mr-3"/> Semua Fitur Premium</li>
                  <li className="flex items-center"><CheckCircle2 className="w-5 h-5 text-teal-500 mr-3"/> Bonus Eksklusif #1 & #2</li>
                </ul>

                <Button className="w-full bg-white border-2 border-[#069b8d] text-[#069b8d] hover:bg-[#069b8d] hover:text-white font-bold text-lg py-6 rounded-xl transition-all duration-300">
                  Beli Paket Pemula
                </Button>
              </div>
            </div>

            {/* Plan 2 - Highlighted */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col relative border-4 border-[#ffe121] z-10 transform md:-translate-y-4">
              <div className="absolute top-0 inset-x-0 bg-[#ffe121] text-[#985200] text-center font-black py-1 text-sm uppercase tracking-widest">
                Paling Laris & Direkomendasikan
              </div>
              <div className="bg-slate-800 p-8 pt-10 text-center text-white">
                <h3 className="text-2xl font-black mb-2">Paket Bisnis</h3>
                <p className="text-slate-300 font-medium">Lisensi untuk Unlimited Website</p>
              </div>
              <div className="p-8 text-center flex-1 flex flex-col bg-slate-50">
                <div className="mb-6">
                  <span className="text-slate-400 line-through text-lg font-medium block mb-2">Rp 2.800.000</span>
                  <div className="text-5xl font-black text-red-500">Rp 1.550.000</div>
                  <span className="text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full inline-block mt-4">Diskon Terbesar! Sekali Bayar</span>
                </div>
                
                <ul className="text-left space-y-4 mb-8 flex-1 text-slate-700 font-medium">
                  <li className="flex items-center"><CheckCircle2 className="w-5 h-5 text-teal-500 mr-3"/> <span className="font-bold text-slate-800">Unlimited Website (Tanpa Batas)</span></li>
                  <li className="flex items-center"><CheckCircle2 className="w-5 h-5 text-teal-500 mr-3"/> Update Gratis Seumur Hidup</li>
                  <li className="flex items-center"><CheckCircle2 className="w-5 h-5 text-teal-500 mr-3"/> Dukungan Teknis VIP Priority</li>
                  <li className="flex items-center"><CheckCircle2 className="w-5 h-5 text-teal-500 mr-3"/> Semua Fitur Premium</li>
                  <li className="flex items-center"><CheckCircle2 className="w-5 h-5 text-teal-500 mr-3"/> <span className="font-bold text-slate-800">SEMUA Bonus Eksklusif (1-4)</span></li>
                  <li className="flex items-center"><CheckCircle2 className="w-5 h-5 text-teal-500 mr-3"/> Akses Grup Eksklusif</li>
                </ul>

                <Button className="w-full bg-[#ffe121] hover:bg-[#fac02b] text-[#985200] shadow-[0_6px_0_0_#d49d10] hover:shadow-[0_2px_0_0_#d49d10] hover:translate-y-1 font-black text-xl py-8 rounded-xl transition-all duration-200">
                  Beli Paket Bisnis Sekarang
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. GUARANTEE SECTION */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-amber-100 text-amber-500 rounded-full mb-8 shadow-inner">
            <Award className="w-12 h-12" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-6">Garansi 30 Hari Uang Kembali</h2>
          <p className="text-xl text-slate-600 leading-relaxed mb-8 max-w-2xl mx-auto">
            Kami sangat yakin Anda akan menyukai ProductiPress. Namun, jika dalam 30 hari Anda merasa plugin ini tidak memberikan manfaat bagi bisnis Anda, hubungi tim support kami, dan kami akan mengembalikan uang Anda 100% tanpa ditanya!
          </p>
          <div className="flex flex-wrap justify-center gap-4 opacity-70 grayscale">
            <div className="px-4 py-2 border rounded font-bold text-slate-500">BCA</div>
            <div className="px-4 py-2 border rounded font-bold text-slate-500">MANDIRI</div>
            <div className="px-4 py-2 border rounded font-bold text-slate-500">BNI</div>
            <div className="px-4 py-2 border rounded font-bold text-slate-500">BRI</div>
            <div className="px-4 py-2 border rounded font-bold text-slate-500">OVO / GO-PAY</div>
          </div>
        </div>
      </section>

      {/* 10. FAQ SECTION */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-[#3a6a64] mb-6">Hal yang Sering Ditanyakan (FAQ)</h2>
            <p className="text-lg text-slate-600">
              Punya pertanyaan? Mungkin jawabannya sudah ada di bawah ini.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center font-bold text-lg text-slate-800 focus:outline-none"
                >
                  <span>{faq.q}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-teal-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                <div 
                  className={`px-6 pb-5 text-slate-600 leading-relaxed transition-all duration-300 ease-in-out ${openFaq === index ? 'block' : 'hidden'}`}
                >
                  <div className="pt-2 border-t border-slate-100">
                    {faq.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. FOOTER / DISCLAIMER */}
      <footer className="bg-slate-900 text-slate-400 py-12 text-center text-sm">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="mb-6">
            <strong>P.S.S</strong> Investasi yang Anda keluarkan hari ini tidak sebanding dengan potensi kerugian jika Anda menunda menggunakan sistem cerdas ini untuk bisnis Anda. Take action sekarang!
          </p>
          <div className="w-16 h-px bg-slate-700 mx-auto mb-6"></div>
          <p className="text-xs opacity-60">
            Disclaimer: Segala hasil yang didapatkan bisa berbeda-beda untuk setiap pengguna tergantung dari berbagai faktor seperti model bisnis, konsistensi, dan upaya pemasaran yang dilakukan. Kami tidak menjamin kesuksesan instan, namun kami memberikan tool terbaik untuk membantu Anda mencapainya.
          </p>
          <p className="mt-8">
            &copy; {new Date().getFullYear()} Software Company. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
