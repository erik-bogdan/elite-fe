"use client";

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Bebas_Neue } from 'next/font/google';
import { motion } from 'framer-motion';
import { FiPlus, FiTrash2, FiEdit2, FiX, FiCheck } from 'react-icons/fi';
import Select from 'react-select';
import { useParams } from 'next/navigation';
import { useGetSeasonsQuery } from '@/lib/features/season/seasonSlice';
import { useGetChampionshipsQuery, useGetLeagueTeamsQuery } from '@/lib/features/championship/championshipSlice';
import { toast } from 'sonner';

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'] });

interface LiveMatchGroup {
  id: string;
  name: string;
  matchCount?: number;
}

export default function LiveMatchesPage() {
  const params = useParams();
  const championshipId = typeof params.id === 'string' ? params.id : null;

  const { data: seasons } = useGetSeasonsQuery();
  const { data: championships } = useGetChampionshipsQuery();
  const { data: leagueTeams } = useGetLeagueTeamsQuery(championshipId || '', { skip: !championshipId });

  // Filters
  const [seasonId, setSeasonId] = useState<string | ''>('');
  const [leagueId, setLeagueId] = useState<string | ''>(championshipId || '');
  const [round, setRound] = useState<number | ''>('');
  const [gameDay, setGameDay] = useState<number | ''>('');
  const [teamId, setTeamId] = useState<string | ''>('');

  // Matches data
  const [matches, setMatches] = useState<{ items: any[]; total: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableRounds, setAvailableRounds] = useState<number[]>([]);
  const [availableGameDays, setAvailableGameDays] = useState<number[]>([]);

  // Groups
  const [groups, setGroups] = useState<LiveMatchGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupMatches, setGroupMatches] = useState<any[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  // Modal for adding match to group
  const [addToGroupModal, setAddToGroupModal] = useState<{ open: boolean; matchId: string | null }>({ open: false, matchId: null });

  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555';

  // Set leagueId from championshipId on mount
  useEffect(() => {
    if (championshipId) {
      setLeagueId(championshipId);
    }
  }, [championshipId]);

  // Fetch matches
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!leagueId) {
        setMatches(null);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (seasonId) params.set('seasonId', String(seasonId));
        if (leagueId) params.set('leagueId', String(leagueId));
        if (typeof round === 'number') params.set('round', String(round));
        if (teamId) params.set('teamId', String(teamId));
        params.set('page', '1');
        params.set('pageSize', '1000'); // Large page size for live matches

        const url = `${backendBase}/api/matches?${params.toString()}`;
        const resp = await fetch(url, { credentials: 'include' });
        if (resp.ok) {
          const d = await resp.json();
          // Filter by gameDay on frontend (handling postponed data)
          let filteredItems = d.items || [];
          if (typeof gameDay === 'number') {
            filteredItems = filteredItems.filter((item: any) => {
              const match = item.match;
              const isDelayed = match.isDelayed || false;
              const effectiveGameDay = (typeof match.delayedGameDay === 'number' && !Number.isNaN(match.delayedGameDay))
                ? match.delayedGameDay
                : match.gameDay;
              return effectiveGameDay === gameDay;
            });
          }

          // Extract unique gameDays and rounds from matches
          const gameDaysSet = new Set<number>();
          const roundsSet = new Set<number>();
          (d.items || []).forEach((item: any) => {
            const match = item.match;
            const isDelayed = match.isDelayed || false;
            const effectiveGameDay = (typeof match.delayedGameDay === 'number' && !Number.isNaN(match.delayedGameDay))
              ? match.delayedGameDay
              : match.gameDay;
            const effectiveRound = (isDelayed && match.delayedRound)
              ? match.delayedRound
              : match.matchRound;

            if (effectiveGameDay && typeof effectiveGameDay === 'number') gameDaysSet.add(effectiveGameDay);
            if (effectiveRound && typeof effectiveRound === 'number') roundsSet.add(effectiveRound);
          });

          setAvailableGameDays(Array.from(gameDaysSet).sort((a, b) => a - b));
          setAvailableRounds(Array.from(roundsSet).sort((a, b) => a - b));

          if (mounted) {
            setMatches({
              items: filteredItems,
              total: filteredItems.length
            });
          }
        } else {
          if (mounted) setMatches({ items: [], total: 0 });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [seasonId, leagueId, round, gameDay, teamId, backendBase]);

  // Fetch available rounds
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!leagueId) { setAvailableRounds([]); return; }
      try {
        const url = `${backendBase}/api/matches/league/${leagueId}/rounds`;
        const resp = await fetch(url, { credentials: 'include' });
        if (resp.ok) {
          const d = await resp.json();
          const list = Array.isArray(d?.rounds) ? d.rounds : [];
          if (mounted) setAvailableRounds(list);
        } else {
          if (mounted) setAvailableRounds([]);
        }
      } catch {
        if (mounted) setAvailableRounds([]);
      }
    })();
    return () => { mounted = false };
  }, [leagueId, backendBase]);

  // Fetch groups
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const url = `${backendBase}/api/live-matches/groups`;
        const resp = await fetch(url, { credentials: 'include' });
        if (resp.ok) {
          const d = await resp.json();
          if (mounted) setGroups(d || []);
        } else {
          if (mounted) setGroups([]);
        }
      } catch {
        if (mounted) setGroups([]);
      }
    })();
    return () => { mounted = false };
  }, [backendBase]);

  // Fetch group matches when group is selected
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedGroupId) {
        setGroupMatches([]);
        return;
      }
      try {
        const url = `${backendBase}/api/live-matches/groups/${selectedGroupId}`;
        const resp = await fetch(url, { credentials: 'include' });
        if (resp.ok) {
          const d = await resp.json();
          if (mounted) setGroupMatches(d.matches || []);
        } else {
          if (mounted) setGroupMatches([]);
        }
      } catch {
        if (mounted) setGroupMatches([]);
      }
    })();
    return () => { mounted = false };
  }, [selectedGroupId, backendBase]);

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      borderColor: 'rgba(255, 92, 26, 0.5)',
      boxShadow: 'none',
      '&:hover': { borderColor: 'rgba(255, 92, 26, 0.8)' },
      minWidth: 180,
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

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Adj meg egy nevet a csoportnak');
      return;
    }
    try {
      const url = `${backendBase}/api/live-matches/groups`;
      const resp = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName.trim() })
      });
      if (resp.ok) {
        const newGroup = await resp.json();
        setGroups([...groups, { ...newGroup, matchCount: 0 }]);
        setNewGroupName('');
        setIsCreatingGroup(false);
        toast.success('Csoport létrehozva');
      } else {
        toast.error('Nem sikerült létrehozni a csoportot');
      }
    } catch {
      toast.error('Hiba történt');
    }
  };

  const handleUpdateGroup = async (groupId: string) => {
    if (!editingGroupName.trim()) {
      toast.error('Adj meg egy nevet');
      return;
    }
    try {
      const url = `${backendBase}/api/live-matches/groups/${groupId}`;
      const resp = await fetch(url, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingGroupName.trim() })
      });
      if (resp.ok) {
        setGroups(groups.map(g => g.id === groupId ? { ...g, name: editingGroupName.trim() } : g));
        setEditingGroupId(null);
        setEditingGroupName('');
        toast.success('Csoport frissítve');
      } else {
        toast.error('Nem sikerült frissíteni a csoportot');
      }
    } catch {
      toast.error('Hiba történt');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Biztosan törölni szeretnéd ezt a csoportot?')) return;
    try {
      const url = `${backendBase}/api/live-matches/groups/${groupId}`;
      const resp = await fetch(url, { method: 'DELETE', credentials: 'include' });
      if (resp.ok) {
        setGroups(groups.filter(g => g.id !== groupId));
        if (selectedGroupId === groupId) setSelectedGroupId(null);
        toast.success('Csoport törölve');
      } else {
        toast.error('Nem sikerült törölni a csoportot');
      }
    } catch {
      toast.error('Hiba történt');
    }
  };

  const handleAddMatchToGroup = async (groupId: string, matchId: string) => {
    try {
      const url = `${backendBase}/api/live-matches/groups/${groupId}/matches`;
      const resp = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId })
      });
      if (resp.ok) {
        if (selectedGroupId === groupId) {
          // Refresh group matches
          const groupUrl = `${backendBase}/api/live-matches/groups/${groupId}`;
          const groupResp = await fetch(groupUrl, { credentials: 'include' });
          if (groupResp.ok) {
            const d = await groupResp.json();
            setGroupMatches(d.matches || []);
          }
        }
        // Update group count
        setGroups(groups.map(g => g.id === groupId ? { ...g, matchCount: (g.matchCount || 0) + 1 } : g));
        toast.success('Meccs hozzáadva a csoporthoz');
        setAddToGroupModal({ open: false, matchId: null });
      } else {
        const err = await resp.json();
        toast.error(err.message || 'Nem sikerült hozzáadni a meccset');
      }
    } catch {
      toast.error('Hiba történt');
    }
  };

  const handleRemoveMatchFromGroup = async (matchId: string) => {
    if (!selectedGroupId) return;
    try {
      const url = `${backendBase}/api/live-matches/groups/${selectedGroupId}/matches/${matchId}`;
      const resp = await fetch(url, { method: 'DELETE', credentials: 'include' });
      if (resp.ok) {
        setGroupMatches(groupMatches.filter(m => m.match.id !== matchId));
        setGroups(groups.map(g => g.id === selectedGroupId ? { ...g, matchCount: Math.max(0, (g.matchCount || 0) - 1) } : g));
        toast.success('Meccs eltávolítva a csoportból');
      } else {
        toast.error('Nem sikerült eltávolítani a meccset');
      }
    } catch {
      toast.error('Hiba történt');
    }
  };

  const getEffectiveGameDay = (match: any) => {
    const isDelayed = match.isDelayed || false;
    return (typeof match.delayedGameDay === 'number' && !Number.isNaN(match.delayedGameDay))
      ? match.delayedGameDay
      : match.gameDay;
  };

  const getEffectiveDate = (match: any) => {
    const isDelayed = match.isDelayed || false;
    if (isDelayed && match.delayedDate) {
      return new Date(match.delayedDate).toISOString();
    }
    return match.matchAt ? new Date(match.matchAt).toISOString() : null;
  };

  const getEffectiveTime = (match: any) => {
    const isDelayed = match.isDelayed || false;
    if (isDelayed && match.delayedTime) {
      return new Date(match.delayedTime).toISOString();
    }
    return match.matchAt ? new Date(match.matchAt).toISOString() : null;
  };

  const getEffectiveTable = (match: any) => {
    const isDelayed = match.isDelayed || false;
    return (isDelayed && match.delayedTable) ? match.delayedTable : match.matchTable;
  };

  const getEffectiveRound = (match: any) => {
    const isDelayed = match.isDelayed || false;
    return (isDelayed && match.delayedRound) ? match.delayedRound : match.matchRound;
  };

  if (!championshipId) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <p className="text-white">Bajnokság ID szükséges</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="flex gap-6">
        {/* Left sidebar - Groups */}
        <div className="w-96 flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-xl overflow-hidden border border-[#ff5c1a]/40"
          >
            <div className="p-6 border-b border-[#ff5c1a]/20">
              <h2 className={`${bebasNeue.className} text-2xl text-white mb-4`}>Csoportok</h2>
              {!isCreatingGroup ? (
                <button
                  onClick={() => setIsCreatingGroup(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white rounded-lg transition-colors"
                >
                  <FiPlus className="w-5 h-5" />
                  Új csoport
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Csoport neve"
                    className="flex-1 px-3 py-2 bg-black/40 border border-[#ff5c1a]/30 rounded text-white placeholder-gray-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateGroup();
                      if (e.key === 'Escape') {
                        setIsCreatingGroup(false);
                        setNewGroupName('');
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleCreateGroup}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                  >
                    <FiCheck className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingGroup(false);
                      setNewGroupName('');
                    }}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
              {groups.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Nincs csoport</p>
              ) : (
                groups.map((group) => (
                  <div
                    key={group.id}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedGroupId === group.id
                        ? 'bg-[#ff5c1a]/20 border-[#ff5c1a]'
                        : 'bg-black/20 border-[#ff5c1a]/30 hover:bg-black/30'
                    }`}
                    onClick={() => setSelectedGroupId(group.id)}
                  >
                    {editingGroupId === group.id ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={editingGroupName}
                          onChange={(e) => setEditingGroupName(e.target.value)}
                          className="flex-1 px-2 py-1 bg-black/40 border border-[#ff5c1a]/30 rounded text-white text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateGroup(group.id);
                            if (e.key === 'Escape') {
                              setEditingGroupId(null);
                              setEditingGroupName('');
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateGroup(group.id)}
                          className="p-1 text-green-400 hover:text-green-300"
                        >
                          <FiCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingGroupId(null);
                            setEditingGroupName('');
                          }}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-white font-semibold">{group.name}</p>
                          <p className="text-gray-400 text-sm">{group.matchCount || 0} meccs</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingGroupId(group.id);
                              setEditingGroupName(group.name);
                            }}
                            className="p-1 text-[#ff5c1a] hover:text-[#ff7c3a]"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGroup(group.id);
                            }}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Selected group matches */}
            {selectedGroupId && (
              <div className="p-4 border-t border-[#ff5c1a]/20">
                <h3 className={`${bebasNeue.className} text-lg text-white mb-3`}>
                  Csoport meccsek ({groupMatches.length})
                </h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {groupMatches.map((item: any) => {
                    const match = item.match;
                    const home = item.homeTeam;
                    const away = item.awayTeam;
                    const effectiveDate = getEffectiveDate(match);
                    const effectiveTime = getEffectiveTime(match);
                    return (
                      <div
                        key={match.id}
                        className="p-2 bg-black/30 rounded border border-[#ff5c1a]/20 flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">
                            {home?.name || 'Hazai'} vs {away?.name || 'Vendég'}
                          </p>
                          {effectiveDate && (
                            <p className="text-gray-400 text-xs">
                              {new Date(effectiveDate).toLocaleDateString('hu-HU')}{' '}
                              {effectiveTime && new Date(effectiveTime).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveMatchFromGroup(match.id)}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                  {groupMatches.length === 0 && (
                    <p className="text-gray-400 text-center py-4 text-sm">Nincs meccs a csoportban</p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right side - Matches */}
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-xl overflow-hidden border border-[#ff5c1a]/40"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-6 border-b border-[#ff5c1a]/20">
              <h2 className={`${bebasNeue.className} text-2xl text-white`}>Meccsek</h2>
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-[180px]">
                  <Select
                    options={[{ value: '', label: 'Összes Szezon' }, ...(seasons || []).map(s => ({ value: String(s.id), label: s.name }))]}
                    value={(() => {
                      if (!seasonId) return { value: '', label: 'Összes Szezon' };
                      const s = (seasons || []).find(ss => String(ss.id) === String(seasonId));
                      return { value: String(seasonId), label: s?.name || String(seasonId) } as any;
                    })()}
                    onChange={(opt: any) => {
                      setSeasonId(opt?.value || '');
                      setRound('');
                      setGameDay('');
                      setTeamId('');
                    }}
                    styles={selectStyles as any}
                  />
                </div>
                <div className="min-w-[160px]">
                  <Select
                    isDisabled={!seasonId}
                    options={[{ value: '', label: 'Összes Forduló' }, ...availableRounds.map((r) => ({ value: String(r), label: `Forduló ${r}` }))]}
                    value={(() => {
                      if (!round) return { value: '', label: 'Összes Forduló' } as any;
                      return { value: String(round), label: `Forduló ${round}` } as any;
                    })()}
                    onChange={(opt: any) => {
                      const v = opt?.value;
                      setRound(v ? Number(v) : '');
                    }}
                    styles={selectStyles as any}
                  />
                </div>
                <div className="min-w-[160px]">
                  <Select
                    isDisabled={!seasonId}
                    options={[{ value: '', label: 'Összes Játéknap' }, ...availableGameDays.map((gd) => ({ value: String(gd), label: `Játéknap ${gd}` }))]}
                    value={(() => {
                      if (!gameDay) return { value: '', label: 'Összes Játéknap' } as any;
                      return { value: String(gameDay), label: `Játéknap ${gameDay}` } as any;
                    })()}
                    onChange={(opt: any) => {
                      const v = opt?.value;
                      setGameDay(v ? Number(v) : '');
                    }}
                    styles={selectStyles as any}
                  />
                </div>
                <div className="min-w-[180px]">
                  <Select
                    isDisabled={!seasonId}
                    options={[{ value: '', label: 'Összes Csapat' }, ...(leagueTeams || []).map((t: any) => ({ value: String(t.id), label: t.name || String(t.id) }))]}
                    value={(() => {
                      if (!teamId) return { value: '', label: 'Összes Csapat' } as any;
                      const t = (leagueTeams || []).find((tt: any) => String(tt.id) === String(teamId));
                      return { value: String(teamId), label: t?.name || String(teamId) } as any;
                    })()}
                    onChange={(opt: any) => {
                      setTeamId(opt?.value || '');
                    }}
                    styles={selectStyles as any}
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-black/30">
                    <th className="px-6 py-4 text-left text-[#e0e6f7]">Hazai csapat</th>
                    <th className="px-6 py-4 text-left text-[#e0e6f7]">Vendég csapat</th>
                    <th className="px-6 py-4 text-left text-[#e0e6f7]">Dátum</th>
                    <th className="px-6 py-4 text-left text-[#e0e6f7]">Idő</th>
                    <th className="px-6 py-4 text-left text-[#e0e6f7]">Forduló</th>
                    <th className="px-6 py-4 text-left text-[#e0e6f7]">Játéknap</th>
                    <th className="px-6 py-4 text-left text-[#e0e6f7]">Asztal</th>
                    <th className="px-6 py-4 text-left text-[#e0e6f7]">Műveletek</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="px-6 py-6 text-white">Betöltés...</td></tr>
                  ) : !matches || matches.items.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-6 text-white">Nincs találat</td></tr>
                  ) : (
                    matches.items.map((row: any) => {
                      const match = row.match;
                      const home = row.homeTeam;
                      const away = row.awayTeam;
                      const effectiveDate = getEffectiveDate(match);
                      const effectiveTime = getEffectiveTime(match);
                      const effectiveGameDay = getEffectiveGameDay(match);
                      const effectiveRound = getEffectiveRound(match);
                      const effectiveTable = getEffectiveTable(match);
                      const isDelayed = match.isDelayed || false;
                      const homeLogo = home?.logo ? (home.logo.startsWith('http') ? home.logo : `${backendBase}${home.logo}`) : '/elitelogo.png';
                      const awayLogo = away?.logo ? (away.logo.startsWith('http') ? away.logo : `${backendBase}${away.logo}`) : '/elitelogo.png';

                      return (
                        <tr
                          key={match.id}
                          className="border-t border-[#ff5c1a]/20 hover:bg-black/20"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Image src={homeLogo} alt={home?.name || 'Hazai'} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                              <span className="text-white">{home?.name || '-'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Image src={awayLogo} alt={away?.name || 'Vendég'} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                              <span className="text-white">{away?.name || '-'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-white">
                            {effectiveDate ? new Date(effectiveDate).toLocaleDateString('hu-HU', { timeZone: 'UTC' }) : '-'}
                          </td>
                          <td className="px-6 py-4 text-white">
                            {effectiveTime ? new Date(effectiveTime).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '-'}
                          </td>
                          <td className="px-6 py-4 text-white">
                            {isDelayed && match.delayedRound ? (
                              <span className="text-orange-400" title="Halasztott">
                                <span style={{ textDecoration: 'line-through' }}>{match.matchRound}</span> → {match.delayedRound}
                              </span>
                            ) : (
                              effectiveRound ?? '-'
                            )}
                          </td>
                          <td className="px-6 py-4 text-white">
                            {isDelayed && match.delayedGameDay ? (
                              <span className="text-orange-400" title="Halasztott">
                                <span style={{ textDecoration: 'line-through' }}>{match.gameDay}</span> → {match.delayedGameDay}
                              </span>
                            ) : (
                              effectiveGameDay ?? '-'
                            )}
                          </td>
                          <td className="px-6 py-4 text-white">
                            {isDelayed && match.delayedTable ? (
                              <span className="text-orange-400" title="Halasztott">
                                <span style={{ textDecoration: 'line-through' }}>{match.matchTable}</span> → {match.delayedTable}
                              </span>
                            ) : (
                              effectiveTable ?? '-'
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setAddToGroupModal({ open: true, matchId: match.id })}
                              className="p-2 text-[#ff5c1a] hover:text-[#ff7c3a] transition-colors"
                              title="Hozzáadás csoporthoz"
                            >
                              <FiPlus className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {matches && matches.total > 0 && (
              <div className="p-4 border-t border-[#ff5c1a]/20">
                <div className="text-white">Összesen: {matches.total} meccs</div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Add to Group Modal */}
      {addToGroupModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setAddToGroupModal({ open: false, matchId: null })}>
          <div
            className="bg-gradient-to-br from-[#001a3a]/95 to-[#002b6b]/95 rounded-xl p-6 border border-[#ff5c1a]/40 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`${bebasNeue.className} text-xl text-white mb-4`}>Meccs hozzáadása csoporthoz</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {groups.length === 0 ? (
                <p className="text-gray-400 text-center py-4">Nincs elérhető csoport</p>
              ) : (
                groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => addToGroupModal.matchId && handleAddMatchToGroup(group.id, addToGroupModal.matchId)}
                    className="w-full p-3 text-left bg-black/30 hover:bg-black/50 border border-[#ff5c1a]/30 rounded-lg transition-colors"
                  >
                    <p className="text-white font-semibold">{group.name}</p>
                    <p className="text-gray-400 text-sm">{group.matchCount || 0} meccs</p>
                  </button>
                ))
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setAddToGroupModal({ open: false, matchId: null })}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                Mégse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

