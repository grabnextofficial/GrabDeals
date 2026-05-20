"use client";
import React, { useState, useEffect } from "react";

interface ChatScript {
  user: string;
  question: string;
  answer: string;
}

const CHAT_SCRIPTS: ChatScript[] = [
  {
    user: "Rohan S. (Delhi)",
    question: "Is this a lifetime license or monthly?",
    answer: "It's 100% lifetime access! One-time payment of ₹249, use forever without any subscription."
  },
  {
    user: "Vikram K. (Mumbai)",
    question: "Does it support Macbook M2 Apple Silicon?",
    answer: "Yes! All software versions support M1, M2, M3, and M4 chips natively."
  },
  {
    user: "Neha G. (Bangalore)",
    question: "How will I get the link after payment?",
    answer: "You'll receive an automated high-speed download link in your email invoice immediately!"
  },
  {
    user: "Aarav P. (Pune)",
    question: "What if I get stuck during installation?",
    answer: "Don't worry! Our support team is available on WhatsApp 24/7 to help you install it."
  }
];

export function SimulatedChatPopup() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<"question" | "answer">("question");

  useEffect(() => {
    // Show first popup after 5 seconds
    const showTimer = setTimeout(() => {
      setVisible(true);
      setStep("question");
    }, 5000);

    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!visible) return;

    if (step === "question") {
      // Transition to answer after 3 seconds
      const timer = setTimeout(() => {
        setStep("answer");
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      // Hide popup after showing answer for 6 seconds, then show next question
      const timer = setTimeout(() => {
        setVisible(false);
        // Move to next script
        setTimeout(() => {
          setIndex((prev) => (prev + 1) % CHAT_SCRIPTS.length);
          setVisible(true);
          setStep("question");
        }, 4000); // Wait 4s before showing next popup
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [visible, step]);

  if (!visible) return null;

  const current = CHAT_SCRIPTS[index];

  return (
    <div className="fixed bottom-24 left-6 z-[97] bg-white border border-gray-150 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.12)] max-w-[280px] sm:max-w-[320px] transition-all duration-300 animate-slide-up flex flex-col gap-2.5">
      {/* Header / User Info */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-black text-sm">
          {current.user.charAt(0)}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-black text-gray-900 leading-none">{current.user}</span>
          <span className="text-[9px] font-bold text-green-600 mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
            Verified Customer
          </span>
        </div>
      </div>

      {/* Message Stack */}
      <div className="flex flex-col gap-2">
        {/* User Question */}
        <div className="bg-gray-50 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 self-start border border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold mb-0.5">Question</p>
          "{current.question}"
        </div>

        {/* Support Reply (with loading typing simulator if not ready) */}
        {step === "answer" ? (
          <div className="bg-green-50 rounded-xl px-3 py-2 text-xs font-extrabold text-green-800 self-end border border-green-100 animate-slide-up">
            <p className="text-[10px] text-green-600 font-black mb-0.5">Support Team</p>
            {current.answer}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-400 self-end flex items-center gap-1">
            <span>Support is typing</span>
            <span className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
