"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { motion } from 'framer-motion';
import Table from "../components/Table";
import { Bebas_Neue } from "next/font/google";
import UpcomingMatchCard from "../components/UpcomingMatchCard";
import EnterResultModal from "../components/EnterResultModal";
import { authClient } from "../lib/auth-client";
import { useGetMyLeagueQuery } from "@/lib/features/apiSlice";
import { useGetChampionshipByIdQuery, useGetMatchesForLeagueQuery, useGetStandingsQuery, useGetMatchMetaQuery, useUpdateMatchResultMutation, useGetPlayoffMatchesQuery, useGetPlayoffGroupsQuery } from "@/lib/features/championship/championshipSlice";
import { useGetActiveInviteQuery } from "@/lib/features/apiSlice";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const bebasNeue = Bebas_Neue({
    weight: "400",
    subsets: ["latin"],
});

// helper to parse date from backend fields
const parseMatchDate = (row: any): Date | null => {
  const at = row?.match?.matchAt || row?.match?.matchDate || null;
  if (!at) return null;
  try { return new Date(at); } catch { return null; }
};

// helper to parse delayed date from backend fields
const parseDelayedDate = (row: any): Date | null => {
  const at = row?.match?.delayedTime || null;
  if (!at) return null;
  try { return new Date(at); } catch { return null; }
};

// helper to get effective date (delayed if available, otherwise original)
const getEffectiveDate = (row: any): Date | null => {
  if (row?.match?.isDelayed && row?.match?.delayedTime) {
    return parseDelayedDate(row);
  }
  return parseMatchDate(row);
};

