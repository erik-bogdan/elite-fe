"use client";

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Bebas_Neue } from 'next/font/google';
import { motion } from 'framer-motion';
import { FiPlus, FiTrash2, FiEdit2, FiX, FiCheck, FiPlay, FiEdit, FiImage } from 'react-icons/fi';
import Select from 'react-select';
import { useGetSeasonsQuery } from '@/lib/features/season/seasonSlice';
import { useGetChampionshipsQuery } from '@/lib/features/championship/championshipSlice';
import { toast } from 'sonner';
import { getOrCreateAnonymousUserId } from '@/lib/utils/cookie-utils';

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'] });

interface LiveMatchGroup {
  id: string;
  name: string;
  active?: boolean;
  matchCount?: number;
}

export default function LiveMatchesPage() {
  const { data: seasons } = useGetSeasonsQuery();
  const { data: championships } = useGetChampionshipsQuery();

  // Filters
  const [seasonId, setSeasonId] = useState<string | ''>('');
  const [leagueId, setLeagueId] = useState<string | ''>('');
  const [round, setRound] = useState<number | ''>('');
  const [gameDay, setGameDay] = useState<number | ''>('');
  const [teamId, setTeamId] = useState<string | ''>('');
  
  // Pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  // Matches data
  const [matches, setMatches] = useState<{ items: any[]; total: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableRounds, setAvailableRounds] = useState<number[]>([]);
  const [availableGameDays, setAvailableGameDays] = useState<number[]>([]);
  const [availableTeams, setAvailableTeams] = useState<any[]>([]);

  // Filter championships by selected season
  const leaguesForSeason = useMemo(() => {
    if (!seasons || !championships) return [] as any[];
    return (championships as any[]).filter((c) => !seasonId || String(c.seasonId) === String(seasonId));
  }, [seasons, championships, seasonId]);

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
  const [groupsWithMatch, setGroupsWithMatch] = useState<Set<string>>(new Set());
  
  // Modal for poll management
  const [pollModal, setPollModal] = useState<{ open: boolean; groupMatchId: string | null }>({ open: false, groupMatchId: null });
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['']);
  const [currentPoll, setCurrentPoll] = useState<any>(null);
  const [matchPolls, setMatchPolls] = useState<Map<string, boolean>>(new Map()); // Track which matches have polls

  // Image generation
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555';


  // Fetch matches
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (seasonId) params.set('seasonId', String(seasonId));
        if (leagueId) params.set('leagueId', String(leagueId));
        if (typeof round === 'number') params.set('round', String(round));
        if (typeof gameDay === 'number') params.set('gameDay', String(gameDay));
        if (teamId) params.set('teamId', String(teamId));
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));

        const url = `${backendBase}/api/matches?${params.toString()}`;
        const resp = await fetch(url, { credentials: 'include' });
        if (resp.ok) {
          const d = await resp.json();
          
          // gameDay filtering is now done on backend - it matches both gameDay and delayedGameDay
          if (mounted) {
            setMatches({
              items: d.items || [],
              total: d.total || 0
            });
          }
          
          // Extract teams from matches for filter options
          // Note: rounds and gameDays are fetched separately via API calls
          const teamsSet = new Map<string, any>();
          (d.items || []).forEach((item: any) => {
            const home = item.homeTeam;
            const away = item.awayTeam;
            if (home && home.id) teamsSet.set(String(home.id), home);
            if (away && away.id) teamsSet.set(String(away.id), away);
          });
          
          if (mounted) {
            setAvailableTeams(Array.from(teamsSet.values()));
          }
        } else {
          if (mounted) setMatches({ items: [], total: 0 });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [seasonId, leagueId, round, gameDay, teamId, page, pageSize, backendBase]);

  // Fetch available rounds when league changes (like /admin/matches)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!leagueId) { 
        setAvailableRounds([]); 
        return; 
      }
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

  // Fetch available gameDays from all matches in the league (not just current page)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!leagueId) {
        setAvailableGameDays([]);
        return;
      }
      try {
        // Fetch all matches for the league to get complete gameDays list
        const params = new URLSearchParams();
        if (seasonId) params.set('seasonId', String(seasonId));
        params.set('leagueId', String(leagueId));
        params.set('page', '1');
        params.set('pageSize', '10000'); // Large page size to get all matches

        const url = `${backendBase}/api/matches?${params.toString()}`;
        const resp = await fetch(url, { credentials: 'include' });
        if (resp.ok) {
          const d = await resp.json();
          const gameDaysSet = new Set<number>();
          (d.items || []).forEach((item: any) => {
            const match = item.match;
            // Use delayedGameDay if available, otherwise use gameDay
            const effectiveGameDay = (typeof match.delayedGameDay === 'number' && !Number.isNaN(match.delayedGameDay))
              ? match.delayedGameDay
              : match.gameDay;
            
            if (effectiveGameDay && typeof effectiveGameDay === 'number') {
              gameDaysSet.add(effectiveGameDay);
            }
          });
          if (mounted) {
            setAvailableGameDays(Array.from(gameDaysSet).sort((a, b) => a - b));
          }
        } else {
          if (mounted) setAvailableGameDays([]);
        }
      } catch {
        if (mounted) setAvailableGameDays([]);
      }
    })();
    return () => { mounted = false };
  }, [leagueId, seasonId, backendBase]);

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
        setMatchPolls(new Map());
        return;
      }
      try {
        const url = `${backendBase}/api/live-matches/groups/${selectedGroupId}`;
        const resp = await fetch(url, { credentials: 'include' });
        if (resp.ok) {
          const d = await resp.json();
          // Include groupMatchId (junction table ID) in each match item
          const matchesWithIds = (d.matches || []).map((item: any) => {
            // Find the groupMatchId from the matches array structure
            return { ...item, id: item.id || item.groupMatchId };
          });
          if (mounted) setGroupMatches(matchesWithIds);
          
          // Fetch polls for each match
          const pollsMap = new Map<string, boolean>();
          await Promise.all(matchesWithIds.map(async (item: any) => {
            const groupMatchId = item.id;
            try {
              const pollUrl = `${backendBase}/api/live-matches/group-matches/${groupMatchId}/poll`;
              const pollResp = await fetch(pollUrl, { credentials: 'include' });
              if (pollResp.ok) {
                const poll = await pollResp.json();
                pollsMap.set(groupMatchId, !!poll);
              }
            } catch {
              pollsMap.set(groupMatchId, false);
            }
          }));
          if (mounted) setMatchPolls(pollsMap);
        } else {
          if (mounted) {
            setGroupMatches([]);
            setMatchPolls(new Map());
          }
        }
      } catch {
        if (mounted) {
          setGroupMatches([]);
          setMatchPolls(new Map());
        }
      }
    })();
    return () => { mounted = false };
  }, [selectedGroupId, backendBase]);

  // Load poll when modal opens
  useEffect(() => {
    if (pollModal.open && pollModal.groupMatchId) {
      const groupMatchId = pollModal.groupMatchId; // Store in variable for type narrowing
      (async () => {
        try {
          const url = `${backendBase}/api/live-matches/group-matches/${groupMatchId}/poll`;
          const resp = await fetch(url, { credentials: 'include' });
          if (resp.ok) {
            const poll = await resp.json();
            if (poll) {
              setCurrentPoll(poll);
              setPollQuestion(poll.question);
              setPollOptions(poll.options?.map((o: any) => o.text) || ['']);
              // Update matchPolls map
              setMatchPolls(prev => new Map(prev).set(groupMatchId, true));
            } else {
              setCurrentPoll(null);
              setPollQuestion('');
              setPollOptions(['']);
              // Update matchPolls map
              setMatchPolls(prev => new Map(prev).set(groupMatchId, false));
            }
          } else {
            setCurrentPoll(null);
            setPollQuestion('');
            setPollOptions(['']);
          }
        } catch {
          setCurrentPoll(null);
          setPollQuestion('');
          setPollOptions(['']);
        }
      })();
    } else {
      setCurrentPoll(null);
      setPollQuestion('');
      setPollOptions(['']);
    }
  }, [pollModal, backendBase]);

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

  const handleActivateGroup = async (groupId: string) => {
    try {
      const url = `${backendBase}/api/live-matches/groups/${groupId}/activate`;
      const resp = await fetch(url, { method: 'POST', credentials: 'include' });
      if (resp.ok) {
        // Update all groups - set the activated one to true, others to false
        setGroups(groups.map(g => ({ ...g, active: g.id === groupId })));
        toast.success('Csoport aktiválva');
      } else {
        const err = await resp.json();
        toast.error(err.message || 'Nem sikerült aktiválni a csoportot');
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

  // Copy the rest of the component from [id]/live-matches/page.tsx
  // This will be the same UI but without requiring a championship ID
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
                          <div className="flex items-center gap-2">
                            <p className="text-white font-semibold">{group.name}</p>
                            {group.active && (
                              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                                Aktív
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">{group.matchCount || 0} meccs</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                setIsGeneratingImage(true);
                                const url = `${backendBase}/api/live-matches/groups/${group.id}/image`;
                                const res = await fetch(url, { credentials: 'include' });
                                if (!res.ok) throw new Error('Kép generálás sikertelen');
                                const blob = await res.blob();
                                const previewUrl = window.URL.createObjectURL(blob);
                                setPreviewImageUrl(previewUrl);
                              } catch (err) {
                                console.error(err);
                                toast.error('Nem sikerült generálni a képet');
                              } finally {
                                setIsGeneratingImage(false);
                              }
                            }}
                            disabled={isGeneratingImage || (group.matchCount || 0) === 0}
                            className="p-1 text-blue-400 hover:text-blue-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                            title="Kép generálása"
                          >
                            <FiImage className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActivateGroup(group.id);
                            }}
                            className={`p-1 ${group.active ? 'text-green-400 hover:text-green-300' : 'text-gray-400 hover:text-gray-300'}`}
                            title={group.active ? 'Aktív csoport' : 'Aktiválás'}
                          >
                            <FiPlay className="w-4 h-4" />
                          </button>
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
                    const groupMatchId = item.id || item.groupMatchId; // Use the junction table ID
                    const isCompleted = match.matchStatus === 'completed';
                    return (
                      <div
                        key={match.id}
                        className={`p-2 bg-black/30 rounded border border-[#ff5c1a]/20 flex items-center justify-between ${isCompleted ? 'opacity-50' : ''}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${isCompleted ? 'text-gray-500' : 'text-white'}`}>
                            {home?.name || 'Hazai'} vs {away?.name || 'Vendég'}
                          </p>
                          {effectiveDate && (
                            <p className={`text-xs ${isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                              {new Date(effectiveDate).toLocaleDateString('hu-HU', { timeZone: 'UTC' })}{' '}
                              {effectiveTime && new Date(effectiveTime).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPollModal({ open: true, groupMatchId });
                            }}
                            className="p-1 text-blue-400 hover:text-blue-300"
                            title={matchPolls.get(groupMatchId) ? "Szavazás szerkesztése" : "Szavazás hozzáadása"}
                          >
                            {matchPolls.get(groupMatchId) ? (
                              <FiEdit className="w-4 h-4" />
                            ) : (
                              <FiPlus className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleRemoveMatchFromGroup(match.id)}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
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
                      setLeagueId('');
                      setRound('');
                      setGameDay('');
                      setTeamId('');
                      setPage(1);
                    }}
                    styles={selectStyles as any}
                  />
                </div>
                <div className="min-w-[180px]">
                  <Select
                    isDisabled={!seasonId}
                    options={[{ value: '', label: 'Összes Bajnokság' }, ...leaguesForSeason.map((l: any) => ({ value: String(l.id), label: l.name }))]}
                    value={(() => {
                      if (!leagueId) return { value: '', label: 'Összes Bajnokság' };
                      const l = leaguesForSeason.find((ll: any) => String(ll.id) === String(leagueId));
                      return { value: String(leagueId), label: l?.name || String(leagueId) } as any;
                    })()}
                    onChange={(opt: any) => {
                      setLeagueId(opt?.value || '');
                      setRound('');
                      setGameDay('');
                      setTeamId('');
                      setPage(1);
                    }}
                    styles={selectStyles as any}
                  />
                </div>
                <div className="min-w-[160px]">
                  <Select
                    isDisabled={!leagueId}
                    options={[{ value: '', label: 'Összes Forduló' }, ...availableRounds.map((r) => ({ value: String(r), label: `Forduló ${r}` }))]}
                    value={(() => {
                      if (!round) return { value: '', label: 'Összes Forduló' } as any;
                      return { value: String(round), label: `Forduló ${round}` } as any;
                    })()}
                    onChange={(opt: any) => {
                      const v = opt?.value;
                      setRound(v ? Number(v) : '');
                      setPage(1);
                    }}
                    styles={selectStyles as any}
                  />
                </div>
                <div className="min-w-[160px]">
                  <Select
                    isDisabled={!leagueId || availableGameDays.length === 0}
                    options={[{ value: '', label: 'Összes Játéknap' }, ...availableGameDays.map((gd) => ({ value: String(gd), label: `Játéknap ${gd}` }))]}
                    value={(() => {
                      if (!gameDay) return { value: '', label: 'Összes Játéknap' } as any;
                      return { value: String(gameDay), label: `Játéknap ${gameDay}` } as any;
                    })()}
                    onChange={(opt: any) => {
                      const v = opt?.value;
                      setGameDay(v ? Number(v) : '');
                      setPage(1);
                    }}
                    styles={selectStyles as any}
                  />
                </div>
                <div className="min-w-[180px]">
                  <Select
                    isDisabled={!leagueId || availableTeams.length === 0}
                    options={[{ value: '', label: 'Összes Csapat' }, ...availableTeams.map((t: any) => ({ value: String(t.id), label: t.name || String(t.id) }))]}
                    value={(() => {
                      if (!teamId) return { value: '', label: 'Összes Csapat' } as any;
                      const t = availableTeams.find((tt: any) => String(tt.id) === String(teamId));
                      return { value: String(teamId), label: t?.name || String(teamId) } as any;
                    })()}
                    onChange={(opt: any) => {
                      setTeamId(opt?.value || '');
                      setPage(1);
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
                              onClick={async () => {
                                // Fetch which groups already contain this match
                                try {
                                  const url = `${backendBase}/api/live-matches/matches/${match.id}/groups`;
                                  const resp = await fetch(url, { credentials: 'include' });
                                  if (resp.ok) {
                                    const d = await resp.json();
                                    const groupIds = new Set<string>((d.groups || []).map((g: any) => g.id));
                                    setGroupsWithMatch(groupIds);
                                  } else {
                                    setGroupsWithMatch(new Set());
                                  }
                                } catch {
                                  setGroupsWithMatch(new Set());
                                }
                                setAddToGroupModal({ open: true, matchId: match.id });
                              }}
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
                <div className="flex items-center justify-between">
                  <div className="text-white">Összesen: {matches.total} meccs</div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-2 bg-black/40 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/60 transition-colors"
                    >
                      Előző
                    </button>
                    <span className="text-white">
                      {page} / {Math.max(1, Math.ceil(matches.total / pageSize))}
                    </span>
                    <button
                      disabled={page >= Math.ceil(matches.total / pageSize)}
                      onClick={() => setPage((p) => Math.min(Math.ceil(matches.total / pageSize), p + 1))}
                      className="px-3 py-2 bg-black/40 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/60 transition-colors"
                    >
                      Következő
                    </button>
                  </div>
                </div>
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
              ) : (() => {
                const availableGroups = groups.filter(g => !groupsWithMatch.has(g.id));
                return availableGroups.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">Ez a meccs már minden csoportban benne van</p>
                ) : (
                  availableGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => addToGroupModal.matchId && handleAddMatchToGroup(group.id, addToGroupModal.matchId)}
                      className="w-full p-3 text-left bg-black/30 hover:bg-black/50 border border-[#ff5c1a]/30 rounded-lg transition-colors"
                    >
                      <p className="text-white font-semibold">{group.name}</p>
                      {group.matchCount !== undefined && (
                        <p className="text-gray-400 text-sm">{group.matchCount} meccs</p>
                      )}
                    </button>
                  ))
                );
              })()}
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

      {/* Poll Management Modal */}
      {pollModal.open && pollModal.groupMatchId && (() => {
        const groupMatchId = pollModal.groupMatchId; // Store in variable for type narrowing
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setPollModal({ open: false, groupMatchId: null })}>
            <div
              className="bg-gradient-to-br from-[#001a3a]/95 to-[#002b6b]/95 rounded-xl p-6 border border-[#ff5c1a]/40 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={`${bebasNeue.className} text-xl text-white mb-4`}>Szavazás kezelése</h3>
              
              {/* Load existing poll or create new */}
              {currentPoll ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-white mb-2">Kérdés</label>
                    <input
                      type="text"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-[#ff5c1a]/30 rounded text-white"
                      placeholder="Szavazási kérdés"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white mb-2">Válaszlehetőségek</label>
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...pollOptions];
                            newOpts[idx] = e.target.value;
                            setPollOptions(newOpts);
                          }}
                          className="flex-1 px-3 py-2 bg-black/40 border border-[#ff5c1a]/30 rounded text-white"
                          placeholder={`Válaszlehetőség ${idx + 1}`}
                        />
                        {pollOptions.length > 1 && (
                          <button
                            onClick={() => {
                              const newOpts = pollOptions.filter((_, i) => i !== idx);
                              setPollOptions(newOpts);
                            }}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="mt-2 px-4 py-2 bg-[#ff5c1a]/30 hover:bg-[#ff5c1a]/40 text-white rounded flex items-center gap-2"
                    >
                      <FiPlus className="w-4 h-4" />
                      Új válaszlehetőség
                    </button>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={async () => {
                        try {
                          const url = `${backendBase}/api/live-matches/polls/${currentPoll.id}`;
                          const resp = await fetch(url, { method: 'DELETE', credentials: 'include' });
                          if (resp.ok) {
                            setCurrentPoll(null);
                            setPollQuestion('');
                            setPollOptions(['']);
                            setMatchPolls(prev => new Map(prev).set(groupMatchId, false));
                            toast.success('Szavazás törölve');
                          } else {
                            toast.error('Nem sikerült törölni a szavazást');
                          }
                        } catch {
                          toast.error('Hiba történt');
                        }
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                    >
                      Törlés
                    </button>
                    <button
                      onClick={async () => {
                        if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) {
                          toast.error('Kérlek adj meg egy kérdést és legalább 2 válaszlehetőséget');
                          return;
                        }
                        try {
                          const url = `${backendBase}/api/live-matches/polls/${currentPoll.id}`;
                          const resp = await fetch(url, {
                            method: 'PUT',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              question: pollQuestion.trim(),
                              options: pollOptions.filter(o => o.trim()).map((text, idx) => ({ text: text.trim(), order: idx }))
                            })
                          });
                          if (resp.ok) {
                            const updated = await resp.json();
                            setCurrentPoll(updated);
                            setMatchPolls(prev => new Map(prev).set(groupMatchId, true));
                            toast.success('Szavazás frissítve');
                            setPollModal({ open: false, groupMatchId: null });
                          } else {
                            toast.error('Nem sikerült frissíteni a szavazást');
                          }
                        } catch {
                          toast.error('Hiba történt');
                        }
                      }}
                      className="px-4 py-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white rounded"
                    >
                      Mentés
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-white mb-2">Kérdés</label>
                    <input
                      type="text"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-[#ff5c1a]/30 rounded text-white"
                      placeholder="Szavazási kérdés"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white mb-2">Válaszlehetőségek</label>
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...pollOptions];
                            newOpts[idx] = e.target.value;
                            setPollOptions(newOpts);
                          }}
                          className="flex-1 px-3 py-2 bg-black/40 border border-[#ff5c1a]/30 rounded text-white"
                          placeholder={`Válaszlehetőség ${idx + 1}`}
                        />
                        {pollOptions.length > 1 && (
                          <button
                            onClick={() => {
                              const newOpts = pollOptions.filter((_, i) => i !== idx);
                              setPollOptions(newOpts);
                            }}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="mt-2 px-4 py-2 bg-[#ff5c1a]/30 hover:bg-[#ff5c1a]/40 text-white rounded flex items-center gap-2"
                    >
                      <FiPlus className="w-4 h-4" />
                      Új válaszlehetőség
                    </button>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setPollModal({ open: false, groupMatchId: null });
                        setPollQuestion('');
                        setPollOptions(['']);
                        setCurrentPoll(null);
                      }}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                    >
                      Mégse
                    </button>
                    <button
                      onClick={async () => {
                        if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) {
                          toast.error('Kérlek adj meg egy kérdést és legalább 2 válaszlehetőséget');
                          return;
                        }
                        try {
                          const url = `${backendBase}/api/live-matches/polls`;
                          const resp = await fetch(url, {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              groupMatchId: groupMatchId,
                              question: pollQuestion.trim(),
                              options: pollOptions.filter(o => o.trim())
                            })
                          });
                          if (resp.ok) {
                            const newPoll = await resp.json();
                            setCurrentPoll(newPoll);
                            setMatchPolls(prev => new Map(prev).set(groupMatchId, true));
                            toast.success('Szavazás létrehozva');
                            setPollModal({ open: false, groupMatchId: null });
                          } else {
                            const err = await resp.json();
                            toast.error(err.message || 'Nem sikerült létrehozni a szavazást');
                          }
                        } catch {
                          toast.error('Hiba történt');
                        }
                      }}
                      className="px-4 py-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white rounded"
                    >
                      Létrehozás
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Preview Image Modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => {
          window.URL.revokeObjectURL(previewImageUrl);
          setPreviewImageUrl(null);
        }}>
          <div className="bg-[#001a3a] rounded-xl border border-[#ff5c1a]/40 p-6 max-w-6xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`${bebasNeue.className} text-2xl text-white`}>Generált kép előnézet</h3>
              <button
                onClick={() => {
                  window.URL.revokeObjectURL(previewImageUrl);
                  setPreviewImageUrl(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <div className="border border-white/20 rounded-lg overflow-hidden mb-4">
              <Image 
                src={previewImageUrl} 
                alt="Live matches előnézet" 
                width={1200}
                height={800}
                className="w-full h-auto"
                unoptimized
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = previewImageUrl;
                  a.download = `live-matches-${Date.now()}.png`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                className="px-4 py-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white rounded transition-colors"
              >
                Letöltés
              </button>
              <button
                onClick={() => {
                  window.URL.revokeObjectURL(previewImageUrl);
                  setPreviewImageUrl(null);
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Bezárás
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

