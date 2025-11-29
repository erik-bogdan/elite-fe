"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Bebas_Neue } from "next/font/google";
import { FiTable, FiDownload, FiChevronUp, FiChevronDown, FiEdit2, FiCalendar, FiMoreVertical, FiArrowUp, FiArrowDown, FiMinus } from "react-icons/fi";
import EnterResultModal from "@/app/components/EnterResultModal";
import { useGetTeamPlayersBySeasonQuery } from "@/lib/features/apiSlice";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { toast } from 'sonner';
import { useGetAvailableTeamsForLeagueQuery, useGetChampionshipByIdQuery, useGetLeagueTeamsQuery, useAddTeamToLeagueMutation, useRemoveTeamFromLeagueMutation, useSendInviteForLeagueTeamMutation, useGetMatchesForLeagueQuery, useGetStandingsQuery, useGetMatchMetaQuery, useUpdateMatchResultMutation, useGetStandingsByGameDayQuery, useGetGameDayMvpsQuery, useGetStandingsUptoGameDayQuery, useGetStandingsUptoRoundQuery, useGetPlayoffGroupsQuery, useGetPlayoffMatchesQuery } from "@/lib/features/championship/championshipSlice";
import RankModal from "./RankModal";
import * as Tooltip from '@radix-ui/react-tooltip';
import TeamAssignModal from "./TeamAssignModal";
import StartModal from "./StartModal";
import ScriptModal from "./ScriptModal";
import GroupedPlayoffModal from "./GroupedPlayoffModal";
import KnockoutPlayoffModal from "./KnockoutPlayoffModal";
import ActionMenu from "../../teams/ActionMenu";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

interface Match {
  id: number;
  homeTeam: { name: string; logo: string };
  awayTeam: { name: string; logo: string };
  time: string;
  tableNumber: number;
  round: number;
}

interface MatchDay {
  id: number;
  date: string;
  matches: Match[];
  mvp: {
    name: string;
    team: string;
    image: string;
  };
}

// Mock data
const mockMatchDays: MatchDay[] = [
  {
    id: 1,
    date: "2024-03-15",
    matches: [
      {
        id: 1,
        homeTeam: { name: "Team Alpha", logo: "/team1.png" },
        awayTeam: { name: "Team Beta", logo: "/team2.png" },
        time: "18:00",
        tableNumber: 1,
        round: 1,
      },
      {
        id: 2,
        homeTeam: { name: "Team Gamma", logo: "/team3.png" },
        awayTeam: { name: "Team Delta", logo: "/team4.png" },
        time: "19:00",
        tableNumber: 2,
        round: 1,
      },
    ],
    mvp: {
      name: "John Doe",
      team: "Team Alpha",
      image: "/player1.png",
    },
  },
  {
    id: 2,
    date: "2024-03-22",
    matches: [
      {
        id: 3,
        homeTeam: { name: "Team Beta", logo: "/team2.png" },
        awayTeam: { name: "Team Gamma", logo: "/team3.png" },
        time: "18:00",
        tableNumber: 1,
        round: 2,
      },
      {
        id: 4,
        homeTeam: { name: "Team Delta", logo: "/team4.png" },
        awayTeam: { name: "Team Alpha", logo: "/team1.png" },
        time: "19:00",
        tableNumber: 2,
        round: 2,
      },
    ],
    mvp: {
      name: "Jane Smith",
      team: "Team Gamma",
      image: "/player2.png",
    },
  },
];

