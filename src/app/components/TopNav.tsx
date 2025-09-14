"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bebas_Neue } from "next/font/google";
import Image from "next/image";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

export default function TopNav() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const threshold = typeof window !== "undefined" ? window.innerHeight * 1.5 : 600;
      setVisible(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[1200] border-b border-white/15 bg-black/90 backdrop-blur-sm"
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="py-3 flex items-center justify-between text-white">
              <Link href="/" className={`${bebasNeue.className} text-2xl tracking-wide`}><Image src="/logo.svg" alt="Elite Logo" width={200} height={200} /></Link>
              <div className="hidden md:flex items-center gap-8 text-3xl">
                <Link href="#" className={`${bebasNeue.className} hover:text-white text-white/85`}>ELITE Beerpong</Link>
                <Link href="#" className={`${bebasNeue.className} hover:text-white text-white/85`}>MECCSEK</Link>
                <Link href="#" className={`${bebasNeue.className} hover:text-white text-white/85`}>Tabella</Link>
              </div>
              <Link href="/auth/login" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="h-8 w-8 rounded-full bg-white/15 border border-white/20 grid place-items-center text-white/80 text-xs">
                {/* User icon from react-icons */}
                <span className="text-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 14a4 4 0 01-8 0m8 0a4 4 0 00-8 0m8 0V7a4 4 0 10-8 0v7m8 0a4 4 0 01-8 0" />
                  </svg>
                </span>
                </div>
                <span className={`${bebasNeue.className} text-white/85 text-lg`}>Bejelentkezés</span>
              </Link>
            </div>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}


