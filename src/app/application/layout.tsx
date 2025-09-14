"use client";

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Bebas_Neue } from "next/font/google";
import NeonBg from '../components/NeonBg';
import { FiMenu, FiX } from 'react-icons/fi';
import NotificationsDropdown from "../components/NotificationsDropdown";
import { authClient } from "../lib/auth-client";
import { useSession } from '@/hooks/useAuth';
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

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

  const initial = (nickname || "").trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="min-h-screen w-full flex flex-col relative">
      <NeonBg />
      {/* Top Navigation - hidden on /application/apply */}
      {!isApply && (
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#002b6b]/95 backdrop-blur-md shadow-md border-b border-[#ff5c1a]"
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
              <div className="h-9 w-9 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-[#ff5c1a] to-[#002b6b] flex items-center justify-center shadow-lg shadow-[#ff5c1a]/20">
                <span className="font-bold text-base md:text-lg text-white">{initial}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Mobile Nav Drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50  backdrop-blur-md flex flex-col bg-[#002b6b]/95">
            <div className="flex items-center justify-between px-4 py-4 border-b border-[#ff5c1a] bg-[#002b6b]/95">
              <Image src="/logo.svg" alt="ELITE Beerpong logo" width={120} height={30} priority className="w-auto h-8" />
              <button
                className="text-white text-3xl p-2 focus:outline-none"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close menu"
              >
                <FiX />
              </button>
            </div>
            <nav className="flex flex-col space-y-2 bg-[#002b6b]/95 px-6">
              <Link href="/application" className={`${bebasNeue.className} text-xl text-white py-3 border-b border-[#ff5c1a]`} onClick={() => setMobileNavOpen(false)}>
                DASHBOARD
              </Link>
              <Link href="/application/matches" className={`${bebasNeue.className} text-xl text-white py-3 border-b border-[#ff5c1a]`} onClick={() => setMobileNavOpen(false)}>
                MATCHES
              </Link>
              <Link href="/application/live-matches" className={`${bebasNeue.className} text-xl text-white py-3 border-b border-[#ff5c1a]`} onClick={() => setMobileNavOpen(false)}>
                ÉLŐ MECCSEK
              </Link>
              <Link href="/application/league" className={`${bebasNeue.className} text-xl text-white py-3 border-b border-[#ff5c1a]`} onClick={() => setMobileNavOpen(false)}>
                LEAGUE
              </Link>
              <Link href="/application/profile" className={`${bebasNeue.className} text-xl text-white py-3 border-b border-[#ff5c1a]`} onClick={() => setMobileNavOpen(false)}>
                PROFILE
              </Link>
            </nav>
            <div className="flex items-center space-x-4 px-6 mt-8">
              <div className="relative">
                <button className="p-2 hover:bg-[#ff5c1a] hover:bg-opacity-20 rounded-full transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#ff5c1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#ff5c1a] rounded-full text-xs flex items-center justify-center text-white font-bold shadow-lg shadow-[#ff5c1a]/40">
                  3
                </span>
              </div>
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#ff5c1a] to-[#002b6b] flex items-center justify-center shadow-lg shadow-[#ff5c1a]/20">
                <span className="font-bold text-base text-white">{initial}</span>
              </div>
            </div>
          </div>
        )}
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