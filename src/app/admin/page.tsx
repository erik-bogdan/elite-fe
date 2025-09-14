"use client";

import { useGetChampionshipStatsQuery } from "@/lib/features/championship/championshipSlice";
import { motion } from "framer-motion";
import { Bebas_Neue } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { FiCalendar, FiUsers, FiAward, FiBarChart } from "react-icons/fi";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"] });

export default function DashboardPage() {
  const { data: statsData, isLoading } = useGetChampionshipStatsQuery();
  const championships = statsData?.championships || [];

  // Helper function to get absolute URL for images
  const abs = (path: string | null | undefined) => {
    if (!path) return '/elitelogo.png';
    if (path.startsWith('http')) return path;
    return `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}${path}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'text-blue-400';
      case 'ongoing': return 'text-green-400';
      case 'completed': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Hamarosan';
      case 'ongoing': return 'Folyamatban';
      case 'completed': return 'Befejezve';
      default: return 'Ismeretlen';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/70">Bajnokságok betöltése...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`${bebasNeue.className} text-white text-3xl md:text-4xl`}>
            Admin Dashboard
          </h1>
          <p className="text-white/70 mt-2">
            Bajnokságok és statisztikák kezelése
          </p>
        </div>
        <Link
          href="/admin/championships"
          className="px-6 py-3 rounded-lg bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white font-semibold transition-colors flex items-center gap-2"
        >
          <FiAward className="w-5 h-5" />
          Bajnokságok kezelése
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {championships?.map((championship, index) => {
          return (
            <motion.div
              key={championship.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-black/30 border border-[#ff5c1a]/30 rounded-2xl p-6 hover:border-[#ff5c1a]/50 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-black/40">
                    <Image
                      src={abs(championship.logo)}
                      alt={championship.name}
                      fill
                      sizes="48px"
                      className="object-contain p-1"
                    />
                  </div>
                  <div>
                    <h3 className={`${bebasNeue.className} text-white text-lg leading-tight`}>
                      {championship.name}
                    </h3>
                    <p className="text-white/60 text-sm">
                      {championship.subName || 'Bajnokság'}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full bg-white/10 ${getStatusColor(championship.status)}`}>
                  {getStatusText(championship.status)}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/70">
                    <FiBarChart className="w-4 h-4" />
                    <span className="text-sm">Meccsek</span>
                  </div>
                  <span className="text-white font-semibold">
                    {championship.completedMatches}/{championship.totalMatches}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/70">
                    <FiUsers className="w-4 h-4" />
                    <span className="text-sm">Csapatok</span>
                  </div>
                  <span className="text-white font-semibold">
                    {championship.teams}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/70">
                    <FiCalendar className="w-4 h-4" />
                    <span className="text-sm">Létrehozva</span>
                  </div>
                  <span className="text-white font-semibold text-sm">
                    {new Date(championship.createdAt).toLocaleDateString('hu-HU')}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <Link
                  href={`/admin/championships/${championship.id}`}
                  className="w-full px-4 py-2 rounded-lg bg-[#ff5c1a]/20 hover:bg-[#ff5c1a]/30 text-[#ff5c1a] font-semibold transition-colors text-center block group-hover:bg-[#ff5c1a] group-hover:text-white"
                >
                  Részletek megtekintése
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>

      {championships?.length === 0 && (
        <div className="text-center py-12">
          <div className="text-white/50 text-lg mb-4">
            Még nincsenek bajnokságok
          </div>
          <Link
            href="/admin/championships"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white font-semibold transition-colors"
          >
            <FiAward className="w-5 h-5" />
            Első bajnokság létrehozása
          </Link>
        </div>
      )}
    </div>
  );
} 