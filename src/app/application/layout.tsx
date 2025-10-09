"use client";

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Bebas_Neue } from "next/font/google";
import NeonBg from '../components/NeonBg';
import { FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import NotificationsDropdown from "../components/NotificationsDropdown";
import { authClient } from "../lib/auth-client";
import { useSession } from '@/hooks/useAuth';
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FiXCircle } from 'react-icons/fi';

const bebasNeue = Bebas_Neue({
    weight: "400",
    subsets: ["latin"],
});

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [nickname, setNickname] = useState<string>("");
  const [role, setRole] = useState<string | null>(null);
  const pathname = usePathname();
  const isApply = pathname?.startsWith('/application/apply');
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isImpersonating, setIsImpersonating] = useState<{ adminName?: string; targetName?: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await authClient.getSession();
        if (mounted) {
          setNickname((data?.user?.nickname || data?.user?.name || "").trim());
          setRole((data?.user as any)?.role || null);
        }
      } catch {}
    })();
    return () => { mounted = false };
  }, []);

  useEffect(() => {
    if (!isPending && !session) {
      router.replace('/auth/login');
    }
  }, [isPending, session, router]);

  useEffect(() => {
    const impersonatedBy = (session as any)?.session?.impersonatedBy || (session as any)?.impersonatedBy;
    if (impersonatedBy) {
      const adminName = (impersonatedBy.user?.name || impersonatedBy.user?.email || 'Admin');
      const targetName = (session as any)?.user?.name || (session as any)?.user?.email || 'User';
      setIsImpersonating({ adminName, targetName });
    } else {
      setIsImpersonating(null);
    }
  }, [session]);

  const initial = (nickname || "").trim().charAt(0).toUpperCase() || "?";

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative">
      <NeonBg />
      {isImpersonating && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-[#ff5c1a] text-white">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
            <div className="flex items-center justify-between h-10">
              <div className="text-sm">
                Impersonate aktív: <span className="font-semibold">{isImpersonating.targetName}</span> néven
              </div>
              <button
                onClick={async () => {
                  try {
                    await (authClient as any).admin?.stopImpersonating?.();
                  } catch {
                    try { await (authClient as any).admin?.revert?.(); } catch {}
                  }
                  window.location.reload();
                }}
                className="flex items-center gap-1 hover:opacity-90"
                aria-label="Kilépés az impersonate-ből"
                title="Kilépés"
              >
                <FiXCircle className="w-4 h-4" />
                <span>Kilépés</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Top Navigation - hidden on /application/apply */}
      {!isApply && (
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#002b6b]/95 backdrop-blur-md shadow-md border-b border-[#ff5c1a]"
        style={{ top: isImpersonating ? 40 : 0 }}
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 className={`${bebasNeue.className} text-2xl md:text-4xl tracking-wider`}>
                <Image
                  src="/logo.svg"
                  alt="ELITE Beerpong logo"
                  width={120}
                  height={30}
                  priority
                  className="w-auto h-8 md:h-10"
                />
              </h1>
            </div>
            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex space-x-4 lg:space-x-8">
              <Link href="/application" className={`${bebasNeue.className} text-base md:text-xl text-white hover:text-[#ff5c1a] px-2 md:px-3 py-1 md:py-2 transition-colors tracking-wider border-b-2 border-transparent hover:border-[#ff5c1a]`}>
                DASHBOARD
              </Link>
              <Link href="/application/matches" className={`${bebasNeue.className} text-base md:text-xl text-white hover:text-[#ff5c1a] px-2 md:px-3 py-1 md:py-2 transition-colors tracking-wider border-b-2 border-transparent hover:border-[#ff5c1a]`}>
                MECCSEK
              </Link>
              <Link href="/application/live-matches" className={`${bebasNeue.className} text-base md:text-xl text-white hover:text-[#ff5c1a] px-2 md:px-3 py-1 md:py-2 transition-colors tracking-wider border-b-2 border-transparent hover:border-[#ff5c1a]`}>
                ÉLŐ MECCSEK
              </Link>
              <Link href="/application/league" className={`${bebasNeue.className} text-base md:text-xl text-white hover:text-[#ff5c1a] px-2 md:px-3 py-1 md:py-2 transition-colors tracking-wider border-b-2 border-transparent hover:border-[#ff5c1a]`}>
                TABELLA
              </Link>
              <Link href="/application/profile" className={`${bebasNeue.className} text-base md:text-xl text-white hover:text-[#ff5c1a] px-2 md:px-3 py-1 md:py-2 transition-colors tracking-wider border-b-2 border-transparent hover:border-[#ff5c1a]`}>
                PROFIL
              </Link>
              {(() => {
                const userRole = (session?.user as any)?.role ?? role;
                const isAdmin = userRole === 'admin' || (Array.isArray(userRole) && userRole.includes('admin'));
                return isAdmin;
              })() && (
                <Link href="/admin" target='_blank' className={`${bebasNeue.className} text-base md:text-xl text-white hover:text-[#ff5c1a] px-2 md:px-3 py-1 md:py-2 transition-colors tracking-wider border-b-2 border-transparent hover:border-[#ff5c1a]`}>
                  ADMIN
                </Link>
              )}
            </nav>
            {/* Mobile Hamburger */}
            <div className="flex md:hidden items-center">
              <button
                className="text-white text-3xl p-2 focus:outline-none"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open menu"
              >
                <FiMenu />
              </button>
            </div>
            {/* Right side icons */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
              <NotificationsDropdown />
              <button
                onClick={handleSignOut}
                className="p-2 text-white hover:text-[#ff5c1a] hover:bg-[#ff5c1a]/10 rounded-full transition-colors"
                aria-label="Sign out"
                title="Kijelentkezés"
              >
                <FiLogOut className="w-5 h-5" />
              </button>
              <div className="h-9 w-9 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-[#ff5c1a] to-[#002b6b] flex items-center justify-center shadow-lg shadow-[#ff5c1a]/20">
                <span className="font-bold text-base md:text-lg text-white">{initial}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Mobile Nav Drawer - Full Screen with Animation */}
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div 
              initial={{ opacity: 0, x: "-100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "-100%" }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                duration: 0.3 
              }}
              className="fixed inset-0 z-50 w-full h-[100vh] bg-[#002b6b] flex flex-col" 
              style={{ backgroundColor: '#002b6b' }}
            >
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="flex items-center justify-between px-4 py-4 border-b border-[#ff5c1a]"
              >
                <Image src="/logo.svg" alt="ELITE Beerpong logo" width={120} height={30} priority className="w-auto h-8" />
                <button
                  className="text-white text-3xl p-2 focus:outline-none hover:bg-[#ff5c1a]/10 rounded-full transition-colors"
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close menu"
                >
                  <FiX />
                </button>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="flex-1 flex flex-col justify-between bg-[#002b6b]"
              >
                <motion.nav 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="flex flex-col space-y-2 px-6 py-6"
                >
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    <Link href="/application" className={`${bebasNeue.className} text-2xl text-white py-4 border-b border-[#ff5c1a] block hover:text-[#ff5c1a] transition-colors`} onClick={() => setMobileNavOpen(false)}>
                      DASHBOARD
                    </Link>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                  >
                    <Link href="/application/matches" className={`${bebasNeue.className} text-2xl text-white py-4 border-b border-[#ff5c1a] block hover:text-[#ff5c1a] transition-colors`} onClick={() => setMobileNavOpen(false)}>
                      MECCSEK
                    </Link>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                  >
                    <Link href="/application/live-matches" className={`${bebasNeue.className} text-2xl text-white py-4 border-b border-[#ff5c1a] block hover:text-[#ff5c1a] transition-colors`} onClick={() => setMobileNavOpen(false)}>
                      ÉLŐ MECCSEK
                    </Link>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7, duration: 0.3 }}
                  >
                    <Link href="/application/league" className={`${bebasNeue.className} text-2xl text-white py-4 border-b border-[#ff5c1a] block hover:text-[#ff5c1a] transition-colors`} onClick={() => setMobileNavOpen(false)}>
                      TABELLA
                    </Link>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8, duration: 0.3 }}
                  >
                    <Link href="/application/profile" className={`${bebasNeue.className} text-2xl text-white py-4 border-b border-[#ff5c1a] block hover:text-[#ff5c1a] transition-colors`} onClick={() => setMobileNavOpen(false)}>
                      PROFIL
                    </Link>
                  </motion.div>
                </motion.nav>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.4 }}
                  className="flex items-center justify-center space-x-6 px-6 py-8 border-t border-[#ff5c1a]"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.0, duration: 0.3, type: "spring", stiffness: 200 }}
                    className="relative"
                  >
                    <button className="p-3 hover:bg-[#ff5c1a] hover:bg-opacity-20 rounded-full transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#ff5c1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </button>
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#ff5c1a] rounded-full text-xs flex items-center justify-center text-white font-bold shadow-lg shadow-[#ff5c1a]/40">
                      3
                    </span>
                  </motion.div>
                  
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.1, duration: 0.3, type: "spring", stiffness: 200 }}
                    onClick={handleSignOut}
                    className="p-3 text-white hover:text-[#ff5c1a] hover:bg-[#ff5c1a]/10 rounded-full transition-colors"
                    aria-label="Sign out"
                    title="Kijelentkezés"
                  >
                    <FiLogOut className="w-8 h-8" />
                  </motion.button>
                  
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.2, duration: 0.3, type: "spring", stiffness: 200 }}
                    className="h-12 w-12 rounded-full bg-gradient-to-br from-[#ff5c1a] to-[#002b6b] flex items-center justify-center shadow-lg shadow-[#ff5c1a]/20"
                  >
                    <span className="font-bold text-lg text-white">{initial}</span>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      )}
      {/* Main Content */}
      <main className={`flex-1 ${isApply ? 'pt-0' : 'pt-20 md:pt-24'} w-full flex items-center justify-center`}>
        <div className="max-w-7xl w-full px-2 sm:px-4">
          {children}
        </div>
      </main>
    </div>
  );
} 