"use client";

import { useMemo, useState, useEffect } from "react";
import { Bebas_Neue } from "next/font/google";
import { FiUser, FiUserPlus, FiChevronRight, FiMail } from "react-icons/fi";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import AddPlayerModal from "./components/AddPlayerModal";
import { useGetPlayersQuery, useGetTeamsQuery, useSendPlayerInviteMutation } from "@/lib/features/apiSlice";
import { useGetSeasonsQuery } from "@/lib/features/season/seasonSlice";
import { useModal } from "@/hooks/modalHook";
import { toast } from "sonner";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});


// A csapatválasztó valós adatokból

export default function PlayersPage() {
  const router = useRouter();
  const { isOpen: isAddPlayerModalOpen, open: openAddPlayerModal, close: closeAddPlayerModal } = useModal();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const { data: seasons } = useGetSeasonsQuery();
  const [selectedSeason, setSelectedSeason] = useState<string | 'all'>('all');
  // Default to active season when available
  useEffect(() => {
    if (selectedSeason === 'all' && Array.isArray(seasons)) {
      const active = seasons.find(s => s.isActive);
      if (active) setSelectedSeason(String(active.id));
    }
  }, [seasons, selectedSeason]);
  const { data: playersData } = useGetPlayersQuery(selectedSeason === 'all' ? undefined : { seasonId: selectedSeason });
  const { data: teamsData } = useGetTeamsQuery();
  const players = playersData || [];
  const [sendInvite, { isLoading: inviteLoading }] = useSendPlayerInviteMutation();
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const teamOptions = useMemo(() => (teamsData || []).map(t => ({ value: String(t.id), label: t.name })), [teamsData]);
  const teamIdToName = useMemo(() => {
    const map = new Map<string, string>();
    (teamsData || []).forEach(t => map.set(String(t.id), t.name));
    return map;
  }, [teamsData]);

  const handlePlayerClick = (playerId: string) => {
    router.push(`/admin/players/${playerId}`);
  };

  const paginatedPlayers = players.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="min-h-screen p-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-xl p-6 border border-[#ff5c1a]/40"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#ff5c1a]/20 flex items-center justify-center">
              <FiUser className="w-6 h-6 text-[#ff5c1a]" />
            </div>
            <div>
              <p className="text-[#e0e6f7]">Total Players</p>
              <p className={`${bebasNeue.className} text-3xl text-white`}>{players.length}</p>
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
              <FiUser className="w-6 h-6 text-[#ff5c1a]" />
            </div>
            <div>
              <p className="text-[#e0e6f7]">Active Players</p>
              <p className={`${bebasNeue.className} text-3xl text-white`}>
                {players.filter((player: any) => player.status === "active").length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-xl p-6 border border-[#ff5c1a]/40"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#ff5c1a]/20 flex items-center justify-center">
              <FiUser className="w-6 h-6 text-[#ff5c1a]" />
            </div>
            <div>
              <p className="text-[#e0e6f7]">Teams</p>
              <p className={`${bebasNeue.className} text-3xl text-white`}>
                {new Set(players.map((p: any) => p.teamId).filter(Boolean)).size}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Players Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-xl overflow-hidden border border-[#ff5c1a]/40"
      >
        <div className="flex justify-between items-center p-6 border-b border-[#ff5c1a]/20">
          <h2 className={`${bebasNeue.className} text-2xl text-white`}>Játékosok</h2>
          <div className="flex items-center gap-3">
            <label className="text-[#e0e6f7]">Szezon:</label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value as any)}
              className="bg-black/60 border-2 border-[#ff5c1a] text-white rounded-lg px-3 py-2"
            >
              <option value="all">Összes</option>
              {(seasons || []).map((s) => (
                <option key={s.id} value={String(s.id)}>{s.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={openAddPlayerModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white rounded-lg transition-colors"
          >
            <FiUserPlus className="w-5 h-5" />
            Új Játékos
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-black/30">
                <th className="px-6 py-4 text-left text-[#e0e6f7]">Játékos</th>
                <th className="px-6 py-4 text-left text-[#e0e6f7]">Becenév</th>
                <th className="px-6 py-4 text-left text-[#e0e6f7]">Email</th>
                <th className="px-6 py-4 text-left text-[#e0e6f7]">Csapat</th>
                <th className="px-6 py-4 text-left text-[#e0e6f7]">Státusz</th>
                <th className="px-6 py-4 text-left text-[#e0e6f7]">Felhasználó</th>
                <th className="px-6 py-4 text-left text-[#e0e6f7]">Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPlayers.map((player) => (
                <tr
                  key={player.id}
                  className="border-t border-[#ff5c1a]/20 hover:bg-black/20 cursor-pointer"
                  onClick={() => handlePlayerClick(player.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <Image
                          src={(player as any).image || `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/uploads/player-images/default.png`}
                          alt={`${(player as any).firstName ?? ''} ${(player as any).lastName ?? ''}`.trim() || 'Player'}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <span className="text-white">{`${player.firstName} ${player.lastName}`}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white">{player.nickname}</td>
                  <td className="px-6 py-4 text-white">{player.email}</td>
                  <td className="px-6 py-4 text-white">{teamIdToName.get(String((player as any).teamId)) || '-'}</td>
                  <td className="px-6 py-4 text-white">-</td>
                  <td className="px-6 py-4 text-white">{(player as any).userId ? 'Van' : 'Nincs'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {!(player as any).userId && (player as any).email && (
                        (invited.has(String(player.id)) || (player as any).invitation?.pending) ? (
                          <span className="px-3 py-1 rounded bg-green-600/80 text-white text-sm">Meghívva</span>
                        ) : (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await sendInvite({ id: String(player.id) }).unwrap();
                                setInvited(prev => new Set(prev).add(String(player.id)));
                                toast.success("Meghívó elküldve");
                              } catch {
                                toast.error("Nem sikerült a meghívó küldése");
                              }
                            }}
                            className="flex items-center gap-1 px-3 py-1 rounded bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white text-sm"
                            disabled={inviteLoading}
                            title="Meghívó küldése"
                          >
                            <FiMail className="w-4 h-4" /> Invite
                          </button>
                        )
                      )}
                      <FiChevronRight className="w-5 h-5 text-[#ff5c1a]" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-[#ff5c1a]/20">
          <div className="text-[#e0e6f7]">
            Megjelenítve {Math.min((currentPage - 1) * pageSize + 1, players.length)} - {" "}
            {Math.min(currentPage * pageSize, players.length)} of {players.length} players
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-black/30 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/40 transition-colors"
            >
              Előző
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(players.length / pageSize)))}
              disabled={currentPage === Math.ceil(players.length / pageSize)}
              className="px-4 py-2 rounded-lg bg-black/30 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/40 transition-colors"
            >
              Következő
            </button>
          </div>
        </div>
      </motion.div>

      <AddPlayerModal 
        isOpen={isAddPlayerModalOpen} 
        onClose={closeAddPlayerModal} 
        teamOptions={teamOptions}
        allowExisting={false}
      />
    </div>
  );
} 