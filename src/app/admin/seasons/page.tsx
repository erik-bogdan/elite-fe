"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bebas_Neue } from "next/font/google";
import { FiPlus, FiEdit2, FiTrash2, FiCalendar } from "react-icons/fi";
import { useGetSeasonsQuery, useCreateSeasonMutation, useDeleteSeasonMutation, useUpdateSeasonMutation } from "@/lib/features/season/seasonSlice";
import { toast } from "sonner";
import Select from "react-select";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

export default function SeasonsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<{
    id: string;
    name: string;
    startDate?: string | null;
    endDate?: string | null;
  } | null>(null);
  const { data: seasons, isLoading, error } = useGetSeasonsQuery();
  const [createSeason] = useCreateSeasonMutation();
  const [deleteSeason] = useDeleteSeasonMutation();
  const [updateSeason] = useUpdateSeasonMutation();

  const handleCreateSeason = async (formData: FormData) => {
    try {
      const data = {
        name: formData.get('name') as string,
        startDate: formData.get('startDate') as string,
        endDate: formData.get('endDate') as string,
      };

      await createSeason(data).unwrap();
      toast.success('Szezon sikeresen létrehozva!');
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Hiba történt a szezon létrehozásakor!');
    }
  };

  const handleDeleteSeason = async (id: string) => {
    try {
      await deleteSeason(id).unwrap();
      toast.success('Szezon sikeresen törölve!');
    } catch (error) {
      toast.error('Hiba történt a szezon törlésekor!');
    }
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
      <div className="flex justify-between items-center mb-8">
        <h1 className={`${bebasNeue.className} text-4xl text-white`}>SZEZONOK</h1>
        <button
          onClick={() => { setSelectedSeason(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white rounded-lg transition-colors"
        >
          <FiPlus className="w-5 h-5" />
          Új Szezon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {seasons?.map((season) => (
          <motion.div
            key={season.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-xl p-6 border border-[#ff5c1a]/40"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#ff5c1a]/20 flex items-center justify-center">
                <FiCalendar className="w-6 h-6 text-[#ff5c1a]" />
              </div>
              <div>
                <h3 className={`${bebasNeue.className} text-2xl text-white`}>{season.name}</h3>
                {season.startDate && season.endDate ? (
                  <p className="text-[#e0e6f7]">
                    {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
                  </p>
                ) : (
                  <p className="text-[#e0e6f7]">-</p>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <button
                onClick={async () => {
                  try {
                    await updateSeason({ id: season.id, isActive: true }).unwrap();
                  } catch (e) {}
                }}
                className={`px-3 py-1 rounded-full text-sm ${
                  season.isActive
                    ? "bg-green-500/20 text-green-400"
                    : "bg-[#ff5c1a]/20 text-[#ff5c1a] hover:bg-[#ff5c1a]/30"
                }`}
              >
                {season.isActive ? "Aktív" : "Aktiválás"}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedSeason({
                      id: season.id,
                      name: season.name,
                      startDate: season.startDate ?? undefined,
                      endDate: season.endDate ?? undefined,
                    });
                    setIsModalOpen(true);
                  }}
                  className="p-2 text-[#ff5c1a] hover:text-[#ff7c3a] transition-colors"
                >
                  <FiEdit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteSeason(season.id)}
                  className="p-2 text-red-500 hover:text-red-600 transition-colors"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create/Edit Season Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#001a3a] rounded-2xl p-8 w-full max-w-md border-2 border-[#ff5c1a]">
            <h2 className={`${bebasNeue.className} text-2xl text-white mb-6`}>{selectedSeason ? 'Szezon szerkesztése' : 'Új szezon'}</h2>
            <form key={selectedSeason?.id || 'new-season'} onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const id = fd.get('id') as string | null;
              const payload = {
                name: fd.get('name') as string,
                startDate: (fd.get('startDate') as string) || undefined,
                endDate: (fd.get('endDate') as string) || undefined,
              };
              if (id) {
                updateSeason({ id, ...payload })
                  .unwrap()
                  .then(() => {
                    toast.success('Szezon frissítve');
                    setIsModalOpen(false);
                    setSelectedSeason(null);
                  })
                  .catch(() => toast.error('Hiba a szezon frissítésekor'));
              } else {
                handleCreateSeason(new FormData(e.currentTarget));
              }
            }}>
              <div className="space-y-4">
                <input type="hidden" name="id" defaultValue={selectedSeason?.id || ''} />
                <div>
                  <label className="block text-white mb-2">Név</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={selectedSeason?.name || ''}
                    className="w-full px-4 py-2 bg-black/40 border-2 border-[#ff5c1a]/50 rounded-lg text-white focus:border-[#ff5c1a] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Kezdő dátum</label>
                  <input
                    type="date"
                    name="startDate"
                    defaultValue={selectedSeason?.startDate ? String(selectedSeason.startDate).slice(0,10) : ''}
                    className="w-full px-4 py-2 bg-black/40 border-2 border-[#ff5c1a]/50 rounded-lg text-white focus:border-[#ff5c1a] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Záró dátum</label>
                  <input
                    type="date"
                    name="endDate"
                    defaultValue={selectedSeason?.endDate ? String(selectedSeason.endDate).slice(0,10) : ''}
                    className="w-full px-4 py-2 bg-black/40 border-2 border-[#ff5c1a]/50 rounded-lg text-white focus:border-[#ff5c1a] focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setSelectedSeason(null); }}
                  className="px-4 py-2 text-white hover:text-[#ff5c1a] transition-colors"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white rounded-lg transition-colors"
                >
                  {selectedSeason ? 'Mentés' : 'Létrehozás'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 