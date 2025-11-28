"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Bebas_Neue } from 'next/font/google';
import { useGetChampionshipByIdQuery, useGetStandingsQuery, useGetStandingsByDayQuery, useGetStandingsUptoGameDayQuery, useGetStandingsUptoRoundQuery, useGetStandingsByGameDayQuery, useGetMatchesForLeagueQuery, useGetPlayoffGroupsQuery, useGetKnockoutBracketQuery } from '@/lib/features/championship/championshipSlice';
import { FiArrowUp, FiArrowDown, FiMinus } from 'react-icons/fi';
import * as Tooltip from '@radix-ui/react-tooltip';
import TopNav from '../../components/TopNav';
import { use } from 'react';

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'] });

export default function DetailedTablePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: championshipId } = use(params);
  const { data: championship, isLoading } = useGetChampionshipByIdQuery(championshipId);
  const { data: leagueMatches } = useGetMatchesForLeagueQuery(championshipId, { skip: !championshipId });
  
  // absolute URL helper for logos coming from backend
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555';
  const abs = (p?: string | null) => (p ? (p.startsWith('http') ? p : `${backendBase}${p}`) : '');
  
  const hasGroupedPlayoff = Boolean(championship?.properties?.hasPlayoff && championship?.properties?.playoffType === 'groupped');
  const hasKnockoutPlayoff = Boolean(championship?.properties?.hasPlayoff && championship?.properties?.playoffType === 'knockout');
  const { data: playoffGroups } = useGetPlayoffGroupsQuery(championshipId, { skip: !championshipId || !hasGroupedPlayoff });
  const { data: knockoutBracket } = useGetKnockoutBracketQuery(championshipId, { skip: !championshipId || !hasKnockoutPlayoff });
  const showGroupedPlayoffTab = hasGroupedPlayoff && Boolean(playoffGroups?.enabled && playoffGroups?.ready);
  
  // Check if all regular season matches are completed for knockout playoff
  const allRegularMatchesCompleted = useMemo(() => {
    if (!leagueMatches || !Array.isArray(leagueMatches)) return false;
    const regularMatches = leagueMatches.filter((row: any) => !row.match?.isPlayoffMatch);
    if (regularMatches.length === 0) return false;
    return regularMatches.every((row: any) => row.match?.matchStatus === 'completed');
  }, [leagueMatches]);
  
  const showKnockoutPlayoffTab = hasKnockoutPlayoff && allRegularMatchesCompleted;
  const showPlayoffTab = showGroupedPlayoffTab || showKnockoutPlayoffTab;
  
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [uptoGameDay, setUptoGameDay] = useState<number | 'all'>('all');
  const [uptoRound, setUptoRound] = useState<number | 'all'>('all');
  const [standingsTab, setStandingsTab] = useState<'regular' | 'playoff'>(showPlayoffTab ? 'playoff' : 'regular');
  const [playoffRoundTab, setPlayoffRoundTab] = useState<'quarter' | 'semi' | 'final'>('quarter');
  const [allMatchesIncludingPlayoff, setAllMatchesIncludingPlayoff] = useState<any[]>([]);
  const playoffDefaulted = useRef(false);
  
  // Fetch all matches including playoff
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
        params.set('playoff', 'all');
        params.set('page', '1');
        params.set('pageSize', '1000');
        const url = `${backendBase}/api/matches?${params.toString()}`;
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
  
  const { data: standingsData } = useGetStandingsQuery(championshipId, { skip: !championshipId || !championship?.isStarted || selectedDay !== 'all' || uptoGameDay !== 'all' || uptoRound !== 'all' });
  const { data: standingsByDay } = useGetStandingsByGameDayQuery({ id: championshipId, gameDay: Number(selectedDay) }, { skip: !championshipId || !championship?.isStarted || selectedDay === 'all' });
  const { data: standingsUpto } = useGetStandingsUptoGameDayQuery({ id: championshipId, gameDay: Number(uptoGameDay) }, { skip: !championshipId || !championship?.isStarted || uptoGameDay === 'all' || uptoRound !== 'all' });
  const { data: standingsPrev } = useGetStandingsUptoGameDayQuery({ id: championshipId, gameDay: Number(uptoGameDay) - 1 }, { skip: !championshipId || !championship?.isStarted || uptoGameDay === 'all' || Number(uptoGameDay) <= 1 });
  const { data: standingsUptoRound } = useGetStandingsUptoRoundQuery({ id: championshipId, round: Number(uptoRound) }, { skip: !championshipId || !championship?.isStarted || uptoRound === 'all' });
  const { data: standingsPrevRound } = useGetStandingsUptoRoundQuery({ id: championshipId, round: Number(uptoRound) - 1 }, { skip: !championshipId || !championship?.isStarted || uptoRound === 'all' || Number(uptoRound) <= 1 });
  
  // Prepare knockout bracket data
  const knockoutBracketData = useMemo(() => {
    if (!hasKnockoutPlayoff || !standingsData?.standings || !leagueMatches) return null;
    
    const allMatches = Array.isArray(leagueMatches) ? leagueMatches : [];
    const playoffMatches = allMatches.filter((row: any) => row.match?.isPlayoffMatch);
    
    const teams = standingsData.standings.map((s: any, idx: number) => ({
      seed: idx + 1,
      teamId: s.teamId,
      name: s.name,
      logo: abs(s.logo),
    }));

    return { teams, playoffMatches };
  }, [hasKnockoutPlayoff, standingsData, leagueMatches]);
  
  // Create matchup structure with matches for bracket display
  const knockoutMatchupsWithMatches = useMemo(() => {
    if (!knockoutBracket || !allMatchesIncludingPlayoff || allMatchesIncludingPlayoff.length === 0) return [];
    
    const playoffMatches = allMatchesIncludingPlayoff
      .filter((row: any) => row?.match?.isPlayoffMatch === true)
      .map((row: any) => ({
        id: row.match?.id,
        homeTeamId: row.match?.homeTeamId,
        awayTeamId: row.match?.awayTeamId,
        homeScore: row.match?.homeTeamScore,
        awayScore: row.match?.awayTeamScore,
        round: row.match?.matchRound,
      }));
    
    const matchupMap = new Map<string, any[]>();
    
    playoffMatches.forEach((m: any) => {
      const teamIds = [m.homeTeamId, m.awayTeamId].sort().join('-');
      if (!matchupMap.has(teamIds)) {
        matchupMap.set(teamIds, []);
      }
      matchupMap.get(teamIds)!.push(m);
    });
    
    let currentMatchups: any[] = [];
    if (playoffRoundTab === 'quarter') {
      currentMatchups = knockoutBracket?.quarterfinals || [];
    } else if (playoffRoundTab === 'semi') {
      currentMatchups = knockoutBracket?.semifinals || [];
    } else if (playoffRoundTab === 'final') {
      currentMatchups = knockoutBracket?.finals || [];
    }
    
    return currentMatchups.map((matchup: any) => {
      const teamIds = [matchup.homeTeamId, matchup.awayTeamId].sort().join('-');
      const matches = matchupMap.get(teamIds) || [];
      
      const sortedMatches = matches.sort((a: any, b: any) => {
        const aRound = a.round || 0;
        const bRound = b.round || 0;
        if (aRound !== bRound) return aRound - bRound;
        return 0;
      });
      
      return {
        ...matchup,
        matches: sortedMatches.map((m: any) => ({
          id: m.id,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          round: m.round,
        })),
      };
    });
  }, [knockoutBracket, allMatchesIncludingPlayoff, playoffRoundTab]);
  
  // Auto-switch to playoff tab when available (only once, on initial load)
  useEffect(() => {
    if (showPlayoffTab && !playoffDefaulted.current) {
      setStandingsTab('playoff');
      playoffDefaulted.current = true;
    } else if (!showPlayoffTab && standingsTab === 'playoff') {
      setStandingsTab('regular');
      playoffDefaulted.current = false;
    }
  }, [showPlayoffTab, standingsTab]);

  if (isLoading || !championship) return <div className="p-6 text-white">Betöltés...</div>;

  // Helper to render playoff tables
  const renderPlayoffTable = (standings: any[], title: string) => {
    if (!standings || standings.length === 0) {
      return (
        <div className="text-center py-8 text-white/70">
          Nincs adat a {title} számára.
        </div>
      );
    }

    return (
      <table className="min-w-full divide-y divide-[#ff5c1a]/30">
        <thead>
          <tr className="text-left text-white">
            <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm">#</th>
            <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm">Csapat</th>
            <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm hidden sm:table-cell">Meccs</th>
            <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm">GY</th>
            <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm">V</th>
            <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm hidden lg:table-cell">Győzelem</th>
            <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm hidden lg:table-cell">Győzelem (h)</th>
            <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm hidden lg:table-cell">Vereség (h)</th>
            <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm hidden lg:table-cell">Vereség</th>
            <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm hidden md:table-cell">PK</th>
            <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm">Pont</th>
            <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm hidden sm:table-cell">Forma</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#ff5c1a]/20">
          {standings.map((s: any, idx: number) => (
            <tr key={s.teamId} className="text-white">
              <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm">{s.rank || idx + 1}</td>
              <td className="py-2 pr-2 sm:pr-4 flex items-center gap-2 min-w-0">
                <Image src={abs(s.logo) || '/elitelogo.png'} alt={s.name} width={20} height={20} className="rounded-full border border-white/10 flex-shrink-0" />
                <span className="text-xs sm:text-sm truncate">{s.name}</span>
              </td>
              <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm hidden sm:table-cell">{s.games ?? 0}</td>
              <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm">{s.winsTotal ?? 0}</td>
              <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm">{s.lossesTotal ?? 0}</td>
              <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm hidden lg:table-cell">{s.winsRegular ?? 0}</td>
              <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm hidden lg:table-cell">{s.winsOT ?? 0}</td>
              <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm hidden lg:table-cell">{s.lossesOT ?? 0}</td>
              <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm hidden lg:table-cell">{s.lossesRegular ?? 0}</td>
              <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm hidden md:table-cell">{s.cupDiff ?? 0}</td>
              <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm font-bold">{s.points ?? 0}</td>
              <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm hidden sm:table-cell">
                <div className="flex items-center gap-1">
                  {s.form?.slice(-5).map((result: string, i: number) => {
                    const color = result === 'W' ? 'bg-green-600' : result === 'L' ? 'bg-red-600' : 'bg-gray-600';
                    return (
                      <div key={i} className={`w-5 h-5 sm:w-6 sm:h-6 rounded ${color} flex items-center justify-center text-[8px] text-white`}>
                        {result === 'W' ? 'GY' : result === 'L' ? 'V' : '-'}
                      </div>
                    );
                  }) || <span className="text-white/50">-</span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Fixed TopNav */}
      <TopNav />
      
      {/* Main Content with top padding to account for fixed header */}
      <div className="pt-20 pb-12">
        {/* Hero Section with Title Overlay */}
        <div className="relative mb-16 mx-4">
          <div className="relative w-full h-96 md:h-[500px] rounded-2xl overflow-hidden">
            <Image 
              src="/title.jpg" 
              alt="Beerpong Arena" 
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <h1 className={`${bebasNeue.className} text-[#FFDB11] text-4xl md:text-6xl lg:text-7xl mb-4`}>
                  {championship.name}
                </h1>
                <p className="text-white text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto">
                  {championship.isStarted ? (championship.phase === 'knockout' ? 'Knockout fázis' : 'Alapszakasz') : 'Nem kezdődött el'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Standings Table */}
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`${bebasNeue.className} text-[#FFDB11] text-2xl md:text-3xl`}>
                Tabella
              </h2>
              {showPlayoffTab && (
                <div className="flex space-x-2 bg-black/40 rounded-lg p-1 border border-[#FFDB11]/30">
                  <button
                    onClick={() => setStandingsTab('regular')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      standingsTab === 'regular' ? 'bg-[#FFDB11] text-black' : 'bg-transparent text-white/70 hover:bg-black/60'
                    }`}
                  >
                    Alapszakasz
                  </button>
                  <button
                    onClick={() => setStandingsTab('playoff')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      standingsTab === 'playoff' ? 'bg-[#FFDB11] text-black' : 'bg-transparent text-white/70 hover:bg-black/60'
                    }`}
                  >
                    Playoff
                  </button>
                </div>
              )}
            </div>
            {championship.isStarted && standingsTab === 'regular' && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end mb-3 gap-3 sm:gap-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                  <label className="text-white/70 text-sm">Játéknap:</label>
                  <select value={selectedDay} onChange={(e) => { setSelectedDay(e.target.value === 'all' ? 'all' : Number(e.target.value)); setUptoGameDay('all'); setUptoRound('all'); }} className="bg-black/40 text-white border border-white/20 rounded px-2 py-1 text-sm w-full sm:w-auto">
                    <option value="all">Összes</option>
                    {Array.from(new Set((leagueMatches || []).map((rm: any) => rm.match.gameDay))).filter((x: any) => !!x).sort((a: any,b: any)=>a-b).map((g: number) => (
                      <option key={`gd-${g}`} value={g}>Gameday {g}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                  <label className="text-white/70 text-sm">Játéknapig:</label>
                  <select value={uptoGameDay} onChange={(e) => { setUptoGameDay(e.target.value === 'all' ? 'all' : Number(e.target.value)); setSelectedDay('all'); setUptoRound('all'); }} className="bg-black/40 text-white border border-white/20 rounded px-2 py-1 text-sm w-full sm:w-auto">
                    <option value="all">Összes</option>
                    {Array.from(new Set((leagueMatches || []).map((rm: any) => rm.match.gameDay))).filter((x: any) => !!x).sort((a: any,b: any)=>a-b).map((g: number) => (
                      <option key={`gd-${g}`} value={g}>Gameday {g}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                  <label className="text-white/70 text-sm">Fordulóig:</label>
                  <select value={uptoRound} onChange={(e) => { setUptoRound(e.target.value === 'all' ? 'all' : Number(e.target.value)); setSelectedDay('all'); setUptoGameDay('all'); }} className="bg-black/40 text-white border border-white/20 rounded px-2 py-1 text-sm w-full sm:w-auto">
                    <option value="all">Összes</option>
                    {Array.from(new Set((leagueMatches || []).map((rm: any) => rm.match.matchRound))).filter((x: any) => !!x).sort((a: any,b: any)=>a-b).map((r: number) => (
                      <option key={`rd-${r}`} value={r}>Forduló {r}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              {standingsTab === 'regular' ? (
                <table className="min-w-full divide-y divide-[#ff5c1a]/30">
                <thead>
                  <tr className="text-left text-white">
                    <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm">#</th>
                    <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm">Csapat</th>
                    <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm hidden sm:table-cell">Meccs</th>
                    <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm">GY</th>
                    <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm">V</th>
                    <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm hidden lg:table-cell">Győzelem</th>
                    <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm hidden lg:table-cell">Győzelem (h)</th>
                    <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm hidden lg:table-cell">Vereség (h)</th>
                    <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm hidden lg:table-cell">Vereség</th>
                    <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm hidden md:table-cell">PK</th>
                    <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm">Pont</th>
                    <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm hidden sm:table-cell">Forma</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ff5c1a]/20">
                  {(() => {
                    let source = standingsData?.standings;
                    if (selectedDay !== 'all') source = standingsByDay?.standings;
                    if (uptoGameDay !== 'all') source = standingsUpto?.standings;
                    if (uptoRound !== 'all') source = standingsUptoRound?.standings;
                    const rows = (source && source.length > 0) ? source : [];
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
                        delta = prevRank - s.rank;
                        if (delta > 0) moveIcon = <FiArrowUp className="text-green-400" />;
                        else if (delta < 0) moveIcon = <FiArrowDown className="text-red-400" />;
                        else moveIcon = <FiMinus className="text-white/50" />;
                      }
                      
                      // Form calculation with tooltips - filter by selected game day
                      const all = (leagueMatches || []) as any[];
                      let tMatches = all.filter((row: any) => row.match.matchStatus === 'completed' && (row.match.homeTeamId === s.teamId || row.match.awayTeamId === s.teamId));
                      
                      // Apply filters based on selected criteria
                      if (uptoRound !== 'all') tMatches = tMatches.filter((row: any) => Number(row.match.matchRound || 0) <= Number(uptoRound));
                      else if (uptoGameDay !== 'all') tMatches = tMatches.filter((row: any) => Number(row.match.gameDay || 0) <= Number(uptoGameDay));
                      else if (selectedDay !== 'all') tMatches = tMatches.filter((row: any) => Number(row.match.gameDay || 0) === Number(selectedDay));
                      
                      tMatches = tMatches.sort((a: any, b: any) => new Date(a.match.matchAt || a.match.matchDate || a.match.createdAt).getTime() - new Date(b.match.matchAt || b.match.matchDate || b.match.createdAt).getTime());
                      const last5 = tMatches.slice(-5).map((m: any) => {
                        const isHome = m.match.homeTeamId === s.teamId;
                        const hs = Number(m.match.homeTeamScore || 0);
                        const as = Number(m.match.awayTeamScore || 0);
                        const win = isHome ? hs > as : as > hs;
                        const maxS = Math.max(hs, as);
                        const minS = Math.min(hs, as);
                        const ot = maxS > 10 && minS >= 10;
                        const code = win ? (ot ? 'GYH' : 'GY') : (ot ? 'VH' : 'V');
                        const color = win ? (ot ? 'bg-green-600/60' : 'bg-green-600') : (ot ? 'bg-red-600/60' : 'bg-red-600');
                        const dateStr = (m.match.matchAt || m.match.matchDate) ? new Date(m.match.matchAt || m.match.matchDate).toLocaleDateString('hu-HU', { timeZone: 'UTC' }) : '';
                        const score = `${hs} : ${as}`;
                        const oppName = isHome ? (m.awayTeam?.name || m.match.awayTeamId) : (m.homeTeam?.name || m.match.homeTeamId);
                        const title = `${score} (${isHome ? s.name : oppName} - ${isHome ? oppName : s.name})\n${dateStr}`;
                        return { code, color, title };
                      });
                      
                      const formItems = last5.map((it, i) => (
                        <Tooltip.Root key={i}>
                          <Tooltip.Trigger asChild>
                            <button type="button" className={`inline-flex items-center justify-center rounded ${it.color} text-[8px] leading-none w-5 h-5 sm:w-6 sm:h-6 text-white`}>
                              {it.code}
                            </button>
                          </Tooltip.Trigger>
                          <Tooltip.Content side="top" sideOffset={6} className="rounded bg-black/80 text-white text-xs px-2 py-1 shadow whitespace-pre-line">
                            {it.title}
                            <Tooltip.Arrow className="fill-black/80" />
                          </Tooltip.Content>
                        </Tooltip.Root>
                      ));
                      
                      return (
                        <tr key={s.teamId} className="text-white">
                          <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm">{s.rank}</td>
                          <td className="py-2 pr-2 sm:pr-4 flex items-center gap-2 min-w-0">
                            <Image src={abs(s.logo) || '/elitelogo.png'} alt={s.name} width={20} height={20} className="rounded-full border border-white/10 flex-shrink-0" />
                            <span className="text-xs sm:text-sm truncate">{s.name}</span>
                            {(uptoGameDay !== 'all' || uptoRound !== 'all') && moveIcon && (
                              <span className="ml-2 inline-flex items-center gap-1 text-xs">{moveIcon}<span className="text-white/70">{delta ? (delta > 0 ? `+${delta}` : `${delta}`) : '0'}</span></span>
                            )}
                          </td>
                          <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm hidden sm:table-cell">{s.games ?? 0}</td>
                          <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm">{s.winsTotal ?? 0}</td>
                          <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm">{s.lossesTotal ?? 0}</td>
                          <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm hidden lg:table-cell">{s.winsRegular ?? 0}</td>
                          <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm hidden lg:table-cell">{s.winsOT ?? 0}</td>
                          <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm hidden lg:table-cell">{s.lossesOT ?? 0}</td>
                          <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm hidden lg:table-cell">{s.lossesRegular ?? 0}</td>
                          <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm hidden md:table-cell">{s.cupDiff ?? 0}</td>
                          <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm font-bold">{s.points ?? 0}</td>
                          <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm hidden sm:table-cell">
                            <Tooltip.Provider delayDuration={100}>
                              <div className="flex items-center gap-1">
                                {formItems.length === 0 ? (
                                  <span className="text-white/50">-</span>
                                ) : formItems}
                              </div>
                            </Tooltip.Provider>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
              ) : showKnockoutPlayoffTab ? (
                // Knockout bracket display
                <div className="py-8">
                  <div className="text-center mb-6">
                    <h2 className={`${bebasNeue.className} text-3xl md:text-4xl text-[#FFDB11] mb-2 tracking-wider`}>
                      PLAYOFF
                    </h2>
                    
                    {/* Round subtabs */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                      <button
                        onClick={() => setPlayoffRoundTab('quarter')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          playoffRoundTab === 'quarter' 
                            ? 'bg-[#FFDB11] text-black' 
                            : 'bg-black/40 text-white/60 hover:text-white/80 border border-[#FFDB11]/30'
                        }`}
                      >
                        Negyeddöntő
                      </button>
                      <button
                        onClick={() => setPlayoffRoundTab('semi')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          playoffRoundTab === 'semi' 
                            ? 'bg-[#FFDB11] text-black' 
                            : 'bg-black/40 text-white/60 hover:text-white/80 border border-[#FFDB11]/30'
                        }`}
                      >
                        Elődöntő
                      </button>
                      <button
                        onClick={() => setPlayoffRoundTab('final')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          playoffRoundTab === 'final' 
                            ? 'bg-[#FFDB11] text-black' 
                            : 'bg-black/40 text-white/60 hover:text-white/80 border border-[#FFDB11]/30'
                        }`}
                      >
                        Döntő
                      </button>
                    </div>
                  </div>
                  {knockoutBracketData ? (
                    <div className="flex flex-col items-center gap-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 lg:gap-24 w-full max-w-6xl">
                        {/* Left column */}
                        <div className="space-y-6">
                          {(() => {
                            let matchups: any[] = [];
                            if (playoffRoundTab === 'quarter') {
                              matchups = knockoutBracket?.quarterfinals || [];
                            } else if (playoffRoundTab === 'semi') {
                              matchups = knockoutBracket?.semifinals || [];
                            } else if (playoffRoundTab === 'final') {
                              matchups = knockoutBracket?.finals || [];
                            }
                            
                            const endIdx = playoffRoundTab === 'quarter' ? 2 : matchups.length;
                            return matchups.slice(0, endIdx).map((matchup: any, matchupIdx: number) => {
                              const matchupWithMatches = knockoutMatchupsWithMatches.find((m: any) => {
                                const teamIds = [matchup.homeTeamId, matchup.awayTeamId].sort();
                                const mTeamIds = [m.homeTeamId, m.awayTeamId].sort();
                                return teamIds[0] === mTeamIds[0] && teamIds[1] === mTeamIds[1];
                              });
                              
                              const homeTeam = knockoutBracketData.teams.find((t: any) => t.teamId === matchup.homeTeamId);
                              const awayTeam = knockoutBracketData.teams.find((t: any) => t.teamId === matchup.awayTeamId);
                              
                              let pairTeam0IsHome = true;
                              if (matchupWithMatches && homeTeam && awayTeam) {
                                pairTeam0IsHome = matchupWithMatches.homeTeamId === homeTeam.teamId;
                              }
                              
                              let team0Wins = 0;
                              let team1Wins = 0;
                              if (matchupWithMatches && matchupWithMatches.matches) {
                                matchupWithMatches.matches.forEach((match: any, matchIdx: number) => {
                                  if (match.homeScore !== null && match.awayScore !== null) {
                                    const matchNumber = matchIdx + 1;
                                    const isOddMatch = matchNumber % 2 === 1;
                                    const isTeam0HomeThisMatch = isOddMatch ? pairTeam0IsHome : !pairTeam0IsHome;
                                    
                                    if (match.homeScore > match.awayScore) {
                                      if (isTeam0HomeThisMatch) team0Wins++;
                                      else team1Wins++;
                                    } else if (match.awayScore > match.homeScore) {
                                      if (isTeam0HomeThisMatch) team1Wins++;
                                      else team0Wins++;
                                    }
                                  }
                                });
                              } else if (matchupWithMatches) {
                                team0Wins = pairTeam0IsHome ? matchupWithMatches.homeWins : matchupWithMatches.awayWins;
                                team1Wins = pairTeam0IsHome ? matchupWithMatches.awayWins : matchupWithMatches.homeWins;
                              }
                              
                              const isAfterFirstMatchup = playoffRoundTab === 'quarter' && matchupIdx === 0;
                              
                              return (
                                <div key={matchupIdx} className={`relative ${isAfterFirstMatchup ? 'mb-20' : ''}`}>
                                  {[homeTeam, awayTeam].map((team: any, itemIndex: number) => {
                                    if (!team) return null;
                                    const wins = itemIndex === 0 ? team0Wins : team1Wins;
                                    const isWinner = matchup.winnerId === team.teamId;
                                    const seed = knockoutBracketData.teams.findIndex((t: any) => t.teamId === team.teamId) + 1;
                                    
                                    return (
                                      <div key={itemIndex} className={`relative ${itemIndex === 0 ? 'mb-3' : ''}`}>
                                        <div className={`bg-gradient-to-r from-[#ff5c1a]/20 via-[#ff5c1a]/10 to-transparent rounded-xl border-2 ${isWinner ? 'border-green-500' : 'border-[#ff5c1a]/60'} p-4 min-h-[110px] md:min-h-[90px] flex flex-col justify-center hover:border-[#ff5c1a] hover:shadow-lg hover:shadow-[#ff5c1a]/30 transition-all`}>
                                          <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                              {seed && (
                                                <span className={`${bebasNeue.className} text-[#ff5c1a] font-bold text-xl flex-shrink-0`}>
                                                  {seed}.
                                                </span>
                                              )}
                                              <span className={`${bebasNeue.className} text-white font-semibold text-lg md:text-xl truncate tracking-wide ${isWinner ? 'text-green-400' : ''}`}>
                                                {team.name.toUpperCase()}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                              {matchupWithMatches && matchupWithMatches.matches && matchupWithMatches.matches.length > 0 && (
                                                <span className={`${bebasNeue.className} text-3xl md:text-4xl font-bold ${wins > (itemIndex === 0 ? team1Wins : team0Wins) ? 'text-[#ff5c1a]' : 'text-white/60'}`}>
                                                  {wins}
                                                </span>
                                              )}
                                              <Image 
                                                src={team.logo || '/elitelogo.png'} 
                                                alt={team.name} 
                                                width={48} 
                                                height={48} 
                                                className="object-contain w-12 h-12 md:w-14 md:h-14"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                        {itemIndex === 0 && (
                                          <>
                                            {matchupWithMatches && matchupWithMatches.matches && matchupWithMatches.matches.length > 0 && (
                                              <div className="pt-3">
                                                <div className="flex items-center justify-center gap-2 text-sm text-white/80">
                                                  <span className="text-white/60">
                                                    {matchupWithMatches.matches.slice(0, 7).map((match: any, matchIdx: number) => {
                                                      const homeScore = match.homeScore ?? 0;
                                                      const awayScore = match.awayScore ?? 0;
                                                      
                                                      const matchNumber = matchIdx + 1;
                                                      const isOddMatch = matchNumber % 2 === 1;
                                                      const isTeam0HomeThisMatch = isOddMatch ? pairTeam0IsHome : !pairTeam0IsHome;
                                                      
                                                      let displayScore0, displayScore1;
                                                      if (isTeam0HomeThisMatch) {
                                                        displayScore0 = homeScore;
                                                        displayScore1 = awayScore;
                                                      } else {
                                                        displayScore0 = awayScore;
                                                        displayScore1 = homeScore;
                                                      }
                                                      
                                                      return (
                                                        <span key={matchIdx}>
                                                          {displayScore0}-{displayScore1}
                                                          {matchIdx < Math.min(matchupWithMatches.matches.length, 7) - 1 ? ', ' : ''}
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
                            let matchups: any[] = [];
                            if (playoffRoundTab === 'quarter') {
                              matchups = knockoutBracket?.quarterfinals || [];
                            } else if (playoffRoundTab === 'semi') {
                              matchups = knockoutBracket?.semifinals || [];
                            } else if (playoffRoundTab === 'final') {
                              matchups = knockoutBracket?.finals || [];
                            }
                            
                            const startIdx = playoffRoundTab === 'quarter' ? 2 : 0;
                            return matchups.slice(startIdx).map((matchup: any, matchupIdx: number) => {
                              const matchupWithMatches = knockoutMatchupsWithMatches.find((m: any) => {
                                const teamIds = [matchup.homeTeamId, matchup.awayTeamId].sort();
                                const mTeamIds = [m.homeTeamId, m.awayTeamId].sort();
                                return teamIds[0] === mTeamIds[0] && teamIds[1] === mTeamIds[1];
                              });
                              
                              const homeTeam = knockoutBracketData.teams.find((t: any) => t.teamId === matchup.homeTeamId);
                              const awayTeam = knockoutBracketData.teams.find((t: any) => t.teamId === matchup.awayTeamId);
                              
                              let pairTeam0IsHome = true;
                              if (matchupWithMatches && homeTeam && awayTeam) {
                                pairTeam0IsHome = matchupWithMatches.homeTeamId === homeTeam.teamId;
                              }
                              
                              let team0Wins = 0;
                              let team1Wins = 0;
                              if (matchupWithMatches && matchupWithMatches.matches) {
                                matchupWithMatches.matches.forEach((match: any, matchIdx: number) => {
                                  if (match.homeScore !== null && match.awayScore !== null) {
                                    const matchNumber = matchIdx + 1;
                                    const isOddMatch = matchNumber % 2 === 1;
                                    const isTeam0HomeThisMatch = isOddMatch ? pairTeam0IsHome : !pairTeam0IsHome;
                                    
                                    if (match.homeScore > match.awayScore) {
                                      if (isTeam0HomeThisMatch) team0Wins++;
                                      else team1Wins++;
                                    } else if (match.awayScore > match.homeScore) {
                                      if (isTeam0HomeThisMatch) team1Wins++;
                                      else team0Wins++;
                                    }
                                  }
                                });
                              } else if (matchupWithMatches) {
                                team0Wins = pairTeam0IsHome ? matchupWithMatches.homeWins : matchupWithMatches.awayWins;
                                team1Wins = pairTeam0IsHome ? matchupWithMatches.awayWins : matchupWithMatches.homeWins;
                              }
                              
                              const isAfterFirstMatchup = playoffRoundTab === 'quarter' && matchupIdx === 0;
                              
                              return (
                                <div key={matchupIdx} className={`relative ${isAfterFirstMatchup ? 'mb-20' : ''}`}>
                                  {[homeTeam, awayTeam].map((team: any, itemIndex: number) => {
                                    if (!team) return null;
                                    const wins = itemIndex === 0 ? team0Wins : team1Wins;
                                    const isWinner = matchup.winnerId === team.teamId;
                                    const seed = knockoutBracketData.teams.findIndex((t: any) => t.teamId === team.teamId) + 1;
                                    
                                    return (
                                      <div key={itemIndex} className={`relative ${itemIndex === 0 ? 'mb-3' : ''}`}>
                                        <div className={`bg-gradient-to-r from-transparent via-[#ff5c1a]/10 to-[#ff5c1a]/20 rounded-xl border-2 ${isWinner ? 'border-green-500' : 'border-[#ff5c1a]/60'} p-4 min-h-[110px] md:min-h-[90px] flex flex-col justify-center hover:border-[#ff5c1a] hover:shadow-lg hover:shadow-[#ff5c1a]/30 transition-all`}>
                                          <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                              {seed && (
                                                <span className={`${bebasNeue.className} text-[#ff5c1a] font-bold text-xl flex-shrink-0`}>
                                                  {seed}.
                                                </span>
                                              )}
                                              <span className={`${bebasNeue.className} text-white font-semibold text-lg md:text-xl truncate tracking-wide ${isWinner ? 'text-green-400' : ''}`}>
                                                {team.name.toUpperCase()}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                              {matchupWithMatches && matchupWithMatches.matches && matchupWithMatches.matches.length > 0 && (
                                                <span className={`${bebasNeue.className} text-3xl md:text-4xl font-bold ${wins > (itemIndex === 0 ? team1Wins : team0Wins) ? 'text-[#ff5c1a]' : 'text-white/60'}`}>
                                                  {wins}
                                                </span>
                                              )}
                                              <Image 
                                                src={team.logo || '/elitelogo.png'} 
                                                alt={team.name} 
                                                width={48} 
                                                height={48} 
                                                className="object-contain w-12 h-12 md:w-14 md:h-14"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                        {itemIndex === 0 && (
                                          <>
                                            {matchupWithMatches && matchupWithMatches.matches && matchupWithMatches.matches.length > 0 && (
                                              <div className="pt-3">
                                                <div className="flex items-center justify-center gap-2 text-sm text-white/80">
                                                  <span className="text-white/60">
                                                    {matchupWithMatches.matches.slice(0, 7).map((match: any, matchIdx: number) => {
                                                      const homeScore = match.homeScore ?? 0;
                                                      const awayScore = match.awayScore ?? 0;
                                                      
                                                      const matchNumber = matchIdx + 1;
                                                      const isOddMatch = matchNumber % 2 === 1;
                                                      const isTeam0HomeThisMatch = isOddMatch ? pairTeam0IsHome : !pairTeam0IsHome;
                                                      
                                                      let displayScore0, displayScore1;
                                                      if (isTeam0HomeThisMatch) {
                                                        displayScore0 = homeScore;
                                                        displayScore1 = awayScore;
                                                      } else {
                                                        displayScore0 = awayScore;
                                                        displayScore1 = homeScore;
                                                      }
                                                      
                                                      return (
                                                        <span key={matchIdx}>
                                                          {displayScore0}-{displayScore1}
                                                          {matchIdx < Math.min(matchupWithMatches.matches.length, 7) - 1 ? ', ' : ''}
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
                <div className="space-y-8">
                  {playoffGroups?.upper && playoffGroups.upper.standings && playoffGroups.upper.standings.length > 0 && (
                    <div>
                      <h3 className={`${bebasNeue.className} text-[#FFDB11] text-xl md:text-2xl mb-4`}>
                        Felső ház tabella
                      </h3>
                      {renderPlayoffTable(playoffGroups.upper.standings, 'Felső ház')}
                    </div>
                  )}
                  {playoffGroups?.lower && playoffGroups.lower.standings && playoffGroups.lower.standings.length > 0 && (
                    <div>
                      <h3 className={`${bebasNeue.className} text-[#FFDB11] text-xl md:text-2xl mb-4`}>
                        Alsó ház tabella
                      </h3>
                      {renderPlayoffTable(
                        playoffGroups.lower.standings.map((s: any, idx: number) => ({
                          ...s,
                          rank: (playoffGroups.upper?.standings?.length || 0) + idx + 1
                        })),
                        'Alsó ház'
                      )}
                    </div>
                  )}
                  {(!playoffGroups?.upper?.standings?.length && !playoffGroups?.lower?.standings?.length) && (
                    <div className="text-center py-8 text-white/70">
                      Még nem elérhető a playoff tabella.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}