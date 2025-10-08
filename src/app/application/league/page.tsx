"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Bebas_Neue } from 'next/font/google';
import { useGetMyLeagueQuery } from '@/lib/features/apiSlice';
import { useGetChampionshipByIdQuery, useGetMatchesForLeagueQuery, useGetStandingsQuery, useGetStandingsByDayQuery, useGetStandingsUptoGameDayQuery, useGetStandingsUptoRoundQuery, useGetGameDayMvpsQuery } from '@/lib/features/championship/championshipSlice';
import { FiChevronDown, FiChevronUp, FiArrowUp, FiArrowDown, FiMinus } from 'react-icons/fi';
import * as Tooltip from '@radix-ui/react-tooltip';
import RankModal from '@/app/admin/championships/[id]/RankModal';

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'] });

export default function LeaguePage() {
  const { data: my, isLoading: loadingMy } = useGetMyLeagueQuery();
  const leagueId = my?.leagueId;
  const { data: championship, isLoading } = useGetChampionshipByIdQuery(leagueId!, { skip: !leagueId });
  const { data: leagueMatches } = useGetMatchesForLeagueQuery(leagueId!, { skip: !leagueId });

  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [uptoGameDay, setUptoGameDay] = useState<number | 'all'>('all');
  const [uptoRound, setUptoRound] = useState<number | 'all'>('all');

  const { data: standingsData } = useGetStandingsQuery(leagueId!, { skip: !leagueId || !championship?.isStarted || selectedDay !== 'all' || uptoGameDay !== 'all' || uptoRound !== 'all' });
  const { data: standingsByDay } = useGetStandingsByDayQuery({ id: leagueId!, date: selectedDay }, { skip: !leagueId || !championship?.isStarted || selectedDay === 'all' });
  const { data: standingsUpto } = useGetStandingsUptoGameDayQuery({ id: leagueId!, gameDay: Number(uptoGameDay) }, { skip: !leagueId || !championship?.isStarted || uptoGameDay === 'all' || uptoRound !== 'all' });
  const { data: standingsPrev } = useGetStandingsUptoGameDayQuery({ id: leagueId!, gameDay: Number(uptoGameDay) - 1 }, { skip: !leagueId || !championship?.isStarted || uptoGameDay === 'all' || Number(uptoGameDay) <= 1 });
  const { data: standingsUptoRound } = useGetStandingsUptoRoundQuery({ id: leagueId!, round: Number(uptoRound) }, { skip: !leagueId || !championship?.isStarted || uptoRound === 'all' });
  const { data: standingsPrevRound } = useGetStandingsUptoRoundQuery({ id: leagueId!, round: Number(uptoRound) - 1 }, { skip: !leagueId || !championship?.isStarted || uptoRound === 'all' || Number(uptoRound) <= 1 });
  const { data: mvpsData } = useGetGameDayMvpsQuery(leagueId!, { skip: !leagueId || !championship?.isStarted });
  const [rankModal, setRankModal] = useState<{ open: boolean; teamId?: string; teamName?: string }>({ open: false });
  const [expandedMatchDays, setExpandedMatchDays] = useState<number[]>([]);
  const [expandedMatches, setExpandedMatches] = useState<string[]>([]);
  const [expandedRounds, setExpandedRounds] = useState<string[]>([]);

  if (loadingMy) return <div className="p-6 text-white">Betöltés...</div>;
  if (!leagueId) return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className={`${bebasNeue.className} text-4xl md:text-6xl text-white mb-4 tracking-wider`}>
            TABELLA
          </h1>
          <div className="flex items-center justify-center space-x-4 text-[#ff5c1a]">
            <span className="text-sm">•</span>
            <span className="text-sm">Nincs aktív bajnokság</span>
            <span className="text-sm">•</span>
            <span className="text-sm">Szezon</span>
          </div>
        </div>
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl text-white font-semibold mb-2">Nincs elérhető bajnokság</h2>
          <p className="text-gray-400">Nem található bajnokság az aktív szezonban.</p>
        </div>
      </div>
    </div>
  );
  if (isLoading || !championship) return <div className="p-6 text-white">Betöltés...</div>;

  // absolute URL helper for logos coming from backend
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555';
  const abs = (p?: string | null) => (p ? (p.startsWith('http') ? p : `${backendBase}${p}`) : '');

  // Build match days list grouped by date (UTC) and then rounds (read-only)
  const matchDays = (Array.isArray(leagueMatches) ? leagueMatches : [])
    .map((row: any) => {
      const match = row.match;
      const isDelayed = match.isDelayed || false;
      
      // Use original data for grouping and display
      const originalDateSrc = match.matchAt || match.matchDate || null;
      const originalTimeSrc = match.matchTime || match.matchAt || null;
      const originalTableSrc = match.matchTable;
      const originalRoundSrc = match.matchRound;
      
      if (!originalDateSrc) return null;
      const originalDateIso = new Date(originalDateSrc).toISOString();
      const originalTimeIso = originalTimeSrc ? new Date(originalTimeSrc).toISOString() : null;
      
      return {
        id: match.id,
        date: originalDateIso, // Original date for grouping
        time: originalTimeIso,
        table: originalTableSrc,
        round: originalRoundSrc,
        isDelayed,
        originalDateRaw: match.matchAt || match.matchDate,
        originalTime: match.matchTime || match.matchAt,
        originalTable: match.matchTable,
        originalRound: match.matchRound,
        delayedDate: match.delayedDate,
        delayedTime: match.delayedTime,
        delayedTable: match.delayedTable,
        delayedRound: match.delayedRound,
        home: row.homeTeam?.name || match.homeTeamId,
        homeLogo: abs(row.homeTeam?.logo) || '/elitelogo.png',
        away: row.awayTeam?.name || match.awayTeamId,
        awayLogo: abs(row.awayTeam?.logo) || '/elitelogo.png',
        homeScore: match.homeTeamScore,
        awayScore: match.awayTeamScore,
      };
    })
    .filter(Boolean)
    .reduce((acc: Record<string, any[]>, m: any) => {
      // Group by original date to maintain gameday order
      const key = new Date(m.date).toISOString().slice(0,10);
      if (!acc[key]) acc[key] = [];
      acc[key].push(m);
      
      // If delayed, also add to delayed date group
      if (m.isDelayed && m.delayedDate) {
        const delayedKey = new Date(m.delayedDate).toISOString().slice(0,10);
        if (!acc[delayedKey]) acc[delayedKey] = [];
        acc[delayedKey].push({
          ...m,
          date: new Date(m.delayedDate).toISOString(),
          time: m.delayedTime ? new Date(m.delayedTime).toISOString() : null,
          table: m.delayedTable,
          round: m.delayedRound,
        });
      }
      
      return acc;
    }, {} as Record<string, any[]>);
  const matchDayList = Object.entries(matchDays)
    .map(([date, items], idx) => ({
      id: idx + 1,
      date,
      round: (items[0] as any)?.round ?? (idx + 1),
      matches: items
        .map((m: any) => ({
          id: m.id,
          // raw timestamp for reliable sorting
          sortTime: m.time ? new Date(m.time).getTime() : 0,
          // formatted time for display
          time: m.time ? new Date(m.time).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '',
          tableNumber: m.table,
          round: m.round,
          isDelayed: m.isDelayed,
          originalDate: m.originalDate,
          originalTime: m.originalTime,
          originalTable: m.originalTable,
          originalRound: m.originalRound,
          delayedDate: m.delayedDate,
          delayedTime: m.delayedTime,
          delayedTable: m.delayedTable,
          delayedRound: m.delayedRound,
          homeTeam: { name: m.home, logo: m.homeLogo },
          awayTeam: { name: m.away, logo: m.awayLogo },
          homeScore: m.homeScore,
          awayScore: m.awayScore,
        }))
        .sort((a: any, b: any) => (a.sortTime - b.sortTime) || (a.tableNumber - b.tableNumber))
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const toggleMatchDay = (matchDayId: number) => {
    setExpandedMatchDays(prev => prev.includes(matchDayId) ? prev.filter(id => id !== matchDayId) : [...prev, matchDayId]);
  };
  const toggleRound = (key: string) => {
    setExpandedRounds(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden border-4 border-[#ff5c1a] flex-shrink-0">
          <Image src={abs(championship.logo) || '/elitelogo.png'} alt={championship.name} width={96} height={96} className="object-cover w-full h-full" />
        </div>
        <div className="text-center sm:text-left">
          <h1 className={`${bebasNeue.className} text-2xl sm:text-3xl lg:text-4xl text-white`}>{championship.name}</h1>
          <span className="inline-block px-3 py-1 rounded-full bg-[#ff5c1a] text-white font-bold text-sm sm:text-base">
            {championship.isStarted ? (championship.phase === 'knockout' ? 'Knockout' : 'Alapszkasz') : 'Nem kezdőtött el'}
          </span>
        </div>
      </div>

      {/* MVP boxes */}
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standings (read-only with filters, forms, rank modal) */}
      <div className="bg-[#001a3a]/60 rounded-xl p-6 border border-[#ff5c1a]/30 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${bebasNeue.className} text-2xl text-white`}>Tabella</h3>
        </div>
        {championship.isStarted && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end mb-3 gap-3 sm:gap-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <label className="text-white/70 text-sm">Játéknap:</label>
              <select value={selectedDay} onChange={(e) => { setSelectedDay(e.target.value); setUptoGameDay('all'); setUptoRound('all'); }} className="bg-black/40 text-white border border-white/20 rounded px-2 py-1 text-sm w-full sm:w-auto">
                <option value="all">Összes</option>
                {Array.from(new Set((leagueMatches || []).map((rm: any) => (rm.match.matchAt || rm.match.matchDate) && new Date(rm.match.matchAt || rm.match.matchDate).toISOString().slice(0,10)))).filter(Boolean).sort().map((d: string, idx: number) => (
                  <option key={`day-${d}`} value={d}>Gameday {idx + 1}</option>
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
                let source = selectedDay === 'all' ? standingsData?.standings : standingsByDay?.standings;
                if (uptoGameDay !== 'all') source = standingsUpto?.standings;
                if (uptoRound !== 'all') source = standingsUptoRound?.standings;
                const rows = (source && source.length > 0) ? source : [];
                const prevMap = new Map<string, number>();
                if (uptoRound !== 'all') {
                  if (standingsPrevRound?.standings?.length) standingsPrevRound.standings.forEach((p: any) => prevMap.set(p.teamId, p.rank));
                } else if (standingsPrev?.standings?.length) {
                  standingsPrev.standings.forEach((p: any) => prevMap.set(p.teamId, p.rank));
                }
                const formatKey = (d: any) => d ? new Date(d).toISOString().slice(0,10) : '';
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
                  // form calc with filters
                  const all = (leagueMatches || []) as any[];
                  let tMatches = all.filter((row: any) => row.match.matchStatus === 'completed' && (row.match.homeTeamId === s.teamId || row.match.awayTeamId === s.teamId));
                  if (uptoRound !== 'all') tMatches = tMatches.filter((row: any) => Number(row.match.matchRound || 0) <= Number(uptoRound));
                  else if (uptoGameDay !== 'all') tMatches = tMatches.filter((row: any) => Number(row.match.gameDay || 0) <= Number(uptoGameDay));
                  else if (selectedDay !== 'all') tMatches = tMatches.filter((row: any) => formatKey(row.match.matchAt || row.match.matchDate) === selectedDay);
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
                  return (
                    <tr key={s.teamId} className="text-white">
                      <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm">{s.rank}</td>
                      <td className="py-2 pr-2 sm:pr-4 flex items-center gap-2 min-w-0">
                        <Image src={abs(s.logo) || '/elitelogo.png'} alt={s.name} width={20} height={20} className="rounded-full border border-white/10 flex-shrink-0" />
                        <button type="button" onClick={() => setRankModal({ open: true, teamId: s.teamId, teamName: s.name })} className="underline-offset-2 hover:underline cursor-pointer text-xs sm:text-sm truncate">{s.name}</button>
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
                            {last5.length === 0 ? (
                              <span className="text-white/50">-</span>
                            ) : last5.map((it, i) => (
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
      </div>

      {rankModal.open && rankModal.teamId && (
        <RankModal
          open={rankModal.open}
          onClose={() => setRankModal({ open: false })}
          leagueId={leagueId!}
          teamId={rankModal.teamId}
          teamName={rankModal.teamName || ''}
        />
      )}

      {/* Matches grouped by Gameday and Rounds (read-only) */}
      <div className="space-y-6">
        {matchDayList.map((matchDay) => (
          <div key={matchDay.id} className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-xl overflow-hidden border border-[#ff5c1a]/40">
            <button onClick={() => toggleMatchDay(matchDay.id)} className="w-full flex items-center justify-between p-6 hover:bg-[#001a3a]/60 transition-colors">
              <h2 className={`${bebasNeue.className} text-2xl text-white`}>Gameday {matchDay.id} - {new Date(matchDay.date).toLocaleDateString('hu-HU', { timeZone: 'UTC' })}</h2>
              {expandedMatchDays.includes(matchDay.id) ? <FiChevronUp className="w-6 h-6 text-[#ff5c1a]" /> : <FiChevronDown className="w-6 h-6 text-[#ff5c1a]" />}
            </button>
            {expandedMatchDays.includes(matchDay.id) && (
              <div className="p-6 space-y-6">
                {(() => {
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
                    const sorted = (items as any[]).sort((a, b) => (a.sortTime - b.sortTime) || ((a.tableNumber as any) - (b.tableNumber as any)));
                    return (
                      <div key={key} className="bg-black/20 rounded-lg">
                        <button onClick={() => toggleRound(key)} className="w-full flex items-center justify-between px-4 py-3 border-b border-white/10">
                          <span className="text-white">{r}. Forduló</span>
                          {expandedRounds.includes(key) ? <FiChevronUp className="w-5 h-5 text-[#ff5c1a]" /> : <FiChevronDown className="w-5 h-5 text-[#ff5c1a]" />}
                        </button>
                        {expandedRounds.includes(key) && (
                          <div className="p-4 space-y-4">
                            {sorted.map((match: any) => {
                              const isOT = Math.max(Number(match.homeScore||0), Number(match.awayScore||0)) > 10 && Math.min(Number(match.homeScore||0), Number(match.awayScore||0)) >= 10;
                              const keyId = String(match.id);
                              return (
                                <div key={keyId} className={`${match.isDelayed ? (match.round === match.originalRound ? "bg-red-900/20" : "bg-yellow-900/20 border-1 border-yellow-400") : "bg-black/30"} rounded-lg p-3 sm:p-4 relative`}>
                                  <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                                      <div className="flex items-center gap-2">
                                        <Image src={match.homeTeam.logo || '/elitelogo.png'} alt={match.homeTeam.name} width={24} height={24} className="rounded-full flex-shrink-0" />
                                        <span className="text-white text-sm sm:text-base truncate">{match.homeTeam.name}</span>
                                      </div>
                                      <span className="text-white hidden sm:inline">-</span>
                                      <div className="flex items-center gap-2">
                                        <Image src={match.awayTeam.logo || '/elitelogo.png'} alt={match.awayTeam.name} width={24} height={24} className="rounded-full flex-shrink-0" />
                                        <span className="text-white text-sm sm:text-base truncate">{match.awayTeam.name}</span>
                                      </div>
                                      <span className="text-[#ff5c1a] text-sm sm:text-base">{typeof match.homeScore === 'number' && typeof match.awayScore === 'number' ? `(${match.homeScore} - ${match.awayScore}${isOT ? ' OT' : ''})` : ''}</span>
                                      {/* Delayed badge after result */}
                                      {match.isDelayed && (
                                        <div className="bg-gray-800/90 text-white px-2 py-1 rounded text-xs font-bold">
                                          {match.round === match.originalRound ? 'HALASZTVA' : 'HALASZTOTT MECCS LEJÁTSZÁSA'}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                      <span className="text-[#e0e6f7] text-xs sm:text-sm">
                                        {match.isDelayed && match.delayedTime ? 
                                          new Date(match.delayedTime).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : 
                                          match.time
                                        }
                                      </span>
                                      <span className="text-[#e0e6f7] text-xs sm:text-sm">
                                        Asztal: {match.isDelayed && match.delayedTable ? match.delayedTable : match.tableNumber}
                                      </span>
                                    </div>
                                  </div>
                                  {/* Delayed match info - only show in original round */}
                                  {match.isDelayed && (match.delayedDate || match.delayedTime || match.delayedTable || match.delayedRound) && match.round === match.originalRound && (
                                    <div className="mt-3 pt-3 border-t border-gray-600">
                                      <div className="text-xs text-gray-300 mb-2 font-bold">Halasztva erre:</div>
                                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-200">
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
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


