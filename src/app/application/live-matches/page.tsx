"use client";

import { useMemo, useState } from 'react';
import { Bebas_Neue } from "next/font/google";
import { FiPlay, FiPause, FiRefreshCw, FiUsers, FiClock, FiExternalLink } from 'react-icons/fi';
import Link from 'next/link';
import { useGetMyLeagueQuery } from '@/lib/features/apiSlice';
import { useGetMatchesForLeagueQuery } from '@/lib/features/championship/championshipSlice';
import GameStatsGrid from '@/components/GameStatsGrid';

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

export default function LiveMatchesPage() {
  const { data: my } = useGetMyLeagueQuery();
  const leagueId = my?.leagueId;
  const { data: leagueMatches } = useGetMatchesForLeagueQuery(leagueId!, {
    skip: !leagueId,
    pollingInterval: 5000,
  });
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const liveMatches = useMemo(() => {
    const rows = Array.isArray(leagueMatches) ? leagueMatches : [];
    return rows
      .filter((row: any) => (row?.match?.trackingActive === 1) || (row?.match?.matchStatus === 'in_progress'))
      .map((row: any) => {
        const td = row?.match?.trackingData || {};
        const gs = td?.gameState || {};
        const phase = gs?.phase || 'regular';
        const startedAt = row?.match?.trackingStartedAt ? new Date(row.match.trackingStartedAt) : null;
        const now = Date.now();
        const durationSec = startedAt ? Math.max(0, Math.floor((now - startedAt.getTime()) / 1000)) : 0;
        const mm = String(Math.floor(durationSec / 60)).padStart(2, '0');
        const ss = String(durationSec % 60).padStart(2, '0');

        // Compute live score from trackingData (same, mint tracking oldalon)
        const liveHomeScore = phase === 'overtime'
          ? (Number(gs.homeScore || 0) + Number(gs.otHome || 0))
          : Number(gs.homeScore ?? row.match.homeTeamScore ?? 0);
        const liveAwayScore = phase === 'overtime'
          ? (Number(gs.awayScore || 0) + Number(gs.otAway || 0))
          : Number(gs.awayScore ?? row.match.awayTeamScore ?? 0);

        // Quick stats
        const totalThrows = Array.isArray(td?.gameHistory) ? td.gameHistory.length : 0;
        const hitsHome = Array.isArray(td?.gameHistory)
          ? td.gameHistory.filter((a: any) => a.team === 'home' && a.type === 'hit').length
          : 0;
        const hitsAway = Array.isArray(td?.gameHistory)
          ? td.gameHistory.filter((a: any) => a.team === 'away' && a.type === 'hit').length
          : 0;

        return {
          id: row.match.id,
          homeTeam: {
            name: row.homeTeam?.name || 'Home',
            score: liveHomeScore,
            players: [td?.homeTeam?.players?.[0]?.name, td?.homeTeam?.players?.[1]?.name].filter(Boolean)
          },
          awayTeam: {
            name: row.awayTeam?.name || 'Away',
            score: liveAwayScore,
            players: [td?.awayTeam?.players?.[0]?.name, td?.awayTeam?.players?.[1]?.name].filter(Boolean)
          },
          status: 'live',
          phase,
          startTime: startedAt ? startedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
          duration: `${mm}:${ss}`,
          trackingData: td,
          currentTurn: gs?.currentTurn || null,
          returnServeCount: gs?.returnServeCount || 0,
          overtimePeriod: gs?.overtimePeriod || 0,
          totalThrows,
          hitsHome,
          hitsAway,
        };
      });
  }, [leagueMatches]);

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'overtime':
        return 'text-red-400';
      case 'return_serve':
        return 'text-yellow-400';
      case 'regular':
        return 'text-green-400';
      default:
        return 'text-white';
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'overtime':
        return '🔥';
      case 'return_serve':
        return '⚡';
      case 'regular':
        return '🏓';
      default:
        return '🎯';
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`${bebasNeue.className} text-4xl md:text-6xl text-white mb-4 tracking-wider`}>
            ÉLŐ MECCSEK
          </h1>
          <div className="flex items-center justify-center space-x-4 text-[#ff5c1a]">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold">LIVE</span>
            </div>
            <span className="text-sm">•</span>
            <span className="text-sm">{liveMatches.length} aktív meccs</span>
          </div>
        </div>

        {/* Live Matches Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {liveMatches.map((match) => (
            <div key={match.id} className="bg-black/40 backdrop-blur-sm rounded-2xl border border-[#ff5c1a]/30 p-6 hover:border-[#ff5c1a]/60 transition-all duration-300 hover:shadow-lg hover:shadow-[#ff5c1a]/20">
              {/* Match Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400 uppercase tracking-wider">LIVE</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getPhaseIcon(match.phase)}</span>
                  <span className={`text-sm font-semibold ${getPhaseColor(match.phase)}`}>
                    {match.phase === 'overtime' ? 'HOSSZABBÍTÁS' : 
                     match.phase === 'return_serve' ? 'VISSZASZÁLLÓ' : 'RENDES JÁTÉK'}
                  </span>
                </div>
              </div>

              {/* Teams */}
              <div className="space-y-4 mb-6">
                {/* Home Team */}
                <div className="flex items-center justify-between">
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
                <div className="flex items-center justify-between">
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
                  <FiClock className="w-4 h-4" />
                  <span>Kezdés: {match.startTime}</span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <FiPlay className="w-4 h-4" />
                  <span>Idő: {match.duration}</span>
                </div>
                <div className="text-xs text-gray-400">
                  Összes dobás: <span className="text-white font-semibold">{match.totalThrows}</span>
                </div>
                <div className="text-xs text-gray-400 text-right">
                  Hits H/V: <span className="text-green-400 font-semibold">{match.hitsHome}</span> / <span className="text-green-400 font-semibold">{match.hitsAway}</span>
                </div>
                {match.phase === 'return_serve' && (
                  <div className="col-span-2 text-xs text-yellow-300 text-center">
                    Visszaszálló: {match.returnServeCount}
                  </div>
                )}
                {match.phase === 'overtime' && (
                  <div className="col-span-2 text-xs text-red-300 text-center">
                    Hosszabbítás periódus: {match.overtimePeriod}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button 
                  onClick={() => setSelectedMatchId(match.id)}
                  className="flex-1 bg-[#ff5c1a] hover:bg-[#e54d1a] text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <FiExternalLink className="w-4 h-4" />
                  <span>KÖVETÉS</span>
                </button>
                <button className="bg-black/30 hover:bg-black/50 text-white p-2 rounded-lg transition-colors">
                  <FiRefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Live Stats Preview */}
              <div className="mt-4 pt-4 border-t border-[#ff5c1a]/20">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="text-center">
                    <div className="text-gray-400">Dobások</div>
                    <div className="text-white font-semibold">{match.trackingData.gameHistory.length}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">Hits</div>
                    <div className="text-white font-semibold">
                      {match.trackingData.gameHistory.filter((action: any) => action.type === 'hit').length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {liveMatches.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏓</div>
            <h2 className="text-2xl text-white font-semibold mb-2">Nincsenek élő meccsek</h2>
            <p className="text-gray-400">Jelenleg nincs aktív meccs. Várj, amíg valaki elindít egy játékot!</p>
          </div>
        )}
      </div>
      {/* Modal viewer for live tracking */}
      {selectedMatchId && (() => {
        const row = Array.isArray(leagueMatches) ? (leagueMatches as any[]).find(r => r?.match?.id === selectedMatchId) : null;
        const td = row?.match?.trackingData || {};
        const gameHistory = Array.isArray(td.gameHistory) ? td.gameHistory : [];
        const selectedPlayers = td.selectedPlayers || {};

        // Helpers replicated (lightweight) from matches page
        const resolveName = (id: string, team: 'home' | 'away') => {
          const teamPlayers = team === 'home' ? td.homeTeam?.players || [] : td.awayTeam?.players || [];
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

        // Build rounds from history to compute roundIndex like tracking page
        const recomputeFromHistory = (actions: any[]) => {
          // Full logic aligned with tracking page
          let s: any = {
            homeScore: 0,
            awayScore: 0,
            currentTurn: 'home',
            phase: 'regular',
            homeFirstPlayer: homeFirstId,
            homeSecondPlayer: homeSecondId,
            awayFirstPlayer: awayFirstId,
            awaySecondPlayer: awaySecondId,
            lastThrower: null,
            consecutiveThrows: 0,
            returnServeCount: 0,
            gameHistory: [],
            initThrowsCount: 0,
            throwsInTurn: 0,
            hitsInTurn: 0,
            rebuttalCupsToMake: undefined,
            rebuttalMode: undefined,
            rebuttalStep: 0,
            rebuttalAttemptsLeft: undefined,
            rebuttalLastShooter: null,
            exitTeam: undefined,
            gameEnded: false,
            otHome: 0,
            otAway: 0,
            overtimePeriod: 0,
            lastOvertimeThrower: null,
          };

          const apply = (prev: any, action: any): any => {
            if (prev.gameEnded) return prev;
            const isHome = action.team === 'home';
            let ns = { ...prev };
            ns.gameHistory = [...ns.gameHistory, action];

            // 1) Starting sequence
            if (ns.phase === 'regular' && ns.initThrowsCount === 0) {
              if (action.type === 'hit') {
                if (isHome) ns.homeScore++; else ns.awayScore++;
              }
              ns.lastThrower = action.playerId;
              ns.consecutiveThrows = 0;
              ns.throwsInTurn = 0;
              ns.hitsInTurn = 0;
              ns.initThrowsCount = 1;
              ns.currentTurn = 'away';
              return ns;
            }

            // 2) Return serve handling
            if (ns.phase === 'return_serve') {
              if (ns.rebuttalMode === 'gt3') {
                if (action.type === 'miss') {
                  ns.gameEnded = true;
                } else {
                  if (isHome) ns.homeScore = ns.homeScore + 1; else ns.awayScore = ns.awayScore + 1;
                  const remaining = Math.max((ns.rebuttalCupsToMake || 0) - 1, 0);
                  ns.rebuttalCupsToMake = remaining;
                  ns.returnServeCount = remaining;
                  ns.rebuttalLastShooter = action.playerId;
                  if (remaining <= 0) {
                    ns.phase = 'overtime';
                    ns.currentTurn = ns.exitTeam || 'home';
                    ns.overtimePeriod = (ns.overtimePeriod || 0) + 1;
                  }
                }
                ns.consecutiveThrows = 0; ns.throwsInTurn = 0; ns.hitsInTurn = 0; ns.lastThrower = action.playerId;
              } else if (ns.rebuttalMode === 'lte3') {
                if (action.type === 'miss') {
                  ns.gameEnded = true;
                } else {
                  if (isHome) ns.homeScore = ns.homeScore + 1; else ns.awayScore = ns.awayScore + 1;
                  const remaining = Math.max((ns.rebuttalCupsToMake || 0) - 1, 0);
                  ns.rebuttalCupsToMake = remaining;
                  ns.returnServeCount = remaining;
                  ns.rebuttalStep = (ns.rebuttalStep || 0) + 1;
                  ns.rebuttalLastShooter = action.playerId;
                  if (remaining <= 0) {
                    ns.phase = 'overtime';
                    ns.currentTurn = ns.exitTeam || 'home';
                    ns.overtimePeriod = (ns.overtimePeriod || 0) + 1;
                  }
                }
                ns.consecutiveThrows = 0; ns.throwsInTurn = 0; ns.hitsInTurn = 0; ns.lastThrower = action.playerId;
              } else if (ns.rebuttalMode === 'onecup_double') {
                if (action.type === 'hit') {
                  if (isHome) ns.homeScore = ns.homeScore + 1; else ns.awayScore = ns.awayScore + 1;
                  ns.phase = 'overtime';
                  ns.currentTurn = ns.exitTeam || 'home';
                  ns.overtimePeriod = (ns.overtimePeriod || 0) + 1;
                } else {
                  const left = (ns.rebuttalAttemptsLeft || 0) - 1;
                  ns.rebuttalAttemptsLeft = left;
                  ns.rebuttalLastShooter = action.playerId;
                  if (left <= 0) ns.gameEnded = true;
                }
                ns.consecutiveThrows = 0; ns.throwsInTurn = 0; ns.hitsInTurn = 0; ns.lastThrower = action.playerId;
              }
              return ns;
            }

            // 3) Overtime
            if (ns.phase === 'overtime') {
              if (action.type === 'hit') {
                if (isHome) ns.otHome = (ns.otHome || 0) + 1; else ns.otAway = (ns.otAway || 0) + 1;
                ns.hitsInTurn += 1;
              }
              ns.throwsInTurn += 1;
              ns.consecutiveThrows = ns.throwsInTurn;
              ns.lastThrower = action.playerId;
              ns.lastOvertimeThrower = action.playerId;
              if (!ns.overtimePeriod || ns.overtimePeriod === 0) ns.overtimePeriod = 1;

              const exitThrowNumberInOt = ns.throwsInTurn;
              if (ns.throwsInTurn === 1) {
                // stay
              } else if (ns.throwsInTurn === 2) {
                if (ns.hitsInTurn === 2 && action.type === 'hit') {
                  // allow bonus
                } else {
                  ns.currentTurn = isHome ? 'away' : 'home';
                  ns.throwsInTurn = 0; ns.hitsInTurn = 0; ns.consecutiveThrows = 0;
                }
              } else if (ns.throwsInTurn === 3) {
                ns.currentTurn = isHome ? 'away' : 'home';
                ns.throwsInTurn = 0; ns.hitsInTurn = 0; ns.consecutiveThrows = 0;
              }

              const otHome = ns.otHome || 0;
              const otAway = ns.otAway || 0;
              if (otHome >= 3 && otAway < 3) {
                const cupsToMake = Math.max(3 - otAway, 0);
                const mode = cupsToMake === 1 && exitThrowNumberInOt > 1 ? 'onecup_double' : 'lte3';
                const attemptsLeft = mode === 'onecup_double' ? 2 : undefined;
                return {
                  ...ns,
                  phase: 'return_serve',
                  currentTurn: 'away',
                  exitTeam: 'home',
                  rebuttalMode: mode,
                  rebuttalCupsToMake: cupsToMake,
                  rebuttalStep: 0,
                  rebuttalAttemptsLeft: attemptsLeft,
                  rebuttalLastShooter: null,
                  consecutiveThrows: 0,
                  throwsInTurn: 0,
                  hitsInTurn: 0,
                  homeScore: ns.homeScore + otHome,
                  awayScore: ns.awayScore + otAway,
                  otHome: 0,
                  otAway: 0,
                };
              }
              if (otAway >= 3 && otHome < 3) {
                const cupsToMake = Math.max(3 - otHome, 0);
                const mode = cupsToMake === 1 && exitThrowNumberInOt > 1 ? 'onecup_double' : 'lte3';
                const attemptsLeft = mode === 'onecup_double' ? 2 : undefined;
                return {
                  ...ns,
                  phase: 'return_serve',
                  currentTurn: 'home',
                  exitTeam: 'away',
                  rebuttalMode: mode,
                  rebuttalCupsToMake: cupsToMake,
                  rebuttalStep: 0,
                  rebuttalAttemptsLeft: attemptsLeft,
                  rebuttalLastShooter: null,
                  consecutiveThrows: 0,
                  throwsInTurn: 0,
                  hitsInTurn: 0,
                  homeScore: ns.homeScore + otHome,
                  awayScore: ns.awayScore + otAway,
                  otHome: 0,
                  otAway: 0,
                };
              }
              return ns;
            }

            // 4) Regular turns
            if (action.type === 'hit') {
              if (isHome) ns.homeScore++; else ns.awayScore++;
              ns.hitsInTurn += 1;
            }
            ns.throwsInTurn += 1;
            const exitThrowNumberAfterThisThrow = ns.throwsInTurn;
            ns.consecutiveThrows = ns.throwsInTurn;
            ns.lastThrower = action.playerId;
            if (ns.throwsInTurn === 1) {
              // stay
            } else if (ns.throwsInTurn === 2) {
              if (ns.hitsInTurn === 2 && action.type === 'hit') {
                // allow bonus
              } else {
                ns.currentTurn = isHome ? 'away' : 'home';
                ns.throwsInTurn = 0; ns.hitsInTurn = 0; ns.consecutiveThrows = 0;
              }
            } else if (ns.throwsInTurn === 3) {
              ns.currentTurn = isHome ? 'away' : 'home';
              ns.throwsInTurn = 0; ns.hitsInTurn = 0; ns.consecutiveThrows = 0;
            }

            // Transition to return serve when one team reaches 10 and the other below 10
            if (ns.phase === 'regular') {
              if (ns.homeScore >= 10 && ns.awayScore < 10) {
                const need = 10 - ns.awayScore;
                let mode: 'gt3' | 'lte3' | 'onecup_double' = need > 3 ? 'gt3' : 'lte3';
                let attemptsLeft: number | undefined = undefined;
                if (need === 1 && exitThrowNumberAfterThisThrow > 1) { mode = 'onecup_double'; attemptsLeft = 2; }
                return {
                  ...ns,
                  phase: 'return_serve',
                  currentTurn: 'away',
                  exitTeam: 'home',
                  rebuttalCupsToMake: need,
                  rebuttalMode: mode,
                  rebuttalStep: 0,
                  rebuttalAttemptsLeft: attemptsLeft,
                  rebuttalLastShooter: null,
                  consecutiveThrows: 0,
                  throwsInTurn: 0,
                  hitsInTurn: 0,
                };
              } else if (ns.awayScore >= 10 && ns.homeScore < 10) {
                const need = 10 - ns.homeScore;
                let mode: 'gt3' | 'lte3' | 'onecup_double' = need > 3 ? 'gt3' : 'lte3';
                let attemptsLeft: number | undefined = undefined;
                if (need === 1 && exitThrowNumberAfterThisThrow > 1) { mode = 'onecup_double'; attemptsLeft = 2; }
                return {
                  ...ns,
                  phase: 'return_serve',
                  currentTurn: 'home',
                  exitTeam: 'away',
                  rebuttalCupsToMake: need,
                  rebuttalMode: mode,
                  rebuttalStep: 0,
                  rebuttalAttemptsLeft: attemptsLeft,
                  rebuttalLastShooter: null,
                  consecutiveThrows: 0,
                  throwsInTurn: 0,
                  hitsInTurn: 0,
                };
              }
            }

            if (ns.phase === 'regular' && ns.homeScore >= 10 && ns.awayScore >= 10) {
              ns.phase = 'overtime';
              ns.overtimePeriod = 1;
            }

            return ns;
          };

          actions.forEach(a => { s = apply(s, a); });
          return s;
        };
        const buildRounds = () => {
          const rounds: any[] = [];
          let currentRound: any = null;

          for (let i = 0; i < gameHistory.length; i++) {
            const action = gameHistory[i];

            // State BEFORE this action
            let stateBefore: any;
            try {
              stateBefore = recomputeFromHistory(gameHistory.slice(0, i));
            } catch (_) {
              stateBefore = { currentTurn: action.team, phase: 'regular' };
            }

            // State AFTER this action
            let stateAfter: any;
            try {
              stateAfter = recomputeFromHistory(gameHistory.slice(0, i + 1));
            } catch (_) {
              stateAfter = stateBefore;
            }

            // Group all return_serve throws into a single round
            if (stateBefore.phase === 'return_serve') {
              if (!currentRound || currentRound.phase !== 'return_serve' || currentRound.team !== stateBefore.currentTurn) {
                if (currentRound && currentRound.throws.length > 0) {
                  rounds.push(currentRound);
                }
                currentRound = {
                  team: stateBefore.currentTurn,
                  phase: 'return_serve',
                  throws: [],
                  roundIndex: rounds.length,
                };
              }
              currentRound.throws.push(action);
              // Close this return_serve round only when leaving return_serve
              if (stateAfter.phase !== 'return_serve') {
                rounds.push(currentRound);
                currentRound = null;
              }
              continue;
            }

            // Normal (regular / overtime) rounds: start when team at action start differs
            if (!currentRound || currentRound.team !== stateBefore.currentTurn || currentRound.phase === 'return_serve') {
              if (currentRound && currentRound.throws.length > 0) {
                rounds.push(currentRound);
              }
              currentRound = {
                team: stateBefore.currentTurn,
                phase: stateBefore.phase,
                throws: [],
                roundIndex: rounds.length,
              };
            }

            // Add action
            currentRound.throws.push(action);

            // End round when the turn switches to the other team or when entering return_serve
            if (stateAfter.currentTurn !== currentRound.team || stateAfter.phase === 'return_serve') {
              rounds.push(currentRound);
              currentRound = null;
            }
          }

          if (currentRound && currentRound.throws.length > 0) {
            rounds.push(currentRound);
          }

          return rounds;
        };
        const rounds = buildRounds();
        const throwsMapped = gameHistory.map((action: any, index: number) => {
          // Calculate round index based on game phase
          let roundIndex = 0;
          let currentIndex = 0;
          
          for (let i = 0; i < rounds.length; i++) {
            const round = rounds[i];
            const roundThrowCount = round.throws.length;
            if (currentIndex <= index && index < currentIndex + roundThrowCount) {
              roundIndex = i;
              break;
            }
            currentIndex += roundThrowCount;
          }
          
          return {
            type: action.type,
            playerId: action.playerId,
            team: action.team,
            timestamp: action.timestamp,
            roundIndex: roundIndex
          };
        });

        const teamStats = {
          home: [
            calculatePlayerStats(homeFirstId, 'home', homeFirstName),
            calculatePlayerStats(homeSecondId, 'home', homeSecondName)
          ],
          away: [
            calculatePlayerStats(awayFirstId, 'away', awayFirstName),
            calculatePlayerStats(awaySecondId, 'away', awaySecondName)
          ],
          homeTotal: {
            hits: gameHistory.filter((a: any) => a.team==='home' && a.type==='hit').length,
            total: gameHistory.filter((a: any) => a.team==='home').length,
            percentage: (()=>{ const t = gameHistory.filter((a:any)=>a.team==='home').length; const h = gameHistory.filter((a:any)=>a.team==='home'&&a.type==='hit').length; return t>0?Math.round((h/t)*100):0; })()
          },
          awayTotal: {
            hits: gameHistory.filter((a: any) => a.team==='away' && a.type==='hit').length,
            total: gameHistory.filter((a: any) => a.team==='away').length,
            percentage: (()=>{ const t = gameHistory.filter((a:any)=>a.team==='away').length; const h = gameHistory.filter((a:any)=>a.team==='away'&&a.type==='hit').length; return t>0?Math.round((h/t)*100):0; })()
          },
          winner: null,
          // derive star flags from first 10 throws for both players
          starHome: (() => {
            const pf = gameHistory.filter((a:any)=>a.playerId===homeFirstId).slice(0,10);
            const ps = gameHistory.filter((a:any)=>a.playerId===homeSecondId).slice(0,10);
            return pf.length===10 && ps.length===10 && pf.every((a:any)=>a.type==='hit') && ps.every((a:any)=>a.type==='hit');
          })(),
          starAway: (() => {
            const pf = gameHistory.filter((a:any)=>a.playerId===awayFirstId).slice(0,10);
            const ps = gameHistory.filter((a:any)=>a.playerId===awaySecondId).slice(0,10);
            return pf.length===10 && ps.length===10 && pf.every((a:any)=>a.type==='hit') && ps.every((a:any)=>a.type==='hit');
          })()
        } as any;

        return (
          <div key={selectedMatchId} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0b1221] rounded-2xl border-2 border-[#ff5c1a] max-w-5xl w-full max-h-[90vh] overflow-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`${bebasNeue.className} text-2xl text-white`}>Élő követés</h3>
                <button onClick={() => setSelectedMatchId(null)} className="text-white/80 hover:text-white">Bezárás</button>
              </div>
              <GameStatsGrid teamStats={teamStats} throws={throwsMapped} className="w-full" />
            </div>
          </div>
        );
      })()}
    </div>
  );
}
