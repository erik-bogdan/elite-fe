"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bebas_Neue } from "next/font/google";
import { FiPlus, FiCalendar } from "react-icons/fi";
import { useGetSeasonsQuery, useCreateSeasonMutation, useDeleteSeasonMutation } from "@/lib/features/season/seasonSlice";
import { toast } from "sonner";
import SeasonModal from "./components/SeasonModal";
import { SeasonTable } from "./components/SeasonTable";
import { Season } from "@/lib/features/season/seasonSlice";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

export default function SeasonsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: seasons, isLoading, error } = useGetSeasonsQuery();
  const [createSeason] = useCreateSeasonMutation();
  const [deleteSeason] = useDeleteSeasonMutation();
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);

  const handleCreateSeason = async (data: { name: string; startDate: string; endDate: string }) => {
    try {
      await createSeason(data).unwrap();
      toast.success('Szezon sikeresen létrehozva!');
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Hiba történt a szezon létrehozásakor!');
    }
  };

  const handleDeleteSeason = async (id: string) => {
    if (window.confirm('Biztosan törölni szeretnéd ezt a szezont?')) {
      try {
        await deleteSeason(id).unwrap();
        toast.success('Szezon sikeresen törölve!');
      } catch (error) {
        toast.error('Hiba történt a szezon törlésekor!');
      }
    }
  };

  const handleEditSeason = (season: Season) => {
    setEditingSeason(season);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#ff5c1a]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Hiba történt az adatok betöltésekor!</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-xl p-6 border border-[#ff5c1a]/40"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#ff5c1a]/20 flex items-center justify-center">
              <FiCalendar className="w-6 h-6 text-[#ff5c1a]" />
            </div>
            <div>
              <p className="text-[#e0e6f7]">Total Seasons</p>
              <p className={`${bebasNeue.className} text-3xl text-white`}>{seasons?.length || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-xl p-6 border border-[#ff5c1a]/40"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#ff5c1a]/20 flex items-center justify-center">
              <FiCalendar className="w-6 h-6 text-[#ff5c1a]" />
            </div>
            <div>
              <p className="text-[#e0e6f7]">Active Seasons</p>
              <p className={`${bebasNeue.className} text-3xl text-white`}>
                {seasons?.filter(s => s.startDate && s.endDate && new Date(s.startDate) <= new Date() && new Date(s.endDate) >= new Date()).length || 0}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Seasons Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-xl overflow-hidden border border-[#ff5c1a]/40"
      >
        <div className="flex justify-between items-center p-6 border-b border-[#ff5c1a]/20">
          <h2 className={`${bebasNeue.className} text-2xl text-white`}>Szezonok</h2>
          <button
            onClick={() => { setEditingSeason(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white rounded-lg transition-colors"
          >
            <FiPlus className="w-5 h-5" />
            Új Szezon
          </button>
        </div>

        <SeasonTable
          seasons={seasons || []}
          onEdit={handleEditSeason}
          onDelete={handleDeleteSeason}
        />
      </motion.div>

      {isModalOpen && (
        <SeasonModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingSeason(null); }}
          onSubmit={handleCreateSeason}
          season={editingSeason}
        />
      )}
    </div>
  );
} 