export default function ChampionshipView() {
  const params = useParams();
  const router = useRouter();
  const championshipId = typeof params.id === 'string' ? params.id : null;
  const { data: championship, isLoading, error } = useGetChampionshipByIdQuery(championshipId!, {
    skip: !championshipId,
  });
  const { data: attachedTeams, refetch } = useGetLeagueTeamsQuery(championshipId!, { skip: !championshipId });
  const { data: availableTeams } = useGetAvailableTeamsForLeagueQuery(championshipId!, { skip: !championshipId });
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [uptoGameDay, setUptoGameDay] = useState<number | 'all'>('all');
  const [uptoRound, setUptoRound] = useState<number | 'all'>('all');
  const { data: standingsData, refetch: refetchStandings } = useGetStandingsQuery(championshipId!, { skip: !championshipId || !championship?.isStarted || selectedDay !== 'all' || uptoGameDay !== 'all' || uptoRound !== 'all' });
  const { data: standingsByDay } = useGetStandingsByGameDayQuery({ id: championshipId!, gameDay: Number(selectedDay) }, { skip: !championshipId || !championship?.isStarted || selectedDay === 'all' });
  const { data: standingsUpto } = useGetStandingsUptoGameDayQuery({ id: championshipId!, gameDay: Number(uptoGameDay) }, { skip: !championshipId || !championship?.isStarted || uptoGameDay === 'all' || uptoRound !== 'all' });
  const { data: standingsPrev } = useGetStandingsUptoGameDayQuery({ id: championshipId!, gameDay: Number(uptoGameDay) - 1 }, { skip: !championshipId || !championship?.isStarted || uptoGameDay === 'all' || Number(uptoGameDay) <= 1 });
  const { data: standingsUptoRound } = useGetStandingsUptoRoundQuery({ id: championshipId!, round: Number(uptoRound) }, { skip: !championshipId || !championship?.isStarted || uptoRound === 'all' });
  const { data: standingsPrevRound } = useGetStandingsUptoRoundQuery({ id: championshipId!, round: Number(uptoRound) - 1 }, { skip: !championshipId || !championship?.isStarted || uptoRound === 'all' || Number(uptoRound) <= 1 });
  const { data: mvpsData } = useGetGameDayMvpsQuery(championshipId!, { skip: !championshipId || !championship?.isStarted });
  const [addTeam] = useAddTeamToLeagueMutation();
  const [removeTeam] = useRemoveTeamFromLeagueMutation();
  const [sendInvite] = useSendInviteForLeagueTeamMutation();
  const { data: leagueMatches, refetch: refetchMatches } = useGetMatchesForLeagueQuery(championshipId!, { skip: !championshipId });
  const playoffProperties = (championship as any)?.properties;
  const knockoutBestOf = Number(playoffProperties?.knockoutBestOf) || 7;
  const knockoutWinsNeeded = Math.ceil(knockoutBestOf / 2);
  const hasGroupedPlayoff = Boolean(playoffProperties?.hasPlayoff && playoffProperties?.playoffType === 'groupped');
  const hasKnockoutPlayoff = Boolean(playoffProperties?.hasPlayoff && playoffProperties?.playoffType === 'knockout');
  
  // Fetch all matches including playoff matches
  const [allMatchesIncludingPlayoff, setAllMatchesIncludingPlayoff] = useState<any[]>([]);
  useEffect(() => {
    if (!championshipId) {
      setAllMatchesIncludingPlayoff([]);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const params = new URLSearchParams();
        params.set('leagueId', championshipId);
        params.set('playoff', 'all'); // Get all matches including playoff
        params.set('page', '1');
        params.set('pageSize', '1000'); // Large page size to get all matches
        const url = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}/api/matches?${params.toString()}`;
        const resp = await fetch(url, { credentials: 'include' });
        if (resp.ok && mounted) {
          const data = await resp.json();
          setAllMatchesIncludingPlayoff(data.items || []);
        } else if (mounted) {
          setAllMatchesIncludingPlayoff([]);
        }
      } catch (error) {
        console.error('Failed to fetch all matches:', error);
        if (mounted) setAllMatchesIncludingPlayoff([]);
      }
    })();
    return () => { mounted = false };
  }, [championshipId]);
  const { data: playoffGroups } = useGetPlayoffGroupsQuery(championshipId!, { skip: !championshipId || !hasGroupedPlayoff });
  const { data: playoffMatches } = useGetPlayoffMatchesQuery(championshipId!, { skip: !championshipId || !hasGroupedPlayoff });
  const playoffScheduled = Boolean((playoffMatches?.upper?.length || 0) + (playoffMatches?.lower?.length || 0));
  const [expandedMatchDays, setExpandedMatchDays] = useState<number[]>([]);
  const [expandedMatches, setExpandedMatches] = useState<string[]>([]);
  const [expandedRounds, setExpandedRounds] = useState<string[]>([]);
  const [expandedHouseMatches, setExpandedHouseMatches] = useState<string[]>([]);
  const [expandedKnockoutMatchups, setExpandedKnockoutMatchups] = useState<string[]>([]);
  const [isTeamModalOpen, setTeamModalOpen] = useState(false);
  const [isStartModalOpen, setStartModalOpen] = useState(false);
  const [isScriptModalOpen, setScriptModalOpen] = useState(false);
  const [isGroupedModalOpen, setGroupedModalOpen] = useState(false);
  const [isKnockoutModalOpen, setKnockoutModalOpen] = useState(false);
  const [isExportImageOpen, setExportImageOpen] = useState(false);
  const [exportGameday, setExportGameday] = useState<number | 'latest'>("latest" as any);
  const [playersForExport, setPlayersForExport] = useState<Array<{ id: string; label: string }>>([]);
  const [mvpPlayerId, setMvpPlayerId] = useState<string>('');
  const [mvpLabelType, setMvpLabelType] = useState<'GAMEDAY MVP' | 'TOP PERFORMER'>('GAMEDAY MVP');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [activeRow, setActiveRow] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null);
  const [resultModal, setResultModal] = useState<{ open: boolean; match?: any }>(() => ({ open: false }));
  const [rankModal, setRankModal] = useState<{ open: boolean; teamId?: string; teamName?: string }>({ open: false });
  const modalHomeTeamId = resultModal.open ? (resultModal.match?.homeTeam?.id || resultModal.match?.homeTeamId) : null;
  const modalAwayTeamId = resultModal.open ? (resultModal.match?.awayTeam?.id || resultModal.match?.awayTeamId) : null;
  const modalSeasonId = championship?.seasonId ? String(championship.seasonId as any) : '';
  const modalMatchId = resultModal.open ? String(resultModal.match?.id || resultModal.match?.match?.id || '') : '';
  const { data: matchMeta, refetch: refetchMeta, isFetching: isFetchingMatchMeta } = useGetMatchMetaQuery(modalMatchId, { skip: !modalMatchId });
  const [updateMatchResult] = useUpdateMatchResultMutation();

  useEffect(() => {
    if (!championshipId) {
      router.push('/admin/championships');
      return;
    }
  }, [championshipId, router]);

  useEffect(() => {
    // Load players for MVP select when modal opens or league teams change
    (async () => {
      try {
        if (!isExportImageOpen) return;
        const seasonId = championship?.seasonId as any;
        const teams = attachedTeams || [];
        if (!seasonId || teams.length === 0) return;
        const backend = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}`;
        const results = await Promise.all(teams.map(async (t: any) => {
          try {
            const res = await fetch(`${backend}/api/teams/${t.id}/players?seasonId=${encodeURIComponent(String(seasonId))}`, { credentials: 'include' });
            if (!res.ok) return [] as any[];
            const rows = await res.json();
            return (rows || []).map((p: any) => ({ id: String(p.id), label: `${(p.lastName || '') + ' ' + (p.firstName || '') || p.nickname || ''} (${t.name})` }));
          } catch { return [] as any[]; }
        }));
        const list = results.flat().filter(Boolean) as Array<{ id: string; label: string }>;
        setPlayersForExport(list);
      } catch {}
    })();
  }, [isExportImageOpen, attachedTeams, championship]);

  // NOTE: All hooks must be called before any early returns to maintain hook order
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
  const abs = (p?: string | null) => p ? (p.startsWith('http') ? p : `${backendBase}${p}`) : '';
  
  // Check if all regular season matches are completed
  const allRegularMatchesCompleted = useMemo(() => {
    if (!leagueMatches || !Array.isArray(leagueMatches)) return false;
    const regularMatches = leagueMatches.filter((row: any) => !row.match?.isPlayoffMatch);
    if (regularMatches.length === 0) return false;
    return regularMatches.every((row: any) => row.match?.matchStatus === 'completed');
  }, [leagueMatches]);

  // Knockout playoff bracket data
  const knockoutBracketData = useMemo(() => {
    if (!hasKnockoutPlayoff || !standingsData?.standings || !leagueMatches) return null;
    
    // Get playoff matches
    const allMatches = Array.isArray(leagueMatches) ? leagueMatches : [];
    const playoffMatches = allMatches.filter((row: any) => row.match?.isPlayoffMatch);
    
    // Get teams with seeds from standings
    const teams = standingsData.standings.map((s: any, idx: number) => ({
      seed: idx + 1,
      teamId: s.teamId,
      name: s.name,
      logo: abs(s.logo),
    }));

    // Organize matches by round
    const matchesByRound: Record<number, any[]> = {};
    playoffMatches.forEach((row: any) => {
      const round = row.match?.matchRound || 1;
      if (!matchesByRound[round]) matchesByRound[round] = [];
      matchesByRound[round].push({
        id: row.match?.id,
        round,
        homeTeamId: row.match?.homeTeamId,
        awayTeamId: row.match?.awayTeamId,
        homeTeam: row.homeTeam,
        awayTeam: row.awayTeam,
        homeScore: row.match?.homeTeamScore,
        awayScore: row.match?.awayTeamScore,
        status: row.match?.matchStatus,
        matchAt: row.match?.matchAt,
      });
    });

    return { teams, matchesByRound };
  }, [hasKnockoutPlayoff, standingsData, leagueMatches, abs]);


  const shouldShowPlayoffTables = Boolean(
    hasGroupedPlayoff &&
    playoffGroups?.enabled &&
    playoffGroups?.ready &&
    (
      (playoffGroups?.upper?.standings?.length || 0) > 0 ||
      (playoffGroups?.lower?.standings?.length || 0) > 0
    )
  );

  const showGroupedPlayoffTab = hasGroupedPlayoff && Boolean(playoffGroups?.enabled && playoffGroups?.ready);
  const showKnockoutPlayoffTab = hasKnockoutPlayoff && allRegularMatchesCompleted;
  const showPlayoffTab = showGroupedPlayoffTab || showKnockoutPlayoffTab;
  
  const [standingsTab, setStandingsTab] = useState<'regular' | 'playoff'>('regular');
  const [playoffRoundTab, setPlayoffRoundTab] = useState<'quarter' | 'semi' | 'final'>('quarter');
  const playoffDefaulted = useRef(false);
  
  useEffect(() => {
    if (!showPlayoffTab && standingsTab === 'playoff') {
      setStandingsTab('regular');
    } else if (showPlayoffTab && !playoffDefaulted.current) {
      setStandingsTab('playoff');
      playoffDefaulted.current = true;
    }
  }, [showPlayoffTab, standingsTab]);

  const renderHouseTable = (title: string, rows?: any[] | null, startRank: number = 1) => {
    if (!rows || rows.length === 0) return null;
    return (
      <div className="bg-[#001a3a]/60 rounded-xl p-6 border border-[#ff5c1a]/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${bebasNeue.className} text-2xl text-white`}>{title}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#ff5c1a]/30">
            <thead>
              <tr className="text-left text-white">
                <th className="py-3 pr-4">#</th>
                <th className="py-3 pr-4">Csapat</th>
                <th className="py-3 pr-4">Meccs</th>
                <th className="py-3 pr-4">GY</th>
                <th className="py-3 pr-4">V</th>
                <th className="py-3 pr-4">Győzelem</th>
                <th className="py-3 pr-4">Győzelem (h)</th>
                <th className="py-3 pr-4">Vereség (h)</th>
                <th className="py-3 pr-4">Vereség</th>
                <th className="py-3 pr-4">PK</th>
                <th className="py-3 pr-4">Pont</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ff5c1a]/20">
              {rows.map((s: any, idx: number) => (
                <tr key={s.teamId} className="text-white">
                  <td className="py-2 pr-4">{(typeof startRank === 'number' ? startRank + idx : s.rank)}</td>
                  <td className="py-2 pr-4 flex items-center gap-2">
                    <Image src={abs(s.logo) || '/elitelogo.png'} alt={s.name} width={24} height={24} className="rounded-full border border-white/10" />
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/teams/${s.teamId}/view`)}
                      className="underline-offset-2 hover:underline cursor-pointer"
                      title="Csapat megnyitása"
                    >
                      {s.name}
                    </button>
                  </td>
                  <td className="py-2 pr-4">{s.games ?? 0}</td>
                  <td className="py-2 pr-4">{s.winsTotal ?? 0}</td>
                  <td className="py-2 pr-4">{s.lossesTotal ?? 0}</td>
                  <td className="py-2 pr-4">{s.winsRegular ?? 0}</td>
                  <td className="py-2 pr-4">{s.winsOT ?? 0}</td>
                  <td className="py-2 pr-4">{s.lossesOT ?? 0}</td>
                  <td className="py-2 pr-4">{s.lossesRegular ?? 0}</td>
                  <td className="py-2 pr-4">{s.cupDiff ?? 0}</td>
                  <td className="py-2 pr-4">{s.points ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderHouseMatches = (title: string, items?: any[] | null) => {
    const key = title.toLowerCase().includes('felső') ? 'upper' : 'lower';
    const isOpen = expandedHouseMatches.includes(key);
    return (
      <div className="bg-[#001a3a]/60 border border-[#ff5c1a]/20 rounded-2xl p-5">
        <button
          onClick={() =>
            setExpandedHouseMatches((prev) =>
              prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
            )
          }
          className="flex items-center justify-between w-full mb-4"
        >
          <div>
            <h4 className={`${bebasNeue.className} text-xl text-white`}>{title}</h4>
            <span className="text-white/70 text-sm">
              {items?.length ? `${items.length} meccs` : 'Nincs meccs'}
            </span>
          </div>
          {isOpen ? <FiChevronUp className="w-6 h-6 text-[#ff5c1a]" /> : <FiChevronDown className="w-6 h-6 text-[#ff5c1a]" />}
        </button>
        {!isOpen ? null : (
          <>
            {(!items || items.length === 0) && (
              <div className="text-white/60 text-sm">Nincs playoff meccs ebben a házban.</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(items || []).map((match: any) => {
                const start = match.matchAt ? new Date(match.matchAt) : null;
                const dateLabel = start ? start.toLocaleDateString('hu-HU') : '';
                const timeLabel = start ? start.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }) : '';
                const isCompleted = match.status === 'completed';
                const statusLabel = isCompleted ? 'LEJÁTSZVA' : match.status === 'scheduled' ? 'ÜTEMEZVE' : match.status?.toUpperCase();
                return (
                  <div
                    key={match.id}
                    className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,#09204c,#010a1c)] p-4 shadow-[0_10px_25px_rgba(0,0,0,0.35)]"
                  >
                    <div className="flex items-center justify-between text-white/70 text-xs mb-3">
                      <span>Időkör {match.gameDay ?? '-'}</span>
                      <span>Asztal {match.table ?? '-'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <Image src={abs(match.home?.logo) || '/elitelogo.png'} alt={match.home?.name || ''} width={28} height={28} className="rounded-full border border-white/10" />
                        <span className="text-white font-semibold truncate">{match.home?.name}</span>
                      </div>
                      <div className={`${bebasNeue.className} text-2xl text-white`}>
                        {isCompleted ? (
                          <>
                            <span>{match.home?.score ?? 0}</span>
                            <span className="text-white/60 mx-1">-</span>
                            <span>{match.away?.score ?? 0}</span>
                          </>
                        ) : (
                          <span className="text-white/60 text-base">vs</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 min-w-0 justify-end">
                        <span className="text-white font-semibold truncate text-right">{match.away?.name}</span>
                        <Image src={abs(match.away?.logo) || '/elitelogo.png'} alt={match.away?.name || ''} width={28} height={28} className="rounded-full border border-white/10" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/70">
                      <div>
                        <div>{dateLabel}</div>
                        <div>{timeLabel}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full border text-[10px] tracking-wide ${isCompleted ? 'border-green-400 text-green-300' : 'border-orange-300 text-orange-200'}`}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  const toggleMatchDay = (matchDayId: number) => {
    setExpandedMatchDays(prev =>
      prev.includes(matchDayId)
        ? prev.filter(id => id !== matchDayId)
        : [...prev, matchDayId]
    );
  };

  const toggleMatch = (matchId: string) => {
    setExpandedMatches(prev =>
      prev.includes(matchId)
        ? prev.filter(id => id !== matchId)
        : [...prev, matchId]
    );
  };

  // Fetch real matches and group by gameday (using delayedGameDay if available)
  // Separate knockout playoff matches from regular matches
  const allMatchesMapped = useMemo(() => {
    // Combine regular matches from leagueMatches and playoff matches from allMatchesIncludingPlayoff
    const regularMatchesList = Array.isArray(leagueMatches) ? leagueMatches : [];
    const playoffMatchesList = Array.isArray(allMatchesIncludingPlayoff) 
      ? allMatchesIncludingPlayoff.filter((row: any) => row?.match?.isPlayoffMatch === true)
      : [];
    
    // Deduplicate by match ID (in case same match appears in both lists)
    const matchIds = new Set<string>();
    const allMatches: any[] = [];
    
    // Add regular matches first
    regularMatchesList.forEach((row: any) => {
      const matchId = row?.match?.id;
      if (matchId && !matchIds.has(String(matchId))) {
        matchIds.add(String(matchId));
        allMatches.push(row);
      }
    });
    
    // Add playoff matches
    playoffMatchesList.forEach((row: any) => {
      const matchId = row?.match?.id;
      if (matchId && !matchIds.has(String(matchId))) {
        matchIds.add(String(matchId));
        allMatches.push(row);
      }
    });
    
    return allMatches
      .map((row: any) => {
        const match = row.match;
        const isDelayed = match.isDelayed || false;
        const isPlayoffMatch = match.isPlayoffMatch || false;
        
        // Use original data for grouping and display
        const originalDateSrc = match.matchAt || match.matchDate || null;
        const originalTimeSrc = match.matchTime || match.matchAt || null;
        const originalTableSrc = match.matchTable;
        const originalRoundSrc = match.matchRound;
        const originalGameDaySrc = match.gameDay;
        const delayedGameDaySrc = match.delayedGameDay;
        
        if (!originalDateSrc) return null;
        const originalDateIso = new Date(originalDateSrc).toISOString();
        const originalTimeIso = originalTimeSrc ? new Date(originalTimeSrc).toISOString() : null;
        // Effective schedule if delayed
        // For playoff matches, gameDay stores the knockout round (1=quarter, 2=semi, 3=final)
        const effectiveGameDay = (typeof delayedGameDaySrc === 'number' && !Number.isNaN(delayedGameDaySrc)) 
          ? delayedGameDaySrc 
          : (typeof originalGameDaySrc === 'number' && !Number.isNaN(originalGameDaySrc)) 
            ? originalGameDaySrc 
            : (originalGameDaySrc ? Number(originalGameDaySrc) : null);
        const effectiveDateIso = (isDelayed && match.delayedDate) ? new Date(match.delayedDate).toISOString() : originalDateIso;
        const effectiveTimeIso = (isDelayed && match.delayedTime) ? new Date(match.delayedTime).toISOString() : originalTimeIso;
        const effectiveTable = (isDelayed && match.delayedTable) ? match.delayedTable : originalTableSrc;
        const effectiveRound = (isDelayed && match.delayedRound) ? match.delayedRound : originalRoundSrc;
        
        return {
          id: match.id,
          date: effectiveDateIso, // Effective date for grouping/ordering
          time: effectiveTimeIso,
          table: effectiveTable,
          round: effectiveRound,
          gameDay: effectiveGameDay,
          isDelayed,
          isPlayoffMatch,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          originalDateRaw: match.matchAt || match.matchDate,
          originalTime: match.matchTime || match.matchAt,
          originalTable: match.matchTable,
          originalRound: match.matchRound,
          delayedDate: match.delayedDate,
          delayedTime: match.delayedTime,
          delayedTable: match.delayedTable,
          delayedRound: match.delayedRound,
          delayedGameDay: delayedGameDaySrc,
          originalGameDayRaw: originalGameDaySrc, // Keep original for debugging
          home: row.homeTeam?.name || match.homeTeamId,
          homeLogo: abs(row.homeTeam?.logo) || '/elitelogo.png',
          away: row.awayTeam?.name || match.awayTeamId,
          awayLogo: abs(row.awayTeam?.logo) || '/elitelogo.png',
          homeScore: match.homeTeamScore,
          awayScore: match.awayTeamScore,
        };
      })
      .filter(Boolean);
  }, [leagueMatches, allMatchesIncludingPlayoff, abs]);

  // Separate knockout playoff matches
  const regularMatches = useMemo(() => {
    return allMatchesMapped.filter((m: any) => !m.isPlayoffMatch || !hasKnockoutPlayoff);
  }, [allMatchesMapped, hasKnockoutPlayoff]);

  // Group knockout playoff matches by matchup (homeTeamId + awayTeamId combination)
  // Filter by selected round tab (gameDay: 1=quarter, 2=semi, 3=final)
  const knockoutMatchups = useMemo(() => {
    if (!hasKnockoutPlayoff) return [];
    
    const roundGameDayMap: Record<'quarter' | 'semi' | 'final', number> = {
      quarter: 1,
      semi: 2,
      final: 3,
    };
    const selectedGameDay = roundGameDayMap[playoffRoundTab];
    
    // Get all playoff matches first
    const allPlayoffMatches = allMatchesMapped.filter((m: any) => m.isPlayoffMatch && hasKnockoutPlayoff);
    
    // Debug: log all playoff matches
    if (allPlayoffMatches.length > 0) {
      console.log('All playoff matches:', allPlayoffMatches.map((m: any) => ({
        id: m.id,
        gameDay: m.gameDay,
        delayedGameDay: m.delayedGameDay,
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
        originalGameDay: m.originalGameDayRaw,
      })));
      console.log('Selected gameDay for round:', playoffRoundTab, '=', selectedGameDay);
    }
    
    // Filter by gameDay (1=quarter, 2=semi, 3=final)
    // Use delayedGameDay if available, otherwise use gameDay
    // Also check originalGameDayRaw in case gameDay is not set properly
    const knockoutPlayoffMatches = allMatchesMapped.filter((m: any) => {
      if (!m.isPlayoffMatch || !hasKnockoutPlayoff) return false;
      
      // Try multiple sources for gameDay
      const effectiveGameDay = (typeof m.delayedGameDay === 'number' && !Number.isNaN(m.delayedGameDay)) 
        ? m.delayedGameDay 
        : (typeof m.gameDay === 'number' && !Number.isNaN(m.gameDay)) 
          ? m.gameDay 
          : null;
      
      return effectiveGameDay === selectedGameDay;
    });
    
    console.log('Filtered playoff matches for round', playoffRoundTab, ':', knockoutPlayoffMatches.length, 'out of', allPlayoffMatches.length);
    
    if (knockoutPlayoffMatches.length === 0) return [];
    
    const matchupMap = new Map<string, any[]>();
    knockoutPlayoffMatches.forEach((m: any) => {
      // Create a consistent key for matchup (sort team IDs to handle both directions)
      const teamIds = [m.homeTeamId, m.awayTeamId].sort().join('-');
      if (!matchupMap.has(teamIds)) {
        matchupMap.set(teamIds, []);
      }
      matchupMap.get(teamIds)!.push(m);
    });

    return Array.from(matchupMap.entries()).map(([key, matches]) => {
      const firstMatch = matches[0];
      // Sort matches by matchNumber if available, otherwise by date
      const sorted = matches.sort((a: any, b: any) => {
        // Try to extract match number from round or use date
        const aNum = a.round || 0;
        const bNum = b.round || 0;
        if (aNum !== bNum) return aNum - bNum;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      
      return {
        key,
        homeTeamId: firstMatch.homeTeamId,
        homeTeamName: firstMatch.home,
        homeTeamLogo: firstMatch.homeLogo,
        awayTeamId: firstMatch.awayTeamId,
        awayTeamName: firstMatch.away,
        awayTeamLogo: firstMatch.awayLogo,
        matches: sorted.map((m: any) => ({
          id: m.id,
          time: m.time ? new Date(m.time).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit'}) : '',
          tableNumber: m.table,
          round: m.round,
          isDelayed: m.isDelayed,
          originalDateRaw: m.originalDateRaw,
          originalTime: m.originalTime,
          originalTable: m.originalTable,
          originalRound: m.originalRound,
          delayedDate: m.delayedDate,
          delayedTime: m.delayedTime,
          delayedTable: m.delayedTable,
          delayedRound: m.delayedRound,
          delayedGameDay: m.delayedGameDay,
          homeTeam: { name: m.home, logo: m.homeLogo },
          awayTeam: { name: m.away, logo: m.awayLogo },
          homeScore: m.homeScore,
          awayScore: m.awayScore,
        }))
      };
    });
  }, [allMatchesMapped, hasKnockoutPlayoff, playoffRoundTab]);

  const teamInfoById = useMemo(() => {
    if (!standingsData?.standings) return new Map<string, { teamId: string; name: string; logo: string; seed: number }>();
    const map = new Map<string, { teamId: string; name: string; logo: string; seed: number }>();
    standingsData.standings.forEach((row: any, idx: number) => {
      map.set(String(row.teamId), {
        teamId: String(row.teamId),
        name: row.name,
        logo: abs(row.logo) || '/elitelogo.png',
        seed: idx + 1,
      });
    });
    return map;
  }, [standingsData, abs]);

  const teamInfoBySeed = useMemo(() => {
    const map = new Map<number, { teamId: string; name: string; logo: string; seed: number }>();
    teamInfoById.forEach((info) => {
      if (info?.seed) {
        map.set(info.seed, info);
      }
    });
    return map;
  }, [teamInfoById]);

  const knockoutAdvancers = useMemo(() => {
    if (!hasKnockoutPlayoff || !teamInfoById.size || !Array.isArray(allMatchesMapped) || allMatchesMapped.length === 0) {
      return {
        semi: { left: [null, null], right: [null, null] } as { left: Array<{ teamId: string; name: string; logo: string; seed: number } | null>; right: Array<{ teamId: string; name: string; logo: string; seed: number } | null>; },
        final: [null, null] as Array<{ teamId: string; name: string; logo: string; seed: number } | null>,
      };
    }

    const getSeriesWinner = (teamAId: string, teamBId: string, gameDay: number) => {
      if (!teamAId || !teamBId) return null;
      const seriesMatches = allMatchesMapped.filter((m: any) => {
        if (!m.isPlayoffMatch) return false;
        const effectiveGameDay = m.gameDay;
        if (effectiveGameDay !== gameDay) return false;
        const involvesTeams =
          (m.homeTeamId === teamAId && m.awayTeamId === teamBId) ||
          (m.homeTeamId === teamBId && m.awayTeamId === teamAId);
        return involvesTeams;
      });

      if (seriesMatches.length === 0) return null;

      let teamAWins = 0;
      let teamBWins = 0;

      seriesMatches.forEach((match: any) => {
        if (match.homeScore == null || match.awayScore == null) return;
        if (match.homeTeamId === teamAId && match.awayTeamId === teamBId) {
          if (match.homeScore > match.awayScore) teamAWins++;
          else if (match.awayScore > match.homeScore) teamBWins++;
        } else if (match.homeTeamId === teamBId && match.awayTeamId === teamAId) {
          if (match.homeScore > match.awayScore) teamBWins++;
          else if (match.awayScore > match.homeScore) teamAWins++;
        }
      });

      if (teamAWins >= knockoutWinsNeeded) return teamAId;
      if (teamBWins >= knockoutWinsNeeded) return teamBId;
      return null;
    };

    const semiSlots = {
      left: [null, null],
      right: [null, null],
    } as { left: Array<{ teamId: string; name: string; logo: string; seed: number } | null>; right: Array<{ teamId: string; name: string; logo: string; seed: number } | null>; };

    const quarterSeedPairs = [
      { seeds: [1, 8], slot: 'left' as const, index: 0 },
      { seeds: [5, 4], slot: 'left' as const, index: 1 },
      { seeds: [3, 6], slot: 'right' as const, index: 0 },
      { seeds: [7, 2], slot: 'right' as const, index: 1 },
    ];

    quarterSeedPairs.forEach(({ seeds, slot, index }) => {
      const teamA = teamInfoBySeed.get(seeds[0]);
      const teamB = teamInfoBySeed.get(seeds[1]);
      if (!teamA || !teamB) return;
      const winnerId = getSeriesWinner(teamA.teamId, teamB.teamId, 1);
      if (winnerId) {
        const winnerInfo = teamInfoById.get(winnerId);
        semiSlots[slot][index] = winnerInfo || null;
      }
    });

    const finalSlots: Array<{ teamId: string; name: string; logo: string; seed: number } | null> = [null, null];

    const semifinalSeries = [
      { teams: semiSlots.left, index: 0 },
      { teams: semiSlots.right, index: 1 },
    ];

    semifinalSeries.forEach(({ teams, index }) => {
      const teamA = teams[0];
      const teamB = teams[1];
      if (!teamA || !teamB) return;
      const winnerId = getSeriesWinner(teamA.teamId, teamB.teamId, 2);
      if (winnerId) {
        finalSlots[index] = teamInfoById.get(winnerId) || null;
      }
    });

    return { semi: semiSlots, final: finalSlots };
  }, [allMatchesMapped, hasKnockoutPlayoff, knockoutWinsNeeded, teamInfoById, teamInfoBySeed]);

  const matchDays = useMemo(() => {
    return regularMatches
      .reduce((acc: Record<string, any[]>, m: any) => {
        // Group strictly by effective gameday if available; otherwise by effective date
        const dateKey = new Date(m.date).toISOString().slice(0,10);
        const key = (typeof m.gameDay === 'number' && !Number.isNaN(m.gameDay)) ? `gd:${m.gameDay}` : `d:${dateKey}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(m);
        
        return acc;
      }, {} as Record<string, any[]>);
  }, [regularMatches]);
  const matchDayList = useMemo(() => {
    return Object.entries(matchDays)
      .map(([groupKey, items], idx) => {
        // derive gameday (if grouped by gd:), otherwise infer date label from earliest date
        const isGd = groupKey.startsWith('gd:');
        const gameDayNum = isGd ? Number(groupKey.slice(3)) : undefined;
        const earliest = items
          .map((x: any) => new Date(x.date).getTime())
          .reduce((min: number, t: number) => Math.min(min, t), Number.POSITIVE_INFINITY);
        const dateIso = new Date(earliest).toISOString();
        return ({
          id: (typeof gameDayNum === 'number' && !Number.isNaN(gameDayNum)) ? gameDayNum : (idx + 1),
          date: dateIso,
          round: (items[0] as any)?.round ?? (idx + 1),
          matches: items
            .sort((a: any, b: any) => (a.time ? new Date(a.time).getTime() : 0) - (b.time ? new Date(b.time).getTime() : 0) || ((a.table || 0) - (b.table || 0)))
            .map((m: any) => ({
              id: m.id,
              time: m.time ? new Date(m.time).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit'}) : '',
              tableNumber: m.table,
              round: m.round,
              isDelayed: m.isDelayed,
              originalDateRaw: m.originalDateRaw,
              originalTime: m.originalTime,
              originalTable: m.originalTable,
              originalRound: m.originalRound,
              delayedDate: m.delayedDate,
              delayedTime: m.delayedTime,
              delayedTable: m.delayedTable,
              delayedRound: m.delayedRound,
              delayedGameDay: m.delayedGameDay,
              homeTeam: { name: m.home, logo: m.homeLogo },
              awayTeam: { name: m.away, logo: m.awayLogo },
              homeScore: m.homeScore,
              awayScore: m.awayScore,
            }))
        });
      })
      .sort((a, b) => {
        // Primary: sort by numeric gameday id if both are numeric and not fallback-generated
        const isNumA = typeof a.id === 'number';
        const isNumB = typeof b.id === 'number';
        if (isNumA && isNumB) return (a.id as number) - (b.id as number);
        // Fallback: sort by date
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
  }, [matchDays]);

  // Group matches by round for collapsible sections
  const roundGroups = useMemo(() => {
    return (Array.isArray(leagueMatches) ? leagueMatches : [])
    .map((row: any) => ({
      id: row.match.id,
      round: Number(row.match.matchRound || 0) || 0,
      time: row.match.matchTime || row.match.matchAt,
      table: row.match.matchTable,
      date: row.match.matchDate || row.match.matchAt,
      home: row.homeTeam?.name || row.match.homeTeamId,
      homeLogo: abs(row.homeTeam?.logo) || '/elitelogo.png',
      away: row.awayTeam?.name || row.match.awayTeamId,
      awayLogo: abs(row.awayTeam?.logo) || '/elitelogo.png',
      homeScore: row.match.homeTeamScore,
      awayScore: row.match.awayTeamScore,
    }))
    .reduce((acc: Record<number, any[]>, m: any) => {
      const r = m.round || 0;
      if (!acc[r]) acc[r] = [];
      acc[r].push(m);
      return acc;
    }, {} as Record<number, any[]>);
  }, [leagueMatches, abs]);

  const roundList = useMemo(() => {
    return Object.entries(roundGroups)
    .map(([round, items]) => ({
      round: Number(round),
      matches: (items as any[])
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime() || (a.table - b.table))
        .map((m: any) => ({
          id: m.id,
          time: new Date(m.time).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit'}),
          tableNumber: m.table,
          date: new Date(m.date).toLocaleDateString(),
          homeTeam: { name: m.home, logo: m.homeLogo },
          awayTeam: { name: m.away, logo: m.awayLogo },
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          isOT: Math.max(Number(m.homeScore||0), Number(m.awayScore||0)) > 10 && Math.min(Number(m.homeScore||0), Number(m.awayScore||0)) >= 10,
        }))
    }))
    .sort((a, b) => a.round - b.round);
  }, [roundGroups]);

  const toggleRound = (key: string) => {
    setExpandedRounds((prev) => prev.includes(key) ? prev.filter(r => r !== key) : [...prev, key]);
  };

  // Early returns AFTER all hooks to maintain hook order
  if (!championshipId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#ff5c1a]"></div>
      </div>
    );
  }

  if (error || !championship) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Hiba történt az adatok betöltésekor!</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      {/* Championship Header */}
      <div className="flex items-center gap-6 mb-8">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#ff5c1a]">
          <Image
            src={abs(championship.logo) || "/elitelogo.png"}
            alt={championship.name}
            width={96}
            height={96}
            className="object-cover w-full h-full"
          />
        </div>
        <div>
          <h1 className={`${bebasNeue.className} text-4xl text-white`}>{championship.name}</h1>
          <div className="flex items-center gap-2">
            <span className="inline-block px-3 py-1 rounded-full bg-[#ff5c1a] text-white font-bold">
              {championship.isStarted ? (championship.phase === 'knockout' ? 'Knockout' : 'Regular') : 'Not started'}
            </span>
            {championship.isStarted && (
              <span className="inline-block px-3 py-1 rounded-full bg-black/40 text-white">
                {championship.phase === 'knockout' ? `Kör: ${championship.knockoutRound ?? 0}` : `Kör: ${championship.regularRound ?? 0}`}
          </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-8">
        {!championship.isStarted && (
          <button onClick={() => setStartModalOpen(true)} className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#ff5c1a] text-white hover:bg-[#ff7c3a] transition-colors">
            <FiTable className="w-5 h-5" /> Bajnokság indítása
        </button>
        )}
        <button
          onClick={async () => {
            try {
              const backend = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}`;
              const url = `${backend}/api/championship/${championshipId}/export/xlsx`;
              const res = await fetch(url, { credentials: 'include' });
              if (!res.ok) throw new Error('Export sikertelen');
              const blob = await res.blob();
              const a = document.createElement('a');
              a.href = window.URL.createObjectURL(blob);
              const name = `${(championship?.name || 'championship').replace(/[^\w\s\-_.]/g, '')}.xlsx`;
              a.download = name;
              document.body.appendChild(a);
              a.click();
              a.remove();
            } catch (e) {
              console.error(e);
              toast.error('Nem sikerült az export');
            }
          }}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#ff5c1a] text-white hover:bg-[#ff7c3a] transition-colors"
        >
          <FiDownload className="w-5 h-5" /> Export Championship
        </button>
        <button 
          onClick={() => setScriptModalOpen(true)} 
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#ff5c1a] text-white hover:bg-[#ff7c3a] transition-colors"
        >
          <FiTable className="w-5 h-5" /> Script Generálás
        </button>
        <button
          onClick={() => setExportImageOpen(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#ff5c1a] text-white hover:bg-[#ff7c3a] transition-colors"
        >
          <FiDownload className="w-5 h-5" /> Gameday Tabella Kép
        </button>
      </div>

      {/* Game Day MVP boxes under header buttons */}
      {championship?.isStarted && (
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {(mvpsData?.mvps || []).map((x: any, idx: number) => (
              <div key={`${x.gameDay ?? x.date ?? idx}`} className="relative overflow-hidden rounded-2xl p-5 border-2 border-[#ff5c1a] bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,92,26,0.18),transparent_40%),radial-gradient(120%_120%_at_100%_0%,rgba(0,119,255,0.14),transparent_45%),linear-gradient(120deg,#0a1d3f_0%,#06244e_100%)] shadow-[0_0_25px_0_rgba(255,92,26,0.35)] flex items-center justify-between">
                <div className="relative z-[1] min-w-0">
                  <div className="text-white/70 text-xs mb-1">Gameday {x.gameDay ?? ''} • {x.date ? new Date(x.date).toLocaleDateString() : ''}</div>
                  {x.mvp ? (
                    <>
                      <div className={`${bebasNeue.className} text-2xl md:text-3xl text-white tracking-wide`}>{x.mvp.name}</div>
                      <div className="text-[#ffb38f] font-medium">{x.mvp.teamName}</div>
                    </>
                  ) : (
                    <div className="text-white/60">Még nincs MVP (Függőben lévő meccs).</div>
                  )}
                </div>
                <div className="relative z-[1] w-14 h-14 rounded-full bg-[radial-gradient(circle_at_30%_30%,#ff7c3a,transparent_60%),radial-gradient(circle_at_70%_70%,#2f80ed,transparent_60%)] border-2 border-white/10 flex items-center justify-center shadow-[0_0_18px_rgba(255,92,26,0.35)]">
                  <svg xmlns='http://www.w3.org/2000/svg' className='w-6 h-6 text-white/90' viewBox='0 0 24 24' fill='currentColor'><path d='M12 2l2.39 4.84 5.34.78-3.86 3.76.91 5.32L12 14.77 7.22 16.7l.91-5.32L4.27 7.62l5.34-.78L12 2z'/></svg>
                </div>
                <div className="absolute inset-0 pointer-events-none opacity-40" />
              </div>
            ))}
          </div>
        </div>
      )}

      {shouldShowPlayoffTables && (
        <div className="space-y-6 mb-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className={`${bebasNeue.className} text-2xl text-white`}>
              Playoff házak
            </h3>
            {!playoffScheduled && (
              <button
                onClick={() => setGroupedModalOpen(true)}
                className="px-4 py-2 rounded bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white transition-colors"
              >
                Playoff sorsolás
              </button>
            )}
          </div>
          {renderHouseTable('Felső ház tabella', playoffGroups?.upper?.standings, 1)}
          {renderHouseMatches('Felső ház meccsei', playoffMatches?.upper)}
          {renderHouseTable('Alsó ház tabella', playoffGroups?.lower?.standings, (playoffGroups?.upper?.standings?.length || 0) + 1)}
          {renderHouseMatches('Alsó ház meccsei', playoffMatches?.lower)}
        </div>
      )}

      {/* Teams/Standings table */}
      <div className="bg-[#001a3a]/60 rounded-xl p-6 border border-[#ff5c1a]/30 mb-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <h3 className={`${bebasNeue.className} text-2xl text-white`}>{championship.isStarted ? 'Tabella' : 'Csapatok'}</h3>
          <div className="flex items-center gap-4">
            {showPlayoffTab && (
              <div className="flex items-center gap-2 bg-black/30 border border-[#ff5c1a]/40 rounded-full p-1">
                <button
                  onClick={() => setStandingsTab('regular')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${standingsTab === 'regular' ? 'bg-[#ff5c1a] text-white' : 'text-white/60 hover:text-white/80'}`}
                >
                  Alapszakasz
                </button>
                <button
                  onClick={() => setStandingsTab('playoff')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${standingsTab === 'playoff' ? 'bg-[#ff5c1a] text-white' : 'text-white/60 hover:text-white/80'}`}
                >
                  Playoff
                </button>
              </div>
            )}
            {!championship.isStarted && (
              <button onClick={() => setTeamModalOpen(true)} className="px-4 py-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white rounded">Kezelés</button>
            )}
          </div>
        </div>
        {championship.isStarted && standingsTab === 'regular' && (
          <div className="flex items-center justify-end mb-3 gap-2">
            <label className="text-white/70">Játéknap:</label>
            <select value={selectedDay} onChange={(e) => { setSelectedDay(e.target.value === 'all' ? 'all' : Number(e.target.value)); setUptoGameDay('all'); setUptoRound('all'); }} className="bg-black/40 text-white border border-white/20 rounded px-2 py-1">
              <option value="all">Összes</option>
              {Array.from(new Set((leagueMatches || []).map((rm: any) => rm.match.gameDay))).filter((x: any) => !!x).sort((a: any,b: any)=>a-b).map((g: number) => (
                <option key={`gd-${g}`} value={g}>Gameday {g}</option>
              ))}
            </select>
            <label className="text-white/70 ml-4">Játéknapig:</label>
            <select value={uptoGameDay} onChange={(e) => { setUptoGameDay(e.target.value === 'all' ? 'all' : Number(e.target.value)); setSelectedDay('all'); }} className="bg-black/40 text-white border border-white/20 rounded px-2 py-1">
              <option value="all">Összes</option>
              {Array.from(new Set((leagueMatches || []).map((rm: any) => rm.match.delayedGameDay || rm.match.gameDay))).filter((x: any) => !!x).sort((a: any,b: any)=>a-b).map((g: number) => (
                <option key={`gd-${g}`} value={g}>Gameday {g}</option>
              ))}
            </select>
            <label className="text-white/70 ml-4">Fordulóig:</label>
            <select value={uptoRound} onChange={(e) => { setUptoRound(e.target.value === 'all' ? 'all' : Number(e.target.value)); setSelectedDay('all'); setUptoGameDay('all'); }} className="bg-black/40 text-white border border-white/20 rounded px-2 py-1">
              <option value="all">Összes</option>
              {Array.from(new Set((leagueMatches || []).map((rm: any) => rm.match.matchRound))).filter((x: any) => !!x).sort((a: any,b: any)=>a-b).map((r: number) => (
                <option key={`rd-${r}`} value={r}>Forduló {r}</option>
              ))}
            </select>
      </div>
        )}
      <TeamAssignModal leagueId={championshipId!} isOpen={isTeamModalOpen} onClose={() => setTeamModalOpen(false)} onChanged={() => refetch()} />
        {!championship.isStarted ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#ff5c1a]/30">
              <thead>
                <tr className="text-left text-white">
                  <th className="py-3 pr-4">Logo</th>
                  <th className="py-3 pr-4">Név</th>
                  <th className="py-3 pr-4">Státusz</th>
                  <th className="py-3 pr-4">Játékosok</th>
                  <th className="py-3 pr-4">Meghívó</th>
                  <th className="py-3 pr-4">Örökös csapat</th>
                  <th className="py-3 pr-4 text-right">Műveletek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ff5c1a]/20">
                {(attachedTeams || []).map((t: any) => {
                const status: string | undefined = t._status;
                const color = status === 'approved' ? 'text-green-400' : status === 'declined' ? 'text-red-400' : 'text-yellow-400';
                const label = status === 'approved' ? 'Elfogadva' : status === 'declined' ? 'Elutasítva' : 'Függőben';
                const logo = abs(t.logo) || '/elitelogo.png';
                const invite = t._inviteSent ? `Kiküldve: ${new Date(t._inviteSentDate || t.updatedAt || Date.now()).toLocaleString()}` : 'Nincs kiküldve';
                return (
                  <tr key={`row-${t.id}`} className="text-white">
                    <td className="py-2 pr-4">
                      <Image src={logo} alt={t.name} width={36} height={36} className="rounded-full border border-white/10" />
                    </td>
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/teams/${t.id}/view`)}
                        className="underline-offset-2 hover:underline"
                        title="Csapat megnyitása"
                      >
                        {t.name}
                      </button>
                    </td>
                    <td className={`py-2 pr-4 ${color}`}>{label}</td>
                    <td className="py-2 pr-4">{t._playersCount ?? 0}</td>
                    <td className="py-2 pr-4">{invite}</td>
                    <td className="py-2 pr-4">{t._status === 'declined' ? (t._heirTeamName || '-') : '-'}</td>
                    <td className="py-2 pr-4">
                      <div className="flex justify-end">
                        <button
                          onClick={(e) => {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            if (activeRow === t.id) {
                              setActiveRow(null);
                              setMenuAnchor(null);
                            } else {
                              setActiveRow(t.id as string);
                              setMenuAnchor(rect);
                            }
                          }}
                          className="p-2 hover:bg-[#ff5c1a]/10 rounded-lg transition-colors"
                          aria-label="Műveletek"
                        >
                          <FiMoreVertical className="w-5 h-5 text-[#ff5c1a]" />
                        </button>
                        {activeRow === t.id && menuAnchor && (
                          <ActionMenu
                            anchorRect={menuAnchor}
                            onView={() => { setActiveRow(null); setMenuAnchor(null); router.push(`/admin/teams/${t.id}/view`); }}
                            onInvite={async () => {
                              try {
                                await sendInvite({ leagueTeamId: t._leagueTeamId }).unwrap();
                                toast.success('Meghívó kiküldve');
                                await refetch();
                              } catch (e: any) {
                                const msg = e?.data?.message || e?.error || e?.message || 'Nem sikerült a meghívó küldése';
                                toast.error(String(msg));
                              } finally {
                                setActiveRow(null); setMenuAnchor(null);
                              }
                            }}
                            inviteLabel={t._inviteSent ? 'Meghívó újraküldése' : 'Meghívó kiküldése'}
                            onRemove={async () => { try { await removeTeam({ leagueId: championshipId!, teamId: t.id }).unwrap(); await refetch(); } finally { setActiveRow(null); setMenuAnchor(null); } }}
                            onClose={() => { setActiveRow(null); setMenuAnchor(null); }}
                          />
                        )}
              </div>
                    </td>
                  </tr>
                );
                })}
                {(!attachedTeams || attachedTeams.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-4 text-white/70">Nincs hozzárendelt csapat</td>
                  </tr>
                )}
              </tbody>
            </table>
              </div>
        ) : standingsTab === 'playoff' && hasKnockoutPlayoff ? (
          // Knockout bracket display
          <div className="py-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1"></div>
                <h2 className={`${bebasNeue.className} text-4xl md:text-5xl text-white mb-2 tracking-wider flex-1 text-center`}>
                  PLAYOFF
                </h2>
                <div className="flex-1 flex justify-end">
                  {(() => {
                    // Check if matches for current round are already generated
                    const roundGameDayMap: Record<'quarter' | 'semi' | 'final', number> = {
                      quarter: 1,
                      semi: 2,
                      final: 3,
                    };
                    const selectedGameDay = roundGameDayMap[playoffRoundTab];
                    const hasMatchesForRound = allMatchesMapped.some((m: any) => {
                      if (!m.isPlayoffMatch) return false;
                      // Use delayedGameDay if available, otherwise use gameDay
                      const effectiveGameDay = (typeof m.delayedGameDay === 'number' && !Number.isNaN(m.delayedGameDay)) 
                        ? m.delayedGameDay 
                        : (typeof m.gameDay === 'number' && !Number.isNaN(m.gameDay) ? m.gameDay : null);
                      return effectiveGameDay === selectedGameDay;
                    });
                    
                    // Show button only if regular matches are completed AND no matches exist for current round
                    return allRegularMatchesCompleted && !hasMatchesForRound && (
                      <button
                        onClick={() => setKnockoutModalOpen(true)}
                        className="px-4 py-2 rounded bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white transition-colors text-sm"
                      >
                        Meccs generálás
                      </button>
                    );
                  })()}
                </div>
              </div>
              <div className={`${bebasNeue.className} text-white text-lg md:text-xl mb-6`}>
                {(championship as any)?.name?.toUpperCase() || 'ELITE'}
              </div>
              
              {/* Round subtabs */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <button
                  onClick={() => setPlayoffRoundTab('quarter')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    playoffRoundTab === 'quarter' 
                      ? 'bg-[#ff5c1a] text-white' 
                      : 'bg-black/40 text-white/60 hover:text-white/80 border border-[#ff5c1a]/30'
                  }`}
                >
                  Negyeddöntő
                </button>
                <button
                  onClick={() => setPlayoffRoundTab('semi')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    playoffRoundTab === 'semi' 
                      ? 'bg-[#ff5c1a] text-white' 
                      : 'bg-black/40 text-white/60 hover:text-white/80 border border-[#ff5c1a]/30'
                  }`}
                >
                  Elődöntő
                </button>
                <button
                  onClick={() => setPlayoffRoundTab('final')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    playoffRoundTab === 'final' 
                      ? 'bg-[#ff5c1a] text-white' 
                      : 'bg-black/40 text-white/60 hover:text-white/80 border border-[#ff5c1a]/30'
                  }`}
                >
                  Döntő
                </button>
              </div>
            </div>
            {knockoutBracketData ? (
              <div className="flex flex-col items-center gap-8">
                {/* Bracket structure - two columns with better spacing, or single centered column for finals */}
                <div className={`grid ${playoffRoundTab === 'final' ? 'grid-cols-1 max-w-4xl' : 'grid-cols-2 gap-8 md:gap-16 lg:gap-24'} w-full max-w-6xl`}>
                  {/* Left column */}
                  <div className={`space-y-6 ${playoffRoundTab === 'final' ? 'mx-auto min-w-[450px]' : ''}`}>
                    {(() => {
                      let leftSeeds: number[] = [];
                      let teamsToShow: number = 0;
                      
                      if (playoffRoundTab === 'quarter') {
                        // Quarterfinals: seeds 1, 8, 5, 4
                        leftSeeds = [1, 8, 5, 4].filter(seed => seed <= knockoutBracketData.teams.length);
                        teamsToShow = leftSeeds.length;
                      } else if (playoffRoundTab === 'semi') {
                        // Semifinals: 2 empty positions
                        teamsToShow = 2;
                      } else if (playoffRoundTab === 'final') {
                        // Finals: 2 teams in a pair
                        teamsToShow = 2;
                      }
                      
                      // Group teams into pairs for matchups
                      const pairs: Array<Array<{index: number, team: typeof knockoutBracketData.teams[0] | null, seed: number | null}>> = [];
                      for (let i = 0; i < teamsToShow; i += 2) {
                        const pair = [];
                        for (let j = 0; j < 2 && i + j < teamsToShow; j++) {
                          let team: typeof knockoutBracketData.teams[0] | null = null;
                          let seed: number | null = null;
                          
                          if (playoffRoundTab === 'quarter') {
                            seed = leftSeeds[i + j];
                            team = knockoutBracketData.teams.find(t => t.seed === seed) || null;
                          } else if (playoffRoundTab === 'semi') {
                            const advancers = knockoutAdvancers?.semi?.left || [];
                            team = advancers[i + j] || null;
                            seed = team?.seed ?? null;
                          } else if (playoffRoundTab === 'final') {
                            const finalTeams = knockoutAdvancers?.final || [];
                            const finalTeam = finalTeams[j] || null;
                            team = finalTeam;
                            seed = finalTeam?.seed ?? null;
                          }
                          
                          pair.push({ index: i + j, team, seed });
                        }
                        pairs.push(pair);
                      }
                      
                      return pairs.map((pair, pairIndex) => {
                        const isAfterFirstMatchup = playoffRoundTab === 'quarter' && pairIndex === 0;
                        
                        // Find matching matchup from knockoutMatchups
                        const matchup = pair.length === 2 && pair[0].team && pair[1].team
                          ? knockoutMatchups.find((m: any) => {
                              const teamIds = [pair[0].team!.teamId, pair[1].team!.teamId].sort();
                              const matchupTeamIds = [m.homeTeamId, m.awayTeamId].sort();
                              return teamIds[0] === matchupTeamIds[0] && teamIds[1] === matchupTeamIds[1];
                            })
                          : null;
                        
                        // Determine which team in pair corresponds to home/away in matchup (for first match)
                        let pairTeam0IsHome = true;
                        if (matchup && pair[0].team && pair[1].team) {
                          pairTeam0IsHome = matchup.homeTeamId === pair[0].team.teamId;
                        }
                        
                        // Calculate series stats - wins for each team in the pair
                        // IMPORTANT: On the main scoreboard, pair[0] is always HOME, pair[1] is always AWAY
                        // But matches alternate: odd matches (1,3,5,7) = pair[0] home, even matches (2,4,6) = pair[1] home
                        let team0Wins = 0; // pair[0] wins (always displayed as home on main scoreboard)
                        let team1Wins = 0; // pair[1] wins (always displayed as away on main scoreboard)
                        let completedMatches = 0;
                        if (matchup && matchup.matches) {
                          matchup.matches.forEach((match: any, matchIdx: number) => {
                            if (match.homeScore !== null && match.awayScore !== null) {
                              completedMatches++;
                              const homeScore = match.homeScore;
                              const awayScore = match.awayScore;
                              
                              // Determine which team is home for this specific match
                              // Match numbers: 1,3,5,7 (odd) = pair[0] home, 2,4,6 (even) = pair[1] home
                              const matchNumber = matchIdx + 1; // 1-indexed
                              const isOddMatch = matchNumber % 2 === 1;
                              const isTeam0HomeThisMatch = isOddMatch ? pairTeam0IsHome : !pairTeam0IsHome;
                              
                              // Count wins: always count from pair[0] perspective (pair[0] = home on main scoreboard)
                              if (homeScore > awayScore) {
                                // Home team won this match
                                if (isTeam0HomeThisMatch) {
                                  team0Wins++; // pair[0] won (they were home this match)
                                } else {
                                  team1Wins++; // pair[1] won (they were home this match)
                                }
                              } else if (awayScore > homeScore) {
                                // Away team won this match
                                if (isTeam0HomeThisMatch) {
                                  team1Wins++; // pair[1] won (they were away this match)
                                } else {
                                  team0Wins++; // pair[0] won (they were away this match)
                                }
                              }
                            }
                          });
                        }
                        
                        return (
                          <div key={pairIndex} className={`relative ${isAfterFirstMatchup ? 'mb-20' : ''}`}>
                            {pair.map((item, itemIndex) => {
                              const isEmpty = !item.team;
                              return (
                                <div key={item.index} className={`relative ${itemIndex === 0 ? 'mb-3' : ''}`}>
                                  <div className={`bg-gradient-to-r from-[#ff5c1a]/20 via-[#ff5c1a]/10 to-transparent rounded-xl border-2 border-[#ff5c1a]/60 p-4 min-h-[110px] md:min-h-[90px] flex flex-col justify-center ${isEmpty ? 'opacity-50' : 'hover:border-[#ff5c1a] hover:shadow-lg hover:shadow-[#ff5c1a]/30'} transition-all`}>
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {item.seed && (
                                          <span className={`${bebasNeue.className} text-[#ff5c1a] font-bold text-xl flex-shrink-0`}>
                                            {item.seed}.
                                          </span>
                                        )}
                                        <span className={`${bebasNeue.className} text-white font-semibold text-lg md:text-xl truncate tracking-wide ${isEmpty ? 'text-white/40' : ''}`}>
                                          {item.team ? item.team.name.toUpperCase() : '-'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3 flex-shrink-0">
                                        {/* Main result score - to the left of logo */}
                                        {matchup && matchup.matches && matchup.matches.length > 0 && itemIndex === 0 && (
                                          <span className={`${bebasNeue.className} text-3xl md:text-4xl font-bold ${team0Wins > team1Wins ? 'text-[#ff5c1a]' : 'text-white/60'}`}>
                                            {team0Wins}
                                          </span>
                                        )}
                                        {matchup && matchup.matches && matchup.matches.length > 0 && itemIndex === 1 && (
                                          <span className={`${bebasNeue.className} text-3xl md:text-4xl font-bold ${team1Wins > team0Wins ? 'text-[#ff5c1a]' : 'text-white/60'}`}>
                                            {team1Wins}
                                          </span>
                                        )}
                                        {item.team && (
                                          <Image 
                                            src={item.team.logo || '/elitelogo.png'} 
                                            alt={item.team.name} 
                                            width={48} 
                                            height={48} 
                                            className="object-contain w-12 h-12 md:w-14 md:h-14"
                                          />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {itemIndex === 0 && pair.length === 2 && (
                                    <>
                                      
                                      {/* Match results display */}
                                      {matchup && matchup.matches && matchup.matches.length > 0 && (
                                        <div className="pt-3">
                                          <div className="flex items-center justify-center gap-2 text-sm text-white/80">
                                            <span className="text-white/60">
                                              {matchup.matches.slice(0, 7).map((match: any, matchIdx: number) => {
                                                const isCompleted = match.homeScore !== null && match.awayScore !== null;
                                                const homeScore = match.homeScore;
                                                const awayScore = match.awayScore;
                                                
                                                // Determine which team is home for this specific match
                                                const matchNumber = matchIdx + 1;
                                                const isOddMatch = matchNumber % 2 === 1;
                                                const isTeam0HomeThisMatch = isOddMatch ? pairTeam0IsHome : !pairTeam0IsHome;
                                                
                                                // Display score always in pair[0] - pair[1] order (as shown on main scoreboard)
                                                // But we need to check which team was actually home/away in this match
                                                let displayScore0, displayScore1;
                                                if (isTeam0HomeThisMatch) {
                                                  // pair[0] was home this match: homeScore is pair[0], awayScore is pair[1]
                                                  displayScore0 = homeScore ?? 0;
                                                  displayScore1 = awayScore ?? 0;
                                                } else {
                                                  // pair[1] was home this match: homeScore is pair[1], awayScore is pair[0]
                                                  // But we want to display as pair[0] - pair[1], so swap
                                                  displayScore0 = awayScore ?? 0;
                                                  displayScore1 = homeScore ?? 0;
                                                }
                                                
                                                return (
                                                  <span key={matchIdx}>
                                                    {displayScore0}-{displayScore1}
                                                    {matchIdx < Math.min(matchup.matches.length, 7) - 1 ? ', ' : ''}
                                                  </span>
                                                );
                                              })}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      });
                    })()}
                  </div>
                  {/* Right column */}
                  <div className="space-y-6">
                    {(() => {
                      let rightSeeds: number[] = [];
                      let teamsToShow: number = 0;
                      
                      if (playoffRoundTab === 'quarter') {
                        // Quarterfinals: seeds 3, 6, 7, 2
                        rightSeeds = [3, 6, 7, 2].filter(seed => seed <= knockoutBracketData.teams.length);
                        teamsToShow = rightSeeds.length;
                      } else if (playoffRoundTab === 'semi') {
                        // Semifinals: 2 empty positions
                        teamsToShow = 2;
                      } else if (playoffRoundTab === 'final') {
                        // Finals: no teams in right column (all in left)
                        teamsToShow = 0;
                      }
                      
                      // Group teams into pairs for matchups
                      const pairs: Array<Array<{index: number, team: typeof knockoutBracketData.teams[0] | null, seed: number | null}>> = [];
                      for (let i = 0; i < teamsToShow; i += 2) {
                        const pair = [];
                        for (let j = 0; j < 2 && i + j < teamsToShow; j++) {
                          let team: typeof knockoutBracketData.teams[0] | null = null;
                          let seed: number | null = null;
                          
                          if (playoffRoundTab === 'quarter') {
                            seed = rightSeeds[i + j];
                            team = knockoutBracketData.teams.find(t => t.seed === seed) || null;
                          } else if (playoffRoundTab === 'semi') {
                            const advancers = knockoutAdvancers?.semi?.right || [];
                            team = advancers[i + j] || null;
                            seed = team?.seed ?? null;
                          } else if (playoffRoundTab === 'final') {
                            // Finals: no teams in right column
                            team = null;
                            seed = null;
                          }
                          
                          pair.push({ index: i + j, team, seed });
                        }
                        pairs.push(pair);
                      }
                      
                      return pairs.map((pair, pairIndex) => {
                        const isAfterFirstMatchup = playoffRoundTab === 'quarter' && pairIndex === 0;
                        
                        // Find matching matchup from knockoutMatchups
                        const matchup = pair.length === 2 && pair[0].team && pair[1].team
                          ? knockoutMatchups.find((m: any) => {
                              const teamIds = [pair[0].team!.teamId, pair[1].team!.teamId].sort();
                              const matchupTeamIds = [m.homeTeamId, m.awayTeamId].sort();
                              return teamIds[0] === matchupTeamIds[0] && teamIds[1] === matchupTeamIds[1];
                            })
                          : null;
                        
                        // Determine which team in pair corresponds to home/away in matchup (for first match)
                        let pairTeam0IsHome = true;
                        if (matchup && pair[0].team && pair[1].team) {
                          pairTeam0IsHome = matchup.homeTeamId === pair[0].team.teamId;
                        }
                        
                        // Calculate series stats - wins for each team in the pair
                        // IMPORTANT: On the main scoreboard, pair[0] is always HOME, pair[1] is always AWAY
                        // But matches alternate: odd matches (1,3,5,7) = pair[0] home, even matches (2,4,6) = pair[1] home
                        let team0Wins = 0; // pair[0] wins (always displayed as home on main scoreboard)
                        let team1Wins = 0; // pair[1] wins (always displayed as away on main scoreboard)
                        let completedMatches = 0;
                        if (matchup && matchup.matches) {
                          matchup.matches.forEach((match: any, matchIdx: number) => {
                            if (match.homeScore !== null && match.awayScore !== null) {
                              completedMatches++;
                              const homeScore = match.homeScore;
                              const awayScore = match.awayScore;
                              
                              // Determine which team is home for this specific match
                              // Match numbers: 1,3,5,7 (odd) = pair[0] home, 2,4,6 (even) = pair[1] home
                              const matchNumber = matchIdx + 1; // 1-indexed
                              const isOddMatch = matchNumber % 2 === 1;
                              const isTeam0HomeThisMatch = isOddMatch ? pairTeam0IsHome : !pairTeam0IsHome;
                              
                              // Count wins: always count from pair[0] perspective (pair[0] = home on main scoreboard)
                              if (homeScore > awayScore) {
                                // Home team won this match
                                if (isTeam0HomeThisMatch) {
                                  team0Wins++; // pair[0] won (they were home this match)
                                } else {
                                  team1Wins++; // pair[1] won (they were home this match)
                                }
                              } else if (awayScore > homeScore) {
                                // Away team won this match
                                if (isTeam0HomeThisMatch) {
                                  team1Wins++; // pair[1] won (they were away this match)
                                } else {
                                  team0Wins++; // pair[0] won (they were away this match)
                                }
                              }
                            }
                          });
                        }
                        
                        return (
                          <div key={pairIndex} className={`relative ${isAfterFirstMatchup ? 'mb-20' : ''}`}>
                            {pair.map((item, itemIndex) => {
                              const isEmpty = !item.team;
                              return (
                                <div key={item.index} className={`relative ${itemIndex === 0 ? 'mb-3' : ''}`}>
                                  <div className={`bg-gradient-to-r from-transparent via-[#ff5c1a]/10 to-[#ff5c1a]/20 rounded-xl border-2 border-[#ff5c1a]/60 p-4 min-h-[90px] md:min-h-[90px] flex flex-col justify-center ${isEmpty ? 'opacity-50' : 'hover:border-[#ff5c1a] hover:shadow-lg hover:shadow-[#ff5c1a]/30'} transition-all`}>
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {item.seed && (
                                          <span className={`${bebasNeue.className} text-[#ff5c1a] font-bold text-xl flex-shrink-0`}>
                                            {item.seed}.
                                          </span>
                                        )}
                                        <span className={`${bebasNeue.className} text-white font-semibold text-lg md:text-xl truncate tracking-wide ${isEmpty ? 'text-white/40' : ''}`}>
                                          {item.team ? item.team.name.toUpperCase() : '-'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3 flex-shrink-0">
                                        {/* Main result score - to the left of logo */}
                                        {matchup && matchup.matches && matchup.matches.length > 0 && itemIndex === 0 && (
                                          <span className={`${bebasNeue.className} text-3xl md:text-4xl font-bold ${team0Wins > team1Wins ? 'text-[#ff5c1a]' : 'text-white/60'}`}>
                                            {team0Wins}
                                          </span>
                                        )}
                                        {matchup && matchup.matches && matchup.matches.length > 0 && itemIndex === 1 && (
                                          <span className={`${bebasNeue.className} text-3xl md:text-4xl font-bold ${team1Wins > team0Wins ? 'text-[#ff5c1a]' : 'text-white/60'}`}>
                                            {team1Wins}
                                          </span>
                                        )}
                                        {item.team && (
                                          <Image 
                                            src={item.team.logo || '/elitelogo.png'} 
                                            alt={item.team.name} 
                                            width={48} 
                                            height={48} 
                                            className="object-contain w-12 h-12 md:w-14 md:h-14"
                                          />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {itemIndex === 0 && pair.length === 2 && (
                                    <>
                                     
                                      {/* Match results display */}
                                      {matchup && matchup.matches && matchup.matches.length > 0 && (
                                        <div className=" pt-3">
                                          <div className="flex items-center justify-center gap-2 text-sm text-white/80">
                                            <span className="text-white/60">
                                              {matchup.matches.slice(0, 7).map((match: any, matchIdx: number) => {
                                                const isCompleted = match.homeScore !== null && match.awayScore !== null;
                                                const homeScore = match.homeScore;
                                                const awayScore = match.awayScore;
                                                
                                                // Determine which team is home for this specific match
                                                const matchNumber = matchIdx + 1;
                                                const isOddMatch = matchNumber % 2 === 1;
                                                const isTeam0HomeThisMatch = isOddMatch ? pairTeam0IsHome : !pairTeam0IsHome;
                                                
                                                // Display score always in pair[0] - pair[1] order (as shown on main scoreboard)
                                                // But we need to check which team was actually home/away in this match
                                                let displayScore0, displayScore1;
                                                if (isTeam0HomeThisMatch) {
                                                  // pair[0] was home this match: homeScore is pair[0], awayScore is pair[1]
                                                  displayScore0 = homeScore ?? 0;
                                                  displayScore1 = awayScore ?? 0;
                                                } else {
                                                  // pair[1] was home this match: homeScore is pair[1], awayScore is pair[0]
                                                  // But we want to display as pair[0] - pair[1], so swap
                                                  displayScore0 = awayScore ?? 0;
                                                  displayScore1 = homeScore ?? 0;
                                                }
                                                
                                                return (
                                                  <span key={matchIdx}>
                                                    {displayScore0}-{displayScore1}
                                                    {matchIdx < Math.min(matchup.matches.length, 7) - 1 ? ', ' : ''}
                                                  </span>
                                                );
                                              })}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-white/60">A playoff bracket betöltése...</div>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#ff5c1a]/30">
              <thead>
                <tr className="text-left text-white">
                  <th className="py-3 pr-4">#</th>
                  <th className="py-3 pr-4">Csapat</th>
                  <th className="py-3 pr-4">Meccs</th>
                  <th className="py-3 pr-4">GY</th>
                  <th className="py-3 pr-4">V</th>
                  <th className="py-3 pr-4">Győzelem</th>
                  <th className="py-3 pr-4">Győzelem (h)</th>
                  <th className="py-3 pr-4">Vereség (h)</th>
                  <th className="py-3 pr-4">Vereség</th>
                  <th className="py-3 pr-4">PK</th>
                  <th className="py-3 pr-4">Pont</th>
                  <th className="py-3 pr-4">Forma</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ff5c1a]/20">
                {(() => {
                  let source = selectedDay === 'all' ? standingsData?.standings : standingsByDay?.standings;
                  if (uptoGameDay !== 'all') source = standingsUpto?.standings;
                  if (uptoRound !== 'all') source = standingsUptoRound?.standings;
                  const rows = (source && source.length > 0)
                    ? source
                    : (attachedTeams || []).map((t: any, idx: number) => ({
                        rank: idx + 1,
                        teamId: t.id,
                        name: t.name,
                        logo: abs(t.logo),
                        games: 0,
                        winsTotal: 0,
                        lossesTotal: 0,
                        winsRegular: 0,
                        winsOT: 0,
                        lossesOT: 0,
                        lossesRegular: 0,
                        cupDiff: 0,
                        points: 0,
                      }));
                  // compute movement if uptoGameDay is selected
                  const prevMap = new Map<string, number>();
                  if (uptoRound !== 'all') {
                    if (standingsPrevRound?.standings?.length) standingsPrevRound.standings.forEach((p: any) => prevMap.set(p.teamId, p.rank));
                  } else if (standingsPrev?.standings?.length) {
                    standingsPrev.standings.forEach((p: any) => prevMap.set(p.teamId, p.rank));
                  }
                  return rows.map((s: any) => {
                    const prevRank = prevMap.get(s.teamId);
                    let moveIcon: React.ReactNode = null;
                    let delta: number | null = null;
                    if (prevRank && s.rank) {
                      delta = prevRank - s.rank; // +: improved (went up)
                      if (delta > 0) moveIcon = <FiArrowUp className="text-green-400" />;
                      else if (delta < 0) moveIcon = <FiArrowDown className="text-red-400" />;
                      else moveIcon = <FiMinus className="text-white/50" />;
                    }
                    // compute last 5 form from leagueMatches, respecting filters (day/uptoDay/uptoRound)
                    const allMatches = (leagueMatches || []) as any[];
                    const baseTeamMatches = allMatches
                      .filter((row: any) => row.match.matchStatus === 'completed' && (row.match.homeTeamId === s.teamId || row.match.awayTeamId === s.teamId));
                    const formatKey = (d: any) => d ? new Date(d).toISOString().slice(0,10) : '';
                    let teamMatches = baseTeamMatches;
                    if (uptoRound !== 'all') {
                      teamMatches = teamMatches.filter((row: any) => Number(row.match.matchRound || 0) <= Number(uptoRound));
                    } else if (uptoGameDay !== 'all') {
                      teamMatches = teamMatches.filter((row: any) => Number((row.match.delayedGameDay || row.match.gameDay) || 0) <= Number(uptoGameDay));
                    } else if (selectedDay !== 'all') {
                      teamMatches = teamMatches.filter((row: any) => Number(row.match.gameDay || 0) === Number(selectedDay));
                    }
                    teamMatches = teamMatches.sort((a: any, b: any) => new Date(a.match.matchDate || a.match.matchAt || a.match.createdAt).getTime() - new Date(b.match.matchDate || b.match.matchAt || b.match.createdAt).getTime());
                    const last5 = teamMatches.slice(-5).map((m: any) => {
                      const isHome = m.match.homeTeamId === s.teamId;
                      const oppName = isHome ? (m.awayTeam?.name || m.match.awayTeamId) : (m.homeTeam?.name || m.match.homeTeamId);
                      const hs = Number(m.match.homeTeamScore || 0);
                      const as = Number(m.match.awayTeamScore || 0);
                      const win = isHome ? hs > as : as > hs;
                      const maxS = Math.max(hs, as);
                      const minS = Math.min(hs, as);
                      const ot = maxS > 10 && minS >= 10;
                      const code = win ? (ot ? 'GYH' : 'GY') : (ot ? 'VH' : 'V');
                      const color = win ? (ot ? 'bg-green-600/60' : 'bg-green-600') : (ot ? 'bg-red-600/60' : 'bg-red-600');
                      const border = '';
                      const dateStr = (m.match.matchDate || m.match.matchAt) ? new Date(m.match.matchDate || m.match.matchAt).toLocaleDateString() : '';
                      const score = `${hs} : ${as}`;
                      const title = `${score} (${isHome ? s.name : oppName} - ${isHome ? oppName : s.name})\n${dateStr}`;
                      return { code, color, border, title };
                    });
                    return (
                    <tr key={s.teamId} className="text-white">
                      <td className="py-2 pr-4">{s.rank}</td>
                      <td className="py-2 pr-4 flex items-center gap-2">
                        <Image src={abs(s.logo) || '/elitelogo.png'} alt={s.name} width={24} height={24} className="rounded-full border border-white/10" />
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/teams/${s.teamId}/view`)}
                          className="underline-offset-2 hover:underline cursor-pointer"
                          title="Csapat megnyitása"
                        >
                          {s.name}
                        </button>
                        {(uptoGameDay !== 'all' || uptoRound !== 'all') && moveIcon && (
                          <span className="ml-2 inline-flex items-center gap-1">
                            {moveIcon}
                            <span className={delta && delta > 0 ? 'text-green-400' : delta && delta < 0 ? 'text-red-400' : 'text-white/50'}>
                              {delta ? (delta > 0 ? `+${delta}` : `${delta}`) : '0'}
                            </span>
                          </span>
                        )}
                      </td>
                    <td className="py-2 pr-4">{s.games ?? 0}</td>
                    <td className="py-2 pr-4">{s.winsTotal ?? 0}</td>
                    <td className="py-2 pr-4">{s.lossesTotal ?? 0}</td>
                    <td className="py-2 pr-4">{s.winsRegular ?? 0}</td>
                    <td className="py-2 pr-4">{s.winsOT ?? 0}</td>
                    <td className="py-2 pr-4">{s.lossesOT ?? 0}</td>
                    <td className="py-2 pr-4">{s.lossesRegular ?? 0}</td>
                    <td className="py-2 pr-4">{s.cupDiff ?? 0}</td>
                    <td className="py-2 pr-4">{s.points ?? 0}</td>
                      <td className="py-2 pr-4">
                        <Tooltip.Provider delayDuration={100}>
                          <div className="flex items-center gap-1">
                            {last5.length === 0 ? (
                              <span className="text-white/50">-</span>
                            ) : last5.map((it, i) => (
                              <Tooltip.Root key={i}>
                                <Tooltip.Trigger asChild>
                                  <button
                                    type="button"
                                    className={`inline-flex items-center justify-center rounded ${it.color} ${it.border} text-[9px] leading-none w-6 h-6 text-white`}
                                  >
                                    {it.code}
                                  </button>
                                </Tooltip.Trigger>
                                <Tooltip.Content side="top" sideOffset={6} className="rounded bg-black/80 text-white text-xs px-2 py-1 shadow">
                                  {it.title}
                                  <Tooltip.Arrow className="fill-black/80" />
                                </Tooltip.Content>
                              </Tooltip.Root>
                            ))}
                          </div>
                        </Tooltip.Provider>
                      </td>
                    </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
            </div>
        )}
      </div>

      <StartModal id={championshipId!} isOpen={isStartModalOpen} onClose={() => setStartModalOpen(false)} teamNames={(attachedTeams || []).map((t: any) => t.name)} />
      
      <ScriptModal 
        isOpen={isScriptModalOpen} 
        onClose={() => setScriptModalOpen(false)} 
        leagueMatches={leagueMatches || []}
        championship={championship}
      />
      <GroupedPlayoffModal
        leagueId={championshipId!}
        isOpen={isGroupedModalOpen}
        onClose={() => setGroupedModalOpen(false)}
        playoffGroups={playoffGroups}
      />

      <KnockoutPlayoffModal
        leagueId={championshipId!}
        isOpen={isKnockoutModalOpen}
        onClose={() => setKnockoutModalOpen(false)}
        onSuccess={() => {
          refetchMatches();
          refetchStandings();
        }}
      />

      {/* Export Image Modal */}
      {isExportImageOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={()=>{
            setExportImageOpen(false);
            if (previewImageUrl) {
              window.URL.revokeObjectURL(previewImageUrl);
              setPreviewImageUrl(null);
            }
          }} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0b1221] border-2 border-[#ff5c1a] rounded-xl p-6 w-[90vw] max-w-md">
            <div className={`${bebasNeue.className} text-2xl text-white mb-4`}>Gameday Tabella Kép</div>
            <div className="space-y-4">
              <label className="block text-white/80">Válassz játéknapot</label>
              <select
                value={String(exportGameday)}
                onChange={(e) => setExportGameday(e.target.value === 'latest' ? 'latest' as any : Number(e.target.value))}
                className="w-full bg-black/40 border border-white/20 rounded px-3 py-2 text-white"
              >
                <option value="latest">Legutóbbi játéknap</option>
                {Array.from(new Set((leagueMatches || []).map((rm: any) => rm.match.delayedGameDay || rm.match.gameDay))).filter((x:any)=>!!x).sort((a:any,b:any)=>a-b).map((g:number)=> (
                  <option key={`ex-gd-${g}`} value={g}>{g}. játéknap</option>
                ))}
              </select>
              <div className="pt-2">
                <label className="block text-white/80 mb-1">Címke típus</label>
                <select
                  value={mvpLabelType}
                  onChange={(e)=>setMvpLabelType(e.target.value as 'GAMEDAY MVP' | 'TOP PERFORMER')}
                  className="w-full bg-black/40 border border-white/20 rounded px-3 py-2 text-white mb-3"
                >
                  <option value="GAMEDAY MVP">GAMEDAY MVP</option>
                  <option value="TOP PERFORMER">TOP PERFORMER</option>
                </select>
                <label className="block text-white/80 mb-1">Gameday MVP játékos</label>
                <select
                  value={mvpPlayerId}
                  onChange={(e)=>setMvpPlayerId(e.target.value)}
                  className="w-full bg-black/40 border border-white/20 rounded px-3 py-2 text-white"
                >
                  <option value="">(nincs kiválasztva)</option>
                  <option value="no-player">Még nincs játékos</option>
                  {playersForExport.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                <p className="text-xs text-white/50 mt-1">Lista a bajnokság csapatainak játékosaiból</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async ()=>{
                    try {
                      setIsGeneratingImage(true);
                      const days = Array.from(new Set((leagueMatches || []).map((rm: any) => rm.match.delayedGameDay || rm.match.gameDay))).filter((x:any)=>!!x).sort((a:any,b:any)=>a-b);
                      const gd = exportGameday === 'latest' ? (days[days.length-1] || 1) : exportGameday;
                      const backend = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}`;
                      const params = new URLSearchParams();
                      if (mvpPlayerId) params.set('mvpPlayerId', mvpPlayerId);
                      if (mvpLabelType) params.set('mvpLabel', mvpLabelType);
                      const url = `${backend}/api/championship/${championshipId}/standings/gameday/${gd}/image${params.toString() ? `?${params.toString()}` : ''}`;
                      const res = await fetch(url, { credentials: 'include' });
                      if (!res.ok) throw new Error('Kép generálás sikertelen');
                      const blob = await res.blob();
                      const previewUrl = window.URL.createObjectURL(blob);
                      setPreviewImageUrl(previewUrl);
                    } catch (e) { console.error(e); toast.error('Nem sikerült a kép generálása'); }
                    finally { setIsGeneratingImage(false); }
                  }}
                  disabled={isGeneratingImage}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white rounded px-4 py-2 flex items-center justify-center gap-2"
                >
                  {isGeneratingImage ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generálás...
                    </>
                  ) : (
                    'Előnézet'
                  )}
                </button>
                <button
                  onClick={async ()=>{
                    try {
                      if (!previewImageUrl) {
                        toast.error('Először generálj előnézetet!');
                        return;
                      }
                      const days = Array.from(new Set((leagueMatches || []).map((rm: any) => rm.match.delayedGameDay || rm.match.gameDay))).filter((x:any)=>!!x).sort((a:any,b:any)=>a-b);
                      const gd = exportGameday === 'latest' ? (days[days.length-1] || 1) : exportGameday;
                      const a = document.createElement('a');
                      a.href = previewImageUrl;
                      a.download = `${(championship?.name || 'gameday')}_GD${gd}.png`;
                      document.body.appendChild(a); a.click(); a.remove();
                      setExportImageOpen(false);
                    } catch (e) { console.error(e); toast.error('Nem sikerült a letöltés'); }
                  }}
                  disabled={!previewImageUrl}
                  className="flex-1 bg-[#ff5c1a] hover:bg-[#ff7c3a] disabled:bg-gray-600 disabled:opacity-50 text-white rounded px-4 py-2"
                >
                  Letöltés PNG
                </button>
              </div>
              {previewImageUrl && (
                <div className="mt-4">
                  <label className="block text-white/80 mb-2">Előnézet:</label>
                  <div className="border border-white/20 rounded-lg overflow-hidden">
                    <Image 
                      src={previewImageUrl} 
                      alt="Gameday tabella előnézet" 
                      width={800}
                      height={600}
                      className="w-full h-auto max-h-96 object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {resultModal.open && isFetchingMatchMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="h-10 w-10 rounded-full border-4 border-[#ff5c1a] border-t-transparent animate-spin" />
        </div>
      )}
      {resultModal.open && championship && !isFetchingMatchMeta && matchMeta && (
        <EnterResultModal
          open={true}
          onClose={() => setResultModal({ open: false })}
          teamA={{ name: matchMeta.homeTeam.name, players: (matchMeta.homeTeam.players || []) }}
          teamB={{ name: matchMeta.awayTeam.name, players: (matchMeta.awayTeam.players || []) }}
          initialCupsA={matchMeta.score?.home}
          initialCupsB={matchMeta.score?.away}
          initialSelectedA={[matchMeta.selected?.homeFirstPlayerId, matchMeta.selected?.homeSecondPlayerId].filter(Boolean)}
          initialSelectedB={[matchMeta.selected?.awayFirstPlayerId, matchMeta.selected?.awaySecondPlayerId].filter(Boolean)}
          initialMvpA={matchMeta.mvp?.home}
          initialMvpB={matchMeta.mvp?.away}
          onSubmit={async (payload) => {
            try {
              await updateMatchResult({
                id: modalMatchId,
                body: {
                  homeTeamScore: payload.cupsA,
                  awayTeamScore: payload.cupsB,
                  homeTeamBestPlayerId: payload.mvpAId || undefined,
                  awayTeamBestPlayerId: payload.mvpBId || undefined,
                  homeFirstPlayerId: payload.selectedAIds?.[0],
                  homeSecondPlayerId: payload.selectedAIds?.[1],
                  awayFirstPlayerId: payload.selectedBIds?.[0],
                  awaySecondPlayerId: payload.selectedBIds?.[1],
                }
              }).unwrap();
              // frissítsük a listát, meta-t és a tabellát
              await Promise.all([refetchMatches(), refetchMeta(), refetchStandings()]);
              setResultModal({ open: false });
            } catch (e) {
              console.error(e);
            }
          }}
        />
      )}

      {rankModal.open && rankModal.teamId && (
        <RankModal
          open={rankModal.open}
          onClose={() => setRankModal({ open: false })}
          leagueId={championshipId!}
          teamId={rankModal.teamId}
          teamName={rankModal.teamName || ''}
        />
      )}

  {/* Knockout Playoff Matchups - only show when Playoff tab is selected */}
      {standingsTab === 'playoff' && hasKnockoutPlayoff && (
        <div className="space-y-6 mb-8">
          <h2 className={`${bebasNeue.className} text-3xl text-white mb-4`}>
            Playoff Párharcok {playoffRoundTab === 'quarter' ? '(Negyeddöntő)' : playoffRoundTab === 'semi' ? '(Elődöntő)' : '(Döntő)'}
          </h2>
          {knockoutMatchups.length > 0 ? (
            knockoutMatchups.map((matchup) => {
            const matchupKey = matchup.key;
            const isExpanded = expandedKnockoutMatchups.includes(matchupKey);
            return (
              <motion.div
                key={matchupKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-xl overflow-hidden border border-[#ff5c1a]/40"
              >
                <button
                  onClick={() => {
                    setExpandedKnockoutMatchups((prev) =>
                      prev.includes(matchupKey)
                        ? prev.filter((k) => k !== matchupKey)
                        : [...prev, matchupKey]
                    );
                  }}
                  className="w-full flex items-center justify-between p-6 hover:bg-[#001a3a]/60 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <Image src={matchup.homeTeamLogo || "/elitelogo.png"} alt={matchup.homeTeamName} width={40} height={40} className="rounded-full border-2 border-white/20" />
                      <span className={`${bebasNeue.className} text-xl text-white`}>{matchup.homeTeamName}</span>
                    </div>
                    <span className={`${bebasNeue.className} text-2xl text-[#ff5c1a]`}>VS</span>
                    <div className="flex items-center gap-3">
                      <span className={`${bebasNeue.className} text-xl text-white`}>{matchup.awayTeamName}</span>
                      <Image src={matchup.awayTeamLogo || "/elitelogo.png"} alt={matchup.awayTeamName} width={40} height={40} className="rounded-full border-2 border-white/20" />
                    </div>
                    <span className="text-white/60 text-sm ml-4">
                      {matchup.matches.length} meccs
                    </span>
                  </div>
                  {isExpanded ? (
                    <FiChevronUp className="w-6 h-6 text-[#ff5c1a]" />
                  ) : (
                    <FiChevronDown className="w-6 h-6 text-[#ff5c1a]" />
                  )}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="p-6 space-y-4"
                    >
                      {matchup.matches.map((match: any) => {
                        const isOT = Math.max(Number(match.homeScore||0), Number(match.awayScore||0)) > 10 && Math.min(Number(match.homeScore||0), Number(match.awayScore||0)) >= 10;
                        const keyId = String(match.id);
                        return (
                          <motion.div
                            key={keyId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`${match.isDelayed ? (match.round === match.originalRound ? "bg-red-900/20" : "bg-yellow-900/20 border-1 border-yellow-400") : "bg-black/30"} rounded-lg p-4 relative`}
                          >
                            {match.isDelayed && (
                              <div className="bg-gray-800/90 text-white px-2 py-1 rounded text-xs font-bold mb-2">
                                {match.round === match.originalRound ? 'HALASZTVA' : 'HALASZTOTT MECCS LEJÁTSZÁSA'}
                              </div>
                            )}
                            <button
                              onClick={() => toggleMatch(keyId)}
                              className="w-full flex items-center justify-between"
                            >
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Image src={match.homeTeam.logo || "/elitelogo.png"} alt={match.homeTeam.name} width={32} height={32} className="rounded-full" />
                                  <span className="text-white">{match.homeTeam.name}</span>
                                </div>
                                <span className="text-white">-</span>
                                <div className="flex items-center gap-2">
                                  <Image src={match.awayTeam.logo || "/elitelogo.png"} alt={match.awayTeam.name} width={32} height={32} className="rounded-full" />
                                  <span className="text-white">{match.awayTeam.name}</span>
                                </div>
                                <span className="text-[#ff5c1a]">
                                  {typeof match.homeScore === 'number' && typeof match.awayScore === 'number'
                                    ? `(${match.homeScore} - ${match.awayScore}${isOT ? ' OT' : ''})`
                                    : ''}
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-[#e0e6f7]">
                                  {match.isDelayed && match.delayedTime
                                    ? new Date(match.delayedTime).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
                                    : match.time}
                                </span>
                                <span className="text-[#e0e6f7]">
                                  Asztal: {match.isDelayed && match.delayedTable ? match.delayedTable : match.tableNumber}
                                </span>
                                {expandedMatches.includes(keyId) ? (
                                  <FiChevronUp className="w-5 h-5 text-[#ff5c1a]" />
                                ) : (
                                  <FiChevronDown className="w-5 h-5 text-[#ff5c1a]" />
                                )}
                              </div>
                            </button>

                            <AnimatePresence>
                              {expandedMatches.includes(keyId) && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="mt-4 flex flex-col gap-4"
                                >
                                  {/* Delayed Match Details */}
                                  {match.isDelayed && (match.delayedDate || match.delayedTime || match.delayedTable || match.delayedRound) && match.round === match.originalRound && (
                                    <div className="mb-4">
                                      <h4 className="text-white font-semibold mb-2">HALASZTVA ERRE:</h4>
                                      <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                          {match.delayedDate && (
                                            <div>
                                              <span className="text-gray-400">Új dátum:</span>
                                              <span className="text-white ml-2">
                                                {new Date(match.delayedDate).toLocaleDateString('hu-HU', { timeZone: 'UTC' })}
                                              </span>
                                            </div>
                                          )}
                                          {match.delayedTime && (
                                            <div>
                                              <span className="text-gray-400">Új időpont:</span>
                                              <span className="text-white ml-2">
                                                {new Date(match.delayedTime).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                                              </span>
                                            </div>
                                          )}
                                          {match.delayedTable && (
                                            <div>
                                              <span className="text-gray-400">Új asztal:</span>
                                              <span className="text-white ml-2">{match.delayedTable}</span>
                                            </div>
                                          )}
                                          {match.delayedRound && (
                                            <div>
                                              <span className="text-gray-400">Új forduló:</span>
                                              <span className="text-white ml-2">{match.delayedRound}.</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
            })
          ) : (
            <div className="text-white/60 text-center py-8 bg-black/20 rounded-xl border border-white/10">
              Nincs még meccs generálva az adott körhöz. Kattints a &quot;Meccs generálás&quot; gombra a párharcok generálásához.
            </div>
          )}
        </div>
      )}

  {/* Match Days with nested Rounds - only show regular matches when Regular tab is selected */}
      {standingsTab === 'regular' && (
        <div className="space-y-6">
          {matchDayList?.map((matchDay) => (
          <motion.div
            key={matchDay.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-xl overflow-hidden border border-[#ff5c1a]/40"
          >
            <button
              onClick={() => toggleMatchDay(matchDay.id)}
              className="w-full flex items-center justify-between p-6 hover:bg-[#001a3a]/60 transition-colors"
            >
              <h2 className={`${bebasNeue.className} text-2xl text-white`}>
                 Gameday {matchDay.id} - {new Date(matchDay.date).toLocaleDateString()}
              </h2>
              {expandedMatchDays.includes(matchDay.id) ? (
                <FiChevronUp className="w-6 h-6 text-[#ff5c1a]" />
              ) : (
                <FiChevronDown className="w-6 h-6 text-[#ff5c1a]" />
              )}
            </button>

            <AnimatePresence>
              {expandedMatchDays.includes(matchDay.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 space-y-6"
                >
                  {(() => {
                    // Group existing matches assigned to this day by round
                    const groups = (matchDay.matches || []).reduce((acc: Record<number, any[]>, m: any) => {
                      const r = Number(m.round || 0);
                      if (!acc[r]) acc[r] = [];
                      acc[r].push(m);
                      return acc;
                    }, {} as Record<number, any[]>);
                    const rounds = Object.entries(groups).sort((a, b) => Number(a[0]) - Number(b[0]));
                    return rounds.map(([rStr, items]) => {
                      const r = Number(rStr);
                      const key = `${matchDay.id}:${r}`;
                      const sorted = (items as any[]).sort((a, b) => new Date(a.time as any).getTime() - new Date(b.time as any).getTime() || ((a.tableNumber as any) - (b.tableNumber as any)));
                      return (
                        <div key={key} className="bg-black/20 rounded-lg">
                          <button onClick={() => toggleRound(key)} className="w-full flex items-center justify-between px-4 py-3 border-b border-white/10">
                            <span className="text-white">{r}. Forduló</span>
                            {expandedRounds.includes(key) ? <FiChevronUp className="w-5 h-5 text-[#ff5c1a]" /> : <FiChevronDown className="w-5 h-5 text-[#ff5c1a]" />}
                          </button>
                          <AnimatePresence>
                            {expandedRounds.includes(key) && (
                              <div className="p-4 space-y-4">
                                {sorted.map((match: any) => {
                                  const isOT = Math.max(Number(match.homeScore||0), Number(match.awayScore||0)) > 10 && Math.min(Number(match.homeScore||0), Number(match.awayScore||0)) >= 10;
                                  const keyId = String(match.id);
                                  return (
                                    <motion.div key={keyId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`${match.isDelayed ? (match.round === match.originalRound ? "bg-red-900/20" : "bg-yellow-900/20 border-1 border-yellow-400") : "bg-black/30"} rounded-lg p-4 relative`}>
                                      {match.isDelayed && (
                                        <div className="bg-gray-800/90 text-white px-2 py-1 rounded text-xs font-bold">
                                          {match.round === match.originalRound ? 'HALASZTVA' : 'HALASZTOTT MECCS LEJÁTSZÁSA'}
                                        </div>
                                      )}
                                      <button onClick={() => toggleMatch(keyId)} className="w-full flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                                            <Image src={match.homeTeam.logo || "/elitelogo.png"} alt={match.homeTeam.name} width={32} height={32} className="rounded-full" />
                            <span className="text-white">{match.homeTeam.name}</span>
                          </div>
                                          <span className="text-white">-</span>
                          <div className="flex items-center gap-2">
                                            <Image src={match.awayTeam.logo || "/elitelogo.png"} alt={match.awayTeam.name} width={32} height={32} className="rounded-full" />
                            <span className="text-white">{match.awayTeam.name}</span>
                          </div>
                                          <span className="text-[#ff5c1a]">{typeof match.homeScore === 'number' && typeof match.awayScore === 'number' ? `(${match.homeScore} - ${match.awayScore}${isOT ? ' OT' : ''})` : ''}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[#e0e6f7]">
                            {match.isDelayed && match.delayedTime ? 
                              new Date(match.delayedTime).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : 
                              match.time
                            }
                          </span>
                          <span className="text-[#e0e6f7]">
                            Asztal: {match.isDelayed && match.delayedTable ? match.delayedTable : match.tableNumber}
                          </span>
                                          {expandedMatches.includes(keyId) ? (<FiChevronUp className="w-5 h-5 text-[#ff5c1a]" />) : (<FiChevronDown className="w-5 h-5 text-[#ff5c1a]" />)}
                        </div>
                      </button>

                      <AnimatePresence>
                                        {expandedMatches.includes(keyId) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 flex flex-col gap-4"
                          >
                            {/* Delayed Match Details */}
                            {match.isDelayed && (match.delayedDate || match.delayedTime || match.delayedTable || match.delayedRound) && match.round === match.originalRound && (
                              <div className="mb-4">
                                <h4 className="text-white font-semibold mb-2">HALASZTVA ERRE:</h4>
                                <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    {match.delayedDate && (
                                      <div>
                                        <span className="text-gray-400">Új dátum:</span>
                                        <span className="text-white ml-2">{new Date(match.delayedDate).toLocaleDateString('hu-HU', { timeZone: 'UTC' })}</span>
                                      </div>
                                    )}
                                    {match.delayedTime && (
                                      <div>
                                        <span className="text-gray-400">Új időpont:</span>
                                        <span className="text-white ml-2">{new Date(match.delayedTime).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}</span>
                                      </div>
                                    )}
                                    {match.delayedTable && (
                                      <div>
                                        <span className="text-gray-400">Új asztal:</span>
                                        <span className="text-white ml-2">{match.delayedTable}</span>
                                      </div>
                                    )}
                                    {match.delayedRound && (
                                      <div>
                                        <span className="text-gray-400">Új forduló:</span>
                                        <span className="text-white ml-2">{match.delayedRound}.</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                                  )
                                })}
                              </div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    });
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
        </div>
      )}
    </div>
  );
} 