"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchActiveLiveMatchGroup, fetchLeagueMatches } from "@/lib/features/liveMatchSlice";
import { useGetMatchMetaQuery, useGetMatchByIdRawQuery, useGetStandingsQuery } from "@/lib/features/championship/championshipSlice";
import Image from "next/image";

const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

const abs = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${backendBase}${path}`;
};

export default function LiveMatchPage() {
  const dispatch = useAppDispatch();
  const { group, loading, error, nextMatch, pollForNextMatch, leagueMatches, leagueMatchesLoading } = useAppSelector(
    (state) => state.liveMatch
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);

  // Get match data directly (includes trackingData) for next match to watch tracking
  const nextMatchId = useMemo(() => nextMatch?.match.id, [nextMatch]);
  
  // Use RTK Query for match data - reduce polling to 1 second to avoid spamming backend
  // The data will refresh properly through React's reactivity
  const { data: matchDataRaw } = useGetMatchByIdRawQuery(
    nextMatchId || '',
    {
      skip: !nextMatchId,
      pollingInterval: 1000, // Poll every 1 second (enough for live updates without spamming)
    }
  );
  
  const matchData = matchDataRaw;

  // Get match meta for player names
  const { data: matchMeta } = useGetMatchMetaQuery(
    nextMatchId || '',
    { 
      skip: !nextMatchId
    }
  );

  // Check if match is currently being tracked
  const isTrackingActive = useMemo(() => {
    if (!nextMatch || !matchData) return false;
    const match = matchData.match || matchData;
    return match.trackingActive === 1 || match.matchStatus === 'in_progress';
  }, [nextMatch, matchData]);

  // Get tracking data and calculate stats
  const trackingStats = useMemo(() => {
    if (!matchData || !isTrackingActive) {
      console.log('trackingStats: no matchData or not active', { matchData, isTrackingActive });
      return null;
    }

    const match = matchData.match || matchData;
    const trackingData = match?.trackingData;
    
    console.log('trackingStats: processing', { 
      match, 
      trackingData, 
      matchStatus: match?.matchStatus,
      trackingActive: match?.trackingActive 
    });
    
    if (!trackingData || !trackingData.gameState) {
      // Even without trackingData, if match is in_progress, show basic info
      if (match?.matchStatus === 'in_progress') {
        console.log('trackingStats: returning basic info for in_progress match');
        return {
          liveHomeScore: match.homeTeamScore || 0,
          liveAwayScore: match.awayTeamScore || 0,
          phase: 'regular',
          playerStats: {} as Record<string, { throws: number; hits: number; hitRate: number }>,
          homeTeamHitRate: 0,
          awayTeamHitRate: 0,
          selectedPlayers: {
            homeFirst: match.homeFirstPlayerId,
            homeSecond: match.homeSecondPlayerId,
            awayFirst: match.awayFirstPlayerId,
            awaySecond: match.awaySecondPlayerId
          },
          getPlayerName: (playerId: string, team: 'home' | 'away') => {
            if (!matchMeta) return 'Ismeretlen';
            const players = team === 'home' 
              ? (matchMeta.homeTeam?.players || [])
              : (matchMeta.awayTeam?.players || []);
            const player = players.find((p: any) => p.id === playerId);
            return player?.nickname || player?.label || 'Ismeretlen';
          },
          homePlayers: [
            { 
              id: match.homeFirstPlayerId || '', 
              name: (() => {
                if (!matchMeta) return 'Ismeretlen';
                const player = matchMeta.homeTeam?.players?.find((p: any) => p.id === match.homeFirstPlayerId);
                return player?.nickname || player?.label || 'Ismeretlen';
              })()
            },
            { 
              id: match.homeSecondPlayerId || '', 
              name: (() => {
                if (!matchMeta) return 'Ismeretlen';
                const player = matchMeta.homeTeam?.players?.find((p: any) => p.id === match.homeSecondPlayerId);
                return player?.nickname || player?.label || 'Ismeretlen';
              })()
            }
          ],
          awayPlayers: [
            { 
              id: match.awayFirstPlayerId || '', 
              name: (() => {
                if (!matchMeta) return 'Ismeretlen';
                const player = matchMeta.awayTeam?.players?.find((p: any) => p.id === match.awayFirstPlayerId);
                return player?.nickname || player?.label || 'Ismeretlen';
              })()
            },
            { 
              id: match.awaySecondPlayerId || '', 
              name: (() => {
                if (!matchMeta) return 'Ismeretlen';
                const player = matchMeta.awayTeam?.players?.find((p: any) => p.id === match.awaySecondPlayerId);
                return player?.nickname || player?.label || 'Ismeretlen';
              })()
            }
          ]
        };
      }
      return null;
    }

    const gameState = trackingData.gameState;
    const gameHistory = Array.isArray(trackingData.gameHistory) ? trackingData.gameHistory : [];
    const selectedPlayers = trackingData.selectedPlayers || {};

    // Calculate live score (considering overtime)
    const phase = gameState.phase || 'regular';
    const liveHomeScore = phase === 'overtime'
      ? (Number(gameState.homeScore || 0) + Number(gameState.otHome || 0))
      : Number(gameState.homeScore || 0);
    const liveAwayScore = phase === 'overtime'
      ? (Number(gameState.awayScore || 0) + Number(gameState.otAway || 0))
      : Number(gameState.awayScore || 0);

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
      stats.hitRate = stats.throws > 0 ? Math.round((stats.hits / stats.throws) * 100) : 0;
    });

    // Get player names from matchMeta
    const getPlayerName = (playerId: string, team: 'home' | 'away') => {
      if (!matchMeta) return 'Ismeretlen';
      const players = team === 'home' 
        ? (matchMeta.homeTeam?.players || [])
        : (matchMeta.awayTeam?.players || []);
      const player = players.find((p: any) => p.id === playerId);
      return player?.nickname || player?.label || `${player?.firstName || ''} ${player?.lastName || ''}`.trim() || 'Ismeretlen';
    };

    // Calculate team stats
    const homePlayerIds = [
      selectedPlayers.homeFirst || gameState.homeFirstPlayer,
      selectedPlayers.homeSecond || gameState.homeSecondPlayer
    ].filter(Boolean);
    
    const awayPlayerIds = [
      selectedPlayers.awayFirst || gameState.awayFirstPlayer,
      selectedPlayers.awaySecond || gameState.awaySecondPlayer
    ].filter(Boolean);

    const homeTeamStats = homePlayerIds.reduce((acc, playerId) => {
      const stats = playerStats[playerId] || { throws: 0, hits: 0 };
      acc.throws += stats.throws;
      acc.hits += stats.hits;
      return acc;
    }, { throws: 0, hits: 0 });

    const awayTeamStats = awayPlayerIds.reduce((acc, playerId) => {
      const stats = playerStats[playerId] || { throws: 0, hits: 0 };
      acc.throws += stats.throws;
      acc.hits += stats.hits;
      return acc;
    }, { throws: 0, hits: 0 });

    const homeTeamHitRate = homeTeamStats.throws > 0 
      ? Math.round((homeTeamStats.hits / homeTeamStats.throws) * 100) 
      : 0;
    
    const awayTeamHitRate = awayTeamStats.throws > 0 
      ? Math.round((awayTeamStats.hits / awayTeamStats.throws) * 100) 
      : 0;

    return {
      liveHomeScore,
      liveAwayScore,
      phase,
      playerStats,
      selectedPlayers,
      getPlayerName,
      homeTeamHitRate,
      awayTeamHitRate,
      homePlayers: [
        { id: selectedPlayers.homeFirst || gameState.homeFirstPlayer, name: getPlayerName(selectedPlayers.homeFirst || gameState.homeFirstPlayer || '', 'home') },
        { id: selectedPlayers.homeSecond || gameState.homeSecondPlayer, name: getPlayerName(selectedPlayers.homeSecond || gameState.homeSecondPlayer || '', 'home') }
      ],
      awayPlayers: [
        { id: selectedPlayers.awayFirst || gameState.awayFirstPlayer, name: getPlayerName(selectedPlayers.awayFirst || gameState.awayFirstPlayer || '', 'away') },
        { id: selectedPlayers.awaySecond || gameState.awaySecondPlayer, name: getPlayerName(selectedPlayers.awaySecond || gameState.awaySecondPlayer || '', 'away') }
      ]
    };
  }, [matchMeta, isTrackingActive, matchData]);

  // Get league ID from the first match in the group
  const leagueId = useMemo(() => {
    if (group?.matches && group.matches.length > 0) {
      return group.matches[0].match.leagueId;
    }
    return null;
  }, [group]);

  // Standings for seed-based fixed pairing label
  const { data: standings } = useGetStandingsQuery(leagueId || '', {
    skip: !leagueId,
  });

  useEffect(() => {
    // Fetch on mount
    dispatch(fetchActiveLiveMatchGroup());
    
    // Poll every 10 seconds to keep data fresh
    const interval = setInterval(() => {
      dispatch(fetchActiveLiveMatchGroup());
    }, 10000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // Fetch league matches when leagueId is available and refresh frequently
  useEffect(() => {
    if (!leagueId) return;

    // Initial fetch
    dispatch(fetchLeagueMatches(leagueId));
    
    // Refresh every 10 seconds so series score and list update automatically
    const interval = setInterval(() => {
      dispatch(fetchLeagueMatches(leagueId));
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [dispatch, leagueId]);

  // When the tracked match finishes, refresh league matches immediately
  useEffect(() => {
    if (!leagueId || !matchData) return;
    const match = matchData.match || matchData;
    if (match?.matchStatus === 'completed') {
      dispatch(fetchLeagueMatches(leagueId));
    }
  }, [matchData, leagueId, dispatch]);

  // Calculate poll percentages
  const pollPercentages = useMemo(() => {
    if (!pollForNextMatch || !pollForNextMatch.options || pollForNextMatch.options.length === 0) {
      return null;
    }

    const totalVotes = pollForNextMatch.options.reduce((sum, opt) => sum + (opt.voteCount || 0), 0);
    if (totalVotes === 0) {
      return pollForNextMatch.options.map((opt) => ({ ...opt, percentage: 0 }));
    }

    return pollForNextMatch.options.map((opt) => ({
      ...opt,
      percentage: Math.round((opt.voteCount / totalVotes) * 100),
    }));
  }, [pollForNextMatch]);

  // Format match time (consistent with rest of app)
  const formatMatchTime = (date: Date) => {
    return date.toLocaleTimeString('hu-HU', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false, 
      timeZone: 'UTC' 
    });
  };

  const formatMatchDate = (date: Date) => {
    return date.toLocaleDateString('hu-HU', { timeZone: 'UTC' });
  };

  // Helper to get effective match date/time (prioritize delayed if available)
  const getEffectiveMatchAt = (match: any): Date => {
    if (match.isDelayed && match.delayedDate && match.delayedTime) {
      // Combine delayed date and time
      const delayedDate = new Date(match.delayedDate);
      const delayedTime = new Date(match.delayedTime);
      const combined = new Date(delayedDate);
      combined.setUTCHours(delayedTime.getUTCHours(), delayedTime.getUTCMinutes(), 0, 0);
      return combined;
    }
    return new Date(match.matchAt);
  };

  // Get active game days from live matches
  const activeGameDays = useMemo(() => {
    if (!group?.matches || group.matches.length === 0) return new Set<number>();

    const gameDays = new Set<number>();
    group.matches.forEach((m) => {
      // Consider delayed game day if match is delayed
      const gameDay = m.match.isDelayed && m.match.delayedGameDay
        ? m.match.delayedGameDay
        : m.match.gameDay;
      if (gameDay !== null && gameDay !== undefined) {
        gameDays.add(gameDay);
      }
    });
    return gameDays;
  }, [group]);

  // Prepare and sort matches for scrolling list (only from active game days, playoff matches only)
  const processedMatches = useMemo(() => {
    if (!leagueMatches || leagueMatches.length === 0 || activeGameDays.size === 0) return [];

    return leagueMatches
      // Only include playoff matches in the top-left list
      .filter((m) => m.match && m.match.isPlayoffMatch === true)
      .map((m) => {
        // Use delayed info if match is delayed
        const displayDate = m.match.isDelayed && m.match.delayedDate
          ? new Date(m.match.delayedDate)
          : new Date(m.match.matchAt);
        const displayTime = m.match.isDelayed && m.match.delayedTime
          ? new Date(m.match.delayedTime)
          : new Date(m.match.matchTime);
        const gameDay = m.match.isDelayed && m.match.delayedGameDay
          ? m.match.delayedGameDay
          : m.match.gameDay;
        
        return {
          ...m,
          displayDate,
          displayTime,
          gameDay,
          sortKey: displayDate.getTime(),
        };
      })
      .filter((m) => {
        // Only include matches from active game days
        return m.gameDay !== null && m.gameDay !== undefined && activeGameDays.has(m.gameDay);
      })
      .sort((a, b) => {
        // Sort by gameDay first, then by date/time
        if (a.gameDay !== b.gameDay) {
          return a.gameDay - b.gameDay;
        }
        return a.sortKey - b.sortKey;
      });
  }, [leagueMatches, activeGameDays]);

  // Calculate current playoff series score for next match (based on completed playoff matches)
  const playoffSeriesScore = useMemo(() => {
    if (!nextMatch || !leagueMatches || !Array.isArray(leagueMatches)) return null;
    const currentMatch = nextMatch.match;

    const homeId = currentMatch.homeTeamId;
    const awayId = currentMatch.awayTeamId;

    let homeWins = 0;
    let awayWins = 0;
    let hasPlayoffBetweenTeams = !!currentMatch?.isPlayoffMatch;
    const matchResults: string[] = [];

    leagueMatches.forEach((m: any) => {
      const mm = m.match;
      if (!mm) return;
      // Same pair of teams, regardless of current home/away
      const samePair =
        (mm.homeTeamId === homeId && mm.awayTeamId === awayId) ||
        (mm.homeTeamId === awayId && mm.awayTeamId === homeId);
      if (!samePair) return;

      if (mm.isPlayoffMatch === true) {
        hasPlayoffBetweenTeams = true;
      }

      if (mm.isPlayoffMatch === true && mm.matchStatus === 'completed') {
        const rawHomeScore = Number(mm.homeTeamScore ?? 0);
        const rawAwayScore = Number(mm.awayTeamScore ?? 0);
        if (rawHomeScore === rawAwayScore) return;

        // Normalize score so that current homeId is always the left side
        const pairHomeScore =
          mm.homeTeamId === homeId ? rawHomeScore : rawAwayScore;
        const pairAwayScore =
          mm.homeTeamId === homeId ? rawAwayScore : rawHomeScore;

        matchResults.push(`${pairHomeScore}-${pairAwayScore}`);

        const winnerId = rawHomeScore > rawAwayScore ? mm.homeTeamId : mm.awayTeamId;
        if (winnerId === homeId) homeWins++;
        else if (winnerId === awayId) awayWins++;
      }
    });

    // Only show series score if this pair is actually a playoff párharc
    if (!hasPlayoffBetweenTeams) return null;

    return { homeWins, awayWins, results: matchResults };
  }, [nextMatch, leagueMatches]);

  // Fixed pairing label in seed order (independent of home/away for this match)
  const fixedPairingLabel = useMemo(() => {
    if (!nextMatch || !standings?.standings || !Array.isArray(standings.standings)) {
      return null;
    }
    const rows = standings.standings as any[];
    const withSeed = (teamId: string | undefined, name: string) => {
      if (!teamId) return null;
      const idx = rows.findIndex((r) => r.teamId === teamId);
      const seed = idx >= 0 ? idx + 1 : null;
      return { seed, name };
    };

    const homeInfo = withSeed(nextMatch.homeTeam.id, nextMatch.homeTeam.name);
    const awayInfo = withSeed(nextMatch.awayTeam.id, nextMatch.awayTeam.name);
    if (!homeInfo || !awayInfo || homeInfo.seed == null || awayInfo.seed == null) return null;

    const ordered = [homeInfo, awayInfo].sort((a, b) => (a.seed! - b.seed!));
    return `${ordered[0].seed}. ${ordered[0].name.toUpperCase()} vs ${ordered[1].seed}. ${ordered[1].name.toUpperCase()}`;
  }, [nextMatch, standings]);

  // Infinite scroll with JavaScript (no restart)
  useEffect(() => {
    if (!scrollContainerRef.current || processedMatches.length === 0) return;

    const container = scrollContainerRef.current;
    const scrollSpeed = 0.25; // pixels per frame (slower)

    let animationId: number;
    
    const scroll = () => {
      scrollPositionRef.current += scrollSpeed;
      
      // Get the height of one set of matches
      const singleSetHeight = container.scrollHeight / 4; // We have 4 copies
      
      // If we've scrolled past one full set, reset to start (seamless loop)
      if (scrollPositionRef.current >= singleSetHeight) {
        scrollPositionRef.current = 0;
      }
      
      container.style.transform = `translateY(-${scrollPositionRef.current}px)`;
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [processedMatches]);

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      {/* Main 1920x1080 container */}
      <div 
        className="relative w-[1920px] h-[1080px] mx-auto"
        style={{
          backgroundImage: 'url(/bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Matches List - Top Left (replacing Chat) */}
        <div className="absolute top-[45px] left-[45px] w-[400px]">
          <h3 className="text-white text-lg font-semibold mb-2">Meccsek:</h3>
          <div className="w-full h-[300px] bg-[#001a3a]/30 rounded-lg border border-[#ff5c1a]/30 overflow-hidden relative">
            {leagueMatchesLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-gray-400 text-sm">Betöltés...</div>
              </div>
            ) : processedMatches.length > 0 ? (
              <div className="h-full overflow-hidden relative">
                {/* Infinite scroll container */}
                <div 
                  ref={scrollContainerRef}
                  className="space-y-2 p-3"
                  style={{
                    willChange: 'transform'
                  }}
                >
                  {/* Duplicate content multiple times for seamless loop */}
                  {[...processedMatches, ...processedMatches, ...processedMatches, ...processedMatches].map((m, idx) => (
                    <div
                      key={`${m.match.id}-${idx}`}
                      className="bg-[#001a3a]/60 rounded-lg p-3 border border-[#ff5c1a]/20 hover:border-[#ff5c1a]/40 transition-all duration-300"
                    >
                        {/* Date and Game Day */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#ff5c1a] text-xs font-semibold">
                            {formatMatchDate(m.displayDate)}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {formatMatchTime(m.displayTime)}
                            {m.match.isDelayed && (
                              <span className="ml-1 text-yellow-400">(halasztott)</span>
                            )}
                          </span>
                        </div>
                        
                        {/* Teams */}
                        <div className="flex items-center justify-between gap-2">
                          {/* Home Team */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {m.homeTeam.logo && abs(m.homeTeam.logo) ? (
                              <div className="relative w-6 h-6 rounded-full overflow-hidden border border-[#ff5c1a]/30 flex-shrink-0">
                                <Image
                                  src={abs(m.homeTeam.logo)!}
                                  alt={m.homeTeam.name || "Home team"}
                                  fill
                                  className="object-contain"
                                />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-[#1a3f6f]/60 border border-[#ff5c1a]/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">
                                  {(m.homeTeam.name || "").substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="text-white text-sm font-medium truncate">
                              {m.homeTeam.name}
                            </span>
                          </div>

                          {/* Score or VS */}
                          <div className="flex-shrink-0 px-2">
                            {m.match.matchStatus === 'completed' ? (
                              <span className="text-white text-sm font-bold">
                                {m.match.homeTeamScore} - {m.match.awayTeamScore}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">VS</span>
                            )}
                          </div>

                          {/* Away Team */}
                          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                            <span className="text-white text-sm font-medium truncate text-right">
                              {m.awayTeam.name}
                            </span>
                            {m.awayTeam.logo && abs(m.awayTeam.logo) ? (
                              <div className="relative w-6 h-6 rounded-full overflow-hidden border border-[#ff5c1a]/30 flex-shrink-0">
                                <Image
                                  src={abs(m.awayTeam.logo)!}
                                  alt={m.awayTeam.name || "Away team"}
                                  fill
                                  className="object-contain"
                                />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-[#1a3f6f]/60 border border-[#ff5c1a]/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">
                                  {(m.awayTeam.name || "").substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-gray-400 text-sm">Nincsenek meccsek</div>
              </div>
            )}
          </div>
        </div>

        {/* Voting Section - Mid Left */}
        <div className="absolute top-[400px] left-[45px] w-[400px]">
          <h3 className="text-white text-lg font-semibold mb-3 drop-shadow-lg">Szavazás:</h3>
          <div className="w-full h-[300px] bg-gradient-to-br from-[#001a3a]/40 via-[#001a3a]/30 to-[#001a3a]/20 backdrop-blur-sm rounded-xl border border-[#ff5c1a]/40 shadow-2xl shadow-[#ff5c1a]/10 p-5 relative overflow-hidden">
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#ff5c1a]/5 via-transparent to-[#ff5c1a]/5 pointer-events-none" />
            
            {/* Voting Question */}
            {pollForNextMatch && pollForNextMatch.question ? (
              <>
                <div className="mb-5 relative z-10">
                  <p className="text-white text-[15px] font-semibold leading-relaxed tracking-wide">
                    {pollForNextMatch.question}
                  </p>
                </div>

                {/* Voting Options */}
                <div className="space-y-4 mb-5 relative z-10">
                  {pollPercentages?.map((option, index) => {
                    const isFirst = index === 0;
                    const colorClass = isFirst
                      ? "from-green-500 via-green-400 to-green-500 shadow-green-500/40"
                      : "from-red-500 via-red-400 to-red-500 shadow-red-500/40";
                    const textColorClass = isFirst
                      ? "from-green-400 to-green-300"
                      : "from-red-400 to-red-300";
                    const dotColorClass = isFirst
                      ? "from-green-400 to-green-500 shadow-green-500/50"
                      : "from-red-400 to-red-500 shadow-red-500/50";

                    return (
                      <div key={option.id} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white text-sm font-semibold tracking-wide flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full bg-gradient-to-r ${dotColorClass} shadow-lg`}
                            ></span>
                            {option.text}
                          </span>
                          <span
                            className={`text-white text-sm font-bold bg-gradient-to-r ${textColorClass} bg-clip-text text-transparent drop-shadow-sm`}
                          >
                            {option.percentage}%
                          </span>
                        </div>
                        <div className="relative w-full h-7 bg-[#0a1f3d]/60 rounded-full overflow-hidden border border-[#1a3f6f]/40 shadow-inner">
                          <div
                            className={`h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-700 ease-out shadow-lg relative overflow-hidden`}
                            style={{ width: `${option.percentage}%` }}
                          >
                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                            {/* Glow effect */}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white/40 blur-sm" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="mb-5 relative z-10">
                <p className="text-gray-400 text-sm">Nincs aktív szavazás</p>
              </div>
            )}

            {/* Voting Link */}
            <div className="mt-6 pt-4 relative z-10">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff5c1a]/30 to-transparent"></div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-md font-medium tracking-wide">szavazás:</span>
                <a 
                  href="https://elite.sorpingpong.hu/szavazas" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#ff5c1a] text-md font-semibold hover:text-[#ff7a3d] transition-all duration-300 underline decoration-[#ff5c1a]/50 hover:decoration-[#ff7a3d]/70 underline-offset-2 hover:underline-offset-4 group/link"
                >
                  <span className="group-hover/link:drop-shadow-[0_0_8px_rgba(255,92,26,0.6)] transition-all">
                    elite.sorpingpong.hu/szavazas
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Main Video Area - Right Side */}
        <div className="absolute top-[45px] right-[45px] w-[1280px] h-[783px] bg-black rounded-xl overflow-hidden bg-[#001a3a]/95 border-[1px]">
          {/* OBS Video placeholder */}
          <div className="w-full h-full flex items-center justify-center text-white">
            OBS Video Area
          </div>
        </div>

        {/* Tracking/Team Details Bar - Below Main Video */}
        <div className="absolute bottom-[45px] right-[45px] w-[1280px] rounded-xl h-[180px] bg-[#001a3a]/95 border-[1px] border-[#ff5c1a]/30">
          {/* Live Match Stats or Next Match Team Details */}
          {nextMatch && isTrackingActive && trackingStats ? (
            // Live match with tracking active
            <div className="h-full flex items-center justify-between px-12">
              {/* Home Team with Stats */}
              <div className="flex items-center gap-6">
                {nextMatch.homeTeam.logo && abs(nextMatch.homeTeam.logo) ? (
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#ff5c1a]/30 bg-white/10">
                    <Image
                      src={abs(nextMatch.homeTeam.logo)!}
                      alt={nextMatch.homeTeam.name || "Home team"}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#1a3f6f]/60 border-2 border-[#ff5c1a]/30 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      {(nextMatch.homeTeam.name || "").substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-white text-2xl font-bold">
                      {nextMatch.homeTeam.name}
                    </span>
                    <span className="text-[#ff5c1a] text-sm font-semibold">
                      ({trackingStats.homeTeamHitRate}%)
                    </span>
                  </div>
                  {/* Player Stats */}
                  <div className="flex flex-col gap-1.5">
                    {trackingStats.homePlayers.filter(p => p.id).map((player, idx) => {
                      const stats = player.id && trackingStats.playerStats ? (trackingStats.playerStats[player.id] || null) : null;
                      return (
                        <div key={idx} className="flex items-center gap-3 text-sm">
                          <span className="text-gray-300 w-40 truncate">{player.name}</span>
                          {stats ? (
                            <span className="text-white font-semibold">
                              {stats.hits}/{stats.throws} ({stats.hitRate}%)
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">0/0 (0%)</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Live Score + Playoff aggregate */}
              <div className="flex flex-col items-center gap-2">
                {playoffSeriesScore && (
                  <div className="flex flex-col items-center mb-1">
                    <div className="text-gray-100 text-sm font-semibold">
                      {nextMatch.homeTeam.name} {playoffSeriesScore.homeWins} - {playoffSeriesScore.awayWins} {nextMatch.awayTeam.name}
                    </div>
                    {(() => {
                      const maxGames = 7;
                      const completed = playoffSeriesScore.results || [];
                      const allResults = [...completed];
                      for (let i = completed.length; i < maxGames; i++) {
                        allResults.push('0-0');
                      }
                      return (
                        <div className="text-gray-300 text-xs">
                          ({allResults.join(', ')})
                        </div>
                      );
                    })()}
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <span className="text-white text-4xl font-bold">{trackingStats.liveHomeScore}</span>
                  <span className="text-[#ff5c1a] text-2xl font-bold">-</span>
                  <span className="text-white text-4xl font-bold">{trackingStats.liveAwayScore}</span>
                </div>
                {trackingStats.phase === 'overtime' && (
                  <span className="text-yellow-400 text-sm font-semibold">OVERTIME</span>
                )}
              </div>

              {/* Away Team with Stats */}
              <div className="flex items-center gap-6">
                <div className="flex flex-col gap-2 items-end">
                  <div className="flex items-center gap-3">
                    <span className="text-[#ff5c1a] text-sm font-semibold">
                      ({trackingStats.awayTeamHitRate}%)
                    </span>
                    <span className="text-white text-2xl font-bold">
                      {nextMatch.awayTeam.name}
                    </span>
                  </div>
                  {/* Player Stats */}
                  <div className="flex flex-col gap-1.5">
                    {trackingStats.awayPlayers.filter(p => p.id).map((player, idx) => {
                      const stats = player.id && trackingStats.playerStats ? (trackingStats.playerStats[player.id] || null) : null;
                      return (
                        <div key={idx} className="flex items-center gap-3 text-sm justify-end">
                          {stats ? (
                            <span className="text-white font-semibold">
                              {stats.hits}/{stats.throws} ({stats.hitRate}%)
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">0/0 (0%)</span>
                          )}
                          <span className="text-gray-300 w-40 truncate text-right">{player.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {nextMatch.awayTeam.logo && abs(nextMatch.awayTeam.logo) ? (
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#ff5c1a]/30 bg-white/10">
                    <Image
                      src={abs(nextMatch.awayTeam.logo)!}
                      alt={nextMatch.awayTeam.name || "Away team"}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#1a3f6f]/60 border-2 border-[#ff5c1a]/30 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      {(nextMatch.awayTeam.name || "").substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : nextMatch ? (
            // Next match preview (not started yet)
            <div className="h-full flex items-center justify-between px-12">
              {/* Home Team */}
              <div className="flex items-center gap-4">
                {nextMatch.homeTeam.logo && abs(nextMatch.homeTeam.logo) ? (
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#ff5c1a]/30 bg-white/10">
                    <Image
                      src={abs(nextMatch.homeTeam.logo)!}
                      alt={nextMatch.homeTeam.name || "Home team"}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#1a3f6f]/60 border-2 border-[#ff5c1a]/30 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      {(nextMatch.homeTeam.name || "").substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-white text-2xl font-bold">
                    {nextMatch.homeTeam.name}
                  </span>
                  <span className="text-gray-400 text-sm">Hazai csapat</span>
                </div>
              </div>

              {/* Match Info */}
              <div className="flex flex-col items-center gap-2">
                {(!playoffSeriesScore || !fixedPairingLabel) && (
                  <div className="text-white text-lg font-semibold">VS</div>
                )}
                {fixedPairingLabel && (
                  <div className="text-gray-300 text-xs uppercase tracking-wide mt-0.5">
                    {fixedPairingLabel}
                  </div>
                )}
                {playoffSeriesScore && (
                  <>
                    <div className="flex items-center gap-6 mt-1">
                      <span className="text-white text-3xl font-extrabold">
                        {playoffSeriesScore.homeWins}
                      </span>
                      <span className="text-gray-400 text-xs uppercase tracking-wide">
                        Párharc állása
                      </span>
                      <span className="text-white text-3xl font-extrabold">
                        {playoffSeriesScore.awayWins}
                      </span>
                    </div>
                    {(() => {
                      const maxGames = 7;
                      const completed = playoffSeriesScore.results || [];
                      const allResults = [...completed];
                      for (let i = completed.length; i < maxGames; i++) {
                        allResults.push('0-0');
                      }
                      return (
                        <div className="text-gray-300 text-xs mt-1">
                          ({allResults.join(', ')})
                        </div>
                      );
                    })()}
                  </>
                )}
                <div className="text-[#ff5c1a] text-sm font-medium mt-1">
                  {formatMatchDate(getEffectiveMatchAt(nextMatch.match))}
                </div>
                <div className="text-white text-xl font-bold">
                  {formatMatchTime(getEffectiveMatchAt(nextMatch.match))}
                </div>
              </div>

              {/* Away Team */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-white text-2xl font-bold">
                    {nextMatch.awayTeam.name}
                  </span>
                  <span className="text-gray-400 text-sm">Vendég csapat</span>
                </div>
                {nextMatch.awayTeam.logo && abs(nextMatch.awayTeam.logo) ? (
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#ff5c1a]/30 bg-white/10">
                    <Image
                      src={abs(nextMatch.awayTeam.logo)!}
                      alt={nextMatch.awayTeam.name || "Away team"}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#1a3f6f]/60 border-2 border-[#ff5c1a]/30 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      {(nextMatch.awayTeam.name || "").substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <span className="text-gray-400 text-lg">Nincs következő meccs</span>
          </div>
          )}
        </div>

        {/* Mini Broadcaster Feed - Bottom Left */}
        <div className="absolute bottom-[45px] left-[45px] w-[400px] h-[250px] bg-black/80 rounded-lg overflow-hidden">
          {/* Placeholder for mini broadcaster feed */}
          <div className="w-full h-full flex items-center justify-center text-white">
            Mini Broadcaster Feed
          </div>
        </div>
      </div>
    </div>
  );
}

