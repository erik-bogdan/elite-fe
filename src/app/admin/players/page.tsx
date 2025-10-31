"use client";

import { useMemo, useState, useEffect } from "react";
import { Bebas_Neue } from "next/font/google";
import { FiUser, FiUserPlus, FiChevronRight, FiMail } from "react-icons/fi";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Select from 'react-select';
import AddPlayerModal from "./components/AddPlayerModal";
import { useGetPlayersQuery, useGetTeamsQuery, useSendPlayerInviteMutation } from "@/lib/features/apiSlice";
import { useGetSeasonsQuery } from "@/lib/features/season/seasonSlice";
import { useGetChampionshipsQuery, useGetLeagueTeamsQuery } from "@/lib/features/championship/championshipSlice";
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
  const { data: championships } = useGetChampionshipsQuery();
  
  // Load filters from localStorage
  const [selectedSeason, setSelectedSeason] = useState<string | 'all'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-players-seasonId') || 'all';
    }
    return 'all';
  });
  const [leagueId, setLeagueId] = useState<string | ''>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-players-leagueId') || '';
    }
    return '';
  });
  const [teamId, setTeamId] = useState<string | ''>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-players-teamId') || '';
    }
    return '';
  });
  
  // Default to active season when available
  useEffect(() => {
    if (selectedSeason === 'all' && Array.isArray(seasons)) {
      const active = seasons.find(s => s.isActive);
      if (active) setSelectedSeason(String(active.id));
    }
  }, [seasons, selectedSeason]);
  
  // Save filters to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedSeason === 'all') {
        localStorage.removeItem('admin-players-seasonId');
      } else {
        localStorage.setItem('admin-players-seasonId', selectedSeason);
      }
    }
  }, [selectedSeason]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-players-leagueId', leagueId);
    }
  }, [leagueId]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-players-teamId', teamId);
    }
  }, [teamId]);
  
  // Build query params for players
  const playersQueryParams = useMemo(() => {
    const params: { seasonId?: string; leagueId?: string; teamId?: string } = {};
    if (selectedSeason !== 'all') params.seasonId = selectedSeason;
    if (leagueId) params.leagueId = leagueId;
    if (teamId) params.teamId = teamId;
    return Object.keys(params).length > 0 ? params : undefined;
  }, [selectedSeason, leagueId, teamId]);
  
  const { data: playersData } = useGetPlayersQuery(playersQueryParams);
  const { data: teamsData } = useGetTeamsQuery();
  const { data: leagueTeams } = useGetLeagueTeamsQuery(leagueId, { skip: !leagueId });
  const players = playersData || [];
  const [sendInvite, { isLoading: inviteLoading }] = useSendPlayerInviteMutation();
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const teamOptions = useMemo(() => (teamsData || []).map(t => ({ value: String(t.id), label: t.name })), [teamsData]);
  const teamIdToName = useMemo(() => {
    const map = new Map<string, string>();
    (teamsData || []).forEach(t => map.set(String(t.id), t.name));
    return map;
  }, [teamsData]);

  // Filter championships by selected season
  const leaguesForSeason = useMemo(() => {
    if (!seasons || !championships) return [] as any[];
    return (championships as any[]).filter((c) => String(c.seasonId) === String(selectedSeason));
  }, [seasons, championships, selectedSeason]);

  // Get teams for selected league
  const teamsForLeague = useMemo(() => {
    if (!leagueId || !leagueTeams) return [] as any[];
    return Array.isArray(leagueTeams) ? leagueTeams : [];
  }, [leagueId, leagueTeams]);

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      borderColor: 'rgba(255, 92, 26, 0.5)',
      boxShadow: 'none',
      '&:hover': { borderColor: 'rgba(255, 92, 26, 0.8)' },
      minWidth: 220,
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: '#001a3a',
      border: '1px solid rgba(255, 92, 26, 0.5)',
      zIndex: 40,
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? 'rgba(255, 92, 26, 0.2)' : 'transparent',
      color: 'white',
      '&:hover': { backgroundColor: 'rgba(255, 92, 26, 0.2)' },
    }),
    singleValue: (base: any) => ({ ...base, color: 'white' }),
    input: (base: any) => ({ ...base, color: 'white' }),
    placeholder: (base: any) => ({ ...base, color: 'rgba(255,255,255,0.7)' }),
  } as const;

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
              <p className="text-[#e0e6f7]">Összes Játékos</p>
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
              <p className="text-[#e0e6f7]">Aktív Játékos</p>
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
              <p className="text-[#e0e6f7]">Csapatok</p>
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-6 border-b border-[#ff5c1a]/20">
          <h2 className={`${bebasNeue.className} text-2xl text-white`}>Játékosok</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[220px]">
              <Select
                options={[{ value: 'all', label: 'Összes Szezon' }, ...(seasons || []).map(s => ({ value: String(s.id), label: s.name }))]}
                value={(() => {
                  if (selectedSeason === 'all') return { value: 'all', label: 'Összes Szezon' } as any;
                  const s = (seasons || []).find(ss => String(ss.id) === String(selectedSeason));
                  return { value: String(selectedSeason), label: s?.name || String(selectedSeason) } as any;
                })()}
                onChange={(opt: any) => { 
                  setSelectedSeason(opt?.value || 'all'); 
                  setLeagueId(''); 
                  setTeamId(''); 
                  setCurrentPage(1); 
                }}
                styles={selectStyles as any}
              />
            </div>
            <div className="min-w-[220px]">
              <Select
                isDisabled={selectedSeason === 'all'}
                options={[{ value: '', label: 'Összes Bajnokság' }, ...leaguesForSeason.map((l: any) => ({ value: String(l.id), label: l.name }))]}
                value={(() => {
                  if (!leagueId) return { value: '', label: 'Összes Bajnokság' } as any;
                  const l = leaguesForSeason.find((ll: any) => String(ll.id) === String(leagueId));
                  return { value: String(leagueId), label: l?.name || String(leagueId) } as any;
                })()}
                onChange={(opt: any) => { setLeagueId(opt?.value || ''); setTeamId(''); setCurrentPage(1); }}
                styles={selectStyles as any}
              />
            </div>
            <div className="min-w-[220px]">
              <Select
                isDisabled={!leagueId}
                options={[{ value: '', label: 'Összes Csapat' }, ...teamsForLeague.map((t: any) => ({ value: String(t.id), label: t.name || String(t.id) }))]}
                value={(() => {
                  if (!teamId) return { value: '', label: 'Összes Csapat' } as any;
                  const t = teamsForLeague.find((tt: any) => String(tt.id) === String(teamId));
                  return { value: String(teamId), label: t?.name || String(teamId) } as any;
                })()}
                onChange={(opt: any) => { setTeamId(opt?.value || ''); setCurrentPage(1); }}
                styles={selectStyles as any}
              />
            </div>
            <button
              onClick={openAddPlayerModal}
              className="flex items-center gap-2 px-4 py-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white rounded-lg transition-colors"
            >
              <FiUserPlus className="w-5 h-5" />
              Új Játékos
            </button>
          </div>
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
                        <>
                          {(invited.has(String(player.id)) || (player as any).invitation?.pending) && (
                            <span className="px-3 py-1 rounded bg-green-600/80 text-white text-sm">Meghívva</span>
                          )}
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await sendInvite({ id: String(player.id) }).unwrap();
                                setInvited(prev => new Set(prev).add(String(player.id)));
                                toast.success((invited.has(String(player.id)) || (player as any).invitation?.pending) ? "Meghívó újraküldve" : "Meghívó elküldve");
                              } catch {
                                toast.error("Nem sikerült a meghívó küldése");
                              }
                            }}
                            className="flex items-center gap-1 px-3 py-1 rounded bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white text-sm"
                            disabled={inviteLoading}
                            title={(invited.has(String(player.id)) || (player as any).invitation?.pending) ? "Meghívó újraküldése" : "Meghívó küldése"}
                          >
                            <FiMail className="w-4 h-4" /> {(invited.has(String(player.id)) || (player as any).invitation?.pending) ? 'Újraküldés' : 'Invite'}
                          </button>
                        </>
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