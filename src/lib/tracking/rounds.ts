// Tracking rounds utility extracted to keep Matches modal consistent with Tracking page

export type Team = 'home' | 'away';
export type Phase = 'regular' | 'overtime' | 'return_serve';

export type GameAction = {
  type: 'hit' | 'miss';
  playerId: string;
  team: Team;
  timestamp: number;
};

type GameState = {
  homeScore: number;
  awayScore: number;
  currentTurn: Team;
  phase: Phase;
  lastThrower: string | null;
  consecutiveThrows: number;
  gameHistory: GameAction[];
  initThrowsCount: number;
  throwsInTurn: number;
  hitsInTurn: number;
  rebuttalCupsToMake?: number;
  rebuttalMode?: 'gt3' | 'lte3' | 'onecup_double';
  rebuttalStep?: number;
  rebuttalAttemptsLeft?: number;
  rebuttalLastShooter?: string | null;
  exitTeam?: Team;
  returnServeCount?: number;
  gameEnded: boolean;
  otHome?: number;
  otAway?: number;
  overtimePeriod?: number;
  lastOvertimeThrower?: string | null;
};

export type Round = {
  team: Team;
  phase: Phase;
  throws: GameAction[];
  roundIndex: number;
};

// NOTE: This mirrors the tracking page state machine closely, but is scoped for round computation only
export const recomputeFromHistoryForRounds = (actions: GameAction[]): GameState => {
  let state: GameState = {
    homeScore: 0,
    awayScore: 0,
    currentTurn: 'home',
    phase: 'regular',
    lastThrower: null,
    consecutiveThrows: 0,
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
    returnServeCount: 0,
    gameEnded: false,
    otHome: 0,
    otAway: 0,
    overtimePeriod: 0,
    lastOvertimeThrower: null
  };

  const apply = (prev: GameState, action: GameAction): GameState => {
    if (prev.gameEnded) return prev;
    const isHome = action.team === 'home';
    let s: GameState = { ...prev };
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
      return s;
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
        // stay on same team
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
        const mode = (cupsToMake === 1 && exitThrowNumberInOt > 1) ? 'onecup_double' : 'lte3';
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
        s.otHome = 0; s.otAway = 0;
      } else if (otAway >= 3 && otHome < 3) {
        const cupsToMake = Math.max(3 - otHome, 0);
        const mode = (cupsToMake === 1 && exitThrowNumberInOt > 1) ? 'onecup_double' : 'lte3';
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
        s.otHome = 0; s.otAway = 0;
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
        // stay
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

export const buildRoundsFromHistory = (history: GameAction[]): Round[] => {
  const rounds: Round[] = [];
  let currentRound: Round | null = null;

  for (let i = 0; i < history.length; i++) {
    const action = history[i];

    // State BEFORE this action
    let stateBefore: GameState;
    try {
      stateBefore = recomputeFromHistoryForRounds(history.slice(0, i));
    } catch (_) {
      stateBefore = {
        homeScore: 0, awayScore: 0, currentTurn: 'home', phase: 'regular', lastThrower: null,
        consecutiveThrows: 0, gameHistory: [], initThrowsCount: 0, throwsInTurn: 0, hitsInTurn: 0,
        returnServeCount: 0, gameEnded: false, otHome: 0, otAway: 0, overtimePeriod: 0, lastOvertimeThrower: null
      };
    }

    // State AFTER this action
    let stateAfter: GameState;
    try {
      stateAfter = recomputeFromHistoryForRounds(history.slice(0, i + 1));
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
      if (stateAfter.phase !== 'return_serve') {
        rounds.push(currentRound);
        currentRound = null;
      }
      continue;
    }

    // Normal rounds (regular / overtime)
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

    currentRound.throws.push(action);

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


