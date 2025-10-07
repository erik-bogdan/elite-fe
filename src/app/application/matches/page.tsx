"use client";

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { Bebas_Neue } from 'next/font/google';
import { FiChevronDown, FiChevronUp, FiBarChart, FiUsers, FiCalendar, FiClock, FiExternalLink } from 'react-icons/fi';
import { useGetMyLeagueQuery } from '@/lib/features/apiSlice';
import { useGetChampionshipByIdQuery, useGetMatchesForLeagueQuery } from '@/lib/features/championship/championshipSlice';
import GameStatsGrid from '@/components/GameStatsGrid';
import { buildRoundsFromHistory, GameAction as HistAction } from '@/lib/tracking/rounds';

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'] });

export default function MyMatchesPage() {
  const { data: my, isLoading: loadingMy } = useGetMyLeagueQuery();
  const leagueId = my?.leagueId;
  const myTeamId = my?.teamId;
  const { data: championship } = useGetChampionshipByIdQuery(leagueId!, { skip: !leagueId });
  const { data: leagueMatches } = useGetMatchesForLeagueQuery(leagueId!, { skip: !leagueId });

  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const myMatches = useMemo(() => {
    const all = Array.isArray(leagueMatches) ? leagueMatches : [];
    return all.filter((row: any) => row?.match && (row.match.homeTeamId === myTeamId || row.match.awayTeamId === myTeamId));
  }, [leagueMatches, myTeamId]);

  const processedMatches = useMemo(() => {
    return myMatches.map((row: any) => {
      const match = row.match;
      const trackingData = match.trackingData || {};
      
      // Get player names from tracking data or fallback to joined data
      const getPlayerName = (playerId: string, team: 'home' | 'away') => {
        if (trackingData.selectedPlayers) {
          const teamKey = team === 'home' ? 'homeTeam' : 'awayTeam';
          const players = trackingData[teamKey]?.players || [];
          const found = players.find((p: any) => p.id === playerId);
          if (found?.name) return found.name;
        }
        
        // Fallback to joined player data
        const playerMap: Record<string, any> = {
          [String(match.homeFirstPlayerId)]: row.homeFirstPlayer,
          [String(match.homeSecondPlayerId)]: row.homeSecondPlayer,
          [String(match.awayFirstPlayerId)]: row.awayFirstPlayer,
          [String(match.awaySecondPlayerId)]: row.awaySecondPlayer,
        };
        const player = playerMap[String(playerId)];
        return player?.nickname || player?.name || 'Unknown Player';
      };

      const homeFirstPlayer = getPlayerName(match.homeFirstPlayerId, 'home');
      const homeSecondPlayer = getPlayerName(match.homeSecondPlayerId, 'home');
      const awayFirstPlayer = getPlayerName(match.awayFirstPlayerId, 'away');
      const awaySecondPlayer = getPlayerName(match.awaySecondPlayerId, 'away');

      console.log(match.matchTime);
      return {
        id: match.id,
        date: new Date(match.matchTime).toLocaleDateString('hu-HU', { timeZone: 'UTC' }),
        time: new Date(match.matchAt || match.matchTime).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }),
        table: match.matchTable,
        round: match.matchRound,
        gameDay: match.gameDay || 1,
        homeTeam: {
          name: row.homeTeam?.name || 'Home Team',
          logo: row.homeTeam?.logo || '/elitelogo.png',
          score: match.homeTeamScore,
          players: [homeFirstPlayer, homeSecondPlayer].filter(Boolean),
          isMyTeam: match.homeTeamId === myTeamId
        },
        awayTeam: {
          name: row.awayTeam?.name || 'Away Team',
          logo: row.awayTeam?.logo || '/elitelogo.png',
          score: match.awayTeamScore,
          players: [awayFirstPlayer, awaySecondPlayer].filter(Boolean),
          isMyTeam: match.awayTeamId === myTeamId
        },
        status: match.matchStatus,
        trackingData,
        hasTrackingData: !!trackingData.gameHistory && trackingData.gameHistory.length > 0
      };
    });
  }, [myMatches, myTeamId]);

  const matchesByGameDay = useMemo(() => {
    const grouped = processedMatches.reduce((acc: Record<number, any[]>, match) => {
      const gameDay = match.gameDay;
      if (!acc[gameDay]) {
        acc[gameDay] = [];
      }
      acc[gameDay].push(match);
      return acc;
    }, {});

    // Sort by game day and sort matches within each day by time
    return Object.entries(grouped)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([gameDay, matches]) => ({
        gameDay: Number(gameDay),
        matches: (matches as any[]).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      }));
  }, [processedMatches]);

  const toggleMatchExpansion = (matchId: string) => {
    const newExpanded = new Set(expandedMatches);
    if (newExpanded.has(matchId)) {
      newExpanded.delete(matchId);
    } else {
      newExpanded.add(matchId);
    }
    setExpandedMatches(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'text-green-400';
      case 'in_progress':
        return 'text-yellow-400';
      case 'scheduled':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'BEFEJEZETT';
      case 'in_progress':
        return 'FOLYAMATBAN';
      case 'scheduled':
        return 'TERVEZETT';
      default:
        return status?.toUpperCase() || 'ISMERETLEN';
    }
  };

  if (loadingMy) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#ff5c1a]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`${bebasNeue.className} text-4xl md:text-6xl text-white mb-4 tracking-wider`}>
            MECCSEK
          </h1>
          <div className="flex items-center justify-center space-x-4 text-[#ff5c1a]">
            <span className="text-sm">•</span>
            <span className="text-sm">{processedMatches.length} meccs</span>
            <span className="text-sm">•</span>
            <span className="text-sm">{championship?.name || 'Szezon'}</span>
          </div>
        </div>

        {/* Matches by Game Day */}
        <div className="space-y-8">
          {matchesByGameDay.map((gameDayGroup) => (
            <div key={gameDayGroup.gameDay}>
              {/* Game Day Header */}
              <div className="text-center mb-6">
                <h2 className={`${bebasNeue.className} text-3xl md:text-4xl text-white mb-2 tracking-wider`}>
                  {gameDayGroup.gameDay === 0 ? 'FINÁLE' : `${gameDayGroup.gameDay}. JÁTÉKNAP`}
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-[#ff5c1a] to-[#e54d1a] mx-auto rounded-full"></div>
              </div>

              {/* Matches Grid for this Game Day */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {gameDayGroup.matches.map((match) => (
                  <div key={match.id} className="bg-black/40 backdrop-blur-sm rounded-2xl border border-[#ff5c1a]/30 p-6 hover:border-[#ff5c1a]/60 transition-all duration-300 hover:shadow-lg hover:shadow-[#ff5c1a]/20">
                    {/* Match Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-semibold ${getStatusColor(match.status)}`}>
                          {getStatusText(match.status)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">#{match.table}</span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-gray-400">{match.round}. forduló</span>
                      </div>
                    </div>

                    {/* Teams */}
                    <div className="space-y-4 mb-6">
                      {/* Home Team */}
                      <div className={`flex items-center justify-between p-3 rounded-lg ${match.homeTeam.isMyTeam ? 'bg-[#ff5c1a]/10 border border-[#ff5c1a]/30' : ''}`}>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#ff5c1a] to-[#e54d1a] rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">H</span>
                          </div>
                          <div>
                            <h3 className="text-white font-semibold text-lg">{match.homeTeam.name}</h3>
                            <div className="flex items-center space-x-1 text-xs text-gray-400">
                              <FiUsers className="w-3 h-3" />
                              <span>{match.homeTeam.players.join(' & ')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-white">{match.homeTeam.score}</div>
                        </div>
                      </div>

                      {/* VS Separator */}
                      <div className="flex items-center justify-center">
                        <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#ff5c1a] to-transparent"></div>
                        <span className="px-4 text-[#ff5c1a] font-bold text-lg">VS</span>
                        <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#ff5c1a] to-transparent"></div>
                      </div>

                      {/* Away Team */}
                      <div className={`flex items-center justify-between p-3 rounded-lg ${match.awayTeam.isMyTeam ? 'bg-[#ff5c1a]/10 border border-[#ff5c1a]/30' : ''}`}>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#002b6b] to-[#001a4a] rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">V</span>
                          </div>
                          <div>
                            <h3 className="text-white font-semibold text-lg">{match.awayTeam.name}</h3>
                            <div className="flex items-center space-x-1 text-xs text-gray-400">
                              <FiUsers className="w-3 h-3" />
                              <span>{match.awayTeam.players.join(' & ')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-white">{match.awayTeam.score}</div>
                        </div>
                      </div>
                    </div>

                    {/* Match Info */}
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-300 mb-4">
                      <div className="flex items-center gap-2">
                        <FiCalendar className="w-4 h-4" />
                        <span>{match.date}</span>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <FiClock className="w-4 h-4" />
                        <span>{match.time}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => toggleMatchExpansion(match.id)}
                        className="flex-1 bg-[#ff5c1a] hover:bg-[#e54d1a] text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                      >
                        {expandedMatches.has(match.id) ? (
                          <>
                            <FiChevronUp className="w-4 h-4" />
                            <span>RÉSZLETEK</span>
                          </>
                        ) : (
                          <>
                            <FiChevronDown className="w-4 h-4" />
                            <span>RÉSZLETEK</span>
                          </>
                        )}
                      </button>
                      {match.hasTrackingData && (
                        <button 
                          onClick={() => setSelectedMatchId(match.id)}
                          className="bg-black/30 hover:bg-black/50 text-white p-2 rounded-lg transition-colors"
                        >
                          <FiBarChart className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Expanded Details */}
                    {expandedMatches.has(match.id) && (
                      <div className="mt-4 pt-4 border-t border-[#ff5c1a]/20">
                        {/* Match Details */}
                        <div className="mb-4">
                          <h4 className="text-white font-semibold mb-2">MECCS RÉSZLETEK</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Asztal:</span>
                              <span className="text-white ml-2">#{match.table}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Forduló:</span>
                              <span className="text-white ml-2">{match.round}.</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Dátum:</span>
                              <span className="text-white ml-2">{match.date}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Időpont:</span>
                              <span className="text-white ml-2">{match.time}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {processedMatches.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏓</div>
            <h2 className="text-2xl text-white font-semibold mb-2">Nincsenek meccsek</h2>
            <p className="text-gray-400">Még nincsenek meccsek a csapatodhoz rendelve.</p>
          </div>
        )}
      </div>

      {/* Tracking Data Modal */}
      {selectedMatchId && (() => {
        const match = processedMatches.find(m => m.id === selectedMatchId);
        if (!match || !match.hasTrackingData) return null;

        const trackingData = match.trackingData;
        const gameHistory: HistAction[] = Array.isArray(trackingData.gameHistory) ? trackingData.gameHistory : [];
        const selectedPlayers = trackingData.selectedPlayers || {};

        // Helpers replicated from tracking page
        const resolveName = (id: string, team: 'home' | 'away') => {
          const teamPlayers = team === 'home' ? trackingData.homeTeam?.players || [] : trackingData.awayTeam?.players || [];
          const found = teamPlayers.find((p: any) => p.id === id);
          return found?.name || found?.label || id;
        };

        const homeFirstId = selectedPlayers.homeFirst?.id || selectedPlayers.homeFirst;
        const homeSecondId = selectedPlayers.homeSecond?.id || selectedPlayers.homeSecond;
        const awayFirstId = selectedPlayers.awayFirst?.id || selectedPlayers.awayFirst;
        const awaySecondId = selectedPlayers.awaySecond?.id || selectedPlayers.awaySecond;

        const homeFirstName = resolveName(homeFirstId, 'home');
        const homeSecondName = resolveName(homeSecondId, 'home');
        const awayFirstName = resolveName(awayFirstId, 'away');
        const awaySecondName = resolveName(awaySecondId, 'away');

        const calculatePlayerStats = (playerId: string, team: 'home' | 'away', name: string) => {
          const playerThrows = gameHistory.filter((a: any) => a.playerId === playerId);
          const hits = playerThrows.filter((a: any) => a.type === 'hit').length;
          const total = playerThrows.length;
          const percentage = total > 0 ? Math.round((hits / total) * 100) : 0;
          return { id: playerId, name, hits, total, percentage };
        };

        // Recompute game state from history - needed for buildRounds
        const recomputeFromHistory = (actions: any[]) => {
          let s: any = { currentTurn: 'home', phase: 'regular', gameHistory: [], initThrowsCount: 0, throwsInTurn: 0, hitsInTurn: 0, rebuttalMode: undefined, gameEnded: false, lastThrower: null, lastOvertimeThrower: null, overtimePeriod: 0, otHome: 0, otAway: 0 };
          const apply = (prev: any, action: any) => {
            let ns = { ...prev }; ns.gameHistory = [...ns.gameHistory, action]; const isHome = action.team === 'home';
            if (ns.phase === 'regular' && ns.initThrowsCount === 0) { ns.lastThrower = action.playerId; ns.initThrowsCount = 1; ns.currentTurn = 'away'; ns.throwsInTurn = 0; ns.hitsInTurn = action.type === 'hit' ? 1 : 0; return ns; }
            if (ns.phase === 'return_serve') { ns.throwsInTurn = 0; ns.hitsInTurn = 0; return ns; }
            if (ns.phase === 'overtime') { ns.throwsInTurn = 0; ns.hitsInTurn = 0; return ns; }
            if (ns.currentTurn === 'home' && isHome) { ns.throwsInTurn += 1; ns.hitsInTurn += action.type === 'hit' ? 1 : 0; ns.lastThrower = action.playerId; return ns; }
            if (ns.currentTurn === 'away' && !isHome) { ns.throwsInTurn += 1; ns.hitsInTurn += action.type === 'hit' ? 1 : 0; ns.lastThrower = action.playerId; return ns; }
            if (ns.throwsInTurn >= 2) { ns.currentTurn = isHome ? 'away' : 'home'; ns.throwsInTurn = 1; ns.hitsInTurn = action.type === 'hit' ? 1 : 0; ns.lastThrower = action.playerId; return ns; }
            return ns;
          };
          return actions.reduce(apply, s);
        };

        // Build rounds using the shared util
        const rounds = buildRoundsFromHistory(gameHistory);

        // Convert to throws format for GameStatsGrid - using the correct roundIndex from rounds
        const throws = gameHistory.map((action) => {
          // Find which round contains this action
          const round = rounds.find(r => r.throws.includes(action));
          return {
            ...action,
            roundIndex: round ? round.roundIndex : 0
          };
        });

        const homePlayer1 = calculatePlayerStats(homeFirstId, 'home', homeFirstName);
        const homePlayer2 = calculatePlayerStats(homeSecondId, 'home', homeSecondName);
        const awayPlayer1 = calculatePlayerStats(awayFirstId, 'away', awayFirstName);
        const awayPlayer2 = calculatePlayerStats(awaySecondId, 'away', awaySecondName);

        const homeTotal = { hits: homePlayer1.hits + homePlayer2.hits, total: homePlayer1.total + homePlayer2.total, percentage: 0 };
        const awayTotal = { hits: awayPlayer1.hits + awayPlayer2.hits, total: awayPlayer1.total + awayPlayer2.total, percentage: 0 };

        if (homeTotal.total > 0) homeTotal.percentage = Math.round((homeTotal.hits / homeTotal.total) * 100);
        if (awayTotal.total > 0) awayTotal.percentage = Math.round((awayTotal.hits / awayTotal.total) * 100);

        const winner = homeTotal.hits > awayTotal.hits ? 'home' : awayTotal.hits > homeTotal.hits ? 'away' : null;

        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0b1221] rounded-2xl border-2 border-[#ff5c1a] max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6 p-6 border-b border-[#ff5c1a]/20">
                <h3 className="text-white font-semibold text-xl">Tracking Adatok - {match.homeTeam.name} vs {match.awayTeam.name}</h3>
                <button onClick={() => setSelectedMatchId(null)} className="text-white/80 hover:text-white text-xl">×</button>
              </div>
              <div className="p-6">
                <GameStatsGrid
                  teamStats={{
                    home: [homePlayer1, homePlayer2],
                    away: [awayPlayer1, awayPlayer2],
                    homeTotal,
                    awayTotal,
                    winner
                  }}
                  throws={throws}
                />
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}