export default function DashboardPage() {
  const router = useRouter();
  const [checkingInvite, setCheckingInvite] = useState(true);
  const [upcomingCount, setUpcomingCount] = useState(5);
  const [standingsTab, setStandingsTab] = useState<'regular' | 'playoff'>('regular');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTeams, setModalTeams] = useState<{ teamA: any; teamB: any } | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [nickname, setNickname] = useState<string>("");
  const [handledMatchIds, setHandledMatchIds] = useState<string[]>([]);
  const [collapseKey, setCollapseKey] = useState(0);
  // user → my league/team
  const { data: myLeague } = useGetMyLeagueQuery();
  const leagueId = myLeague?.leagueId;
  const myTeamId = myLeague?.teamId;
  const { data: championship } = useGetChampionshipByIdQuery(leagueId!, { skip: !leagueId });
  const { data: leagueMatches, refetch: refetchLeagueMatches } = useGetMatchesForLeagueQuery(leagueId!, { skip: !leagueId });
  const { data: playoffMatches, refetch: refetchPlayoffMatches } = useGetPlayoffMatchesQuery(leagueId!, { skip: !leagueId });
  const playoffProperties = championship?.properties;
  const hasGroupedPlayoff = Boolean(playoffProperties?.hasPlayoff && playoffProperties?.playoffType === 'groupped');
  const hasKnockoutPlayoff = Boolean(playoffProperties?.hasPlayoff && playoffProperties?.playoffType === 'knockout');
  
  // Fetch all matches including playoff matches (for both grouped and knockout playoff)
  const [allMatchesIncludingPlayoff, setAllMatchesIncludingPlayoff] = useState<any[]>([]);
  const [matchesRefreshKey, setMatchesRefreshKey] = useState(0);
  useEffect(() => {
    if (!leagueId) {
      setAllMatchesIncludingPlayoff([]);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const params = new URLSearchParams();
        params.set('leagueId', leagueId);
        params.set('playoff', 'all'); // Get all matches including playoff
        params.set('page', '1');
        params.set('pageSize', '1000'); // Large page size to get all matches
        const url = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}/api/matches?${params.toString()}`;
        const resp = await fetch(url, { credentials: 'include' });
        if (resp.ok && mounted) {
          const data = await resp.json();
          const items = data.items || [];
          console.log('Fetched all matches (including playoff):', items.length, 'items');
          console.log('Playoff matches in response:', items.filter((r: any) => r?.match?.isPlayoffMatch === true).length);
          setAllMatchesIncludingPlayoff(items);
        } else if (mounted) {
          console.error('Failed to fetch all matches, status:', resp.status);
          setAllMatchesIncludingPlayoff([]);
        }
      } catch (error) {
        console.error('Failed to fetch all matches:', error);
        if (mounted) setAllMatchesIncludingPlayoff([]);
      }
    })();
    return () => { mounted = false };
  }, [leagueId, matchesRefreshKey]);
  const { data: playoffGroups } = useGetPlayoffGroupsQuery(leagueId!, { skip: !leagueId || !hasGroupedPlayoff });
  const { data: standings } = useGetStandingsQuery(leagueId!, { skip: !leagueId || !championship?.isStarted });
  const showPlayoffTab = Boolean(hasGroupedPlayoff && playoffGroups?.enabled && playoffGroups?.ready);
  const playoffAutoSelected = useRef(false);

  useEffect(() => {
    if (showPlayoffTab && !playoffAutoSelected.current) {
      setStandingsTab('playoff');
      playoffAutoSelected.current = true;
    }
    if (!showPlayoffTab && standingsTab !== 'regular') {
      setStandingsTab('regular');
      playoffAutoSelected.current = false;
    }
  }, [showPlayoffTab, standingsTab]);
  const { data: activeInvite, isLoading: isLoadingActiveInvite } = useGetActiveInviteQuery();

  // my standings row
  const myRow = useMemo(() => {
    const list = standings?.standings || [];
    return list.find((s: any) => s.teamId === myTeamId) || null;
  }, [standings, myTeamId]);

  // build mini standings rows for table
  const miniTable = useMemo(() => {
    const list = standings?.standings || [];
    return list.map((s: any, idx: number) => ([
      { column: 'pos', value: String(s.rank) },
      { column: 'name', value: String(s.name || '') },
      { column: 'win', value: String(s.winsTotal ?? 0) },
      { column: 'loose', value: String(s.lossesTotal ?? 0) },
      { column: 'cups', value: String(s.cupDiff ?? 0) },
      { column: 'points', value: String(s.points ?? 0) },
    ]));
  }, [standings]);

  const playoffUpperTable = useMemo(() => {
    if (!playoffGroups?.upper?.standings) return [];
    return playoffGroups.upper.standings.map((s: any, idx: number) => ([
      { column: 'pos', value: String(idx + 1) },
      { column: 'name', value: String(s.name || '') },
      { column: 'win', value: String(s.winsTotal ?? 0) },
      { column: 'loose', value: String(s.lossesTotal ?? 0) },
      { column: 'cups', value: String(s.cupDiff ?? 0) },
      { column: 'points', value: String(s.points ?? 0) },
    ]));
  }, [playoffGroups]);

  const playoffLowerTable = useMemo(() => {
    if (!playoffGroups?.lower?.standings) return [];
    const offset = playoffGroups.upper?.standings?.length || 0;
    return playoffGroups.lower.standings.map((s: any, idx: number) => ([
      { column: 'pos', value: String(offset + idx + 1) },
      { column: 'name', value: String(s.name || '') },
      { column: 'win', value: String(s.winsTotal ?? 0) },
      { column: 'loose', value: String(s.lossesTotal ?? 0) },
      { column: 'cups', value: String(s.cupDiff ?? 0) },
      { column: 'points', value: String(s.points ?? 0) },
    ]));
  }, [playoffGroups]);

  // Normalize grouped playoff matches
  const normalizedGroupedPlayoffMatches = useMemo(() => {
    if (!playoffMatches || !leagueId) return [];
    const upper = Array.isArray(playoffMatches.upper) ? playoffMatches.upper : [];
    const lower = Array.isArray(playoffMatches.lower) ? playoffMatches.lower : [];
    return [...upper, ...lower].map((m: any) => ({
      match: {
        id: m.id,
        leagueId,
        homeTeamId: m.home?.id,
        awayTeamId: m.away?.id,
        homeTeamScore: m.home?.score ?? 0,
        awayTeamScore: m.away?.score ?? 0,
        matchAt: m.matchAt,
        matchDate: m.matchAt,
        matchTime: m.matchAt,
        matchStatus: m.status,
        matchType: 'playoff',
        isPlayoffMatch: true,
        matchRound: m.round,
        gameDay: m.gameDay,
        matchTable: m.table,
        delayedRound: m.round,
        delayedGameDay: m.gameDay,
        delayedDate: m.matchAt,
        delayedTime: m.matchAt,
        delayedTable: m.table,
      },
      homeTeam: { name: m.home?.name, logo: m.home?.logo },
      awayTeam: { name: m.away?.name, logo: m.away?.logo },
    }));
  }, [playoffMatches, leagueId]);

  // Extract knockout playoff matches from allMatchesIncludingPlayoff
  const normalizedKnockoutPlayoffMatches = useMemo(() => {
    if (!allMatchesIncludingPlayoff.length || !leagueId) return [];
    // Filter knockout playoff matches (isPlayoffMatch: true)
    const playoffMatches = allMatchesIncludingPlayoff.filter((row: any) => {
      const isPlayoff = row?.match?.isPlayoffMatch === true;
      if (isPlayoff) {
        console.log('Found playoff match:', row.match.id, row.match.homeTeamId, row.match.awayTeamId, row.match.matchStatus);
      }
      return isPlayoff;
    });
    console.log('Knockout playoff matches found:', playoffMatches.length, 'out of', allMatchesIncludingPlayoff.length, 'total matches');
    return playoffMatches.map((row: any) => ({
        match: {
          id: row.match.id,
          leagueId,
          homeTeamId: row.match.homeTeamId,
          awayTeamId: row.match.awayTeamId,
          homeTeamScore: row.match.homeTeamScore ?? 0,
          awayTeamScore: row.match.awayTeamScore ?? 0,
          matchAt: row.match.matchAt,
          matchDate: row.match.matchDate,
          matchTime: row.match.matchTime,
          matchStatus: row.match.matchStatus,
          matchType: 'playoff',
          isPlayoffMatch: true,
          matchRound: row.match.matchRound,
          gameDay: row.match.gameDay,
          matchTable: row.match.matchTable,
          isDelayed: row.match.isDelayed,
          delayedRound: row.match.delayedRound,
          delayedGameDay: row.match.delayedGameDay,
          delayedDate: row.match.delayedDate,
          delayedTime: row.match.delayedTime,
          delayedTable: row.match.delayedTable,
        },
        homeTeam: row.homeTeam,
        awayTeam: row.awayTeam,
      }));
  }, [allMatchesIncludingPlayoff, leagueId]);

  const combinedMatches = useMemo(() => {
    const regular = Array.isArray(leagueMatches) ? leagueMatches : [];
    return [...regular, ...normalizedGroupedPlayoffMatches, ...normalizedKnockoutPlayoffMatches];
  }, [leagueMatches, normalizedGroupedPlayoffMatches, normalizedKnockoutPlayoffMatches]);

  // my matches
  const mySortedMatches = useMemo(() => {
    const mine = combinedMatches.filter((row: any) => row?.match && (row.match.homeTeamId === myTeamId || row.match.awayTeamId === myTeamId) && row.match.matchStatus !== 'completed');
    
    // Debug: log match data to see if delayed fields are present
    if (mine.length > 0) {
      console.log('Match data sample:', JSON.stringify(mine[0], null, 2));
    }
    
    return mine
      .map((row: any) => ({
        row,
        when: getEffectiveDate(row),
        originalWhen: parseMatchDate(row),
        delayedWhen: parseDelayedDate(row),
        title: `${row.homeTeam?.name || row.match.homeTeamId} vs ${row.awayTeam?.name || row.match.awayTeamId}`,
        table: row.match.isDelayed ? row.match.delayedTable : row.match.matchTable,
        round: row.match.isDelayed ? row.match.delayedRound : row.match.matchRound,
        isDelayed: row.match.isDelayed,
        delayedDate: row.match.delayedDate,
        delayedTime: row.match.delayedTime,
      }))
      .sort((a: any, b: any) => (a.when?.getTime?.() || 0) - (b.when?.getTime?.() || 0));
  }, [combinedMatches, myTeamId]);

  const filteredMatches = useMemo(() => {
    if (!handledMatchIds.length) return mySortedMatches;
    const handledSet = new Set(handledMatchIds);
    return mySortedMatches.filter((m) => {
      const matchId = String(m.row.match?.id || m.row.id || '');
      if (!matchId) return true;
      return !handledSet.has(matchId);
    });
  }, [mySortedMatches, handledMatchIds]);

  // Upcoming matches: all matches that are still not completed/cancelled,
  // irrespective of whether their eredeti időpontja már elmúlt.
  const upcoming = filteredMatches.filter((m) => {
    const status = String(m.row.match?.matchStatus || '');
    return status !== 'completed' && status !== 'cancelled';
  });
  const nextMatch = upcoming[0] || null;
  const nextMatchTitle = nextMatch?.title || 'Nincs következő mérkőzés';
  const nextMatchTime = nextMatch?.when ? nextMatch.when.toLocaleString('hu-HU', { timeZone: 'UTC' }) : '';
  const nextMatchTable = nextMatch?.row?.match?.matchTable ? String(nextMatch.row.match.matchTable) : '';

  const formatDateForDisplay = (d: Date | null) => {
    if (!d || Number.isNaN(d.getTime())) return '';
    // Always render in UTC to match backend schedule and avoid device TZ drift
    const dateStr = d.toLocaleDateString('hu-HU', { timeZone: 'UTC' });
    const timeStr = d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
    return `${dateStr} ${timeStr}`;
  };

  const upcomingToShow = upcoming.slice(0, upcomingCount);
  const upcomingFive = upcomingToShow.map((m) => ({
    matchTitle: m.title,
    // Show delayed time if available, otherwise original time
    date: formatDateForDisplay(m.when),
    table: String(m.table || ''),
    round: m.round,
    matchId: m.row.match?.id || m.row.id,
    isDelayed: m.isDelayed,
    // Original data for the "before delay" section
    originalDate: formatDateForDisplay(m.originalWhen),
    originalTable: String(m.row.match?.matchTable || ''),
    originalRound: m.row.match?.matchRound,
    // Delayed data (now used for main display)
    delayedDate: m.delayedDate,
    delayedTime: m.delayedTime,
    delayedRound: m.row.match?.delayedRound,
    delayedTable: m.row.match?.delayedTable,
    teamA: { 
      name: m.row.homeTeam?.name || '', 
      logo: m.row.homeTeam?.logo ? (m.row.homeTeam.logo.startsWith('http') ? m.row.homeTeam.logo : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}${m.row.homeTeam.logo}`) : '/elitelogo.png'
    },
    teamB: { 
      name: m.row.awayTeam?.name || '', 
      logo: m.row.awayTeam?.logo ? (m.row.awayTeam.logo.startsWith('http') ? m.row.awayTeam.logo : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}${m.row.awayTeam.logo}`) : '/elitelogo.png'
    },
  }));
  console.log(upcomingFive);
  
  // Match meta for modal
  const modalMatchId = selectedMatch ? String(selectedMatch.id || selectedMatch.match?.id || '') : '';
  const { data: matchMeta, refetch: refetchMeta, isFetching: isFetchingMatchMeta } = useGetMatchMetaQuery(modalMatchId, { skip: !modalMatchId });
  const [updateMatchResult] = useUpdateMatchResultMutation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await authClient.getSession();
        if (mounted) setNickname((data?.user?.nickname || data?.user?.name || "").trim());
      } catch {}
      if (!isLoadingActiveInvite) {
        const accepted = (activeInvite as any)?.accepted === true;
        if (activeInvite?.hasInvite && activeInvite?.leagueTeamId && !accepted) {
          router.replace(`/application/apply/${encodeURIComponent(activeInvite.leagueTeamId)}`);
          return;
        }
        if (mounted) setCheckingInvite(false);
      }
    })();
    return () => { mounted = false };
  }, [activeInvite, isLoadingActiveInvite, router]);

  const handleEnterResult = (match: any) => {
    setSelectedMatch(match);
    setModalOpen(true);
  };

  if (checkingInvite) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-[#ff5c1a] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {nickname && (
        <div className={`${bebasNeue.className} text-white text-2xl md:text-4xl`}>Üdvözlünk {nickname}!</div>
      )}
      {/* Top Statboxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Next Match */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/30 rounded-2xl p-4 md:p-6 border-2 border-[#ff5c1a] shadow-lg shadow-[#ff5c1a33]"
        >
          <div className="flex items-center justify-between gap-2 md:gap-0">
            <div>
              <p className="text-[#e0e6f7] text-sm md:text-base">Következő meccs</p>
              <h3 className={`${bebasNeue.className} text-lg md:text-2xl mt-1 tracking-wider text-white`}>{nextMatchTitle}</h3>
            </div>
            <div className="h-10 w-10 md:h-14 md:w-14 rounded-full bg-gradient-to-br from-[#ff5c1a] to-[#002b6b] flex items-center justify-center shadow-lg shadow-[#ff5c1a]/40">
              <span className="font-bold text-base md:text-lg text-white">BM</span>
            </div>
          </div>
          <p className="text-[#ff5c1a] mt-2 md:mt-4 text-base md:text-lg">{nextMatchTime || '—'}</p>
        </motion.div>
        {/* League Position */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/30 rounded-2xl p-4 md:p-6 border-2 border-[#ff5c1a] shadow-lg shadow-[#ff5c1a33]"
        >
          <div className="flex items-center justify-between gap-2 md:gap-0">
            <div>
              <p className="text-[#e0e6f7] text-sm md:text-base">Liga pozíció</p>
              <h3 className={`${bebasNeue.className} text-lg md:text-2xl mt-1 tracking-wider text-white`}>{myRow ? `#${myRow.rank}` : '—'} Helyezés</h3>
            </div>
            <div className="h-10 w-10 md:h-14 md:w-14 rounded-full bg-gradient-to-br from-[#ff5c1a] to-[#002b6b] flex items-center justify-center shadow-lg shadow-[#ff5c1a]/40">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-7 md:w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
          <p className="text-[#ff5c1a] mt-2 md:mt-4 text-base md:text-lg">{myRow ? `${myRow.points} pont • ${myRow.cupDiff}` : '—'} Pohár</p>
        </motion.div>
        {/* Win Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/30 rounded-2xl p-4 md:p-6 border-2 border-[#ff5c1a] shadow-lg shadow-[#ff5c1a33]"
        >
          <div className="flex items-center justify-between gap-2 md:gap-0">
            <div>
              <p className="text-[#e0e6f7] text-sm md:text-base">Győzelmi arány</p>
              <h3 className={`${bebasNeue.className} text-lg md:text-2xl mt-1 tracking-wider text-white`}>
                {myRow ? `${myRow.games ? Math.round((myRow.winsTotal / myRow.games) * 100) : 0}%` : '—'}
              </h3>
            </div>
            <div className="h-10 w-10 md:h-14 md:w-14 rounded-full bg-gradient-to-br from-[#ff5c1a] to-[#002b6b] flex items-center justify-center shadow-lg shadow-[#ff5c1a]/40">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-7 md:w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="text-[#ff5c1a] mt-2 md:mt-4 text-base md:text-lg">{myRow ? `${myRow.winsTotal}W - ${myRow.lossesTotal}L` : '—'}</p>
        </motion.div>
      </div>

      {/* Enter Result Modal */}
      {modalOpen && isFetchingMatchMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="h-10 w-10 rounded-full border-4 border-[#ff5c1a] border-t-transparent animate-spin" />
        </div>
      )}
      {modalOpen && !isFetchingMatchMeta && matchMeta && (
        <EnterResultModal
          open={true}
          onClose={() => setModalOpen(false)}
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
              setModalOpen(false);
              if (modalMatchId) {
                setHandledMatchIds((prev) => (prev.includes(modalMatchId) ? prev : [...prev, modalMatchId]));
              }
              await Promise.allSettled([
                refetchLeagueMatches ? refetchLeagueMatches() : Promise.resolve(null),
                refetchPlayoffMatches ? refetchPlayoffMatches() : Promise.resolve(null),
              ]);
              setMatchesRefreshKey((prev) => prev + 1);
              setCollapseKey((prev) => prev + 1);
              setSelectedMatch(null);
              toast.success('Sikeres meccs eredmény leadás!');
            } catch (e) {
              console.error(e);
              toast.error('Nem sikerült menteni a meccs eredményét.');
            }
          }}
        />
      )}

      {/* Main 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Left column: Upcoming Matches + Recent Activity */}
        <div className="space-y-4 md:space-y-8 lg:col-span-2">
          {/* Upcoming Matches */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 rounded-2xl p-4 md:p-6 border-2 border-[#ff5c1a] shadow-xl shadow-[#ff5c1a33]"
          >
            <h3 className={`${bebasNeue.className} text-lg md:text-2xl mb-4 md:mb-6 tracking-wider text-white`}>Közelgő meccsek</h3>
            <div className="space-y-3 md:space-y-4">
              {upcomingFive.length > 0 ? upcomingFive.map((match, idx) => (
                <UpcomingMatchCard
                  key={idx}
                  id={match.matchId}
                  matchTitle={match.matchTitle}
                  date={match.date}
                  table={match.table}
                  round={match.round}
                  matchId={match.matchId}
                  isDelayed={match.isDelayed}
                  originalDate={match.originalDate}
                  originalTable={match.originalTable}
                  originalRound={match.originalRound}
                  delayedDate={match.delayedDate}
                  delayedTime={match.delayedTime}
                  delayedRound={match.delayedRound}
                  delayedTable={match.delayedTable}
                  teamA={match.teamA}
                  teamB={match.teamB}
                  collapseSignal={collapseKey}
                  onEnterResult={() => handleEnterResult(upcoming[idx].row)}
                  onShare={() => {}}
                  onDelayRequest={() => {}}
                />
              )) : (
                <div className="text-white/70">Nincs közelgő meccs</div>
              )}
            </div>
            
            {/* Load More Button */}
            {upcomingCount < upcoming.length && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setUpcomingCount(prev => Math.min(prev + 5, upcoming.length))}
                  className="inline-flex items-center gap-2 bg-[#ff5c1a] hover:bg-[#ff5c1a]/80 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  Következő 5 betöltése ({upcomingCount}/{upcoming.length})
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}
            
            {/* Reset Button */}
            {upcomingCount > 5 && (
              <div className="mt-2 text-center">
                <button
                  onClick={() => setUpcomingCount(5)}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white/70 px-3 py-1 rounded text-xs transition-colors"
                >
                  Kevesebb megjelenítése
                </button>
              </div>
            )}
          </motion.div>
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 rounded-2xl p-4 md:p-6 border-2 border-[#ff5c1a] shadow-xl shadow-[#ff5c1a33]"
          >
            <h3 className={`${bebasNeue.className} text-lg md:text-2xl mb-4 md:mb-6 tracking-wider text-white`}>Friss aktivitások</h3>
            <div className="space-y-3 md:space-y-4">
              <div>Nincs aktivitás</div>
              {/*<div className="flex flex-col sm:flex-row items-start sm:space-x-4 space-y-2 sm:space-y-0 p-3 md:p-4 bg-black/40 rounded-xl border border-[#ff5c1a] shadow shadow-[#ff5c1a33]">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-[#ff5c1a] to-[#002b6b] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#ff5c1a]/40">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-base md:text-lg text-white">New Match Scheduled</p>
                  <p className="text-[#e0e6f7] text-sm md:text-base">Your team has been scheduled to play against Beer Masters tomorrow at 20:00.</p>
                  <p className="text-[#ff5c1a] mt-1 text-xs md:text-base">2 hours ago</p>
                </div>
              </div>*/}
            </div>
          </motion.div>
        </div>
        {/* Right column: League Standings */}
        <div className="lg:col-span-1 mt-4 lg:mt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 rounded-2xl p-4 md:p-6 border-2 border-[#ff5c1a] shadow-xl shadow-[#ff5c1a33] h-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`${bebasNeue.className} text-lg md:text-2xl tracking-wider text-white`}>Liga Tabella</h3>
              {showPlayoffTab && (
                <div className="flex items-center gap-2 bg-black/40 border border-[#ff5c1a]/40 rounded-full p-1">
                  <button
                    onClick={() => setStandingsTab('regular')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${standingsTab === 'regular' ? 'bg-[#ff5c1a] text-white' : 'text-white/60'}`}
                  >
                    Alapszakasz
                  </button>
                  <button
                    onClick={() => setStandingsTab('playoff')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${standingsTab === 'playoff' ? 'bg-[#ff5c1a] text-white' : 'text-white/60'}`}
                  >
                    Playoff
                  </button>
                </div>
              )}
            </div>
            {standingsTab === 'regular' && (
              <>
                {miniTable.length > 0 ? (
                  <div className="max-h-[500px] overflow-y-auto pr-2">
                    <Table records={{
                      header: [
                        {column: 'pos', value: 'Pos.'},
                        {column: 'name', value: 'Name'},
                        {column: 'win', value: 'W'},
                        {column: 'loose', value: 'L'},
                        {column: 'cups', value: 'Cups'},
                        {column: 'points', value: 'Points'},
                      ],
                      rows: miniTable,
                    }} />
                  </div>
                ) : (
                  <div className="text-white/70">Még nem indult el a szezon</div>
                )}
              </>
            )}
            {standingsTab === 'playoff' && hasGroupedPlayoff && (
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                <div>
                  <h4 className="text-white font-semibold mb-2">Felső ház</h4>
                  {playoffUpperTable.length > 0 ? (
                    <Table records={{
                      header: [
                        {column: 'pos', value: 'Pos.'},
                        {column: 'name', value: 'Name'},
                        {column: 'win', value: 'W'},
                        {column: 'loose', value: 'L'},
                        {column: 'cups', value: 'Cups'},
                        {column: 'points', value: 'Points'},
                      ],
                      rows: playoffUpperTable,
                    }} />
                  ) : (
                    <div className="text-white/60 text-sm">Nincs adat.</div>
                  )}
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">Alsó ház</h4>
                  {playoffLowerTable.length > 0 ? (
                    <Table records={{
                      header: [
                        {column: 'pos', value: 'Pos.'},
                        {column: 'name', value: 'Name'},
                        {column: 'win', value: 'W'},
                        {column: 'loose', value: 'L'},
                        {column: 'cups', value: 'Cups'},
                        {column: 'points', value: 'Points'},
                      ],
                      rows: playoffLowerTable,
                    }} />
                  ) : (
                    <div className="text-white/60 text-sm">Nincs adat.</div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
} 