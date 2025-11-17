import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChampionshipGameDay {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  gameday: boolean;
}

export interface ChampionshipProperties {
  type: 'league' | 'tournament';
  rounds: number;
  hasPlayoff: boolean;
  playoffType?: 'groupped' | 'knockout' | string;
  teams: number;
  gameDays?: ChampionshipGameDay[];
  elimination?: number;
  registrationClose?: string; // ISO datetime
  regfee?: string; // free-form to allow "29.000 Ft/játékos" stb.
  regfeeDueDate?: string; // ISO datetime
  // New prize fields
  nyeremeny_text?: string;
  nyeremeny_value?: string;
  masodik_nyeremeny_text?: string;
  masodik_nyeremeny_value?: string;
}

export interface Match {
  id: number;
  homeTeam: { name: string; logo: string };
  awayTeam: { name: string; logo: string };
  time: string;
  tableNumber: number;
  round: number;
}

export interface MatchDay {
  id: number;
  date: string;
  matches: Match[];
  mvp: {
    name: string;
    team: string;
    image: string;
  };
}

export interface Championship {
  id: string;
  name: string;
  logo: string;
  slug: string;
  seasonId: string;
  totalTeams: number;
  totalMatches: number;
  completedMatches: number;
  phase: string;
  isStarted?: boolean;
  knockoutRound?: number;
  regularRound?: number;
  progress: number;
  properties: ChampionshipProperties;
  teams?: {
    name: string;
    logo: string;
    matches: number;
    wins: number;
  }[];
  winner?: string;
  matchDays?: MatchDay[];
}

export interface PlayoffHouseGroup {
  label: 'upper' | 'lower';
  name: string;
  teamIds: string[];
  standings: any[];
}

export interface PlayoffGroupsResponse {
  enabled: boolean;
  ready: boolean;
  totalTeams: number;
  upper: PlayoffHouseGroup | null;
  lower: PlayoffHouseGroup | null;
}

export interface PlayoffHouseMatch {
  id: string;
  round: number;
  gameDay: number;
  table: number;
  status: string;
  matchAt: string;
  home: { id: string; name: string; logo?: string | null; score: number };
  away: { id: string; name: string; logo?: string | null; score: number };
}

export interface PlayoffMatchesResponse {
  enabled: boolean;
  upper: PlayoffHouseMatch[];
  lower: PlayoffHouseMatch[];
}

export interface CreateChampionshipRequest {
  name: string;
  seasonId: string;
  properties: ChampionshipProperties;
  slug: string;
}

export interface UpdateChampionshipRequest extends Partial<CreateChampionshipRequest> {
  id: string;
}

