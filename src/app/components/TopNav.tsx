"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bebas_Neue } from "next/font/google";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FiMenu, FiX } from "react-icons/fi";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

export default function TopNav() {
  const [visible, setVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const isHiddenRoute = pathname.startsWith("/auth") || pathname.startsWith("/application") || pathname.startsWith("/admin");

  useEffect(() => {
    if (isHiddenRoute) {
      // On hidden routes, never show
      setVisible(false);
    } else if (isHomepage) {
      // On homepage, show after scrolling past hero section
      const onScroll = () => {
        const threshold = typeof window !== "undefined" ? window.innerHeight * 1.5 : 600;
        setVisible(window.scrollY > threshold);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    } else {
      // On other pages, always show
      setVisible(true);
    }
  }, [isHomepage, isHiddenRoute]);

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.nav
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-[1200] border-b border-white/15 bg-black/90 backdrop-blur-sm"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="py-3 sm:py-4 flex items-center justify-between text-white min-h-[60px] sm:min-h-[70px]">
                {/* Logo - smaller on mobile */}
                <Link href="/" className={`${bebasNeue.className} text-lg sm:text-2xl tracking-wide`}>
                  <Image 
                    src="/logo.svg" 
                    alt="Elite Logo" 
                    width={120} 
                    height={120} 
                    className="w-28 h-7 sm:w-32 sm:h-8 md:w-40 md:h-10"
                  />
                </Link>
                
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8 text-3xl">
                  <Link href="/" className={`${bebasNeue.className} hover:text-white text-white/85`}>ELITE Beerpong</Link>
                  <Link href="/szabalyok" className={`${bebasNeue.className} hover:text-white text-white/85`}>SZABÁLYOK</Link>
                </div>
                
                {/* Right side - Login button and mobile menu */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Login button - icon only on mobile */}
                  <Link href="/auth/login" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
                    <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white/15 border border-white/20 grid place-items-center text-white/80">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 14a4 4 0 01-8 0m8 0a4 4 0 00-8 0m8 0V7a4 4 0 10-8 0v7m8 0a4 4 0 01-8 0" />
                      </svg>
                    </div>
                    <span className={`${bebasNeue.className} text-white/85 text-sm sm:text-lg hidden sm:block`}>Bejelentkezés</span>
                  </Link>
                  
                  {/* Mobile menu button */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 text-white/85 hover:text-white transition-colors"
                    aria-label="Toggle menu"
                  >
                    {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </motion.nav>

          {/* Mobile Drawer Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[1199] bg-black/50 backdrop-blur-sm md:hidden"
                onClick={() => setMobileMenuOpen(false)}
              >
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-black/95 backdrop-blur-md border-l border-white/15"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6 pt-20">
                    <nav className="space-y-6">
                      <Link 
                        href="/" 
                        className={`${bebasNeue.className} block text-2xl text-white/85 hover:text-white transition-colors`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        ELITE Beerpong
                      </Link>
                      <Link 
                        href="/szabalyok" 
                        className={`${bebasNeue.className} block text-2xl text-white/85 hover:text-white transition-colors`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        SZABÁLYOK
                      </Link>
                      <div className="pt-6 border-t border-white/15">
                        <Link 
                          href="/auth/login" 
                          className={`${bebasNeue.className} flex items-center gap-3 text-xl text-white/85 hover:text-white transition-colors`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <div className="h-8 w-8 rounded-full bg-white/15 border border-white/20 grid place-items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 14a4 4 0 01-8 0m8 0a4 4 0 00-8 0m8 0V7a4 4 0 10-8 0v7m8 0a4 4 0 01-8 0" />
                            </svg>
                          </div>
                          Bejelentkezés
                        </Link>
                      </div>
                    </nav>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}


