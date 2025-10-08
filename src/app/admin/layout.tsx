"use client";

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Bebas_Neue } from "next/font/google";
import NeonBg from '../components/NeonBg';
import { FiMenu, FiX, FiChevronDown, FiChevronRight, FiAward, FiUsers, FiUser, FiMoreHorizontal, FiChevronLeft, FiLogOut } from 'react-icons/fi';
import NotificationsDropdown from "../components/NotificationsDropdown";
import { useSession } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { authClient } from '../lib/auth-client';

const bebasNeue = Bebas_Neue({
    weight: "400",
    subsets: ["latin"],
});

interface DashboardLayoutProps {
  children: ReactNode;
}

interface MenuSection {
  title: string;
  icon: ReactNode;
  items: { title: string; href: string }[];
}

// Simple Tooltip component (replace with shadcn/ui Tooltip if available)
function Tooltip({ children, label }: { children: React.ReactNode; label: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative flex items-center">
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="flex"
      >
        {children}
      </span>
      {show && (
        <span className="absolute left-full ml-2 px-2 py-1 rounded bg-black text-white text-xs whitespace-nowrap z-50 shadow-lg">
          {label}
        </span>
      )}
    </span>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, error: sessionError, isPending } = useSession();
  const router = useRouter();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    championships: false,
    teams: false,
    players: false,
    others: false,
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (sessionError) {
      router.push("/auth/login");
      return;
    }

    if (!isPending && !session?.user) {
      router.push("/auth/login");
      return;
    }

    if (session?.user) {
      const isAdmin =
        session.user.role === "admin" ||
        (Array.isArray(session.user.role) &&
          session.user.role.includes("admin"));

      if (!isAdmin) {
        toast.error("You don't have permission to access the admin area");
        router.push("/auth/login");
        return;
      }
    }
  }, [session, sessionError, isPending, router]);

  const menuSections: MenuSection[] = [
    {
      title: "Bajnokságok",
      icon: <FiAward className="w-5 h-5" />,
      items: [
        { title: "Összes Bajnokság", href: "/admin/championships" },
        { title: "Meccsek", href: "/admin/matches" },
      ],
    },
    {
      title: "Csapatok",
      icon: <FiUsers className="w-5 h-5" />,
      items: [
        { title: "Összes Csapat", href: "/admin/teams" },
      ],
    },
    {
      title: "Játékosok",
      icon: <FiUser className="w-5 h-5" />,
      items: [
        { title: "Összes Játékos", href: "/admin/players" },
      ],
    },
    {
      title: "Egyéb",
      icon: <FiMoreHorizontal className="w-5 h-5" />,
      items: [
        { title: "Szezonok", href: "/admin/others/seasons" },
        { title: "Beállítások", href: "/admin/settings" },
        { title: "Felhasználók", href: "/admin/users" },
        { title: "Naplók", href: "/admin/logs" },
        { title: "Backup", href: "/admin/backup" },
      ],
    },
  ];

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  if (session && sessionError) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen w-full flex flex-col relative">
      <NeonBg />
      {/* Top Navigation */}
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
                <span className="font-bold text-base md:text-lg text-white">JD</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sidebar collapse/expand button above sidebar */}
      <button
        onClick={() => setSidebarCollapsed((prev) => !prev)}
        className={`hidden md:flex items-center justify-center fixed top-4 left-4 z-50 h-10 w-10 border border-[#ff5c1a] rounded-full shadow-lg transition-colors ${sidebarCollapsed ? 'bg-[#002b6b] text-[#ff5c1a] hover:bg-[#ff5c1a]/10' : 'bg-[#ff5c1a] text-white hover:bg-[#ff7c3a]'}`}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{ transition: 'left 0.3s' }}
      >
        <FiMenu className="w-6 h-6" />
      </button>

      {/* Side Menu */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`fixed left-0 top-20 h-[calc(100vh-5rem)] ${sidebarCollapsed ? 'w-16' : 'w-64'} bg-[#002b6b]/95 backdrop-blur-md border-r border-[#ff5c1a] z-40 hidden md:block overflow-hidden transition-all duration-300`}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 p-2">
            {menuSections.map((section) => (
              <div key={section.title} className="mb-2">
                <button
                  onClick={() => setExpandedSections(prev => ({ ...prev, [section.title.toLowerCase()]: !prev[section.title.toLowerCase()] }))}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} p-2 text-white hover:bg-[#ff5c1a]/10 rounded-lg transition-colors`}
                >
                  <Tooltip label={section.title}>
                    <span>{section.icon}</span>
                  </Tooltip>
                  {!sidebarCollapsed && (
                    <span className={`${bebasNeue.className} text-lg ml-2 flex-1 text-left`}>{section.title}</span>
                  )}
                  {!sidebarCollapsed && (
                    expandedSections[section.title.toLowerCase()] ? (
                      <FiChevronDown className="w-5 h-5 text-[#ff5c1a]" />
                    ) : (
                      <FiChevronRight className="w-5 h-5 text-[#ff5c1a]" />
                    )
                  )}
                </button>
                <AnimatePresence>
                  {!sidebarCollapsed && expandedSections[section.title.toLowerCase()] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-8 mt-2 space-y-1">
                        {section.items.map((item) => (
                          <Link
                            key={item.title}
                            href={item.href}
                            className="block py-2 px-3 text-white hover:text-[#ff5c1a] hover:bg-[#ff5c1a]/10 rounded-lg transition-colors"
                          >
                            {item.title}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Mobile Nav Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 backdrop-blur-md flex flex-col bg-[#002b6b]/95">
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
          <div className="p-4">
            {menuSections.map((section) => (
              <div key={section.title} className="mb-4">
                <button
                  onClick={() => toggleSection(section.title.toLowerCase())}
                  className="w-full flex items-center justify-between p-2 text-white hover:bg-[#ff5c1a]/10 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    {section.icon}
                    <span className={`${bebasNeue.className} text-lg`}>{section.title}</span>
                  </div>
                  {expandedSections[section.title.toLowerCase()] ? (
                    <FiChevronDown className="w-5 h-5 text-[#ff5c1a]" />
                  ) : (
                    <FiChevronRight className="w-5 h-5 text-[#ff5c1a]" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedSections[section.title.toLowerCase()] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-8 mt-2 space-y-1">
                        {section.items.map((item) => (
                          <Link
                            key={item.title}
                            href={item.href}
                            className="block py-2 px-3 text-white hover:text-[#ff5c1a] hover:bg-[#ff5c1a]/10 rounded-lg transition-colors"
                            onClick={() => setMobileNavOpen(false)}
                          >
                            {item.title}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pt-20 md:pt-24 md:pl-64 w-full flex  justify-center">
        <div className="max-w-7xl w-full px-2 sm:px-4">
          {children}
        </div>
      </main>
    </div>
  );
} 