interface ChampionshipState {
  allChampionships: Championship[];
  selectedChampionship: Championship | null;
  activeChampionships: Championship[];
  completedChampionships: Championship[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ChampionshipState = {
  allChampionships: [],
  selectedChampionship: null,
  activeChampionships: [],
  completedChampionships: [],
  isLoading: false,
  error: null,
};

export const championshipSlice = createSlice({
  name: 'championship',
  initialState,
  reducers: {
    setAllChampionships: (state, action: PayloadAction<Championship[]>) => {
      state.allChampionships = action.payload;
      state.activeChampionships = action.payload.filter(c => c.progress < 100);
      state.completedChampionships = action.payload.filter(c => c.progress === 100);
    },
    setSelectedChampionship: (state, action: PayloadAction<Championship | null>) => {
      state.selectedChampionship = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setAllChampionships,
  setSelectedChampionship,
  setLoading,
  setError,
} = championshipSlice.actions;

export const championshipApi = createApi({
  reducerPath: 'championshipApi',
  baseQuery: fetchBaseQuery({
    // Backend base URL
    baseUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}/api`,
    credentials: 'include',
  }),
  tagTypes: ['Championship'],
  endpoints: (builder) => ({
    getChampionships: builder.query<Championship[], void>({
      query: () => '/championship',
      providesTags: ['Championship'],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          dispatch(setLoading(true));
          const { data } = await queryFulfilled;
          dispatch(setAllChampionships(data));
        } catch (error) {
          dispatch(setError('Failed to fetch championships'));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),
    getChampionshipStats: builder.query<{ championships: any[] }, void>({
      query: () => '/championship/stats',
      providesTags: ['Championship'],
    }),
    getChampionshipById: builder.query<Championship, string>({
      query: (id) => `/championship/${id}`,
      providesTags: ['Championship'],
    }),
    getMatchesFiltered: builder.query<{ items: any[]; total: number; page: number; pageSize: number }, { seasonId?: string; leagueId?: string; round?: number; page?: number; pageSize?: number }>({
      query: ({ seasonId, leagueId, round, page = 1, pageSize = 20 }) => {
        const params = new URLSearchParams();
        if (seasonId) params.set('seasonId', String(seasonId));
        if (leagueId) params.set('leagueId', String(leagueId));
        if (typeof round === 'number') params.set('round', String(round));
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        return `/matches?${params.toString()}`;
      },
    }),
    getLeagueTeams: builder.query<any[], string>({
      query: (leagueId) => `/championship/teams/${leagueId}`,
    }),
    getAvailableTeamsForLeague: builder.query<any[], string>({
      query: (leagueId) => `/championship/teams/${leagueId}/available`,
    }),
    addTeamToLeague: builder.mutation<{ success: boolean }, { leagueId: string; teamId: string }>({
      query: ({ leagueId, teamId }) => ({
        url: `/championship/teams/${leagueId}/${teamId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Championship']
    }),
    removeTeamFromLeague: builder.mutation<{ success: boolean }, { leagueId: string; teamId: string }>({
      query: ({ leagueId, teamId }) => ({
        url: `/championship/teams/${leagueId}/${teamId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Championship']
    }),
    sendInviteForLeagueTeam: builder.mutation<{ success: boolean }, { leagueTeamId: string }>({
      query: ({ leagueTeamId }) => ({
        url: `/championship/teams/invite/${leagueTeamId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Championship']
    }),
    previewSchedule: builder.mutation<{ schedule: any[] }, { id: string; teams: string[]; matchesPerDay: number[]; startTime: string; matchDuration: number; tables: number; dayDates?: string[] }>({
      query: ({ id, ...payload }) => ({
        url: `/championship/${id}/generate-schedule`,
        method: 'POST',
        body: payload,
      })
    }),
    saveSchedule: builder.mutation<{ success: boolean; saved: number }, { id: string; schedule: any[]; dayDates?: string[] }>({
      query: ({ id, ...payload }) => ({
        url: `/championship/${id}/save-schedule`,
        method: 'POST',
        body: payload,
      })
    }),
    getMatchesForLeague: builder.query<any[], string>({
      query: (leagueId) => `/matches/league/${leagueId}`,
      providesTags: ['Championship']
    }),
    getMatchByIdRaw: builder.query<any, string>({
      query: (id) => `/matches/${id}`,
      providesTags: ['Championship']
    }),
    startTracking: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({
        url: `/matches/${id}/tracking/start`,
        method: 'PUT'
      }),
      invalidatesTags: ['Championship']
    }),
    syncTracking: builder.mutation<any, { id: string; trackingData: any }>({
      query: ({ id, trackingData }) => ({
        url: `/matches/${id}/tracking/sync`,
        method: 'PUT',
        body: { trackingData }
      })
    }),
    finishTracking: builder.mutation<any, { id: string; trackingData?: any }>({
      query: ({ id, trackingData }) => ({
        url: `/matches/${id}/tracking/finish`,
        method: 'PUT',
        body: trackingData ? { trackingData } : undefined
      }),
      invalidatesTags: ['Championship']
    }),
    getMatchMeta: builder.query<any, string>({
      query: (matchId) => `/matches/${matchId}/meta`,
      providesTags: ['Championship']
    }),
    updateMatchResult: builder.mutation<{ success?: boolean }, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/matches/${id}/result`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['Championship']
    }),
    getStandings: builder.query<{ standings: any[] }, string>({
      query: (id) => `/championship/${id}/standings`,
      providesTags: ['Championship']
    }),
    getStandingsByDay: builder.query<{ standings: any[] }, { id: string; date: string }>({
      query: ({ id, date }) => `/championship/${id}/standings/day/${date}`,
      providesTags: ['Championship']
    }),
    getStandingsUptoGameDay: builder.query<{ standings: any[] }, { id: string; gameDay: number }>({
      query: ({ id, gameDay }) => `/championship/${id}/standings/upto/${gameDay}`,
      providesTags: ['Championship']
    }),
    getStandingsUptoRound: builder.query<{ standings: any[] }, { id: string; round: number }>({
      query: ({ id, round }) => `/championship/${id}/standings/upto-round/${round}`,
      providesTags: ['Championship']
    }),
    getStandingsByGameDay: builder.query<{ standings: any[] }, { id: string; gameDay: number }>({
      query: ({ id, gameDay }) => `/championship/${id}/standings/gameday/${gameDay}`,
      providesTags: ['Championship']
    }),
    getGameDayMvps: builder.query<{ mvps: any[] }, string>({
      query: (id) => `/championship/${id}/mvps`,
      providesTags: ['Championship']
    }),
    getPlayoffGroups: builder.query<PlayoffGroupsResponse, string>({
      query: (id) => `/championship/${id}/playoff/groups`,
      providesTags: ['Championship']
    }),
    previewPlayoffGroupsSchedule: builder.mutation<
      { schedule: any[]; totalDays: number },
      { id: string; startTime: string; matchDuration: number; tables: number; gameDayDate?: string }
    >({
      query: ({ id, ...payload }) => ({
        url: `/championship/${id}/playoff/generate-schedule`,
        method: 'POST',
        body: payload,
      }),
    }),
    savePlayoffGroupsSchedule: builder.mutation<
      { success: boolean; saved: number },
      { id: string; schedule: any[] }
    >({
      query: ({ id, schedule }) => ({
        url: `/championship/${id}/playoff/save-schedule`,
        method: 'POST',
        body: { schedule },
      }),
      invalidatesTags: ['Championship'],
    }),
    getPlayoffMatches: builder.query<PlayoffMatchesResponse, string>({
      query: (id) => `/championship/${id}/playoff/matches`,
      providesTags: ['Championship'],
    }),
    getRankSeries: builder.query<{ series: { round: number; rank: number | null }[] }, { id: string; teamId: string }>({
      query: ({ id, teamId }) => `/championship/${id}/rank-series/${teamId}`,
      providesTags: ['Championship']
    }),
    createChampionship: builder.mutation<Championship, CreateChampionshipRequest>({
      query: (data) => ({
        url: '/championship',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Championship'],
    }),
    updateChampionship: builder.mutation<Championship, UpdateChampionshipRequest>({
      query: ({ id, ...data }) => ({
        url: `/championship/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Championship'],
    }),
    deleteChampionship: builder.mutation<void, string>({
      query: (id) => ({
        url: `/championship/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Championship'],
    }),
  }),
});

export const {
  useGetChampionshipsQuery,
  useGetChampionshipStatsQuery,
  useGetChampionshipByIdQuery,
  useGetLeagueTeamsQuery,
  useGetAvailableTeamsForLeagueQuery,
  useAddTeamToLeagueMutation,
  useRemoveTeamFromLeagueMutation,
  useCreateChampionshipMutation,
  useUpdateChampionshipMutation,
  useDeleteChampionshipMutation,
  useSendInviteForLeagueTeamMutation,
  usePreviewScheduleMutation,
  useSaveScheduleMutation,
  useGetMatchesForLeagueQuery,
  useGetMatchByIdRawQuery,
  useStartTrackingMutation,
  useSyncTrackingMutation,
  useFinishTrackingMutation,
  useGetMatchMetaQuery,
  useUpdateMatchResultMutation,
  useGetStandingsQuery,
  useGetStandingsByDayQuery,
  useGetStandingsUptoGameDayQuery,
  useGetStandingsUptoRoundQuery,
  useGetStandingsByGameDayQuery,
  useGetGameDayMvpsQuery,
  useGetPlayoffGroupsQuery,
  usePreviewPlayoffGroupsScheduleMutation,
  useSavePlayoffGroupsScheduleMutation,
  useGetPlayoffMatchesQuery,
  useGetRankSeriesQuery,
} = championshipApi;

export default championshipSlice.reducer; 