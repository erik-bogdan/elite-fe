import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Team {
  id: string;
  name: string;
  logo?: string | null;
}

export interface Match {
  id: string;
  leagueId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamScore: number;
  awayTeamScore: number;
  matchAt: string;
  matchDate: string;
  matchTime: string;
  matchStatus: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  matchRound: number;
  gameDay: number;
  matchTable: number;
  isDelayed: boolean;
  delayedRound?: number | null;
  delayedGameDay?: number | null;
  delayedDate?: string | null;
  delayedTime?: string | null;
  delayedTable?: number | null;
}

export interface PollOption {
  id: string;
  text: string;
  order: number;
  voteCount: number;
}

export interface Poll {
  id: string;
  groupMatchId: string;
  question: string;
  options: PollOption[];
}

export interface MatchWithDetails {
  id: string; // groupMatchId (junction table ID)
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  poll: Poll | null;
}

export interface LiveMatchGroup {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  matches: MatchWithDetails[];
}

export interface LeagueMatch {
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
}

interface LiveMatchState {
  group: LiveMatchGroup | null;
  loading: boolean;
  error: string | null;
  nextMatch: MatchWithDetails | null;
  pollForNextMatch: Poll | null;
  leagueMatches: LeagueMatch[];
  leagueMatchesLoading: boolean;
}

const initialState: LiveMatchState = {
  group: null,
  loading: false,
  error: null,
  nextMatch: null,
  pollForNextMatch: null,
  leagueMatches: [],
  leagueMatchesLoading: false,
};

// Fetch active live match group
export const fetchActiveLiveMatchGroup = createAsyncThunk(
  'liveMatch/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/live-matches/active`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch active live match group');
      }

      const data = await response.json();
      return data as LiveMatchGroup | null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch active live match group');
    }
  }
);

// Fetch league matches
export const fetchLeagueMatches = createAsyncThunk(
  'liveMatch/fetchLeagueMatches',
  async (leagueId: string, { rejectWithValue }) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/matches/league/${leagueId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch league matches');
      }

      const data = await response.json();
      return data as LeagueMatch[];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch league matches');
    }
  }
);

const liveMatchSlice = createSlice({
  name: 'liveMatch',
  initialState,
  reducers: {
    clearLiveMatchData: (state) => {
      state.group = null;
      state.nextMatch = null;
      state.pollForNextMatch = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveLiveMatchGroup.pending, (state) => {
        // Only set loading if we don't have data yet
        if (!state.group) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchActiveLiveMatchGroup.fulfilled, (state, action) => {
        state.loading = false;
        
        // Check if the data actually changed
        const payload = action.payload;
        const currentGroup = state.group;
        
        // Deep comparison helper for poll options (vote counts)
        const hasPollChanged = (poll1: Poll | null, poll2: Poll | null): boolean => {
          if (!poll1 && !poll2) return false;
          if (!poll1 || !poll2) return true;
          if (poll1.id !== poll2.id) return true;
          if (poll1.question !== poll2.question) return true;
          if (poll1.options.length !== poll2.options.length) return true;
          
          // Check if vote counts changed
          for (let i = 0; i < poll1.options.length; i++) {
            if (poll1.options[i].voteCount !== poll2.options[i].voteCount) {
              return true;
            }
          }
          return false;
        };
        
        // Check if nextMatch changed (by ID and poll vote counts)
        // Helper to get effective match date/time (prioritize delayed if available)
        const getEffectiveMatchAt = (match: Match): Date => {
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

        const findNextMatch = (matches: MatchWithDetails[]) => {
          const now = new Date();
          const upcomingMatches = matches.filter((m) => {
            const effectiveMatchAt = getEffectiveMatchAt(m.match);
            return (
              m.match.matchStatus !== 'completed' &&
              m.match.matchStatus !== 'cancelled' &&
              (m.match.matchStatus === 'in_progress' || effectiveMatchAt >= now)
            );
          });

          if (upcomingMatches.length > 0) {
            upcomingMatches.sort((a, b) => {
              // Prioritize in_progress matches
              if (a.match.matchStatus === 'in_progress' && b.match.matchStatus !== 'in_progress') {
                return -1;
              }
              if (b.match.matchStatus === 'in_progress' && a.match.matchStatus !== 'in_progress') {
                return 1;
              }
              // Sort by effective match time (prioritize delayed time if available)
              const dateA = getEffectiveMatchAt(a.match).getTime();
              const dateB = getEffectiveMatchAt(b.match).getTime();
              return dateA - dateB;
            });
            return upcomingMatches[0];
          }
          return null;
        };
        
        // Only update group if ID changed or matches list changed
        const groupChanged = !currentGroup || 
          !payload ||
          currentGroup.id !== payload.id ||
          currentGroup.matches.length !== payload.matches.length ||
          currentGroup.matches.some((m, i) => 
            payload.matches[i]?.match.id !== m.match.id ||
            payload.matches[i]?.match.matchStatus !== m.match.matchStatus
          );
        
        if (groupChanged || !payload) {
          state.group = payload;
        }
        
        if (payload) {
          const newNextMatch = findNextMatch(payload.matches);
          const currentNextMatch = state.nextMatch;
          
          // Only update if nextMatch changed (different ID or poll vote counts changed)
          const nextMatchChanged = !currentNextMatch || 
            !newNextMatch ||
            currentNextMatch.match.id !== newNextMatch.match.id ||
            hasPollChanged(currentNextMatch.poll, newNextMatch.poll);
          
          if (nextMatchChanged) {
            state.nextMatch = newNextMatch;
            state.pollForNextMatch = newNextMatch?.poll || null;
          } else if (newNextMatch) {
            // Update poll separately if only poll changed (vote counts)
            const pollChanged = hasPollChanged(currentNextMatch.poll, newNextMatch.poll);
            if (pollChanged) {
              state.pollForNextMatch = newNextMatch.poll;
            }
          } else {
            state.nextMatch = null;
            state.pollForNextMatch = null;
          }
        } else {
          state.nextMatch = null;
          state.pollForNextMatch = null;
        }
      })
      .addCase(fetchActiveLiveMatchGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.group = null;
        state.nextMatch = null;
        state.pollForNextMatch = null;
      })
      .addCase(fetchLeagueMatches.pending, (state) => {
        state.leagueMatchesLoading = true;
      })
      .addCase(fetchLeagueMatches.fulfilled, (state, action) => {
        state.leagueMatchesLoading = false;
        state.leagueMatches = action.payload;
      })
      .addCase(fetchLeagueMatches.rejected, (state) => {
        state.leagueMatchesLoading = false;
        state.leagueMatches = [];
      });
  },
});

export const { clearLiveMatchData } = liveMatchSlice.actions;
export default liveMatchSlice.reducer;

