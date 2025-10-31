"use client";

import { Bebas_Neue } from "next/font/google";
import { useState, use, useMemo } from 'react';
import Image from "next/image";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useGetTeamByIdQuery, useGetTeamMatchesQuery, useGetTeamPlayersBySeasonQuery } from '@/lib/features/apiSlice';
import { useGetStandingsQuery, useGetChampionshipByIdQuery } from '@/lib/features/championship/championshipSlice';
import TopNav from '../../components/TopNav';
import PlayerProfileModal from '@/components/PlayerProfileModal';

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'] });

export default function TeamMatchesPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  const router = useRouter();
  const { data: team, isLoading: teamLoading } = useGetTeamByIdQuery(teamId);
  const { data: matchesData, isLoading: matchesLoading } = useGetTeamMatchesQuery({ teamId }, { skip: !teamId });

  const [selectedGameDay, setSelectedGameDay] = useState<number | 'all'>('all');
  const [selectedRound, setSelectedRound] = useState<number | 'all'>('all');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  // Get unique leagues from matches
  const leagueIds = useMemo(() => {
    if (!matchesData) return [];
    const uniqueLeagues = new Set(matchesData.map((m: any) => m.match.leagueId).filter(Boolean));
    return Array.from(uniqueLeagues) as string[];
  }, [matchesData]);

  // Get standings for the first league (assuming team plays in one league per season)
  const primaryLeagueId = leagueIds[0] || '';
  const { data: standingsData } = useGetStandingsQuery(primaryLeagueId, { skip: !primaryLeagueId });
  const { data: championship } = useGetChampionshipByIdQuery(primaryLeagueId, { skip: !primaryLeagueId });

  // Get season ID from championship or matches
  const seasonId = useMemo(() => {
    if (championship?.seasonId) return championship.seasonId;
    if (matchesData && matchesData.length > 0 && matchesData[0]?.league?.seasonId) {
      return matchesData[0].league.seasonId;
    }
    return null;
  }, [championship, matchesData]);

  // Get team players for the season
  const { data: players } = useGetTeamPlayersBySeasonQuery(
    { teamId, seasonId: seasonId || '' },
    { skip: !teamId || !seasonId }
  );

  // Calculate statistics from matches
  const statistics = useMemo(() => {
    if (!matchesData || matchesData.length === 0) {
      return {
        games: 0,
        wins: 0,
        losses: 0,
        winsRegular: 0,
        winsOT: 0,
        lossesRegular: 0,
        lossesOT: 0,
        cupsFor: 0,
        cupsAgainst: 0,
        cupDiff: 0,
        points: 0,
        winRate: 0,
        rank: null,
        leagueName: null
      };
    }

    const completedMatches = matchesData.filter((m: any) => 
      m.match.matchStatus === 'completed' && 
      m.match.homeTeamScore !== null && 
      m.match.awayTeamScore !== null
    );

    let games = 0;
    let wins = 0;
    let losses = 0;
    let winsRegular = 0;
    let winsOT = 0;
    let lossesRegular = 0;
    let lossesOT = 0;
    let cupsFor = 0;
    let cupsAgainst = 0;
    let points = 0;

    completedMatches.forEach((match: any) => {
      const isHome = match.match.homeTeamId === teamId;
      const homeScore = match.match.homeTeamScore || 0;
      const awayScore = match.match.awayTeamScore || 0;
      const teamScore = isHome ? homeScore : awayScore;
      const opponentScore = isHome ? awayScore : homeScore;

      games++;
      cupsFor += teamScore;
      cupsAgainst += opponentScore;

      const maxScore = Math.max(homeScore, awayScore);
      const minScore = Math.min(homeScore, awayScore);
      const overtime = (maxScore > 10 && minScore >= 10);

      if (teamScore > opponentScore) {
        wins++;
        if (overtime) {
          winsOT++;
          points += 2;
        } else {
          winsRegular++;
          points += 3;
        }
      } else if (opponentScore > teamScore) {
        losses++;
        if (overtime) {
          lossesOT++;
          points += 1;
        } else {
          lossesRegular++;
        }
      }
    });

    const cupDiff = cupsFor - cupsAgainst;
    const winRate = games > 0 ? (wins / games) * 100 : 0;

    // Find rank from standings
    let rank = null;
    if (standingsData?.standings) {
      const teamStanding = standingsData.standings.find((s: any) => s.teamId === teamId);
      if (teamStanding) {
        rank = teamStanding.rank;
      }
    }

    const leagueName = matchesData[0]?.league?.name || null;

    return {
      games,
      wins,
      losses,
      winsRegular,
      winsOT,
      lossesRegular,
      lossesOT,
      cupsFor,
      cupsAgainst,
      cupDiff,
      points,
      winRate,
      rank,
      leagueName
    };
  }, [matchesData, teamId, standingsData]);

  // Get unique game days and rounds from matches
  const gameDays = matchesData ? 
    Array.from(new Set(matchesData.map((match: any) => {
      const effectiveGameDay = (typeof match.match.delayedGameDay === 'number' && !Number.isNaN(match.match.delayedGameDay))
        ? match.match.delayedGameDay
        : match.match.gameDay;
      return effectiveGameDay;
    }).filter(Boolean)))
      .sort((a: any, b: any) => a - b) : [];

  const rounds = matchesData ? 
    Array.from(new Set(matchesData.map((match: any) => {
      const isDelayed = match.match.isDelayed || false;
      const effectiveRound = (isDelayed && match.match.delayedRound)
        ? match.match.delayedRound
        : match.match.matchRound;
      return effectiveRound;
    }).filter(Boolean)))
      .sort((a: any, b: any) => a - b) : [];

  // Filter matches by selected criteria (mutually exclusive)
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
    return true;
  });

  // Group matches by effective game day only (no rounds)
  const matchesByGameDay = filteredMatches.reduce((acc: any, match: any) => {
    const effectiveGameDay = (typeof match.match.delayedGameDay === 'number' && !Number.isNaN(match.match.delayedGameDay)) 
      ? match.match.delayedGameDay 
      : (match.match.gameDay || 'Nincs játéknap');
    
    if (!acc[effectiveGameDay]) {
      acc[effectiveGameDay] = [];
    }
    acc[effectiveGameDay].push(match);
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

  const handleTeamClick = (teamId: string) => {
    router.push(`/csapat/${teamId}`);
  };

  const formatPlayerName = (player: any) => {
    if (!player) return '';
    return player.nickname || `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Ismeretlen';
  };

  if (teamLoading || matchesLoading) {
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

  if (!team) {
    return (
      <div className="min-h-screen bg-black">
        <TopNav />
        <div className="pt-20 pb-12">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-white/70 text-lg">Csapat nem található</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <TopNav />
      <div className="pt-20 pb-12">
        {/* Hero Section */}
        <div className="relative mb-16 mx-4">
          <div className="relative w-full h-96 md:h-[500px] rounded-2xl overflow-hidden">
            <Image src="/title.jpg" alt="Beerpong Arena" fill className="object-cover" priority />
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                  {team.logo && (
                    <div className="relative w-16 h-16 md:w-24 md:h-24">
                      <Image
                        src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}${team.logo}`}
                        alt={team.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  <h1 className={`${bebasNeue.className} text-[#FFDB11] text-4xl md:text-6xl lg:text-7xl`}>
                    {team.name}
                  </h1>
                </div>
                <p className="text-white text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto">
                  Mérkőzések és statisztikák
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-6xl mx-auto px-2 sm:px-4">
          {/* Players Full Body Images - Above Statistics */}
          {players && players.length > 0 && (
            <div className="flex flex-wrap justify-center items-start gap-3 sm:gap-4 mb-6 relative bottom-[-23px] z-[1] group/players">
              {players.map((player: any) => (
                <button
                  key={player.id}
                  onClick={() => {
                    setSelectedPlayer(player);
                    setSelectedPlayerId(player.id);
                  }}
                  className="relative h-[150px] w-[100px] md:w-[300px] md:h-[400px] rounded-lg overflow-hidden hover:border-[#FFDB11] transition-all hover:scale-105 cursor-pointer group opacity-100 group-hover/players:opacity-30 hover:!opacity-100 hover:!scale-105"
                  title={player.nickname || `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Játékos'}
                >
                  <Image
                    src={player.image 
                      ? `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}${player.image}`
                      : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}/uploads/player-images/default.png`
                    }
                    alt={player.nickname || player.firstName || 'Játékos'}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100px, 300px"
                    quality={95}
                  />
                  {/* Name overlay on hover */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs sm:text-sm p-1 sm:p-2 opacity-0 group-hover:opacity-100 transition-opacity text-center truncate">
                    {player.nickname || `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Játékos'}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Statistics Card */}
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-4 sm:p-6 mb-6">
            <h2 className={`${bebasNeue.className} text-[#FFDB11] text-xl sm:text-2xl md:text-3xl mb-4 sm:mb-6`}>
              Statisztikák {statistics.leagueName && <span className="text-white/70 text-base sm:text-lg md:text-xl">- {statistics.leagueName}</span>}
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Rank */}
              <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                <div className="text-white/60 text-xs sm:text-sm mb-1">Helyezés</div>
                <div className={`${bebasNeue.className} text-2xl sm:text-3xl ${statistics.rank === 1 ? 'text-[#FFDB11]' : statistics.rank ? 'text-white' : 'text-white/50'}`}>
                  {statistics.rank ? `${statistics.rank}.` : 'N/A'}
                </div>
              </div>

              {/* Games */}
              <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                <div className="text-white/60 text-xs sm:text-sm mb-1">Játszott</div>
                <div className={`${bebasNeue.className} text-2xl sm:text-3xl text-white`}>
                  {statistics.games}
                </div>
              </div>

              {/* Wins */}
              <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                <div className="text-white/60 text-xs sm:text-sm mb-1">Győzelem</div>
                <div className={`${bebasNeue.className} text-2xl sm:text-3xl text-green-400`}>
                  {statistics.wins}
                </div>
                {statistics.winsRegular > 0 && statistics.winsOT > 0 && (
                  <div className="text-white/50 text-[10px] sm:text-xs mt-1">
                    ({statistics.winsRegular} normál, {statistics.winsOT} hossz.)
                  </div>
                )}
              </div>

              {/* Losses */}
              <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                <div className="text-white/60 text-xs sm:text-sm mb-1">Vereség</div>
                <div className={`${bebasNeue.className} text-2xl sm:text-3xl text-red-400`}>
                  {statistics.losses}
                </div>
                {statistics.lossesRegular > 0 && statistics.lossesOT > 0 && (
                  <div className="text-white/50 text-[10px] sm:text-xs mt-1">
                    ({statistics.lossesRegular} normál, {statistics.lossesOT} hossz.)
                  </div>
                )}
              </div>

              {/* Win Rate */}
              <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                <div className="text-white/60 text-xs sm:text-sm mb-1">Győzelmi %</div>
                <div className={`${bebasNeue.className} text-2xl sm:text-3xl text-white`}>
                  {statistics.winRate.toFixed(1)}%
                </div>
              </div>

              {/* Points */}
              <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                <div className="text-white/60 text-xs sm:text-sm mb-1">Pont</div>
                <div className={`${bebasNeue.className} text-2xl sm:text-3xl text-[#FFDB11]`}>
                  {statistics.points}
                </div>
              </div>

              {/* Cups For */}
              <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                <div className="text-white/60 text-xs sm:text-sm mb-1">Dobott Pohár</div>
                <div className={`${bebasNeue.className} text-2xl sm:text-3xl text-blue-400`}>
                  {statistics.cupsFor}
                </div>
              </div>

              {/* Cups Against */}
              <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                <div className="text-white/60 text-xs sm:text-sm mb-1">Kapott Pohár</div>
                <div className={`${bebasNeue.className} text-2xl sm:text-3xl text-red-400`}>
                  {statistics.cupsAgainst}
                </div>
              </div>

              {/* Cup Difference */}
              <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                <div className="text-white/60 text-xs sm:text-sm mb-1">Pohár diff.</div>
                <div className={`${bebasNeue.className} text-2xl sm:text-3xl ${statistics.cupDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {statistics.cupDiff >= 0 ? '+' : ''}{statistics.cupDiff}
                </div>
              </div>
            </div>
          </div>

          {/* Players Section */}
          {players && players.length > 0 && (
            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-4 sm:p-6 mb-6">
              <h2 className={`${bebasNeue.className} text-[#FFDB11] text-xl sm:text-2xl md:text-3xl mb-4 sm:mb-6`}>
                Játékosok
              </h2>
              <div className="flex flex-wrap gap-3 sm:gap-4 justify-center sm:justify-start">
                {players.map((player: any) => (
                  <button
                    key={player.id}
                    onClick={() => {
                      setSelectedPlayer(player);
                      setSelectedPlayerId(player.id);
                    }}
                    className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-white/20 hover:border-[#FFDB11] transition-all hover:scale-110 cursor-pointer group"
                    title={player.nickname || `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Játékos'}
                  >
                    <Image
                      src={player.image 
                        ? `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}${player.image}`
                        : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}/uploads/player-images/default.png`
                      }
                      alt={player.nickname || player.firstName || 'Játékos'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 48px, (max-width: 768px) 64px, 80px"
                    />
                    {/* Name tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {player.nickname || `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Játékos'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8">
            <h2 className={`${bebasNeue.className} text-[#FFDB11] text-xl sm:text-2xl md:text-3xl mb-4 sm:mb-6`}>
              Mérkőzések
            </h2>

            {/* Filters */}
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
                        setSelectedRound('all');
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
                        setSelectedGameDay('all');
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

            {/* Matches by Game Day */}
            <div className="space-y-6 sm:space-y-8">
              {Object.entries(matchesByGameDay).map(([gameDay, matches]: [string, any]) => (
                <div key={gameDay} className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-4 sm:p-6">
                  <h2 className={`${bebasNeue.className} text-[#FFDB11] text-xl sm:text-2xl mb-4 sm:mb-6`}>
                    Játéknap {gameDay}
                  </h2>
                  
                  <div className="space-y-3 sm:space-y-4">
                    {(matches as any[]).map((match: any) => {
                      const isDelayed = match.match.isDelayed || false;
                      const originalGd = match.match.gameDay || 0;
                      const delayedGd = match.match.delayedGameDay || 0;
                      const badgeText = delayedGd > originalGd ? 'HALASZTOTT' : delayedGd < originalGd ? 'ELŐREHOZOTT' : null;
                      const isHome = match.match.homeTeamId === teamId;
                      const opponent = isHome ? match.awayTeam : match.homeTeam;
                      const showScore = match.match.matchStatus === 'completed' && match.match.homeTeamScore !== null && match.match.awayTeamScore !== null;
                      const effectiveRound = isDelayed && match.match.delayedRound
                        ? match.match.delayedRound
                        : match.match.matchRound;
                            
                            const isTracked = match.match.trackingActive === 2 || (match.match.trackingData && Object.keys(match.match.trackingData).length > 0);
                            const isCompleted = match.match.matchStatus === 'completed';
                            
                            return (
                              <Link
                                key={match.match.id}
                                href={`/merkozes/${match.match.id}`}
                                className={`relative bg-black/40 rounded-xl p-3 border ${isDelayed ? 'border-yellow-500/50' : 'border-white/10'} hover:border-white/20 transition-colors block`}
                              >
                                {/* Badge for delayed/moved matches */}
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
                                      TRACKED
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex items-center justify-between">
                                  {isHome ? (
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <div className="flex-shrink-0 w-6 h-6 relative">
                                        {team.logo ? (
                                          <Image
                                            src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}${team.logo}`}
                                            alt={team.name}
                                            fill
                                            className="object-contain"
                                          />
                                        ) : (
                                          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                            <span className="text-xs text-white">?</span>
                                          </div>
                                        )}
                                      </div>
                                      <span className="text-white text-sm font-medium truncate">{team.name}</span>
                                    </div>
                                  ) : (
                                    <Link 
                                      href={`/csapat/${match.match.homeTeamId || ''}`} 
                                      className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTeamClick(match.match.homeTeamId || '');
                                      }}
                                    >
                                      <div className="flex-shrink-0 w-6 h-6 relative">
                                        {match.homeTeam?.logo ? (
                                          <Image
                                            src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}${match.homeTeam.logo}`}
                                            alt={match.homeTeam.name}
                                            fill
                                            className="object-contain"
                                          />
                                        ) : (
                                          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                            <span className="text-xs text-white">?</span>
                                          </div>
                                        )}
                                      </div>
                                      <span className="text-white text-sm font-medium truncate">{match.homeTeam?.name || 'Ismeretlen'}</span>
                                    </Link>
                                  )}
                                  
                                  <div className="flex items-center gap-3 px-4">
                                    {showScore && (
                                      <span className="text-[#ff5c1a] text-lg font-bold bg-[#ff5c1a]/10 px-3 py-1 rounded">
                                        {isHome ? match.match.homeTeamScore : match.match.awayTeamScore}
                                      </span>
                                    )}
                                    <span className="text-white/50 text-xs">VS</span>
                                    {showScore && (
                                      <span className="text-[#ff5c1a] text-lg font-bold bg-[#ff5c1a]/10 px-3 py-1 rounded">
                                        {isHome ? match.match.awayTeamScore : match.match.homeTeamScore}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {!isHome ? (
                                    <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                                      <span className="text-white text-sm font-medium truncate">{team.name}</span>
                                      <div className="flex-shrink-0 w-6 h-6 relative">
                                        {team.logo ? (
                                          <Image
                                            src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}${team.logo}`}
                                            alt={team.name}
                                            fill
                                            className="object-contain"
                                          />
                                        ) : (
                                          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                            <span className="text-xs text-white">?</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <Link 
                                      href={`/csapat/${opponent?.id || ''}`} 
                                      className="flex items-center gap-3 flex-1 min-w-0 justify-end hover:opacity-80 transition-opacity"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTeamClick(opponent?.id || '');
                                      }}
                                    >
                                      <span className="text-white text-sm font-medium truncate">{opponent?.name || 'Ismeretlen'}</span>
                                      <div className="flex-shrink-0 w-6 h-6 relative">
                                        {opponent?.logo ? (
                                          <Image
                                            src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}${opponent.logo}`}
                                            alt={opponent.name}
                                            fill
                                            className="object-contain"
                                          />
                                        ) : (
                                          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                            <span className="text-xs text-white">?</span>
                                          </div>
                                        )}
                                      </div>
                                    </Link>
                                  )}
                                </div>
                                <div className="text-center mt-2">
                                  <div className="text-white/60 text-xs">
                                    {isDelayed && match.match.delayedTime ? 
                                      formatMatchDate(match.match.delayedTime) : 
                                      formatMatchDate(match.match.matchAt || match.match.matchDate)
                                    }
                                  </div>
                                  <div className="text-white/40 text-xs">
                                    {effectiveRound ? `Forduló ${effectiveRound}` : 'Nincs forduló'}
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

            {filteredMatches.length === 0 && (
              <div className="text-center py-12">
                <p className="text-white/70 text-lg">Nincs mérkőzés a kiválasztott szűrőkkel</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Player Profile Modal */}
      {selectedPlayerId && (
        <PlayerProfileModal
          playerId={selectedPlayerId}
          playerName={selectedPlayer?.nickname || `${selectedPlayer?.firstName || ''} ${selectedPlayer?.lastName || ''}`.trim()}
          playerImage={selectedPlayer?.image}
          onClose={() => {
            setSelectedPlayerId(null);
            setSelectedPlayer(null);
          }}
        />
      )}
    </div>
  );
}

