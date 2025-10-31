"use client";

import { Bebas_Neue } from "next/font/google";
import { useState, useEffect, use } from 'react';
import Image from "next/image";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useGetTeamPlayersBySeasonQuery } from '@/lib/features/apiSlice';
import TopNav from '../../components/TopNav';

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'] });

export default function MatchDetailPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params);
  const router = useRouter();
  const [matchData, setMatchData] = useState<any>(null);
  const [matchMeta, setMatchMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [homePlayers, setHomePlayers] = useState<any[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<any[]>([]);

  // Fetch match data
  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        setLoading(true);
        
        // Fetch match details
        const matchResp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}/api/matches/${matchId}`, { credentials: 'include' });
        if (matchResp.ok) {
          const match = await matchResp.json();
          setMatchData(match);
          
          // Fetch match meta (includes seasonId)
          const metaResp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}/api/matches/${matchId}/meta`, { credentials: 'include' });
          if (metaResp.ok) {
            const meta = await metaResp.json();
            setMatchMeta(meta);
            
            // Fetch players for both teams
            const homeTeamId = meta.homeTeam?.id || match.match?.homeTeamId;
            const awayTeamId = meta.awayTeam?.id || match.match?.awayTeamId;
            
            if (meta.seasonId && homeTeamId && awayTeamId) {
              const [homePlayersResp, awayPlayersResp] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}/api/teams/${homeTeamId}/players?seasonId=${meta.seasonId}`, { credentials: 'include' }),
                fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}/api/teams/${awayTeamId}/players?seasonId=${meta.seasonId}`, { credentials: 'include' })
              ]);
              
              if (homePlayersResp.ok) {
                const home = await homePlayersResp.json();
                setHomePlayers(home || []);
              }
              
              if (awayPlayersResp.ok) {
                const away = await awayPlayersResp.json();
                setAwayPlayers(away || []);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching match data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (matchId) {
      fetchMatchData();
    }
  }, [matchId]);

  const formatMatchDate = (dateString: string) => {
    if (!dateString) return 'Nincs dátum';
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

  // Parse tracking data for statistics
  const getTrackingStats = () => {
    if (!matchData?.match?.trackingData) return null;
    
    const trackingData = matchData.match.trackingData;
    const gameState = trackingData.gameState || {};
    const gameHistory = trackingData.gameHistory || [];
    const selectedPlayers = trackingData.selectedPlayers || {};
    
    // Calculate player statistics
    const playerStats: Record<string, { throws: number; hits: number; hitRate: number }> = {};
    
    gameHistory.forEach((action: any) => {
      if (!action.playerId) return;
      
      if (!playerStats[action.playerId]) {
        playerStats[action.playerId] = { throws: 0, hits: 0, hitRate: 0 };
      }
      
      playerStats[action.playerId].throws++;
      if (action.type === 'hit') {
        playerStats[action.playerId].hits++;
      }
    });
    
    // Calculate hit rates
    Object.keys(playerStats).forEach(playerId => {
      const stats = playerStats[playerId];
      stats.hitRate = stats.throws > 0 ? (stats.hits / stats.throws) * 100 : 0;
    });
    
    return {
      gameState,
      gameHistory,
      playerStats,
      selectedPlayers,
      totalThrows: gameHistory.length,
      homeHits: gameHistory.filter((a: any) => a.team === 'home' && a.type === 'hit').length,
      awayHits: gameHistory.filter((a: any) => a.team === 'away' && a.type === 'hit').length,
    };
  };

  const getPlayerName = (playerId: string, team: 'home' | 'away') => {
    const players = team === 'home' ? homePlayers : awayPlayers;
    const player = players.find((p: any) => p.id === playerId);
    return player?.nickname || `${player?.firstName || ''} ${player?.lastName || ''}`.trim() || 'Ismeretlen';
  };

  if (loading) {
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

  if (!matchData || !matchData.match) {
    return (
      <div className="min-h-screen bg-black">
        <TopNav />
        <div className="pt-20 pb-12">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-white/70 text-lg">Mérkőzés nem található</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-[#ff5c1a] text-white rounded-lg hover:bg-[#e54d1a] transition-colors"
            >
              Vissza
            </button>
          </div>
        </div>
      </div>
    );
  }

  const match = matchData.match;
  const homeTeam = matchData.homeTeam;
  const awayTeam = matchData.awayTeam;
  const trackingStats = getTrackingStats();
  const isTracked = match.trackingActive === 2 || (match.trackingData && Object.keys(match.trackingData).length > 0);
  const showScore = match.matchStatus === 'completed' && match.homeTeamScore !== null && match.awayTeamScore !== null;

  // Get players who actually played
  const getPlayersWhoPlayed = () => {
    const playedPlayers: { home: any[], away: any[] } = { home: [], away: [] };
    
    if (isTracked && trackingStats?.selectedPlayers) {
      // Use tracking data
      const selected = trackingStats.selectedPlayers;
      if (selected.homeFirst) {
        const player = homePlayers.find((p: any) => p.id === selected.homeFirst);
        if (player) playedPlayers.home.push(player);
      }
      if (selected.homeSecond) {
        const player = homePlayers.find((p: any) => p.id === selected.homeSecond);
        if (player) playedPlayers.home.push(player);
      }
      if (selected.awayFirst) {
        const player = awayPlayers.find((p: any) => p.id === selected.awayFirst);
        if (player) playedPlayers.away.push(player);
      }
      if (selected.awaySecond) {
        const player = awayPlayers.find((p: any) => p.id === selected.awaySecond);
        if (player) playedPlayers.away.push(player);
      }
    } else if (match.homeFirstPlayerId || match.homeSecondPlayerId || match.awayFirstPlayerId || match.awaySecondPlayerId) {
      // Use match data if no tracking
      if (match.homeFirstPlayerId) {
        const player = homePlayers.find((p: any) => p.id === match.homeFirstPlayerId);
        if (player) playedPlayers.home.push(player);
      }
      if (match.homeSecondPlayerId) {
        const player = homePlayers.find((p: any) => p.id === match.homeSecondPlayerId);
        if (player) playedPlayers.home.push(player);
      }
      if (match.awayFirstPlayerId) {
        const player = awayPlayers.find((p: any) => p.id === match.awayFirstPlayerId);
        if (player) playedPlayers.away.push(player);
      }
      if (match.awaySecondPlayerId) {
        const player = awayPlayers.find((p: any) => p.id === match.awaySecondPlayerId);
        if (player) playedPlayers.away.push(player);
      }
    }
    
    return playedPlayers;
  };

  const playedPlayers = getPlayersWhoPlayed();

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
                  {homeTeam?.logo && (
                    <div className="relative w-16 h-16 md:w-24 md:h-24">
                      <Image
                        src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}${homeTeam.logo}`}
                        alt={homeTeam.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  <h1 className={`${bebasNeue.className} text-[#FFDB11] text-3xl md:text-5xl lg:text-6xl`}>
                    {homeTeam?.name || 'Ismeretlen'} VS {awayTeam?.name || 'Ismeretlen'}
                  </h1>
                  {awayTeam?.logo && (
                    <div className="relative w-16 h-16 md:w-24 md:h-24">
                      <Image
                        src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}${awayTeam.logo}`}
                        alt={awayTeam.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                </div>
                {showScore && (
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <span className="text-[#ff5c1a] text-4xl md:text-6xl font-bold">{match.homeTeamScore}</span>
                    <span className="text-white/50 text-2xl">-</span>
                    <span className="text-[#ff5c1a] text-4xl md:text-6xl font-bold">{match.awayTeamScore}</span>
                  </div>
                )}
                <p className="text-white text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto mt-4">
                  <span className={`${getMatchStatusColor(match.matchStatus)}`}>
                    {getMatchStatusText(match.matchStatus)}
                  </span>
                  {match.matchAt && (
                    <> • {formatMatchDate(match.matchAt)}</>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-6xl mx-auto px-2 sm:px-4">
          {/* Players who played - Side by side */}
          {(playedPlayers.home.length > 0 || playedPlayers.away.length > 0) && (
            <div className="mb-8">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3 flex-1">
                  <Link href={`/csapat/${match.homeTeamId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    {homeTeam?.logo && (
                      <div className="relative w-12 h-12">
                        <Image
                          src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}${homeTeam.logo}`}
                          alt={homeTeam.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                    <h2 className={`${bebasNeue.className} text-[#FFDB11] text-xl md:text-2xl`}>
                      {homeTeam?.name || 'Ismeretlen'}
                    </h2>
                  </Link>
                </div>
                
                <div className="flex items-center gap-3 flex-1 justify-end">
                  <Link href={`/csapat/${match.awayTeamId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <h2 className={`${bebasNeue.className} text-[#FFDB11] text-xl md:text-2xl`}>
                      {awayTeam?.name || 'Ismeretlen'}
                    </h2>
                    {awayTeam?.logo && (
                      <div className="relative w-12 h-12">
                        <Image
                          src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}${awayTeam.logo}`}
                          alt={awayTeam.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                  </Link>
                </div>
              </div>
              
              <div className="flex items-start justify-between gap-6 group/players">
                {/* Home Team Players - Left side */}
                <div className="flex gap-3 sm:gap-4 flex-1 justify-start">
                  {playedPlayers.home.map((player: any) => (
                    <div
                      key={player.id}
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
                      <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs sm:text-sm p-1 sm:p-2 opacity-0 group-hover:opacity-100 transition-opacity text-center truncate">
                        {player.nickname || `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Játékos'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Away Team Players - Right side */}
                <div className="flex gap-3 sm:gap-4 flex-1 justify-end">
                  {playedPlayers.away.map((player: any) => (
                    <div
                      key={player.id}
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
                      <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs sm:text-sm p-1 sm:p-2 opacity-0 group-hover:opacity-100 transition-opacity text-center truncate">
                        {player.nickname || `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Játékos'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tracking Statistics */}
          {isTracked && trackingStats && (
            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-4 sm:p-6 mb-6">
              <h2 className={`${bebasNeue.className} text-[#FFDB11] text-xl sm:text-2xl md:text-3xl mb-4 sm:mb-6`}>
                Tracking Statisztikák
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Home Team Stats */}
                <div className="bg-black/40 rounded-xl p-4 border border-white/10">
                  <h3 className={`${bebasNeue.className} text-white text-lg mb-4`}>
                    {homeTeam?.name || 'Hazai csapat'}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/70">Találatok:</span>
                      <span className="text-white font-bold">{trackingStats.homeHits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Összes dobás:</span>
                      <span className="text-white font-bold">{trackingStats.gameHistory.filter((a: any) => a.team === 'home').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Találati %:</span>
                      <span className="text-white font-bold">
                        {trackingStats.gameHistory.filter((a: any) => a.team === 'home').length > 0
                          ? ((trackingStats.homeHits / trackingStats.gameHistory.filter((a: any) => a.team === 'home').length) * 100).toFixed(1)
                          : '0'
                        }%
                      </span>
                    </div>
                  </div>
                  
                  {/* Home Team Player Stats */}
                  {Object.keys(trackingStats.playerStats).filter(playerId => {
                    const player = trackingStats.playerStats[playerId];
                    const isHomePlayer = trackingStats.selectedPlayers?.homeFirst === playerId || 
                                       trackingStats.selectedPlayers?.homeSecond === playerId;
                    return isHomePlayer && (player.throws > 0);
                  }).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <h4 className="text-white/70 text-sm mb-2">Játékos statisztikák:</h4>
                      {Object.entries(trackingStats.playerStats)
                        .filter(([playerId]) => {
                          return trackingStats.selectedPlayers?.homeFirst === playerId || 
                                 trackingStats.selectedPlayers?.homeSecond === playerId;
                        })
                        .map(([playerId, stats]: [string, any]) => (
                          <div key={playerId} className="text-xs text-white/60 mb-2">
                            <span className="font-medium">{getPlayerName(playerId, 'home')}:</span>
                            {' '}{stats.hits}/{stats.throws} ({stats.hitRate.toFixed(1)}%)
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>

                {/* Away Team Stats */}
                <div className="bg-black/40 rounded-xl p-4 border border-white/10">
                  <h3 className={`${bebasNeue.className} text-white text-lg mb-4`}>
                    {awayTeam?.name || 'Vendég csapat'}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/70">Találatok:</span>
                      <span className="text-white font-bold">{trackingStats.awayHits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Összes dobás:</span>
                      <span className="text-white font-bold">{trackingStats.gameHistory.filter((a: any) => a.team === 'away').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Találati %:</span>
                      <span className="text-white font-bold">
                        {trackingStats.gameHistory.filter((a: any) => a.team === 'away').length > 0
                          ? ((trackingStats.awayHits / trackingStats.gameHistory.filter((a: any) => a.team === 'away').length) * 100).toFixed(1)
                          : '0'
                        }%
                      </span>
                    </div>
                  </div>
                  
                  {/* Away Team Player Stats */}
                  {Object.keys(trackingStats.playerStats).filter(playerId => {
                    const player = trackingStats.playerStats[playerId];
                    const isAwayPlayer = trackingStats.selectedPlayers?.awayFirst === playerId || 
                                        trackingStats.selectedPlayers?.awaySecond === playerId;
                    return isAwayPlayer && (player.throws > 0);
                  }).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <h4 className="text-white/70 text-sm mb-2">Játékos statisztikák:</h4>
                      {Object.entries(trackingStats.playerStats)
                        .filter(([playerId]) => {
                          return trackingStats.selectedPlayers?.awayFirst === playerId || 
                                 trackingStats.selectedPlayers?.awaySecond === playerId;
                        })
                        .map(([playerId, stats]: [string, any]) => (
                          <div key={playerId} className="text-xs text-white/60 mb-2">
                            <span className="font-medium">{getPlayerName(playerId, 'away')}:</span>
                            {' '}{stats.hits}/{stats.throws} ({stats.hitRate.toFixed(1)}%)
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tracking Timeline */}
          {isTracked && trackingStats && trackingStats.gameHistory.length > 0 && (
            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-4 sm:p-6 mb-6">
              <h2 className={`${bebasNeue.className} text-[#FFDB11] text-xl sm:text-2xl md:text-3xl mb-4 sm:mb-6`}>
                Tracking Idővonal
              </h2>
              
              <div className="relative max-h-[600px] overflow-y-auto">
                <div className="relative space-y-4 pb-4">
                  {/* Timeline Line - spans full height of content container */}
                  <div className="absolute left-1/2 top-0 bottom-4 w-0.5 bg-[#FFDB11]/30 transform -translate-x-1/2 pointer-events-none z-0"></div>
                  
                  {trackingStats.gameHistory.map((action: any, index: number) => {
                    const isHome = action.team === 'home';
                    const isHit = action.type === 'hit';
                    const playerName = getPlayerName(action.playerId || '', action.team);
                    const currentScore = {
                      home: trackingStats.gameHistory.slice(0, index + 1).filter((a: any) => a.team === 'home' && a.type === 'hit').length,
                      away: trackingStats.gameHistory.slice(0, index + 1).filter((a: any) => a.team === 'away' && a.type === 'hit').length
                    };
                    
                    return (
                      <div
                        key={index}
                        className={`relative flex items-center ${isHome ? 'justify-start' : 'justify-end'}`}
                      >
                        {/* Timeline Dot */}
                        <div className={`absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full z-10 ${
                          isHit ? 'bg-green-500' : 'bg-red-500'
                        } border-2 border-black`}></div>
                        
                        {/* Action Card */}
                        <div className={`w-[45%] ${
                          isHome ? 'pr-8 text-right' : 'pl-8 text-left'
                        }`}>
                          <div className={`bg-black/60 rounded-lg p-3 border ${
                            isHit 
                              ? 'border-green-500/50 bg-green-500/10' 
                              : 'border-red-500/50 bg-red-500/10'
                          } hover:bg-black/80 transition-colors`}>
                            <div className="flex items-center gap-2">
                              {!isHome && (
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                  isHit ? 'bg-green-600' : 'bg-red-600'
                                }`}>
                                  {isHit ? '✓' : '✗'}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-white font-medium text-sm truncate">
                                  {playerName}
                                </div>
                                <div className={`text-xs ${
                                  isHit ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {isHit ? 'Találat' : 'Elhibázott'}
                                </div>
                                <div className="text-white/50 text-xs mt-1">
                                  #{index + 1} • {isHome ? homeTeam?.name : awayTeam?.name}
                                </div>
                              </div>
                              {isHome && (
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                  isHit ? 'bg-green-600' : 'bg-red-600'
                                }`}>
                                  {isHit ? '✓' : '✗'}
                                </div>
                              )}
                            </div>
                            {/* Score at this point */}
                            <div className="mt-2 pt-2 border-t border-white/10 text-xs text-white/60">
                              Állás: {currentScore.home} - {currentScore.away}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Match Details */}
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-4 sm:p-6">
            <h2 className={`${bebasNeue.className} text-[#FFDB11] text-xl sm:text-2xl md:text-3xl mb-4 sm:mb-6`}>
              Mérkőzés részletek
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-white/70">Játéknap:</span>
                <span className="text-white ml-2">{match.gameDay || 'N/A'}</span>
              </div>
              <div>
                <span className="text-white/70">Forduló:</span>
                <span className="text-white ml-2">{match.matchRound || 'N/A'}</span>
              </div>
              {match.matchTable && (
                <div>
                  <span className="text-white/70">Asztal:</span>
                  <span className="text-white ml-2">{match.matchTable}</span>
                </div>
              )}
              <div>
                <span className="text-white/70">Státusz:</span>
                <span className={`ml-2 ${getMatchStatusColor(match.matchStatus)}`}>
                  {getMatchStatusText(match.matchStatus)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

