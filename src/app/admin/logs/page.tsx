"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bebas_Neue } from "next/font/google";
import { useGetSystemLogsQuery } from "@/lib/features/apiSlice";
import { FiClock, FiUser, FiActivity, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"] });

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const limit = 50;
  
  const { data: logsData, isLoading, error } = useGetSystemLogsQuery({ page, limit });
  const logs = logsData?.logs || [];
  const pagination = logsData?.pagination;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'invite': return 'text-blue-400 bg-blue-400/20';
      case 'match': return 'text-green-400 bg-green-400/20';
      case 'championship': return 'text-purple-400 bg-purple-400/20';
      case 'team': return 'text-orange-400 bg-orange-400/20';
      case 'player': return 'text-cyan-400 bg-cyan-400/20';
      case 'user': return 'text-pink-400 bg-pink-400/20';
      case 'system': return 'text-gray-400 bg-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'invite': return '📧';
      case 'match': return '⚽';
      case 'championship': return '🏆';
      case 'team': return '👥';
      case 'player': return '👤';
      case 'user': return '🔐';
      case 'system': return '⚙️';
      default: return '📝';
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('hu-HU'),
      time: date.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/70">Logok betöltése...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-400">Hiba történt a logok betöltésekor</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`${bebasNeue.className} text-white text-3xl md:text-4xl`}>
            Rendszer Logok
          </h1>
          <p className="text-white/70 mt-2">
            Felhasználói műveletek és rendszeresemények naplója
          </p>
        </div>
        <div className="text-white/60 text-sm">
          Összesen: {pagination?.total || 0} bejegyzés
        </div>
      </div>

      <div className="bg-black/30 border border-[#ff5c1a]/30 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#ff5c1a]/20 border-b border-[#ff5c1a]/30">
                <th className="px-6 py-4 text-left text-white font-semibold">Időpont</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Felhasználó</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Típus</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Művelet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {logs.map((log: any, index: number) => {
                const { date, time } = formatDateTime(log.datetime);
                
                return (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-white/80">
                        <FiClock className="w-4 h-4 text-white/60" />
                        <div>
                          <div className="text-sm font-medium">{date}</div>
                          <div className="text-xs text-white/60">{time}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-white/80">
                        <FiUser className="w-4 h-4 text-white/60" />
                        <div>
                          <div className="text-sm font-medium">
                            {log.userNickname || log.userName || 'Ismeretlen'}
                          </div>
                          {log.userEmail && (
                            <div className="text-xs text-white/60">{log.userEmail}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getTypeIcon(log.type)}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(log.type)}`}>
                          {log.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-white/90">
                        <FiActivity className="w-4 h-4 text-white/60" />
                        <span className="text-sm">{log.operation}</span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-white/50 text-lg">Nincsenek log bejegyzések</div>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
            <div className="text-white/60 text-sm">
              {pagination.page} / {pagination.totalPages} oldal
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-black/40 border border-white/10 text-white hover:bg-black/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-white/80 text-sm">
                {page}
              </span>
              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page === pagination.totalPages}
                className="p-2 rounded-lg bg-black/40 border border-white/10 text-white hover:bg-black/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
