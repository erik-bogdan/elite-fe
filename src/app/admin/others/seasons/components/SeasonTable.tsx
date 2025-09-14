"use client";

import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { Season, useUpdateSeasonMutation } from "@/lib/features/season/seasonSlice";

interface SeasonTableProps {
  seasons: Season[];
  onEdit: (season: Season) => void;
  onDelete: (id: string) => void;
}

export function SeasonTable({ seasons, onEdit, onDelete }: SeasonTableProps) {
  const [updateSeason] = useUpdateSeasonMutation();
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-black/30">
            <th className="px-6 py-4 text-left text-[#e0e6f7]">Név</th>
            <th className="px-6 py-4 text-left text-[#e0e6f7]">Kezdés</th>
            <th className="px-6 py-4 text-left text-[#e0e6f7]">Befejezés</th>
            <th className="px-6 py-4 text-left text-[#e0e6f7]">Státusz</th>
            <th className="px-6 py-4 text-left text-[#e0e6f7]">Műveletek</th>
          </tr>
        </thead>
        <tbody>
          {seasons.map((season) => {
            const isActive = !!season.isActive;
            const isPast = season.endDate ? new Date(season.endDate) < new Date() : false;
            const isFuture = season.startDate ? new Date(season.startDate) > new Date() : false;

            return (
              <tr key={season.id} className="border-t border-[#ff5c1a]/20 hover:bg-black/20">
                <td className="px-6 py-4 text-white">{season.name}</td>
                <td className="px-6 py-4 text-white">{ season.startDate ? formatDate(season.startDate) : '-'}</td>
                <td className="px-6 py-4 text-white">{ season.endDate ? formatDate(season.endDate) : '-'}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={async () => { await updateSeason({ id: season.id, isActive: true }).unwrap(); }}
                    className={`px-3 py-1 rounded-full text-sm ${
                      isActive
                        ? "bg-green-500/20 text-green-400"
                        : "bg-[#ff5c1a]/20 text-[#ff5c1a] hover:bg-[#ff5c1a]/30"
                    }`}
                  >
                    {isActive ? "Aktív" : "Aktiválás"}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(season)}
                      className="p-2 text-[#ff5c1a] hover:text-[#ff7c3a] transition-colors"
                    >
                      <FiEdit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(season.id)}
                      className="p-2 text-red-500 hover:text-red-600 transition-colors"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
} 