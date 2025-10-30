"use client";

import { Bebas_Neue } from "next/font/google";
import { useState, useEffect, use } from 'react';
import Image from "next/image";
import { useGetChampionshipByIdQuery, useGetMatchesForLeagueQuery } from '@/lib/features/championship/championshipSlice';
import TopNav from '../../components/TopNav';

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'] });

export default function MatchesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: championshipId } = use(params);
  const { data: championship, isLoading } = useGetChampionshipByIdQuery(championshipId);
  const { data: matchesData, isLoading: matchesLoading } = useGetMatchesForLeagueQuery(championshipId, { skip: !championshipId });

  const [selectedGameDay, setSelectedGameDay] = useState<number | 'all'>('all');
  const [selectedRound, setSelectedRound] = useState<number | 'all'>('all');

  // Get unique game days and rounds from matches
  // For filter dropdown: show all effective gameDays (delayedGameDay || gameDay) so filtering works correctly
  const gameDays = matchesData ? 
    Array.from(new Set(matchesData.map((match: any) => {
      const effectiveGameDay = (typeof match.match.delayedGameDay === 'number' && !Number.isNaN(match.match.delayedGameDay))
        ? match.match.delayedGameDay
        : match.match.gameDay;
      return effectiveGameDay;
    }).filter(Boolean)))
      .sort((a: any, b: any) => a - b) : [];

  const rounds = matchesData ? 
    Array.from(new Set(matchesData.map((match: any) => match.match.matchRound).filter(Boolean)))
      .sort((a: any, b: any) => a - b) : [];

  // Filter matches by selected criteria (mutually exclusive)
  // When filtering by gameDay, use effective gameDay (delayedGameDay || gameDay) so delayed matches appear in correct gameday
  const filteredMatches = (matchesData || []).filter((match: any) => {
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
  const matchesByGameDay = filteredMatches.reduce((acc: any, match: any) => {
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
      year: 'numeric',
      month: 'long', 
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
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-8">
            <h2 className={`${bebasNeue.className} text-[#FFDB11] text-2xl md:text-3xl mb-6`}>
              Mérkőzések
            </h2>

            {/* Filters */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <label className="text-white/70 text-sm font-medium">Játéknap szűrő:</label>
                <select 
                  value={selectedGameDay} 
                  onChange={(e) => {
                    const value = e.target.value === 'all' ? 'all' : Number(e.target.value);
                    setSelectedGameDay(value);
                    if (value !== 'all') {
                      setSelectedRound('all'); // Reset round filter when game day is selected
                    }
                  }}
                  className="bg-black/40 text-white border border-white/20 rounded px-3 py-2 text-sm"
                >
                  <option value="all">Összes játéknap</option>
                  {gameDays.map((gameDay: number) => (
                    <option key={gameDay} value={gameDay}>Játéknap {gameDay}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <label className="text-white/70 text-sm font-medium">Forduló szűrő:</label>
                <select 
                  value={selectedRound} 
                  onChange={(e) => {
                    const value = e.target.value === 'all' ? 'all' : Number(e.target.value);
                    setSelectedRound(value);
                    if (value !== 'all') {
                      setSelectedGameDay('all'); // Reset game day filter when round is selected
                    }
                  }}
                  className="bg-black/40 text-white border border-white/20 rounded px-3 py-2 text-sm"
                >
                  <option value="all">Összes forduló</option>
                  {rounds.map((round: number) => (
                    <option key={round} value={round}>Forduló {round}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Matches by Game Day and Round */}
          <div className="space-y-8">
            {Object.entries(matchesByGameDay).map(([gameDay, roundsData]: [string, any]) => (
              <div key={gameDay} className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-6">
                <h2 className={`${bebasNeue.className} text-[#FFDB11] text-2xl mb-6`}>
                  Játéknap {gameDay}
                </h2>
                
                <div className="space-y-6">
                  {Object.entries(roundsData).map(([round, matches]: [string, any]) => (
                    <div key={round} className="bg-black/30 rounded-xl p-4 border border-white/5">
                      <h3 className={`${bebasNeue.className} text-white text-lg mb-4`}>
                        Forduló {round}
                      </h3>
                      
                      <div className="space-y-4">
                        {(matches as any[]).map((match: any) => {
                          const isDelayed = match.match.isDelayed || false;
                          const originalGd = match.match.gameDay || 0;
                          const delayedGd = match.match.delayedGameDay || 0;
                          const badgeText = delayedGd > originalGd ? 'HALASZTOTT' : delayedGd < originalGd ? 'ELŐREHOZOTT' : null;
                          
                          return (
                            <div
                              key={match.match.id}
                              className={`relative bg-black/40 rounded-xl p-4 border ${isDelayed ? 'border-yellow-500/50' : 'border-white/10'} hover:border-white/20 transition-colors`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="flex-shrink-0 w-10 h-10 relative">
                                      {match.homeTeam?.logo ? (
                                        <Image
                                          src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}${match.homeTeam.logo}`}
                                          alt={match.homeTeam.name}
                                          fill
                                          className="object-contain"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                          <span className="text-sm text-white">?</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-white font-medium truncate">{match.homeTeam?.name || 'Ismeretlen'}</div>
                                      {match.match.homeTeamScore !== null && (
                                        <div className="text-white/70 text-sm">{match.match.homeTeamScore}</div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-col items-center gap-2 px-4 relative">
                                    {/* Badge for delayed/moved matches - above VS */}
                                    {isDelayed && badgeText && (
                                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
                                        <div className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
                                          badgeText === 'HALASZTOTT' ? 'bg-yellow-600/90 text-white' : 'bg-blue-600/90 text-white'
                                        }`}>
                                          {badgeText}
                                        </div>
                                      </div>
                                    )}
                                    <span className="text-white/70 text-sm">VS</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-3 min-w-0 flex-1 justify-end">
                                    <div className="min-w-0 text-right">
                                      <div className="text-white font-medium truncate">{match.awayTeam?.name || 'Ismeretlen'}</div>
                                      {match.match.awayTeamScore !== null && (
                                        <div className="text-white/70 text-sm">{match.match.awayTeamScore}</div>
                                      )}
                                    </div>
                                    <div className="flex-shrink-0 w-10 h-10 relative">
                                      {match.awayTeam?.logo ? (
                                        <Image
                                          src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}${match.awayTeam.logo}`}
                                          alt={match.awayTeam.name}
                                          fill
                                          className="object-contain"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                          <span className="text-sm text-white">?</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col items-end ml-4 min-w-0">
                                  <div className={`text-sm font-medium ${getMatchStatusColor(match.match.matchStatus)}`}>
                                    {getMatchStatusText(match.match.matchStatus)}
                                  </div>
                                  <div className="text-white/70 text-sm">
                                    {formatMatchDate(match.match.matchAt || match.match.matchDate)}
                                  </div>
                                </div>
                              </div>
                            </div>
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
