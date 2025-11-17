"use client";

import { Bebas_Neue } from "next/font/google";
import { useState, useEffect, use } from 'react';
import Image from "next/image";
import Link from "next/link";
import { useGetChampionshipByIdQuery, useGetMatchesForLeagueQuery, useGetPlayoffMatchesQuery, useGetPlayoffGroupsQuery } from '@/lib/features/championship/championshipSlice';
import TopNav from '../../components/TopNav';

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'] });

export default function MatchesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: championshipId } = use(params);
  const { data: championship, isLoading } = useGetChampionshipByIdQuery(championshipId);
  const { data: matchesData, isLoading: matchesLoading } = useGetMatchesForLeagueQuery(championshipId, { skip: !championshipId });
  
  const hasGroupedPlayoff = Boolean(championship?.properties?.hasPlayoff && championship?.properties?.playoffType === 'groupped');
  const { data: playoffGroups } = useGetPlayoffGroupsQuery(championshipId, { skip: !championshipId || !hasGroupedPlayoff });
  const { data: playoffMatchesData } = useGetPlayoffMatchesQuery(championshipId, { skip: !championshipId || !hasGroupedPlayoff });
  const showPlayoffTab = hasGroupedPlayoff && Boolean(playoffGroups?.enabled && playoffGroups?.ready);

  const [selectedGameDay, setSelectedGameDay] = useState<number | 'all'>('all');
  const [selectedRound, setSelectedRound] = useState<number | 'all'>('all');
  const [matchTab, setMatchTab] = useState<'regular' | 'playoff'>(showPlayoffTab ? 'playoff' : 'regular');
  
  // Auto-switch to playoff tab when available
  useEffect(() => {
    if (showPlayoffTab && matchTab === 'regular') {
      setMatchTab('playoff');
    }
  }, [showPlayoffTab]);
  
  // Normalize playoff matches to match regular match format, keeping upper and lower separate
  const normalizePlayoffHouseMatches = (matches: any[]) => {
    return matches.map((m: any) => ({
      match: {
        id: m.id,
        leagueId: championshipId,
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
        gameDay: m.gameDay || 0,
        matchTable: m.table,
        isDelayed: false,
        delayedRound: m.round,
        delayedGameDay: m.gameDay || 0,
        delayedDate: m.matchAt,
        delayedTime: m.matchAt,
        delayedTable: m.table,
      },
      homeTeam: { id: m.home?.id, name: m.home?.name, logo: m.home?.logo },
      awayTeam: { id: m.away?.id, name: m.away?.name, logo: m.away?.logo },
    }));
  };
  
  const playoffUpperMatches = playoffMatchesData && Array.isArray(playoffMatchesData.upper) 
    ? normalizePlayoffHouseMatches(playoffMatchesData.upper) 
    : [];
  const playoffLowerMatches = playoffMatchesData && Array.isArray(playoffMatchesData.lower) 
    ? normalizePlayoffHouseMatches(playoffMatchesData.lower) 
    : [];
  
  const allMatches = matchTab === 'playoff' ? [...playoffUpperMatches, ...playoffLowerMatches] : (matchesData || []);

  // Get unique game days and rounds from matches
  // For filter dropdown: show all effective gameDays (delayedGameDay || gameDay) so filtering works correctly
  const gameDays = allMatches ? 
    Array.from(new Set(allMatches.map((match: any) => {
      const effectiveGameDay = (typeof match.match.delayedGameDay === 'number' && !Number.isNaN(match.match.delayedGameDay))
        ? match.match.delayedGameDay
        : match.match.gameDay;
      return effectiveGameDay;
    }).filter(Boolean)))
      .sort((a: any, b: any) => a - b) : [];

  const rounds = allMatches ? 
    Array.from(new Set(allMatches.map((match: any) => match.match.matchRound).filter(Boolean)))
      .sort((a: any, b: any) => a - b) : [];

  // Filter matches by selected criteria (mutually exclusive)
  // When filtering by gameDay, use effective gameDay (delayedGameDay || gameDay) so delayed matches appear in correct gameday
  // For playoff matches, don't filter by game day or round - show all together
  const filteredMatches = matchTab === 'playoff' ? allMatches : allMatches.filter((match: any) => {
    if (selectedGameDay !== 'all') {
      const effectiveGameDay = (typeof match.match.delayedGameDay === 'number' && !Number.isNaN(match.match.delayedGameDay))
        ? match.match.delayedGameDay
        : match.match.gameDay;
      return effectiveGameDay === selectedGameDay;
    } else if (selectedRound !== 'all') {
      const isDelayed = match.match.isDelayed || false;
      const effectiveRound = (isDelayed && match.match.delayedRound)
        ? match.match.delayedRound
        : match.match.matchRound;
      return effectiveRound === selectedRound;
    }
    return true; // Show all if both are 'all'
  });

  // Group matches by effective game day and round (using delayedGameDay/delayedRound if available)
  // For playoff matches, group by upper/lower house, sorted by date
  const matchesByGameDay = matchTab === 'playoff' ? (() => {
    // Sort each house by date
    const sortByDate = (matches: any[]) => {
      return [...matches].sort((a: any, b: any) => {
        const dateA = a.match.matchAt ? new Date(a.match.matchAt).getTime() : 0;
        const dateB = b.match.matchAt ? new Date(b.match.matchAt).getTime() : 0;
        return dateA - dateB;
      });
    };
    
    const grouped: any = {};
    if (playoffUpperMatches.length > 0) {
      grouped['Felső ház'] = { 'Összes': sortByDate(playoffUpperMatches) };
    }
    if (playoffLowerMatches.length > 0) {
      grouped['Alsó ház'] = { 'Összes': sortByDate(playoffLowerMatches) };
    }
    return grouped;
  })() : filteredMatches.reduce((acc: any, match: any) => {
    const isDelayed = match.match.isDelayed || false;
    const effectiveGameDay = (typeof match.match.delayedGameDay === 'number' && !Number.isNaN(match.match.delayedGameDay)) 
      ? match.match.delayedGameDay 
      : (match.match.gameDay || 'Nincs játéknap');
    const effectiveRound = (isDelayed && match.match.delayedRound) 
      ? match.match.delayedRound 
      : (match.match.matchRound || 'Nincs forduló');
    
    if (!acc[effectiveGameDay]) {
      acc[effectiveGameDay] = {};
    }
    if (!acc[effectiveGameDay][effectiveRound]) {
      acc[effectiveGameDay][effectiveRound] = [];
    }
    acc[effectiveGameDay][effectiveRound].push(match);
    return acc;
  }, {});

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'scheduled': return 'text-blue-400';
      case 'in_progress': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getMatchStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Befejezve';
      case 'scheduled': return 'Ütemezve';
      case 'in_progress': return 'Folyamatban';
      default: return 'Ismeretlen';
    }
  };

  if (isLoading || matchesLoading) {
    return (
      <div className="min-h-screen bg-black">
        <TopNav />
        <div className="pt-20 pb-12">
          <div className="max-w-6xl mx-auto px-4">
            <div className="animate-pulse">
              <div className="h-8 bg-white/20 rounded mb-4"></div>
              <div className="h-4 bg-white/20 rounded w-3/4 mb-8"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-white/10 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <TopNav />
      <div className="pt-20 pb-12">
        {/* Hero Section - Full Width */}
        <div className="relative mb-16 mx-4">
          <div className="relative w-full h-96 md:h-[500px] rounded-2xl overflow-hidden">
            <Image src="/title.jpg" alt="Beerpong Arena" fill className="object-cover" priority />
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <h1 className={`${bebasNeue.className} text-[#FFDB11] text-4xl md:text-6xl lg:text-7xl mb-4`}>
                  {championship?.name} - Mérkőzések
                </h1>
                <p className="text-white text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto">
                  {championship?.isStarted ? (championship.phase === 'knockout' ? 'Knockout fázis' : 'Alapszakasz') : 'Nem kezdődött el'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section - Centered */}
        <div className="max-w-6xl mx-auto px-2 sm:px-4">
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className={`${bebasNeue.className} text-[#FFDB11] text-xl sm:text-2xl md:text-3xl`}>
                Mérkőzések
              </h2>
              {showPlayoffTab && (
                <div className="flex space-x-2 bg-black/40 rounded-lg p-1 border border-[#FFDB11]/30">
                  <button
                    onClick={() => setMatchTab('regular')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      matchTab === 'regular' ? 'bg-[#FFDB11] text-black' : 'bg-transparent text-white/70 hover:bg-black/60'
                    }`}
                  >
                    Alapszakasz
                  </button>
                  <button
                    onClick={() => setMatchTab('playoff')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      matchTab === 'playoff' ? 'bg-[#FFDB11] text-black' : 'bg-transparent text-white/70 hover:bg-black/60'
                    }`}
                  >
                    Playoff
                  </button>
                </div>
              )}
            </div>

            {/* Filters - only show for regular matches */}
          {matchTab === 'regular' && (
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full">
                <label className="text-white/70 text-xs sm:text-sm font-medium whitespace-nowrap">Játéknap szűrő:</label>
                <select 
                  value={selectedGameDay} 
                  onChange={(e) => {
                    const value = e.target.value === 'all' ? 'all' : Number(e.target.value);
                    setSelectedGameDay(value);
                    if (value !== 'all') {
                      setSelectedRound('all'); // Reset round filter when game day is selected
                    }
                  }}
                  className="w-full sm:w-auto bg-black/40 text-white border border-white/20 rounded px-3 py-2 text-sm"
                >
                  <option value="all">Összes játéknap</option>
                  {gameDays.map((gameDay: number) => (
                    <option key={gameDay} value={gameDay}>Játéknap {gameDay}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full">
                <label className="text-white/70 text-xs sm:text-sm font-medium whitespace-nowrap">Forduló szűrő:</label>
                <select 
                  value={selectedRound} 
                  onChange={(e) => {
                    const value = e.target.value === 'all' ? 'all' : Number(e.target.value);
                    setSelectedRound(value);
                    if (value !== 'all') {
                      setSelectedGameDay('all'); // Reset game day filter when round is selected
                    }
                  }}
                  className="w-full sm:w-auto bg-black/40 text-white border border-white/20 rounded px-3 py-2 text-sm"
                >
                  <option value="all">Összes forduló</option>
                  {rounds.map((round: number) => (
                    <option key={round} value={round}>Forduló {round}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          )}

          {/* Matches by Game Day and Round */}
          <div className="space-y-6 sm:space-y-8">
            {Object.entries(matchesByGameDay).map(([gameDay, roundsData]: [string, any]) => (
              <div key={gameDay} className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-4 sm:p-6">
                {matchTab === 'regular' ? (
                  <h2 className={`${bebasNeue.className} text-[#FFDB11] text-xl sm:text-2xl mb-4 sm:mb-6`}>
                    Játéknap {gameDay}
                  </h2>
                ) : (
                  <h2 className={`${bebasNeue.className} text-[#FFDB11] text-xl sm:text-2xl mb-4 sm:mb-6`}>
                    {gameDay}
                  </h2>
                )}
                
                <div className="space-y-4 sm:space-y-6">
                  {Object.entries(roundsData).map(([round, matches]: [string, any]) => (
                    <div key={round} className="bg-black/30 rounded-xl p-3 sm:p-4 border border-white/5">
                      {matchTab === 'regular' && (
                        <h3 className={`${bebasNeue.className} text-white text-base sm:text-lg mb-3 sm:mb-4`}>
                          Forduló {round}
                        </h3>
                      )}
                      
                      <div className="space-y-3 sm:space-y-4">
                        {(matches as any[]).map((match: any) => {
                          const isDelayed = match.match.isDelayed || false;
                          const originalGd = match.match.gameDay || 0;
                          const delayedGd = match.match.delayedGameDay || 0;
                          const badgeText = delayedGd > originalGd ? 'HALASZTOTT' : delayedGd < originalGd ? 'ELŐREHOZOTT' : null;
                          const showScore = match.match.matchStatus === 'completed' && match.match.homeTeamScore !== null && match.match.awayTeamScore !== null;
                          const effectiveGameDay = (typeof match.match.delayedGameDay === 'number' && !Number.isNaN(match.match.delayedGameDay))
                            ? match.match.delayedGameDay
                            : match.match.gameDay;
                          const isTracked = match.match.trackingActive === 2 || (match.match.trackingData && Object.keys(match.match.trackingData).length > 0);
                          const isCompleted = match.match.matchStatus === 'completed';
                          
                          return (
                            <Link
                              key={match.match.id}
                              href={`/merkozes/${match.match.id}`}
                              className={`relative bg-black/40 rounded-xl p-3 border ${isDelayed ? 'border-yellow-500/50' : 'border-white/10'} hover:border-white/20 transition-colors block`}
                            >
                              {/* Badge for delayed/moved matches - mobile: top */}
                              {isDelayed && badgeText && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                                  <div className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
                                    badgeText === 'HALASZTOTT' ? 'bg-yellow-600/90 text-white' : 'bg-blue-600/90 text-white'
                                  }`}>
                                    {badgeText}
                                  </div>
                                </div>
                              )}
                              
                              {/* Tracking badge for completed matches with tracking */}
                              {isCompleted && isTracked && (
                                <div className="absolute -top-3 right-4 z-10">
                                  <div className="px-2 py-1 rounded text-xs font-semibold whitespace-nowrap bg-green-600/90 text-white flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    TRACKELT
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                                <Link href={`/csapat/${match.match.homeTeamId}`} className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity w-full sm:w-auto">
                                  <div className="flex-shrink-0 w-8 h-8 sm:w-6 sm:h-6 relative">
                                    {match.homeTeam?.logo ? (
                                      <Image
                                        src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}${match.homeTeam.logo}`}
                                        alt={match.homeTeam.name}
                                        fill
                                        className="object-contain"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 sm:w-6 sm:h-6 bg-white/20 rounded-full flex items-center justify-center">
                                        <span className="text-xs text-white">?</span>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-white text-sm sm:text-sm font-medium truncate">{match.homeTeam?.name || 'Ismeretlen'}</span>
                                </Link>
                                
                                <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 flex-shrink-0">
                                  {showScore && (
                                    <span className="text-[#ff5c1a] text-base sm:text-lg font-bold bg-[#ff5c1a]/10 px-2 sm:px-3 py-1 rounded">{match.match.homeTeamScore}</span>
                                  )}
                                  <span className="text-white/50 text-xs">VS</span>
                                  {showScore && (
                                    <span className="text-[#ff5c1a] text-base sm:text-lg font-bold bg-[#ff5c1a]/10 px-2 sm:px-3 py-1 rounded">{match.match.awayTeamScore}</span>
                                  )}
                                </div>
                                
                                <Link href={`/csapat/${match.match.awayTeamId}`} className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 justify-end sm:justify-end hover:opacity-80 transition-opacity w-full sm:w-auto">
                                  <span className="text-white text-sm sm:text-sm font-medium truncate">{match.awayTeam?.name || 'Ismeretlen'}</span>
                                  <div className="flex-shrink-0 w-8 h-8 sm:w-6 sm:h-6 relative">
                                    {match.awayTeam?.logo ? (
                                      <Image
                                        src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}${match.awayTeam.logo}`}
                                        alt={match.awayTeam.name}
                                        fill
                                        className="object-contain"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 sm:w-6 sm:h-6 bg-white/20 rounded-full flex items-center justify-center">
                                        <span className="text-xs text-white">?</span>
                                      </div>
                                    )}
                                  </div>
                                </Link>
                              </div>
                              <div className="text-center mt-2">
                                <div className="text-white/60 text-xs">
                                  {isDelayed && match.match.delayedTime ? 
                                    formatMatchDate(match.match.delayedTime) : 
                                    formatMatchDate(match.match.matchAt || match.match.matchDate)
                                  }
                                </div>
                                <div className="text-white/40 text-xs">
                                  Játéknap {effectiveGameDay || '?'}
                                </div>
                                <div className={`text-xs mt-1 ${getMatchStatusColor(match.match.matchStatus)}`}>
                                  {getMatchStatusText(match.match.matchStatus)}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filteredMatches.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/70 text-lg">Nincs mérkőzés a kiválasztott szűrőkkel</p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
