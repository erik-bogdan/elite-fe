"use client";

import { useState, useEffect, useCallback } from "react";
import { Bebas_Neue } from "next/font/google";
import { useParams, useRouter } from "next/navigation";
import { useFinishTrackingMutation, useStartTrackingMutation, useSyncTrackingMutation } from '@/lib/features/championship/championshipSlice';
import { FiArrowLeft, FiRotateCcw, FiTarget, FiX } from "react-icons/fi";
import { useGetMatchMetaQuery } from "@/lib/features/championship/championshipSlice";
import GameStatsGrid, { TeamStats, ThrowAction } from "@/components/GameStatsGrid";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

interface Player {
  id: string;
  label: string;
}

interface Team {
  name: string;
  players: Player[];
}

interface GameState {
  homeScore: number;
  awayScore: number;
  currentTurn: 'home' | 'away';
  phase: 'regular' | 'overtime' | 'return_serve';
  homeFirstPlayer: string;
  homeSecondPlayer: string;
  awayFirstPlayer: string;
  awaySecondPlayer: string;
  lastThrower: string | null;
  consecutiveThrows: number; // kept for UI hints; mirrors throwsInTurn
  returnServeCount: number;
  gameHistory: GameAction[];
  // Tracking state
  initThrowsCount: number; // 0 → none, 1 → home done, 2 → both done
  throwsInTurn: number; // 0,1,2 (bonus after 2 hits)
  hitsInTurn: number; // 0..2
  // Rebuttal (return serve) state
  rebuttalCupsToMake?: number;
  rebuttalMode?: 'gt3' | 'lte3' | 'onecup_double';
  rebuttalStep?: number; // 0..2 for <=3 mode
  rebuttalAttemptsLeft?: number; // for onecup_double
  rebuttalLastShooter?: string | null; // alternation within team
  exitTeam?: 'home' | 'away'; // who reached 10 first
  gameEnded?: boolean;
  // Overtime cup counters (0..3)
  otHome?: number;
  otAway?: number;
  // Overtime period tracking
  overtimePeriod?: number; // 1, 2, 3, etc.
  lastOvertimeThrower?: string | null; // tracks who threw last in overtime across periods
}

interface GameAction {
  type: 'hit' | 'miss';
  playerId: string;
  team: 'home' | 'away';
  timestamp: number;
}

