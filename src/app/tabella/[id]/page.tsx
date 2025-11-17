"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Bebas_Neue } from 'next/font/google';
import { useGetChampionshipByIdQuery, useGetStandingsQuery, useGetStandingsByDayQuery, useGetStandingsUptoGameDayQuery, useGetStandingsUptoRoundQuery, useGetStandingsByGameDayQuery, useGetMatchesForLeagueQuery, useGetPlayoffGroupsQuery } from '@/lib/features/championship/championshipSlice';
import { FiArrowUp, FiArrowDown, FiMinus } from 'react-icons/fi';
import * as Tooltip from '@radix-ui/react-tooltip';
import TopNav from '../../components/TopNav';
import { use } from 'react';

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'] });

export default function DetailedTablePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: championshipId } = use(params);
  const { data: championship, isLoading } = useGetChampionshipByIdQuery(championshipId);
  const { data: leagueMatches } = useGetMatchesForLeagueQuery(championshipId, { skip: !championshipId });
  
  const hasGroupedPlayoff = Boolean(championship?.properties?.hasPlayoff && championship?.properties?.playoffType === 'groupped');
  const { data: playoffGroups } = useGetPlayoffGroupsQuery(championshipId, { skip: !championshipId || !hasGroupedPlayoff });
  const showPlayoffTab = hasGroupedPlayoff && Boolean(playoffGroups?.enabled && playoffGroups?.ready);
  
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [uptoGameDay, setUptoGameDay] = useState<number | 'all'>('all');
  const [uptoRound, setUptoRound] = useState<number | 'all'>('all');
  const [standingsTab, setStandingsTab] = useState<'regular' | 'playoff'>(showPlayoffTab ? 'playoff' : 'regular');
  
  // Auto-switch to playoff tab when available
  useEffect(() => {
    if (showPlayoffTab && standingsTab === 'regular') {
      setStandingsTab('playoff');
    }
  }, [showPlayoffTab]);

  const { data: standingsData } = useGetStandingsQuery(championshipId, { skip: !championshipId || !championship?.isStarted || selectedDay !== 'all' || uptoGameDay !== 'all' || uptoRound !== 'all' });
  const { data: standingsByDay } = useGetStandingsByGameDayQuery({ id: championshipId, gameDay: Number(selectedDay) }, { skip: !championshipId || !championship?.isStarted || selectedDay === 'all' });
  const { data: standingsUpto } = useGetStandingsUptoGameDayQuery({ id: championshipId, gameDay: Number(uptoGameDay) }, { skip: !championshipId || !championship?.isStarted || uptoGameDay === 'all' || uptoRound !== 'all' });
  const { data: standingsPrev } = useGetStandingsUptoGameDayQuery({ id: championshipId, gameDay: Number(uptoGameDay) - 1 }, { skip: !championshipId || !championship?.isStarted || uptoGameDay === 'all' || Number(uptoGameDay) <= 1 });
  const { data: standingsUptoRound } = useGetStandingsUptoRoundQuery({ id: championshipId, round: Number(uptoRound) }, { skip: !championshipId || !championship?.isStarted || uptoRound === 'all' });
  const { data: standingsPrevRound } = useGetStandingsUptoRoundQuery({ id: championshipId, round: Number(uptoRound) - 1 }, { skip: !championshipId || !championship?.isStarted || uptoRound === 'all' || Number(uptoRound) <= 1 });

  if (isLoading || !championship) return <div className="p-6 text-white">Betöltés...</div>;

  // absolute URL helper for logos coming from backend
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555';
  const abs = (p?: string | null) => (p ? (p.startsWith('http') ? p : `${backendBase}${p}`) : '');

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