export default function MatchTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;
  
  const { data: matchMeta } = useGetMatchMetaQuery(matchId, { skip: !matchId });
  
  const [gameState, setGameState] = useState<GameState>({
    homeScore: 0,
    awayScore: 0,
    currentTurn: 'home',
    phase: 'regular',
    homeFirstPlayer: '',
    homeSecondPlayer: '',
    awayFirstPlayer: '',
    awaySecondPlayer: '',
    lastThrower: null,
    consecutiveThrows: 0,
    returnServeCount: 0,
    gameHistory: [],
    initThrowsCount: 0,
    throwsInTurn: 0,
    hitsInTurn: 0,
    otHome: 0,
    otAway: 0,
    overtimePeriod: 0,
    lastOvertimeThrower: null
  });

  const [selectedPlayers, setSelectedPlayers] = useState({
    homeFirst: '',
    homeSecond: '',
    awayFirst: '',
    awaySecond: ''
  });

  const [setupComplete, setSetupComplete] = useState(false);
  const [showEndMatchModal, setShowEndMatchModal] = useState(false);
  const [mvpSelections, setMvpSelections] = useState({
    home: '',
    away: ''
  });

  // LocalStorage key for this match
  const localStorageKey = `match-${matchId}`;

  // RTK mutations for tracking sync
  const [startTracking] = useStartTrackingMutation();
  const [syncTracking] = useSyncTrackingMutation();
  const [finishTracking] = useFinishTrackingMutation();

  // Load from localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const savedData = localStorage.getItem(localStorageKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Check if data is not too old (24 hours)
        const isDataValid = Date.now() - parsedData.timestamp < 24 * 60 * 60 * 1000;
        
        if (isDataValid) {
          setGameState(parsedData.gameState);
          setSelectedPlayers(parsedData.selectedPlayers);
          setSetupComplete(parsedData.setupComplete);
          setMvpSelections(parsedData.mvpSelections);
          return true;
        } else {
          // Data is too old, remove it
          localStorage.removeItem(localStorageKey);
        }
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      localStorage.removeItem(localStorageKey);
    }
    return false;
  }, [localStorageKey]);

  // Save to localStorage
  const saveToLocalStorage = useCallback(() => {
    const dataToSave = {
      gameState,
      selectedPlayers,
      setupComplete,
      mvpSelections,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [gameState, selectedPlayers, setupComplete, mvpSelections, localStorageKey]);

  // Initialize players when match data loads (only if no localStorage data)
  useEffect(() => {
    if (matchMeta && !selectedPlayers.homeFirst && !setupComplete) {
      const homePlayers = matchMeta.homeTeam.players || [];
      const awayPlayers = matchMeta.awayTeam.players || [];
      
      setSelectedPlayers({
        homeFirst: homePlayers[0]?.id || '',
        homeSecond: homePlayers[1]?.id || '',
        awayFirst: awayPlayers[0]?.id || '',
        awaySecond: awayPlayers[1]?.id || ''
      });
      
      setGameState(prev => ({
        ...prev,
        homeFirstPlayer: homePlayers[0]?.id || '',
        homeSecondPlayer: homePlayers[1]?.id || '',
        awayFirstPlayer: awayPlayers[0]?.id || '',
        awaySecondPlayer: awayPlayers[1]?.id || ''
      }));
    }
  }, [matchMeta, setupComplete, selectedPlayers.homeFirst]);

  // Load from localStorage on component mount
  useEffect(() => {
    if (matchMeta) {
      const wasLoaded = loadFromLocalStorage();
      if (wasLoaded) {
        console.log('Game state restored from localStorage');
      } else {
        // Fallback: load last tracking snapshot from backend
        (async () => {
          try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}/api/matches/${matchId}`, { credentials: 'include' });
            if (!resp.ok) return;
            const data = await resp.json();
            const trackingData = data?.match?.trackingData || data?.trackingData;
            if (trackingData && trackingData.gameState && trackingData.selectedPlayers) {
              setGameState(trackingData.gameState);
              setSelectedPlayers(trackingData.selectedPlayers);
              setSetupComplete(Boolean(trackingData.setupComplete));
              if (trackingData.homeTeam?.mvp || trackingData.awayTeam?.mvp) {
                setMvpSelections({
                  home: trackingData.homeTeam?.mvp || '',
                  away: trackingData.awayTeam?.mvp || ''
                });
              }
              console.log('Game state restored from backend tracking snapshot');
            }
          } catch (err) {
            console.error('Failed to load tracking from backend:', err);
          }
        })();
      }
    }
  }, [matchMeta, loadFromLocalStorage, matchId]);

  // Auto-save to localStorage whenever game state changes
  useEffect(() => {
    if (setupComplete) {
      saveToLocalStorage();
    }
  }, [gameState, selectedPlayers, setupComplete, mvpSelections, saveToLocalStorage]);

  const getPlayerName = useCallback((playerId: string, team: 'home' | 'away') => {
    const players: Player[] | undefined = team === 'home' ? matchMeta?.homeTeam.players : matchMeta?.awayTeam.players;
    return players?.find((p: Player) => p.id === playerId)?.label || playerId;
  }, [matchMeta]);

  const handleThrow = (type: 'hit' | 'miss', playerId: string) => {
    const team = gameState.currentTurn;
    const isHome = team === 'home';
    
    const action: GameAction = {
      type,
      playerId,
      team,
      timestamp: Date.now()
    };

    setGameState(prev => {
      const newHistory = [...prev.gameHistory, action];
      let newHomeScore = prev.homeScore;
      let newAwayScore = prev.awayScore;
      let newPhase = prev.phase;
      let newCurrentTurn = prev.currentTurn;
      let newLastThrower = playerId;
      let newConsecutiveThrows = prev.consecutiveThrows;
      let newReturnServeCount = prev.returnServeCount;
      let newInitThrows = prev.initThrowsCount;
      let newThrowsInTurn = prev.throwsInTurn;
      let newHitsInTurn = prev.hitsInTurn;
      let newRebuttalStep = (prev.rebuttalStep || 0);
      let newRebuttalAttemptsLeft = prev.rebuttalAttemptsLeft;
      let newRebuttalLastShooter = prev.rebuttalLastShooter || null;
      let newGameEnded = prev.gameEnded || false;
      let newOtHome = prev.otHome ?? 0;
      let newOtAway = prev.otAway ?? 0;
      let newOvertimePeriod = prev.overtimePeriod ?? 0;
      let newLastOvertimeThrower = prev.lastOvertimeThrower || null;

      // 1) Starting sequence: exactly one throw for HOME only, then AWAY starts a full normal turn
      if (prev.phase === 'regular' && newInitThrows === 0) {
        if (type === 'hit') {
          if (isHome) newHomeScore++; else newAwayScore++;
        }
        // switch to the other team after this single throw
        newLastThrower = playerId;
        newConsecutiveThrows = 0;
        newThrowsInTurn = 0;
        newHitsInTurn = 0;
        newInitThrows = 1; // start completed
        // After start, set turn to AWAY to begin their normal 2-shot turn
        newCurrentTurn = 'away';
      } else {
        // 2) Return serve handling
        if (prev.phase === 'return_serve') {
          if (prev.rebuttalMode === 'gt3') {
            if (type === 'miss') {
              newGameEnded = true;
            } else {
              // In return serve, we're adding to the base score (10) to get 11, 12, 13, etc.
              if (isHome) newHomeScore = newHomeScore + 1; else newAwayScore = newAwayScore + 1;
              const remaining = Math.max((prev.rebuttalCupsToMake || 0) - 1, 0);
              newReturnServeCount = remaining;
              // persist remaining in state
              // update rebuttal remaining
              // handled at return state merge below
              newRebuttalLastShooter = playerId;
              if (remaining <= 0) {
                newPhase = 'overtime';
                newCurrentTurn = prev.exitTeam || 'home';
                // Reset turn state for normal OT turn (2 throws + bonus)
                newThrowsInTurn = 0;
                newHitsInTurn = 0;
                newConsecutiveThrows = 0;
                // Increment overtime period when returning from return serve
                newOvertimePeriod = (prev.overtimePeriod || 0) + 1;
              }
            }
            newConsecutiveThrows = 0; newThrowsInTurn = 0; newHitsInTurn = 0;
          } else if (prev.rebuttalMode === 'lte3') {
            if (type === 'miss') {
              newGameEnded = true;
            } else {
              // In return serve, we're adding to the base score (10) to get 11, 12, 13, etc.
              if (isHome) newHomeScore = newHomeScore + 1; else newAwayScore = newAwayScore + 1;
              const remaining = Math.max((prev.rebuttalCupsToMake || 0) - 1, 0);
              newReturnServeCount = remaining;
              newRebuttalStep = (prev.rebuttalStep || 0) + 1;
              newRebuttalLastShooter = playerId;
              if (remaining <= 0) {
                newPhase = 'overtime';
                newCurrentTurn = prev.exitTeam || 'home';
                // Reset turn state for normal OT turn (2 throws + bonus)
                newThrowsInTurn = 0;
                newHitsInTurn = 0;
                newConsecutiveThrows = 0;
                // Increment overtime period when returning from return serve
                newOvertimePeriod = (prev.overtimePeriod || 0) + 1;
              }
            }
            newConsecutiveThrows = 0; newThrowsInTurn = 0; newHitsInTurn = 0;
          } else if (prev.rebuttalMode === 'onecup_double') {
            if (type === 'hit') {
              // In return serve, we're adding to the base score (10) to get 11, 12, 13, etc.
              if (isHome) newHomeScore = newHomeScore + 1; else newAwayScore = newAwayScore + 1;
              newPhase = 'overtime';
              newCurrentTurn = prev.exitTeam || 'home';
              // Reset turn state for normal OT turn (2 throws + bonus)
              newThrowsInTurn = 0;
              newHitsInTurn = 0;
              newConsecutiveThrows = 0;
              // Increment overtime period when returning from return serve
              newOvertimePeriod = (prev.overtimePeriod || 0) + 1;
            } else {
              // Robust attempts tracking across undo/redo cycles
              const attemptsBefore = (prev.rebuttalAttemptsLeft ?? (prev.rebuttalLastShooter ? 1 : 2));
              const left = attemptsBefore - 1;
              newRebuttalAttemptsLeft = left;
              // Only set the last shooter on the FIRST attempt; keep it for the second
              if (attemptsBefore >= 2 && !prev.rebuttalLastShooter) {
                newRebuttalLastShooter = playerId;
              } else {
                newRebuttalLastShooter = prev.rebuttalLastShooter || playerId;
              }
              if (left <= 0) newGameEnded = true;
            }
            newConsecutiveThrows = 0; newThrowsInTurn = 0; newHitsInTurn = 0;
          }
        } else if (prev.phase === 'overtime') {
          // Overtime: same rules as regular but counting up to 3 cups
          if (type === 'hit') {
            if (isHome) {
              newOtHome = newOtHome + 1;
            } else {
              newOtAway = newOtAway + 1;
            }
            newHitsInTurn = prev.hitsInTurn + 1;
            newThrowsInTurn = prev.throwsInTurn + 1;
            newConsecutiveThrows = newThrowsInTurn;
            newLastThrower = playerId;
            newLastOvertimeThrower = playerId;
            // Track the last thrower in overtime for player alternation
            if (prev.overtimePeriod && prev.overtimePeriod > 0) {
              // We're in an overtime period, track the thrower
            } else {
              // First time entering overtime, initialize period
              newOvertimePeriod = 1;
            }
          } else {
            // miss in overtime
            newThrowsInTurn = prev.throwsInTurn + 1;
            newConsecutiveThrows = newThrowsInTurn;
          }
          // capture which throw sealed the exit (1=first, 2=second, 3=bonus)
          const exitThrowNumberInOt = newThrowsInTurn; 
          if (newThrowsInTurn === 1) {
            newCurrentTurn = prev.currentTurn;
          } else if (newThrowsInTurn === 2) {
            if (newHitsInTurn === 2) {
              // allow third bonus
            } else {
              newCurrentTurn = isHome ? 'away' : 'home';
              newThrowsInTurn = 0; newHitsInTurn = 0; newConsecutiveThrows = 0;
            }
          } else if (newThrowsInTurn === 3) {
            newCurrentTurn = isHome ? 'away' : 'home';
            newThrowsInTurn = 0; newHitsInTurn = 0; newConsecutiveThrows = 0;
          }

          // if a team reached 3 cups in OT → start rebuttal
          const otHome = newOtHome;
          const otAway = newOtAway;
          if (otHome >= 3 && otAway < 3) {
            const cupsToMake = Math.max(3 - otAway, 0);
            const mode = cupsToMake === 1 && exitThrowNumberInOt > 1 ? 'onecup_double' : 'lte3';
            const attemptsLeft = mode === 'onecup_double' ? 2 : undefined;
            return {
              ...prev,
              phase: 'return_serve',
              currentTurn: 'away',
              exitTeam: 'home',
              rebuttalMode: mode,
              rebuttalCupsToMake: cupsToMake,
              rebuttalStep: 0,
              rebuttalAttemptsLeft: attemptsLeft,
              consecutiveThrows: 0,
              throwsInTurn: 0,
              hitsInTurn: 0,
              homeScore: prev.homeScore + otHome,
              awayScore: prev.awayScore + otAway,
              otHome: 0,
              otAway: 0,
              overtimePeriod: newOvertimePeriod,
              lastOvertimeThrower: newLastOvertimeThrower,
              gameHistory: newHistory,
            } as GameState;
          }
          if (otAway >= 3 && otHome < 3) {
            const cupsToMake = Math.max(3 - otHome, 0);
            const mode = cupsToMake === 1 && exitThrowNumberInOt > 1 ? 'onecup_double' : 'lte3';
            const attemptsLeft = mode === 'onecup_double' ? 2 : undefined;
            return {
              ...prev,
              phase: 'return_serve',
              currentTurn: 'home',
              exitTeam: 'away',
              rebuttalMode: mode,
              rebuttalCupsToMake: cupsToMake,
              rebuttalStep: 0,
              rebuttalAttemptsLeft: attemptsLeft,
              consecutiveThrows: 0,
              throwsInTurn: 0,
              hitsInTurn: 0,
              homeScore: prev.homeScore + otHome,
              awayScore: prev.awayScore + otAway,
              otHome: 0,
              otAway: 0,
              overtimePeriod: newOvertimePeriod,
              lastOvertimeThrower: newLastOvertimeThrower,
              gameHistory: newHistory,
            } as GameState;
          }
        } else {
          // 3) Regular turns (after starting sequence)
          if (type === 'hit') {
            if (isHome) newHomeScore++; else newAwayScore++;
            newHitsInTurn += 1;
          }
          newThrowsInTurn += 1;
          newConsecutiveThrows = newThrowsInTurn;

          // First throw → stay on same team; next throw must be the other player (handled in UI by lastThrower)
          if (newThrowsInTurn === 1) {
            // remain same team for second throw regardless of hit/miss
            newCurrentTurn = prev.currentTurn;
          } else if (newThrowsInTurn === 2) {
            // After second throw: check bonus eligibility
            if (newHitsInTurn === 2 && type === 'hit') {
              // allow one bonus throw
              // keep team; reset throwsInTurn to represent bonus state as 2 (we'll check hitsInTurn===2)
            } else {
              // end turn (at least one miss or second was processed without two hits)
              newCurrentTurn = isHome ? 'away' : 'home';
              newThrowsInTurn = 0;
              newHitsInTurn = 0;
              newConsecutiveThrows = 0;
            }
          } else if (newThrowsInTurn === 3) {
            // Bonus throw consumed → switch turn
            newCurrentTurn = isHome ? 'away' : 'home';
            newThrowsInTurn = 0;
            newHitsInTurn = 0;
            newConsecutiveThrows = 0;
          }
        }
      }

      // Transition to rebuttal (return serve) immediately when one team reaches 10 and the other is below 10
      if (newPhase === 'regular') {
        if (newHomeScore >= 10 && newAwayScore < 10) {
          const need = 10 - newAwayScore;
          const exitThrowNumber = prev.throwsInTurn + 1; // 1/2/3
          let mode: 'gt3' | 'lte3' | 'onecup_double' = need > 3 ? 'gt3' : 'lte3';
          let attemptsLeft: number | undefined = undefined;
          if (need === 1 && exitThrowNumber > 1) {
            mode = 'onecup_double';
            attemptsLeft = 2;
          }
          return {
            ...prev,
            homeScore: newHomeScore,
            awayScore: newAwayScore,
            phase: 'return_serve',
            currentTurn: 'away',
            exitTeam: 'home',
            rebuttalCupsToMake: need,
            rebuttalMode: mode,
            rebuttalStep: 0,
            rebuttalAttemptsLeft: attemptsLeft,
            returnServeCount: need,
            rebuttalLastShooter: null,
            consecutiveThrows: 0,
            throwsInTurn: 0,
            hitsInTurn: 0,
            gameHistory: newHistory,
          };
        } else if (newAwayScore >= 10 && newHomeScore < 10) {
          const need = 10 - newHomeScore;
          const exitThrowNumber = prev.throwsInTurn + 1;
          let mode: 'gt3' | 'lte3' | 'onecup_double' = need > 3 ? 'gt3' : 'lte3';
          let attemptsLeft: number | undefined = undefined;
          if (need === 1 && exitThrowNumber > 1) {
            mode = 'onecup_double';
            attemptsLeft = 2;
          }
          return {
            ...prev,
            homeScore: newHomeScore,
            awayScore: newAwayScore,
            phase: 'return_serve',
            currentTurn: 'home',
            exitTeam: 'away',
            rebuttalCupsToMake: need,
            rebuttalMode: mode,
            rebuttalStep: 0,
            rebuttalAttemptsLeft: attemptsLeft,
            returnServeCount: need,
            rebuttalLastShooter: null,
            consecutiveThrows: 0,
            throwsInTurn: 0,
            hitsInTurn: 0,
            gameHistory: newHistory,
          };
        }
      }

      // Check for overtime start when both sides reached 10
      if (newPhase === 'regular' && newHomeScore >= 10 && newAwayScore >= 10) {
        newPhase = 'overtime';
      }

      return {
        ...prev,
        homeScore: newHomeScore,
        awayScore: newAwayScore,
        currentTurn: newCurrentTurn,
        phase: newPhase,
        lastThrower: newLastThrower,
        consecutiveThrows: newConsecutiveThrows,
        returnServeCount: newReturnServeCount,
        gameHistory: newHistory,
        initThrowsCount: newInitThrows,
        throwsInTurn: newThrowsInTurn,
        hitsInTurn: newHitsInTurn,
        rebuttalStep: newRebuttalStep,
        rebuttalAttemptsLeft: newRebuttalAttemptsLeft,
        rebuttalLastShooter: newRebuttalLastShooter,
        rebuttalCupsToMake: newReturnServeCount ?? prev.rebuttalCupsToMake,
        gameEnded: newGameEnded,
        otHome: newOtHome,
        otAway: newOtAway,
        overtimePeriod: newOvertimePeriod,
        lastOvertimeThrower: newLastOvertimeThrower
      };
    });
  };

  // Recompute full state from history (used by undo)
  const recomputeFromHistory = (actions: GameAction[]): GameState => {
    let state: GameState = {
      homeScore: 0,
      awayScore: 0,
      currentTurn: 'home',
      phase: 'regular',
      homeFirstPlayer: gameState.homeFirstPlayer,
      homeSecondPlayer: gameState.homeSecondPlayer,
      awayFirstPlayer: gameState.awayFirstPlayer,
      awaySecondPlayer: gameState.awaySecondPlayer,
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

    const apply = (prev: GameState, action: GameAction): GameState => {
      if (prev.gameEnded) return prev;
      const isHome = action.team === 'home';
      // Clone
      let s = { ...prev } as GameState;
      s.gameHistory = [...s.gameHistory, action];

      // Starting sequence
      if (s.phase === 'regular' && s.initThrowsCount === 0) {
        if (action.type === 'hit') {
          if (isHome) s.homeScore++; else s.awayScore++;
        }
        s.lastThrower = action.playerId;
        s.consecutiveThrows = 0;
        s.throwsInTurn = 0;
        s.hitsInTurn = 0;
        s.initThrowsCount = 1;
        s.currentTurn = 'away';
      } else if (s.phase === 'return_serve') {
        // return serve
        if (s.rebuttalMode === 'gt3') {
          if (action.type === 'miss') {
            s.gameEnded = true;
          } else {
            if (isHome) s.homeScore = s.homeScore + 1; else s.awayScore = s.awayScore + 1;
            const remaining = Math.max((s.rebuttalCupsToMake || 0) - 1, 0);
            s.rebuttalCupsToMake = remaining;
            s.returnServeCount = remaining;
            s.rebuttalLastShooter = action.playerId;
            if (remaining <= 0) {
              s.phase = 'overtime';
              s.currentTurn = s.exitTeam || 'home';
              // Increment overtime period when returning from return serve
              s.overtimePeriod = (s.overtimePeriod || 0) + 1;
            }
          }
          s.consecutiveThrows = 0; s.throwsInTurn = 0; s.hitsInTurn = 0;
          s.lastThrower = action.playerId;
      } else if (s.rebuttalMode === 'lte3') {
          if (action.type === 'miss') {
            s.gameEnded = true;
          } else {
            if (isHome) s.homeScore = s.homeScore + 1; else s.awayScore = s.awayScore + 1;
            const remaining = Math.max((s.rebuttalCupsToMake || 0) - 1, 0);
            s.rebuttalCupsToMake = remaining;
            s.returnServeCount = remaining;
            s.rebuttalStep = (s.rebuttalStep || 0) + 1;
            s.rebuttalLastShooter = action.playerId;
            if (remaining <= 0) {
              s.phase = 'overtime';
              s.currentTurn = s.exitTeam || 'home';
              // Increment overtime period when returning from return serve
              s.overtimePeriod = (s.overtimePeriod || 0) + 1;
            }
          }
          s.consecutiveThrows = 0; s.throwsInTurn = 0; s.hitsInTurn = 0;
          s.lastThrower = action.playerId;
      } else if (s.rebuttalMode === 'onecup_double') {
          if (action.type === 'hit') {
            if (isHome) s.homeScore = s.homeScore + 1; else s.awayScore = s.awayScore + 1;
            s.phase = 'overtime';
            s.currentTurn = s.exitTeam || 'home';
            // Increment overtime period when returning from return serve
            s.overtimePeriod = (s.overtimePeriod || 0) + 1;
          } else {
            const left = (s.rebuttalAttemptsLeft || 0) - 1;
            s.rebuttalAttemptsLeft = left;
            // Track who threw the first attempt so the second must be the other player
            s.rebuttalLastShooter = action.playerId;
            if (left <= 0) s.gameEnded = true;
          }
          s.consecutiveThrows = 0; s.throwsInTurn = 0; s.hitsInTurn = 0;
          s.lastThrower = action.playerId;
      }
      } else if (s.phase === 'overtime') {
        // Overtime logic
        if (action.type === 'hit') {
          if (isHome) {
            s.otHome = (s.otHome || 0) + 1;
          } else {
            s.otAway = (s.otAway || 0) + 1;
          }
          s.hitsInTurn += 1;
        }
        s.throwsInTurn += 1;
        s.consecutiveThrows = s.throwsInTurn;
        s.lastThrower = action.playerId;
        s.lastOvertimeThrower = action.playerId;
        
        // Initialize overtime period if not set
        if (!s.overtimePeriod || s.overtimePeriod === 0) {
          s.overtimePeriod = 1;
        }

        // Capture the throw number BEFORE any potential reset
        const exitThrowNumberInOt = s.throwsInTurn;

        if (s.throwsInTurn === 1) {
          s.currentTurn = s.currentTurn; // stay
        } else if (s.throwsInTurn === 2) {
          if (s.hitsInTurn === 2 && action.type === 'hit') {
            // allow bonus
          } else {
            s.currentTurn = isHome ? 'away' : 'home';
            s.throwsInTurn = 0; s.hitsInTurn = 0; s.consecutiveThrows = 0;
          }
        } else if (s.throwsInTurn === 3) {
          s.currentTurn = isHome ? 'away' : 'home';
          s.throwsInTurn = 0; s.hitsInTurn = 0; s.consecutiveThrows = 0;
        }

        // Check if a team reached 3 cups in OT → start rebuttal
        const otHome = s.otHome || 0;
        const otAway = s.otAway || 0;
        if (otHome >= 3 && otAway < 3) {
          const cupsToMake = Math.max(3 - otAway, 0);
          const mode = cupsToMake === 1 && exitThrowNumberInOt > 1 ? 'onecup_double' : 'lte3';
          const attemptsLeft = mode === 'onecup_double' ? 2 : undefined;
          
          s.phase = 'return_serve';
          s.currentTurn = 'away';
          s.exitTeam = 'home';
          s.rebuttalMode = mode;
          s.rebuttalCupsToMake = cupsToMake;
          s.rebuttalStep = 0;
          s.rebuttalAttemptsLeft = attemptsLeft;
          s.rebuttalLastShooter = null;
          s.consecutiveThrows = 0; s.throwsInTurn = 0; s.hitsInTurn = 0;
          // Fold current OT counters into base score when leaving OT
          s.homeScore = s.homeScore + otHome;
          s.awayScore = s.awayScore + otAway;
          s.otHome = 0;
          s.otAway = 0;
          // Preserve overtime period and last thrower for next overtime
          // s.overtimePeriod and s.lastOvertimeThrower are preserved
        } else if (otAway >= 3 && otHome < 3) {
          const cupsToMake = Math.max(3 - otHome, 0);
          const mode = cupsToMake === 1 && exitThrowNumberInOt > 1 ? 'onecup_double' : 'lte3';
          const attemptsLeft = mode === 'onecup_double' ? 2 : undefined;
          
          s.phase = 'return_serve';
          s.currentTurn = 'home';
          s.exitTeam = 'away';
          s.rebuttalMode = mode;
          s.rebuttalCupsToMake = cupsToMake;
          s.rebuttalStep = 0;
          s.rebuttalAttemptsLeft = attemptsLeft;
          s.rebuttalLastShooter = null;
          s.consecutiveThrows = 0; s.throwsInTurn = 0; s.hitsInTurn = 0;
          s.homeScore = s.homeScore + otHome;
          s.awayScore = s.awayScore + otAway;
          s.otHome = 0;
          s.otAway = 0;
          // Preserve overtime period and last thrower for next overtime
          // s.overtimePeriod and s.lastOvertimeThrower are preserved
        }
      } else {
        // regular
        if (action.type === 'hit') {
          if (isHome) s.homeScore++; else s.awayScore++;
          s.hitsInTurn += 1;
        }
        s.throwsInTurn += 1;
        // Capture throw count after this throw, BEFORE any potential reset below
        const exitThrowNumberAfterThisThrow = s.throwsInTurn; // 1,2,3
        s.consecutiveThrows = s.throwsInTurn;
        s.lastThrower = action.playerId;

        if (s.throwsInTurn === 1) {
          s.currentTurn = s.currentTurn; // stay
        } else if (s.throwsInTurn === 2) {
          if (s.hitsInTurn === 2 && action.type === 'hit') {
            // allow bonus
          } else {
            s.currentTurn = isHome ? 'away' : 'home';
            s.throwsInTurn = 0; s.hitsInTurn = 0; s.consecutiveThrows = 0;
          }
        } else if (s.throwsInTurn === 3) {
          s.currentTurn = isHome ? 'away' : 'home';
          s.throwsInTurn = 0; s.hitsInTurn = 0; s.consecutiveThrows = 0;
        }

        // move to return serve when one side reaches 10 and the other is below 10
        if (s.phase === 'regular') {
          if (s.homeScore >= 10 && s.awayScore < 10) {
            const need = 10 - s.awayScore;
            const exitThrowNumber = exitThrowNumberAfterThisThrow;
            let mode: 'gt3' | 'lte3' | 'onecup_double' = need > 3 ? 'gt3' : 'lte3';
            let attemptsLeft: number | undefined = undefined;
            if (need === 1 && exitThrowNumber > 1) { mode = 'onecup_double'; attemptsLeft = 2; }
            s.phase = 'return_serve';
            s.currentTurn = 'away';
            s.exitTeam = 'home';
            s.rebuttalCupsToMake = need;
            s.rebuttalMode = mode;
            s.rebuttalStep = 0;
            s.rebuttalAttemptsLeft = attemptsLeft;
            s.rebuttalLastShooter = null;
            s.consecutiveThrows = 0; s.throwsInTurn = 0; s.hitsInTurn = 0;
          } else if (s.awayScore >= 10 && s.homeScore < 10) {
            const need = 10 - s.homeScore;
            const exitThrowNumber = exitThrowNumberAfterThisThrow;
            let mode: 'gt3' | 'lte3' | 'onecup_double' = need > 3 ? 'gt3' : 'lte3';
            let attemptsLeft: number | undefined = undefined;
            if (need === 1 && exitThrowNumber > 1) { mode = 'onecup_double'; attemptsLeft = 2; }
            s.phase = 'return_serve';
            s.currentTurn = 'home';
            s.exitTeam = 'away';
            s.rebuttalCupsToMake = need;
            s.rebuttalMode = mode;
            s.rebuttalStep = 0;
            s.rebuttalAttemptsLeft = attemptsLeft;
            s.rebuttalLastShooter = null;
            s.consecutiveThrows = 0; s.throwsInTurn = 0; s.hitsInTurn = 0;
          }
        }

        if (s.phase === 'regular' && s.homeScore >= 10 && s.awayScore >= 10) {
          s.phase = 'overtime';
          s.overtimePeriod = 1;
        }
      }

      return s;
    };

    actions.forEach(a => { state = apply(state, a); });
    return state;
  };

  const undoLastAction = () => {
    setGameState(prev => {
      if (prev.gameHistory.length === 0) return prev;
      
      const newHistory = prev.gameHistory.slice(0, -1);
      const recomputed = recomputeFromHistory(newHistory);
      
      console.log('Undo - recomputed state:', {
        phase: recomputed.phase,
        rebuttalMode: recomputed.rebuttalMode,
        rebuttalAttemptsLeft: recomputed.rebuttalAttemptsLeft,
        rebuttalLastShooter: recomputed.rebuttalLastShooter,
        gameEnded: recomputed.gameEnded
      });
      
      return { ...recomputed, gameHistory: newHistory };
    });
  };

  // Build rounds from game history
  type Round = {
    team: 'home' | 'away';
    phase: 'regular' | 'overtime' | 'return_serve';
    throws: GameAction[];
    roundIndex: number;
  };

  const buildRounds = (): Round[] => {
    const rounds: Round[] = [];
    let currentRound: Round | null = null;

    for (let i = 0; i < gameState.gameHistory.length; i++) {
      const action = gameState.gameHistory[i];

      // State BEFORE this action
      let stateBefore: GameState;
      try {
        stateBefore = recomputeFromHistory(gameState.gameHistory.slice(0, i));
      } catch (_) {
        stateBefore = { ...gameState } as GameState;
      }

      // State AFTER this action
      let stateAfter: GameState;
      try {
        stateAfter = recomputeFromHistory(gameState.gameHistory.slice(0, i + 1));
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

  // Get throws for a specific player in a specific round
  const getPlayerThrowsInRound = (playerId: string, round: Round): GameAction[] => {
    return round.throws.filter(action => action.playerId === playerId);
  };

  // Check if first 10 throws were perfect for a player
  const isFirst10ThrowsPerfect = (playerId: string): boolean => {
    const playerThrows = gameState.gameHistory.filter(action => action.playerId === playerId);
    const first10Throws = playerThrows.slice(0, 10);
    
    // Must have exactly 10 throws and all must be hits
    return first10Throws.length === 10 && first10Throws.every(throw_ => throw_.type === 'hit');
  };

  // Calculate player statistics
  const calculatePlayerStats = (playerId: string) => {
    const playerThrows = gameState.gameHistory.filter(action => action.playerId === playerId);
    const hits = playerThrows.filter(action => action.type === 'hit').length;
    const total = playerThrows.length;
    const percentage = total > 0 ? Math.round((hits / total) * 100) : 0;
    
    return {
      id: playerId,
      name: getPlayerName(playerId, playerId === selectedPlayers.homeFirst || playerId === selectedPlayers.homeSecond ? 'home' : 'away'),
      hits,
      total,
      percentage,
      isFirst10Perfect: isFirst10ThrowsPerfect(playerId)
    };
  };

  const handleSetupComplete = () => {
    if (selectedPlayers.homeFirst && selectedPlayers.homeSecond && selectedPlayers.awayFirst && selectedPlayers.awaySecond) {
      setGameState(prev => ({
        ...prev,
        homeFirstPlayer: selectedPlayers.homeFirst,
        homeSecondPlayer: selectedPlayers.homeSecond,
        awayFirstPlayer: selectedPlayers.awayFirst,
        awaySecondPlayer: selectedPlayers.awaySecond
      }));
      setSetupComplete(true);

      // Kick off tracking in backend
      startTracking({ id: matchId }).catch(err => console.error('Failed to start tracking:', err));
    }
  };

  const handleEndMatch = () => {
    setShowEndMatchModal(true);
  };

  const getMvpSuggestion = (team: 'home' | 'away') => {
    const firstPlayerId = team === 'home' ? selectedPlayers.homeFirst : selectedPlayers.awayFirst;
    const secondPlayerId = team === 'home' ? selectedPlayers.homeSecond : selectedPlayers.awaySecond;
    
    const firstPlayerStats = calculatePlayerStats(firstPlayerId);
    const secondPlayerStats = calculatePlayerStats(secondPlayerId);
    
    // Calculate weighted score: hits + (percentage * 0.1) + (total throws * 0.05)
    const firstPlayerScore = firstPlayerStats.hits + (firstPlayerStats.percentage * 0.1) + (firstPlayerStats.total * 0.05);
    const secondPlayerScore = secondPlayerStats.hits + (secondPlayerStats.percentage * 0.1) + (secondPlayerStats.total * 0.05);
    
    return firstPlayerScore >= secondPlayerScore ? firstPlayerId : secondPlayerId;
  };

  const handleMvpSelection = (team: 'home' | 'away', playerId: string) => {
    setMvpSelections(prev => ({
      ...prev,
      [team]: playerId
    }));
  };

  // Build tracking payload (same shape as result submit, reused for sync)
  const buildTrackingPayload = useCallback(() => {
    return {
      matchId: matchId,
      homeTeam: {
        name: matchMeta?.homeTeam.name,
        players: [
          { id: selectedPlayers.homeFirst, name: getPlayerName(selectedPlayers.homeFirst, 'home') },
          { id: selectedPlayers.homeSecond, name: getPlayerName(selectedPlayers.homeSecond, 'home') }
        ],
        score: gameState.phase === 'overtime' ? (gameState.homeScore + (gameState.otHome ?? 0)) : gameState.homeScore,
        mvp: mvpSelections.home
      },
      awayTeam: {
        name: matchMeta?.awayTeam.name,
        players: [
          { id: selectedPlayers.awayFirst, name: getPlayerName(selectedPlayers.awayFirst, 'away') },
          { id: selectedPlayers.awaySecond, name: getPlayerName(selectedPlayers.awaySecond, 'away') }
        ],
        score: gameState.phase === 'overtime' ? (gameState.awayScore + (gameState.otAway ?? 0)) : gameState.awayScore,
        mvp: mvpSelections.away
      },
      gameHistory: gameState.gameHistory.map(action => ({
        type: action.type,
        playerId: action.playerId,
        playerName: getPlayerName(action.playerId, action.team),
        team: action.team,
        timestamp: action.timestamp
      })),
      gameState: {
        phase: gameState.phase,
        currentTurn: gameState.currentTurn,
        homeScore: gameState.homeScore,
        awayScore: gameState.awayScore,
        otHome: gameState.otHome,
        otAway: gameState.otAway,
        gameEnded: gameState.gameEnded,
        returnServeCount: gameState.returnServeCount,
        consecutiveThrows: gameState.consecutiveThrows,
        throwsInTurn: gameState.throwsInTurn,
        hitsInTurn: gameState.hitsInTurn,
        initThrowsCount: gameState.initThrowsCount,
        overtimePeriod: gameState.overtimePeriod,
        lastThrower: gameState.lastThrower,
        lastOvertimeThrower: gameState.lastOvertimeThrower,
        rebuttalCupsToMake: gameState.rebuttalCupsToMake,
        rebuttalMode: gameState.rebuttalMode,
        rebuttalStep: gameState.rebuttalStep,
        rebuttalAttemptsLeft: gameState.rebuttalAttemptsLeft,
        rebuttalLastShooter: gameState.rebuttalLastShooter,
        exitTeam: gameState.exitTeam
      },
      selectedPlayers: selectedPlayers,
      setupComplete: setupComplete,
      endTimestamp: Date.now()
    };
  }, [matchId, matchMeta, selectedPlayers, gameState, mvpSelections, setupComplete, getPlayerName]);

  // Sync tracking to backend on every interaction while tracking is active
  useEffect(() => {
    if (!setupComplete) return;
    const payload = buildTrackingPayload();
    syncTracking({ id: matchId, trackingData: payload }).catch(err => console.error('Sync tracking failed:', err));
  }, [gameState, selectedPlayers, setupComplete, buildTrackingPayload, matchId, syncTracking]);

  // Clear localStorage
  const clearLocalStorage = () => {
    try {
      localStorage.removeItem(localStorageKey);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };

  // Helper function to get valid rounds excluding starting throw
  const getValidRoundsForTeam = (team: 'home' | 'away') => {
    const rounds = buildRounds();
    const teamRounds = rounds.filter(round => round.throws.some(t => t.team === team));
    
    // Check which team started the game
    const teamStarted = gameState.gameHistory.length > 0 && gameState.gameHistory[0].team === team;
    
    // Find the starting throw round (the first round that contains only 1 throw from the starting team)
    const startingRoundIndex = teamRounds.findIndex(round => {
      const teamThrows = round.throws.filter(t => t.team === team);
      return teamStarted && teamThrows.length === 1;
    });
    
    // Filter out the starting throw round
    return teamRounds.filter((round, index) => {
      return index !== startingRoundIndex;
    });
  };

  const handleSubmitMatchResult = async () => {
    // Check if MVP is selected for both teams
    if (!mvpSelections.home || !mvpSelections.away) {
      alert('Kérlek válassz MVP-t mindkét csapatból!');
      return;
    }

    // Prepare match data for storage
    const matchData = {
      matchId: matchId,
      homeTeam: {
        name: matchMeta?.homeTeam.name,
        players: [
          {
            id: selectedPlayers.homeFirst,
            name: getPlayerName(selectedPlayers.homeFirst, 'home')
          },
          {
            id: selectedPlayers.homeSecond,
            name: getPlayerName(selectedPlayers.homeSecond, 'home')
          }
        ],
        score: gameState.phase === 'overtime' ? (gameState.homeScore + (gameState.otHome ?? 0)) : gameState.homeScore,
        mvp: mvpSelections.home
      },
      awayTeam: {
        name: matchMeta?.awayTeam.name,
        players: [
          {
            id: selectedPlayers.awayFirst,
            name: getPlayerName(selectedPlayers.awayFirst, 'away')
          },
          {
            id: selectedPlayers.awaySecond,
            name: getPlayerName(selectedPlayers.awaySecond, 'away')
          }
        ],
        score: gameState.phase === 'overtime' ? (gameState.awayScore + (gameState.otAway ?? 0)) : gameState.awayScore,
        mvp: mvpSelections.away
      },
      gameHistory: gameState.gameHistory.map(action => ({
        type: action.type,
        playerId: action.playerId,
        playerName: getPlayerName(action.playerId, action.team),
        team: action.team,
        timestamp: action.timestamp
      })),
      gameState: {
        phase: gameState.phase,
        currentTurn: gameState.currentTurn,
        homeScore: gameState.homeScore,
        awayScore: gameState.awayScore,
        otHome: gameState.otHome,
        otAway: gameState.otAway,
        gameEnded: gameState.gameEnded,
        returnServeCount: gameState.returnServeCount,
        consecutiveThrows: gameState.consecutiveThrows,
        throwsInTurn: gameState.throwsInTurn,
        hitsInTurn: gameState.hitsInTurn,
        initThrowsCount: gameState.initThrowsCount,
        overtimePeriod: gameState.overtimePeriod,
        lastThrower: gameState.lastThrower,
        lastOvertimeThrower: gameState.lastOvertimeThrower,
        rebuttalCupsToMake: gameState.rebuttalCupsToMake,
        rebuttalMode: gameState.rebuttalMode,
        rebuttalStep: gameState.rebuttalStep,
        rebuttalAttemptsLeft: gameState.rebuttalAttemptsLeft,
        rebuttalLastShooter: gameState.rebuttalLastShooter,
        exitTeam: gameState.exitTeam
      },
      selectedPlayers: selectedPlayers,
      setupComplete: setupComplete,
      endTimestamp: Date.now()
    };

    // Console log the match data
    console.log('Match Data for Storage:', JSON.stringify(matchData, null, 2));

    try {
      // Mark tracking finished (sets tracking_active=2 and finished_at)
      await finishTracking({ id: matchId, trackingData: matchData }).catch(e => console.error('Failed to finish tracking flag:', e));

      // Send final result to backend API
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}/api/matches/${matchId}/result`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeTeamScore: matchData.homeTeam.score,
          awayTeamScore: matchData.awayTeam.score,
          homeTeamBestPlayerId: matchData.homeTeam.mvp,
          awayTeamBestPlayerId: matchData.awayTeam.mvp,
          homeFirstPlayerId: matchData.selectedPlayers.homeFirst,
          homeSecondPlayerId: matchData.selectedPlayers.homeSecond,
          awayFirstPlayerId: matchData.selectedPlayers.awayFirst,
          awaySecondPlayerId: matchData.selectedPlayers.awaySecond,
          trackingData: matchData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Backend response:', result);

      setShowEndMatchModal(false);
      // Clear localStorage after successful submission
      clearLocalStorage();
      // Show success message
      alert('Meccs eredmény sikeresen mentve!');
    } catch (error) {
      console.error('Error saving match result:', error);
      alert('Hiba történt az eredmény mentése közben. Kérlek próbáld újra!');
    }
  };

  type ButtonOption = { id: string; name: string; type: 'hit' | 'miss'; disabled: boolean };
  const getCurrentPlayerOptions = (): ButtonOption[] => {
    const team = gameState.currentTurn;
    const isHome = team === 'home';
    const firstPlayer = isHome ? selectedPlayers.homeFirst : selectedPlayers.awayFirst;
    const secondPlayer = isHome ? selectedPlayers.homeSecond : selectedPlayers.awaySecond;
    
    console.log('getCurrentPlayerOptions - current state:', {
      phase: gameState.phase,
      rebuttalMode: gameState.rebuttalMode,
      rebuttalAttemptsLeft: gameState.rebuttalAttemptsLeft,
      rebuttalLastShooter: gameState.rebuttalLastShooter,
      gameEnded: gameState.gameEnded,
      currentTurn: gameState.currentTurn
    });
    
    // Determine which players can throw based on game state
    let canFirstPlayerThrow = true;
    let canSecondPlayerThrow = true;
    
    // If the game ended, disable everything
    if (gameState.gameEnded) {
      canFirstPlayerThrow = false;
      canSecondPlayerThrow = false;
      return [
        { id: firstPlayer, name: getPlayerName(firstPlayer, team), type: 'hit', disabled: true },
        { id: firstPlayer, name: getPlayerName(firstPlayer, team), type: 'miss', disabled: true },
        { id: secondPlayer, name: getPlayerName(secondPlayer, team), type: 'hit', disabled: true },
        { id: secondPlayer, name: getPlayerName(secondPlayer, team), type: 'miss', disabled: true },
      ];
    }

    // Return serve button rules
    if (gameState.phase === 'return_serve') {
      if (gameState.rebuttalMode === 'gt3') {
        // alternate within team until first miss
        if (!gameState.rebuttalLastShooter) {
          canFirstPlayerThrow = true;
          canSecondPlayerThrow = true;
        } else if (gameState.rebuttalLastShooter === firstPlayer) {
          canFirstPlayerThrow = false;
          canSecondPlayerThrow = true;
        } else {
          canFirstPlayerThrow = true;
          canSecondPlayerThrow = false;
        }
      } else if (gameState.rebuttalMode === 'lte3') {
        const step = gameState.rebuttalStep || 0; // 0:any, 1:other, 2:any
        if (step === 0 || step >= 2) {
          canFirstPlayerThrow = true;
          canSecondPlayerThrow = true;
        } else {
          // step 1: other than last shooter
          if (!gameState.rebuttalLastShooter) {
            canFirstPlayerThrow = true;
            canSecondPlayerThrow = true;
          } else if (gameState.rebuttalLastShooter === firstPlayer) {
            canFirstPlayerThrow = false;
            canSecondPlayerThrow = true;
          } else {
            canFirstPlayerThrow = true;
            canSecondPlayerThrow = false;
          }
        }
      } else if (gameState.rebuttalMode === 'onecup_double') {
        // two attempts on one cup → first: any, second: the other player
        const left = gameState.rebuttalAttemptsLeft || 0;
        if (left >= 2) {
          canFirstPlayerThrow = true;
          canSecondPlayerThrow = true;
        } else if (left === 1) {
          // force the other player on second attempt
          canFirstPlayerThrow = gameState.rebuttalLastShooter !== firstPlayer;
          canSecondPlayerThrow = gameState.rebuttalLastShooter !== secondPlayer;
        } else {
          canFirstPlayerThrow = false;
          canSecondPlayerThrow = false;
        }
      }
    } else if (gameState.phase === 'overtime') {
      // OT: 1. bárki, 2. csak a másik, 3. bárki
      if (gameState.consecutiveThrows === 1) {
        // For the second throw in overtime, use the lastOvertimeThrower to determine alternation
        const lastThrower = gameState.lastOvertimeThrower || gameState.lastThrower;
        if (lastThrower === firstPlayer) { 
          canFirstPlayerThrow = false; 
          canSecondPlayerThrow = true; 
        } else { 
          canFirstPlayerThrow = true; 
          canSecondPlayerThrow = false; 
        }
      } else {
        canFirstPlayerThrow = true; canSecondPlayerThrow = true;
      }

    } else if (gameState.phase === 'regular' && gameState.initThrowsCount === 0) {
      // During starting sequence (only first HOME single throw) both home players can throw
      canFirstPlayerThrow = true;
      canSecondPlayerThrow = true;
    } else if (gameState.consecutiveThrows === 1 && gameState.phase === 'regular') {
      // Second throw - only the other player can throw
      if (gameState.lastThrower === firstPlayer) {
        canFirstPlayerThrow = false;
        canSecondPlayerThrow = true;
      } else {
        canFirstPlayerThrow = true;
        canSecondPlayerThrow = false;
      }
    } else if (gameState.consecutiveThrows === 2 && gameState.phase === 'regular') {
      // Bonus throw - either player can throw (only if both previous throws were hits)
      canFirstPlayerThrow = true;
      canSecondPlayerThrow = true;
    }
    
    return [
      { id: firstPlayer, name: getPlayerName(firstPlayer, team), type: 'hit', disabled: !canFirstPlayerThrow },
      { id: firstPlayer, name: getPlayerName(firstPlayer, team), type: 'miss', disabled: !canFirstPlayerThrow },
      { id: secondPlayer, name: getPlayerName(secondPlayer, team), type: 'hit', disabled: !canSecondPlayerThrow },
      { id: secondPlayer, name: getPlayerName(secondPlayer, team), type: 'miss', disabled: !canSecondPlayerThrow }
    ];
  };

  const getPhaseDescription = () => {
    switch (gameState.phase) {
      case 'regular':
        return 'Alap játékidő';
      case 'overtime':
        return 'Hosszabbítás';
      case 'return_serve':
        return `Visszaszálló (${gameState.returnServeCount} pohár)`;
      default:
        return '';
    }
  };

  if (!matchMeta) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#001a3a] to-[#002b6b] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#ff5c1a]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001a3a] to-[#002b6b] p-2 sm:p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white hover:text-[#ff5c1a] transition-colors text-sm sm:text-base order-1 sm:order-1"
          >
            <FiArrowLeft /> Vissza
          </button>
          <h1 className={`${bebasNeue.className} text-lg sm:text-xl lg:text-2xl text-white text-center order-2 sm:order-2`}>
            <span className="block sm:hidden">{matchMeta.homeTeam.name}</span>
            <span className="hidden sm:block">{matchMeta.homeTeam.name} vs {matchMeta.awayTeam.name}</span>
            <span className="block sm:hidden text-sm text-[#ff5c1a]">VS</span>
            <span className="block sm:hidden">{matchMeta.awayTeam.name}</span>
          </h1>
          {setupComplete && (
            <button
              onClick={undoLastAction}
              className="flex items-center gap-2 text-white hover:text-[#ff5c1a] transition-colors text-sm sm:text-base order-3 sm:order-3"
              disabled={gameState.gameHistory.length === 0}
            >
              <FiRotateCcw /> <span className="hidden sm:inline">Visszavonás</span>
            </button>
          )}
        </div>

        {/* Score Display */}
        {setupComplete && (
          <div className="bg-black/30 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-[#ff5c1a]">
            <div className="flex justify-between items-center">
              <div className="text-center flex-1">
                <div className={`${bebasNeue.className} text-2xl sm:text-3xl lg:text-4xl text-white`}>
                  {gameState.phase === 'overtime' ? (gameState.homeScore + (gameState.otHome ?? 0)) : gameState.homeScore}
                </div>
                <div className="text-[#ff5c1a] font-bold text-xs sm:text-sm lg:text-base truncate">{matchMeta.homeTeam.name}</div>
              </div>
              <div className="text-center px-2 sm:px-4">
                <div className={`${bebasNeue.className} text-lg sm:text-xl lg:text-2xl text-[#ff5c1a]`}>VS</div>
                <div className="text-white text-xs sm:text-sm mt-1 sm:mt-2">{getPhaseDescription()}</div>
              </div>
              <div className="text-center flex-1">
                <div className={`${bebasNeue.className} text-2xl sm:text-3xl lg:text-4xl text-white`}>
                  {gameState.phase === 'overtime' ? (gameState.awayScore + (gameState.otAway ?? 0)) : gameState.awayScore}
                </div>
                <div className="text-[#ff5c1a] font-bold text-xs sm:text-sm lg:text-base truncate">{matchMeta.awayTeam.name}</div>
              </div>
            </div>
          </div>
        )}

        {/* Current Turn Indicator */}
        {setupComplete && (
          <div className="bg-black/30 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 border-2 border-[#ff5c1a]">
            <div className="text-center">
              <div className="text-white text-sm sm:text-base lg:text-lg mb-1 sm:mb-2">
                <span className="block sm:inline">{gameState.currentTurn === 'home' ? matchMeta.homeTeam.name : matchMeta.awayTeam.name}</span>
                <span className="block sm:inline sm:ml-1">dob</span>
              </div>
              <div className="text-[#ff5c1a] text-xs sm:text-sm min-h-[16px] sm:min-h-[20px]">
                {gameState.consecutiveThrows > 0 ? `Következő dobás: ${gameState.consecutiveThrows + 1}.` : ' '}
              </div>
            </div>
          </div>
        )}

        {/* Player Selection */}
        {!setupComplete && (
          <div className="bg-black/30 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-[#ff5c1a]">
            <h2 className={`${bebasNeue.className} text-lg sm:text-xl text-white mb-3 sm:mb-4 text-center`}>Játékosok kiválasztása</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Home Team */}
              <div>
                <h3 className="text-[#ff5c1a] font-bold mb-3">{matchMeta.homeTeam.name}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-white text-xs sm:text-sm">Első játékos</label>
                    <select
                      value={selectedPlayers.homeFirst}
                      onChange={(e) => setSelectedPlayers(prev => ({ ...prev, homeFirst: e.target.value }))}
                      className="w-full bg-black/60 border border-[#ff5c1a] text-white rounded-lg px-2 sm:px-3 py-2 text-sm sm:text-base"
                    >
                      <option value="">Válassz játékost</option>
                      {matchMeta.homeTeam.players?.map((player: Player) => (
                        <option key={player.id} value={player.id}>{player.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-white text-xs sm:text-sm">Második játékos</label>
                    <select
                      value={selectedPlayers.homeSecond}
                      onChange={(e) => setSelectedPlayers(prev => ({ ...prev, homeSecond: e.target.value }))}
                      className="w-full bg-black/60 border border-[#ff5c1a] text-white rounded-lg px-2 sm:px-3 py-2 text-sm sm:text-base"
                    >
                      <option value="">Válassz játékost</option>
                      {matchMeta.homeTeam.players?.map((player: Player) => (
                        <option key={player.id} value={player.id}>{player.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Away Team */}
              <div>
                <h3 className="text-[#ff5c1a] font-bold mb-3">{matchMeta.awayTeam.name}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-white text-sm">Első játékos</label>
                    <select
                      value={selectedPlayers.awayFirst}
                      onChange={(e) => setSelectedPlayers(prev => ({ ...prev, awayFirst: e.target.value }))}
                      className="w-full bg-black/60 border border-[#ff5c1a] text-white rounded-lg px-3 py-2"
                    >
                      <option value="">Válassz játékost</option>
                      {matchMeta.awayTeam.players?.map((player: Player) => (
                        <option key={player.id} value={player.id}>{player.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-white text-sm">Második játékos</label>
                    <select
                      value={selectedPlayers.awaySecond}
                      onChange={(e) => setSelectedPlayers(prev => ({ ...prev, awaySecond: e.target.value }))}
                      className="w-full bg-black/60 border border-[#ff5c1a] text-white rounded-lg px-3 py-2"
                    >
                      <option value="">Válassz játékost</option>
                      {matchMeta.awayTeam.players?.map((player: Player) => (
                        <option key={player.id} value={player.id}>{player.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Setup Complete Button */}
            <div className="mt-6 text-center">
              <button
                onClick={handleSetupComplete}
                disabled={!selectedPlayers.homeFirst || !selectedPlayers.homeSecond || !selectedPlayers.awayFirst || !selectedPlayers.awaySecond}
                className={`px-8 py-3 rounded-xl font-bold text-white transition-all ${
                  selectedPlayers.homeFirst && selectedPlayers.homeSecond && selectedPlayers.awayFirst && selectedPlayers.awaySecond
                    ? 'bg-[#ff5c1a] hover:bg-[#e54d1a]'
                    : 'bg-gray-500 cursor-not-allowed opacity-50'
                }`}
              >
                Felállás mentése és tracking indítása
              </button>
            </div>
          </div>
        )}

                {/* End Match Button */}
        {setupComplete && gameState.gameEnded && (
          <div className="bg-black/30 rounded-2xl p-6 mb-6 border-2 border-[#ff5c1a]">
            <div className="text-center">
              <button
                onClick={handleEndMatch}
                className="px-8 py-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all"
              >
                Meccs lezárása
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {setupComplete && (
          <div className="bg-black/30 rounded-2xl p-4 sm:p-6 border-2 border-[#ff5c1a]">
            <h2 className={`${bebasNeue.className} text-lg sm:text-xl text-white mb-4 sm:mb-6 text-center`}>Dobás követése</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
              {(() => {
                const opts = getCurrentPlayerOptions();
                return (
                  <>
                    {opts.slice(0,2).map((player, index) => (
                      <button
                        key={`opt-a-${index}`}
                        onClick={() => !player.disabled && handleThrow(player.type, player.id)}
                        disabled={player.disabled}
                        className={`w-full py-4 sm:py-6 rounded-xl font-bold text-white transition-all text-sm sm:text-base ${
                          player.disabled 
                            ? 'bg-gray-500 cursor-not-allowed opacity-50' 
                            : player.type === 'hit' 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {player.type === 'hit' ? <FiTarget className="w-4 h-4 sm:w-5 sm:h-5" /> : <FiX className="w-4 h-4 sm:w-5 sm:h-5" />}
                          <span className="truncate">{player.type === 'hit' ? 'HIT' : 'MISS'} - {player.name}</span>
                        </div>
                      </button>
                    ))}
                    {/* separator only on mobile */}
                    <div className="block sm:hidden h-px my-2 bg-white/20 w-full col-span-full" />
                    {opts.slice(2).map((player, index) => (
                      <button
                        key={`opt-b-${index}`}
                        onClick={() => !player.disabled && handleThrow(player.type, player.id)}
                        disabled={player.disabled}
                        className={`w-full py-4 sm:py-6 rounded-xl font-bold text-white transition-all text-sm sm:text-base ${
                          player.disabled 
                            ? 'bg-gray-500 cursor-not-allowed opacity-50' 
                            : player.type === 'hit' 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {player.type === 'hit' ? <FiTarget className="w-4 h-4 sm:w-5 sm:h-5" /> : <FiX className="w-4 h-4 sm:w-5 sm:h-5" />}
                          <span className="truncate">{player.type === 'hit' ? 'HIT' : 'MISS'} - {player.name}</span>
                        </div>
                      </button>
                    ))}
                  </>
                );
              })()}
            </div>
          </div>
        )}

                {/* Player Throw History */}
        {setupComplete && (
          <div className="bg-black/30 rounded-2xl p-6 my-6 border-2 border-[#ff5c1a]">
            <h2 className={`${bebasNeue.className} text-xl text-white mb-4 text-center`}>Dobás történet</h2>
            

            
            <GameStatsGrid
              teamStats={(() => {
                // Calculate player stats
                const homeFirstStats = calculatePlayerStats(selectedPlayers.homeFirst);
                const homeSecondStats = calculatePlayerStats(selectedPlayers.homeSecond);
                const awayFirstStats = calculatePlayerStats(selectedPlayers.awayFirst);
                const awaySecondStats = calculatePlayerStats(selectedPlayers.awaySecond);
                
                const homeTotal = {
                  hits: homeFirstStats.hits + homeSecondStats.hits,
                  total: homeFirstStats.total + homeSecondStats.total,
                  percentage: Math.round(((homeFirstStats.hits + homeSecondStats.hits) / (homeFirstStats.total + homeSecondStats.total)) * 100) || 0
                };
                
                const awayTotal = {
                  hits: awayFirstStats.hits + awaySecondStats.hits,
                  total: awayFirstStats.total + awaySecondStats.total,
                  percentage: Math.round(((awayFirstStats.hits + awaySecondStats.hits) / (awayFirstStats.total + awaySecondStats.total)) * 100) || 0
                };
                
                return {
                  home: [homeFirstStats, homeSecondStats],
                  away: [awayFirstStats, awaySecondStats],
                  homeTotal,
                  awayTotal,
                    winner: homeTotal.hits > awayTotal.hits ? 'home' : awayTotal.hits > homeTotal.hits ? 'away' : null,
                    starHome: Boolean(homeFirstStats.isFirst10Perfect && homeSecondStats.isFirst10Perfect),
                    starAway: Boolean(awayFirstStats.isFirst10Perfect && awaySecondStats.isFirst10Perfect)
                };
              })()}
              throws={gameState.gameHistory.map((action, index) => {
                // Calculate round index based on game phase
                let roundIndex = 0;
                let currentIndex = 0;
                
                const rounds = buildRounds();
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
              })}
              gameNumber={1}
              className="w-full"
            />
          </div>
        )}

        
        {/* Game History */}
        {setupComplete && (
          <div className="bg-black/30 rounded-2xl p-6 mt-6 border-2 border-[#ff5c1a]">
            <h2 className={`${bebasNeue.className} text-xl text-white mb-4 text-center`}>Játék történet</h2>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {gameState.gameHistory.slice(-10).reverse().map((action, index) => (
                <div key={index} className="flex items-center justify-between bg-black/40 rounded-lg px-3 py-2">
                  <span className="text-white">
                    {getPlayerName(action.playerId, action.team)}
                  </span>
                  <span className={`font-bold ${action.type === 'hit' ? 'text-green-400' : 'text-red-400'}`}>
                    {action.type === 'hit' ? 'HIT' : 'MISS'}
                  </span>
                  <span className="text-[#ff5c1a] text-sm">
                    {new Date(action.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* End Match Modal */}
        {showEndMatchModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-black/90 rounded-2xl p-8 max-w-2xl w-full mx-4 border-2 border-[#ff5c1a] max-h-[80vh] overflow-auto">
              <h2 className={`${bebasNeue.className} text-2xl text-white mb-6 text-center`}>Meccs eredmény leadása</h2>
              
              {/* Match Summary */}
              <div className="bg-black/30 rounded-xl p-6 mb-6 border border-[#ff5c1a]">
                <div className="flex justify-between items-center mb-6">
                  <div className="text-center">
                    <div className={`${bebasNeue.className} text-4xl text-white mb-2`}>
                      {gameState.phase === 'overtime' ? (gameState.homeScore + (gameState.otHome ?? 0)) : gameState.homeScore}
                    </div>
                    <div className="text-[#ff5c1a] font-bold text-lg">{matchMeta?.homeTeam.name}</div>
                  </div>
                  <div className="text-center">
                    <div className={`${bebasNeue.className} text-2xl text-[#ff5c1a]`}>VS</div>
                    <div className="text-white text-sm mt-2">{getPhaseDescription()}</div>
                  </div>
                  <div className="text-center">
                    <div className={`${bebasNeue.className} text-4xl text-white mb-2`}>
                      {gameState.phase === 'overtime' ? (gameState.awayScore + (gameState.otAway ?? 0)) : gameState.awayScore}
                    </div>
                    <div className="text-[#ff5c1a] font-bold text-lg">{matchMeta?.awayTeam.name}</div>
                  </div>
                </div>
                
                {/* Players with Stats */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-[#ff5c1a] font-bold mb-3 text-center">{matchMeta?.homeTeam.name}</div>
                    <div className="space-y-3">
                              <div
          className={`rounded-lg p-3 border cursor-pointer transition-all h-20 flex flex-col justify-between ${
            mvpSelections.home === selectedPlayers.homeFirst
              ? 'bg-[#ff5c1a]/30 border-[#ff5c1a]'
              : 'bg-black/20 border-[#ff5c1a]/30 hover:bg-black/40'
          }`}
          onClick={() => handleMvpSelection('home', selectedPlayers.homeFirst)}
        >
          <div className="text-white font-semibold flex items-center justify-between">
            {getPlayerName(selectedPlayers.homeFirst, 'home')}
            {mvpSelections.home === selectedPlayers.homeFirst && (
              <span className="text-[#ff5c1a] text-lg">★</span>
            )}
          </div>
          <div className="text-sm text-gray-300">
            {calculatePlayerStats(selectedPlayers.homeFirst).hits}/{calculatePlayerStats(selectedPlayers.homeFirst).total}
            ({calculatePlayerStats(selectedPlayers.homeFirst).percentage}%)
          </div>
          {getMvpSuggestion('home') === selectedPlayers.homeFirst && (
            <div className="text-xs text-[#ff5c1a]">MVP jelölt</div>
          )}
        </div>
                                              <div 
                          className={`rounded-lg p-3 border cursor-pointer transition-all h-20 flex flex-col justify-between ${
                            mvpSelections.home === selectedPlayers.homeSecond
                              ? 'bg-[#ff5c1a]/30 border-[#ff5c1a]'
                              : 'bg-black/20 border-[#ff5c1a]/30 hover:bg-black/40'
                          }`}
                          onClick={() => handleMvpSelection('home', selectedPlayers.homeSecond)}
                        >
                          <div className="text-white font-semibold flex items-center justify-between">
                            {getPlayerName(selectedPlayers.homeSecond, 'home')}
                            {mvpSelections.home === selectedPlayers.homeSecond && (
                              <span className="text-[#ff5c1a] text-lg">★</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-300">
                            {calculatePlayerStats(selectedPlayers.homeSecond).hits}/{calculatePlayerStats(selectedPlayers.homeSecond).total}
                            ({calculatePlayerStats(selectedPlayers.homeSecond).percentage}%)
                          </div>
                          {getMvpSuggestion('home') === selectedPlayers.homeSecond && (
                            <div className="text-xs text-[#ff5c1a]">MVP jelölt</div>
                          )}
                        </div>
                      <div className="bg-[#ff5c1a]/20 rounded-lg p-3 border border-[#ff5c1a] text-center">
                        <div className="text-white font-bold">
                          {(() => {
                            const homeFirstStats = calculatePlayerStats(selectedPlayers.homeFirst);
                            const homeSecondStats = calculatePlayerStats(selectedPlayers.homeSecond);
                            const homeTotal = {
                              hits: homeFirstStats.hits + homeSecondStats.hits,
                              total: homeFirstStats.total + homeSecondStats.total,
                              percentage: Math.round(((homeFirstStats.hits + homeSecondStats.hits) / (homeFirstStats.total + homeSecondStats.total)) * 100) || 0
                            };
                            // Debug log
                            console.log('Home stats:', {
                              first: homeFirstStats.isFirst10Perfect,
                              second: homeSecondStats.isFirst10Perfect,
                              firstThrows: gameState.gameHistory.filter(a => a.playerId === selectedPlayers.homeFirst).length,
                              secondThrows: gameState.gameHistory.filter(a => a.playerId === selectedPlayers.homeSecond).length
                            });
                            
                            return (
                              <>
                                {(homeFirstStats.isFirst10Perfect && homeSecondStats.isFirst10Perfect) ? '★' : ''} {homeTotal.hits}/{homeTotal.total} ({homeTotal.percentage}%)
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[#ff5c1a] font-bold mb-3 text-center">{matchMeta?.awayTeam.name}</div>
                                          <div className="space-y-3">
                        <div 
                          className={`rounded-lg p-3 border cursor-pointer transition-all h-20 flex flex-col justify-between ${
                            mvpSelections.away === selectedPlayers.awayFirst
                              ? 'bg-[#ff5c1a]/30 border-[#ff5c1a]'
                              : 'bg-black/20 border-[#ff5c1a]/30 hover:bg-black/40'
                          }`}
                          onClick={() => handleMvpSelection('away', selectedPlayers.awayFirst)}
                        >
                          <div className="text-white font-semibold flex items-center justify-between">
                            {getPlayerName(selectedPlayers.awayFirst, 'away')}
                            {mvpSelections.away === selectedPlayers.awayFirst && (
                              <span className="text-[#ff5c1a] text-lg">★</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-300">
                            {calculatePlayerStats(selectedPlayers.awayFirst).hits}/{calculatePlayerStats(selectedPlayers.awayFirst).total}
                            ({calculatePlayerStats(selectedPlayers.awayFirst).percentage}%)
                          </div>
                          {getMvpSuggestion('away') === selectedPlayers.awayFirst && (
                            <div className="text-xs text-[#ff5c1a]">MVP jelölt</div>
                          )}
                        </div>
                                              <div 
                          className={`rounded-lg p-3 border cursor-pointer transition-all h-20 flex flex-col justify-between ${
                            mvpSelections.away === selectedPlayers.awaySecond
                              ? 'bg-[#ff5c1a]/30 border-[#ff5c1a]'
                              : 'bg-black/20 border-[#ff5c1a]/30 hover:bg-black/40'
                          }`}
                          onClick={() => handleMvpSelection('away', selectedPlayers.awaySecond)}
                        >
                          <div className="text-white font-semibold flex items-center justify-between">
                            {getPlayerName(selectedPlayers.awaySecond, 'away')}
                            {mvpSelections.away === selectedPlayers.awaySecond && (
                              <span className="text-[#ff5c1a] text-lg">★</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-300">
                            {calculatePlayerStats(selectedPlayers.awaySecond).hits}/{calculatePlayerStats(selectedPlayers.awaySecond).total}
                            ({calculatePlayerStats(selectedPlayers.awaySecond).percentage}%)
                          </div>
                          {getMvpSuggestion('away') === selectedPlayers.awaySecond && (
                            <div className="text-xs text-[#ff5c1a]">MVP jelölt</div>
                          )}
                        </div>
                      <div className="bg-[#ff5c1a]/20 rounded-lg p-3 border border-[#ff5c1a] text-center">
                        <div className="text-white font-bold">
                          {(() => {
                            const awayFirstStats = calculatePlayerStats(selectedPlayers.awayFirst);
                            const awaySecondStats = calculatePlayerStats(selectedPlayers.awaySecond);
                            const awayTotal = {
                              hits: awayFirstStats.hits + awaySecondStats.hits,
                              total: awayFirstStats.total + awaySecondStats.total,
                              percentage: Math.round(((awayFirstStats.hits + awaySecondStats.hits) / (awayFirstStats.total + awaySecondStats.total)) * 100) || 0
                            };
                            // Debug log
                            console.log('Away stats:', {
                              first: awayFirstStats.isFirst10Perfect,
                              second: awaySecondStats.isFirst10Perfect,
                              firstThrows: gameState.gameHistory.filter(a => a.playerId === selectedPlayers.awayFirst).length,
                              secondThrows: gameState.gameHistory.filter(a => a.playerId === selectedPlayers.awaySecond).length
                            });
                            
                            return (
                              <>
                                {(awayFirstStats.isFirst10Perfect && awaySecondStats.isFirst10Perfect) ? '★' : ''} {awayTotal.hits}/{awayTotal.total} ({awayTotal.percentage}%)
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Game Statistics */}
              <div className="bg-black/30 rounded-xl p-6 mb-6 border border-[#ff5c1a]">
                <h3 className="text-[#ff5c1a] font-bold mb-3">Játék statisztikák:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <div className="text-white">Összes dobás: <span className="text-[#ff5c1a] font-bold">{gameState.gameHistory.length}</span></div>
                    <div className="text-white">Hits: <span className="text-green-400 font-bold">{gameState.gameHistory.filter(a => a.type === 'hit').length}</span></div>
                    <div className="text-white">Misses: <span className="text-red-400 font-bold">{gameState.gameHistory.filter(a => a.type === 'miss').length}</span></div>
                  </div>
                  <div>
                    <div className="text-white">Játékidő: <span className="text-[#ff5c1a] font-bold">{getPhaseDescription()}</span></div>
                    <div className="text-white">Hosszabbítás: <span className="text-[#ff5c1a] font-bold">{gameState.overtimePeriod || 0}</span></div>
                  </div>
                </div>

                {/* Detailed Statistics Table */}
                <div className="mt-6">
                  <h4 className="text-white font-bold mb-3 text-center">Részletes statisztikák</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-800">
                          <th className="border border-gray-600 p-2 text-white text-left">Csapat</th>
                          <th className="border border-gray-600 p-2 text-white text-center">0/2</th>
                          <th className="border border-gray-600 p-2 text-white text-center">1/2</th>
                          <th className="border border-gray-600 p-2 text-white text-center">2/3</th>
                          <th className="border border-gray-600 p-2 text-white text-center">3/3</th>
                          <th className="border border-gray-600 p-2 text-white text-center">• Hits</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-black/20">
                          <td className="border border-gray-600 p-2 text-white font-semibold">
                            {getPlayerName(selectedPlayers.homeFirst, 'home')} & {getPlayerName(selectedPlayers.homeSecond, 'home')}
                          </td>
                          <td className="border border-gray-600 p-2 text-white text-center">
                            {(() => {
                              const validRounds = getValidRoundsForTeam('home');
                              
                              return validRounds.filter(round => {
                                const homeThrows = round.throws.filter(t => t.team === 'home');
                                return homeThrows.length === 2 && homeThrows.filter(t => t.type === 'hit').length === 0;
                              }).length;
                            })()}
                          </td>
                          <td className="border border-gray-600 p-2 text-white text-center">
                            {(() => {
                              const validRounds = getValidRoundsForTeam('home');
                              
                              return validRounds.filter(round => {
                                const homeThrows = round.throws.filter(t => t.team === 'home');
                                return homeThrows.length === 2 && homeThrows.filter(t => t.type === 'hit').length === 1;
                              }).length;
                            })()}
                          </td>
                          <td className="border border-gray-600 p-2 text-white text-center">
                            {(() => {
                              const validRounds = getValidRoundsForTeam('home');
                              
                              return validRounds.filter(round => {
                                const homeThrows = round.throws.filter(t => t.team === 'home');
                                return homeThrows.length === 3 && homeThrows.filter(t => t.type === 'hit').length === 2;
                              }).length;
                            })()}
                          </td>
                          <td className="border border-gray-600 p-2 text-white text-center">
                            {(() => {
                              const validRounds = getValidRoundsForTeam('home');
                              
                              return validRounds.filter(round => {
                                const homeThrows = round.throws.filter(t => t.team === 'home');
                                return homeThrows.length === 3 && homeThrows.filter(t => t.type === 'hit').length === 3;
                              }).length;
                            })()}
                          </td>
                          <td className="border border-gray-600 p-2 text-white text-center font-bold">
                            {(() => {
                              const validRounds = getValidRoundsForTeam('home');
                              
                              const totalHits = validRounds.reduce((sum, round) => {
                                const homeThrows = round.throws.filter(t => t.team === 'home');
                                return sum + homeThrows.filter(t => t.type === 'hit').length;
                              }, 0);
                              
                              return validRounds.length > 0 ? (totalHits / validRounds.length).toFixed(2) : '0.00';
                            })()}
                          </td>
                        </tr>
                        <tr className="bg-black/20">
                          <td className="border border-gray-600 p-2 text-white font-semibold">
                            {getPlayerName(selectedPlayers.awayFirst, 'away')} & {getPlayerName(selectedPlayers.awaySecond, 'away')}
                          </td>
                          <td className="border border-gray-600 p-2 text-white text-center">
                            {(() => {
                              const validRounds = getValidRoundsForTeam('away');
                              
                              return validRounds.filter(round => {
                                const awayThrows = round.throws.filter(t => t.team === 'away');
                                return awayThrows.length === 2 && awayThrows.filter(t => t.type === 'hit').length === 0;
                              }).length;
                            })()}
                          </td>
                          <td className="border border-gray-600 p-2 text-white text-center">
                            {(() => {
                              const validRounds = getValidRoundsForTeam('away');
                              
                              return validRounds.filter(round => {
                                const awayThrows = round.throws.filter(t => t.team === 'away');
                                return awayThrows.length === 2 && awayThrows.filter(t => t.type === 'hit').length === 1;
                              }).length;
                            })()}
                          </td>
                          <td className="border border-gray-600 p-2 text-white text-center">
                            {(() => {
                              const validRounds = getValidRoundsForTeam('away');
                              
                              return validRounds.filter(round => {
                                const awayThrows = round.throws.filter(t => t.team === 'away');
                                return awayThrows.length === 3 && awayThrows.filter(t => t.type === 'hit').length === 2;
                              }).length;
                            })()}
                          </td>
                          <td className="border border-gray-600 p-2 text-white text-center">
                            {(() => {
                              const validRounds = getValidRoundsForTeam('away');
                              
                              return validRounds.filter(round => {
                                const awayThrows = round.throws.filter(t => t.team === 'away');
                                return awayThrows.length === 3 && awayThrows.filter(t => t.type === 'hit').length === 3;
                              }).length;
                            })()}
                          </td>
                          <td className="border border-gray-600 p-2 text-white text-center font-bold">
                            {(() => {
                              const validRounds = getValidRoundsForTeam('away');
                              
                              const totalHits = validRounds.reduce((sum, round) => {
                                const awayThrows = round.throws.filter(t => t.team === 'away');
                                return sum + awayThrows.filter(t => t.type === 'hit').length;
                              }, 0);
                              
                              return validRounds.length > 0 ? (totalHits / validRounds.length).toFixed(2) : '0.00';
                            })()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* MVP Warning */}
              {(!mvpSelections.home || !mvpSelections.away) && (
                <div className="bg-red-600/20 border border-red-600 rounded-lg p-3 mb-4">
                  <div className="text-red-400 text-center font-semibold">
                    ⚠️ Addig nem tudod beküldeni az eredményt, amíg nem választottál MVP-t mindkét csapatból!
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowEndMatchModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-gray-600 hover:bg-gray-700 transition-all"
                >
                  Mégse
                </button>
                <button
                  onClick={handleSubmitMatchResult}
                  disabled={!mvpSelections.home || !mvpSelections.away}
                  className={`flex-1 py-3 rounded-xl font-bold text-white transition-all ${
                    mvpSelections.home && mvpSelections.away
                      ? 'bg-[#ff5c1a] hover:bg-[#e54d1a]'
                      : 'bg-gray-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  Eredmény leadása
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
