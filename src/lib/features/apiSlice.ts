import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createSlice } from "@reduxjs/toolkit";

export interface Player {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  nickname: string;
  birthDate?: string;
  image?: string | null;
  captain?: boolean;
  shirtSize?: string;
  invitation?: { pending: boolean; lastSentAt?: string | null };
}

export interface Team {
  id: string;
  name: string;
  logo?: string | null;
  players?: Player[];
  championship?: string;
  seasons?: any[];
}

export interface TeamSeason {
  year: number;
  league: string;
  result: string;
  points: number;
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api`,
    credentials: 'include',
  }),
  tagTypes: ["Team", "Player", "Logs"],
  endpoints: (builder) => ({
    // Active invite (for redirect and dynamic copy)
    getActiveInvite: builder.query<{ hasInvite: boolean; leagueTeamId?: string | null; championship?: { id: string; name: string; subName?: string | null; seasonId?: string }; accepted?: boolean } , void>({
      query: () => `/user/active-invite`,
    }),
    // Upload team logo
    uploadTeamLogo: builder.mutation<any, { id: string; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/teams/${id}/logo`,
          method: 'POST',
          body: formData,
        } as any;
      },
      invalidatesTags: (result, error, { id }) => [{ type: 'Team', id }],
    }),
    getMyLeague: builder.query<{ leagueId: string; teamId: string; teamName?: string | null }, void>({
      query: () => `/user/my-league`,
    }),
    // Apply meta
    getApplyMeta: builder.query<{ teamId: string; seasonId: string; teamName: string; isCaptain: boolean; status?: string }, string>({
      query: (leagueTeamId) => `/apply/${leagueTeamId}/meta`,
    }),
    confirmApply: builder.mutation<{ success: boolean }, { leagueTeamId: string; players: Array<{ id?: string; firstName?: string; lastName?: string; nickname?: string; email?: string; clientId?: string; shirtSize?: string }>; captainId?: string; captainClientId?: string }>({
      query: ({ leagueTeamId, players, captainId, captainClientId }) => ({
        url: `/apply/${leagueTeamId}/confirm`,
        method: 'POST',
        body: { players, captainId, captainClientId },
      }),
    }),
    renameApply: builder.mutation<{ success: boolean; newTeamId: string; newLeagueTeamId: string }, { leagueTeamId: string; newTeamName: string; players: Array<{ id?: string; firstName?: string; lastName?: string; nickname?: string; email?: string; clientId?: string; shirtSize?: string }>; captainId?: string; captainClientId?: string }>({
      query: ({ leagueTeamId, newTeamName, players, captainId, captainClientId }) => ({
        url: `/apply/${leagueTeamId}/rename`,
        method: 'POST',
        body: { newTeamName, players, captainId, captainClientId },
      }),
    }),
    // Decline apply
    declineApply: builder.mutation<{ success: boolean }, { leagueTeamId: string }>({
      query: ({ leagueTeamId }) => ({
        url: `/apply/${leagueTeamId}/decline`,
        method: 'POST',
      }),
    }),
    getSystemLogs: builder.query<{ logs: any[]; pagination: any }, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 50 } = {}) => ({
        url: `/logs?page=${page}&limit=${limit}`,
      }),
      providesTags: ['Logs'],
    }),
    // Player by ID with seasons
    getPlayerById: builder.query<any, string>({
      query: (id) => `/players/${id}`,
      providesTags: (res, err, id) => [{ type: 'Player', id }]
    }),
    // Get all teams
    getTeams: builder.query<Team[], void>({
      query: () => "/teams",
      providesTags: ["Team"],
    }),

    // Get team by ID
    getTeamById: builder.query<Team, string>({
      query: (id) => `/teams/${id}`,
      providesTags: (result, error, id) => [{ type: "Team", id }],
    }),

    // Create new team
    createTeam: builder.mutation<Team, Partial<Team>>({
      query: (team) => ({
        url: "/teams",
        method: "POST",
        body: team,
      }),
      invalidatesTags: ["Team"],
    }),

    // Update team
    updateTeam: builder.mutation<Team, { id: string; team: Partial<Team> }>({
      query: ({ id, team }) => ({
        url: `/teams/${id}`,
        method: "PUT",
        body: team,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Team", id }],
    }),

    // Delete team
    deleteTeam: builder.mutation<void, string>({
      query: (id) => ({
        url: `/teams/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Team"],
    }),

    // Players
    // Season-scoped players for a team
    getTeamPlayersBySeason: builder.query<Player[], { teamId: string; seasonId: string }>({
      query: ({ teamId, seasonId }) => `/teams/${teamId}/players?seasonId=${encodeURIComponent(seasonId)}`,
      providesTags: (result, error, { teamId, seasonId }) => [
        { type: "Team", id: `${teamId}:${seasonId}` },
        { type: "Player", id: `${teamId}:${seasonId}` },
      ],
    }),
    // helper hook name alias for admin usage
    getTeamPlayersBySeason2: builder.query<Player[], { teamId: string; seasonId: string }>({
      query: ({ teamId, seasonId }) => `/teams/${teamId}/players?seasonId=${encodeURIComponent(seasonId)}`,
    }),
    getAvailablePlayersForSeason: builder.query<Player[], { teamId: string; seasonId: string }>({
      query: ({ teamId, seasonId }) => `/teams/${teamId}/players/available?seasonId=${encodeURIComponent(seasonId)}`,
    }),
    assignPlayerToTeamSeason: builder.mutation<{ success: boolean }, { teamId: string; playerId: string; seasonId: string; captain?: boolean }>({
      query: ({ teamId, playerId, seasonId, captain }) => ({
        url: `/teams/${teamId}/players/${playerId}`,
        method: 'POST',
        body: { seasonId, captain },
      }),
      invalidatesTags: (res, err, { teamId, seasonId }) => [
        { type: 'Team', id: `${teamId}:${seasonId}` },
        { type: 'Player', id: `${teamId}:${seasonId}` }
      ]
    }),
    unassignPlayerFromTeamSeason: builder.mutation<{ success: boolean }, { teamId: string; playerId: string; seasonId: string }>({
      query: ({ teamId, playerId, seasonId }) => ({
        url: `/teams/${teamId}/players/${playerId}?seasonId=${encodeURIComponent(seasonId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (res, err, { teamId, seasonId }) => [
        { type: 'Team', id: `${teamId}:${seasonId}` },
        { type: 'Player', id: `${teamId}:${seasonId}` }
      ]
    }),
    createPlayer: builder.mutation<Player, { teamId?: string } & Omit<Player, "id">>({
      query: ({ teamId, ...player }) => ({
        url: "/players",
        method: "POST",
        body: { teamId, ...player },
      }),
      invalidatesTags: (result, error, { teamId }) => ["Player", { type: "Team", id: teamId }],
    }),

    deletePlayer: builder.mutation<void, { id: string; teamId?: string }>({
      query: ({ id }) => ({
        url: `/players/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { teamId }) =>
        teamId ? ["Player", { type: "Team", id: teamId }, { type: "Player", id: teamId }] : ["Player"],
    }),

    // All players or by season
    getPlayers: builder.query<Player[], { seasonId?: string } | void>({
      query: (arg) => arg && (arg as any).seasonId
        ? `/players?seasonId=${encodeURIComponent((arg as any).seasonId)}`
        : `/players`,
      providesTags: ["Player"],
    }),
    searchPlayers: builder.query<Player[], { q: string; teamId?: string; seasonId?: string }>({
      query: ({ q, teamId, seasonId }) => {
        const params = new URLSearchParams({ q });
        if (teamId) params.set('teamId', teamId);
        if (seasonId) params.set('seasonId', seasonId);
        return `/players/search?${params.toString()}`;
      },
    }),
    checkPlayerEmail: builder.query<{ existsInPlayers: boolean; existsInUsers: boolean }, string>({
      query: (email) => `/players/check-email?email=${encodeURIComponent(email)}`,
    }),
    updatePlayer: builder.mutation<Player, { id: string; player: Partial<Player> }>({
      query: ({ id, player }) => ({
        url: `/players/${id}`,
        method: 'PUT',
        body: player,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Player', id }, 'Player'],
    }),
    uploadPlayerImage: builder.mutation<Player, { id: string; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/players/${id}/image`,
          method: 'POST',
          body: formData,
        } as any;
      },
      invalidatesTags: (result, error, { id }) => [{ type: 'Player', id }, 'Player'],
    }),
    sendPlayerInvite: builder.mutation<{ success: boolean }, { id: string }>({
      query: ({ id }) => ({
        url: `/players/${id}/invite`,
        method: 'POST',
      }),
      invalidatesTags: ['Player']
    }),

    // Admin users
    adminGetUsers: builder.query<{ users: any[]; pagination: any }, { page?: number; limit?: number; q?: string }>({
      query: ({ page = 1, limit = 50, q = '' } = {}) => `/admin/users?page=${page}&limit=${limit}&q=${encodeURIComponent(q)}`,
    }),
    adminCreateUser: builder.mutation<{ success: boolean; user?: any }, { email: string; password: string; name?: string; nickname?: string; role?: string; lang?: string }>({
      query: (body) => ({ url: `/admin/users`, method: 'POST', body }),
    }),
    adminUpdateUser: builder.mutation<{ success: boolean; user?: any }, { id: string; name?: string; nickname?: string; role?: string }>({
      query: ({ id, ...rest }) => ({ url: `/admin/users/${id}`, method: 'PUT', body: rest }),
    }),
    adminLinkPlayer: builder.mutation<{ success: boolean; player?: any }, { userId: string; playerId: string }>({
      query: ({ userId, playerId }) => ({ url: `/admin/users/${userId}/link-player/${playerId}`, method: 'POST' }),
    }),
    adminUnlinkPlayer: builder.mutation<{ success: boolean; player?: any }, { userId: string; playerId: string }>({
      query: ({ userId, playerId }) => ({ url: `/admin/users/${userId}/link-player/${playerId}`, method: 'DELETE' }),
    }),
    adminSetPassword: builder.mutation<{ success?: boolean; error?: boolean; message?: string }, { userId: string; newPassword: string }>({
      query: ({ userId, newPassword }) => ({ url: `/admin/users/${userId}/password`, method: 'POST', body: { newPassword } }),
    }),
    adminSendSetPasswordLink: builder.mutation<{ success?: boolean; error?: boolean; message?: string }, { userId: string }>({
      query: ({ userId }) => ({ url: `/admin/users/${userId}/send-set-password`, method: 'POST' }),
    }),
  }),
});

const dataSlice = createSlice({
  name: "data",
  initialState: {
    teams: [] as Team[],
    selectedTeam: null as Team | null,
  },
  reducers: {
    setSelectedTeam: (state, action) => {
      state.selectedTeam = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        apiSlice.endpoints.getTeams.matchFulfilled,
        (state, { payload }) => {
          state.teams = payload;
        },
      )
      .addMatcher(
        apiSlice.endpoints.getTeamById.matchFulfilled,
        (state, { payload }) => {
          state.selectedTeam = payload;
        },
      );
  },
});

export const { setSelectedTeam } = dataSlice.actions;

export const {
  useGetTeamsQuery,
  useGetTeamByIdQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useGetTeamPlayersBySeasonQuery,
  useGetTeamPlayersBySeason2Query,
  useGetAvailablePlayersForSeasonQuery,
  useAssignPlayerToTeamSeasonMutation,
  useUnassignPlayerFromTeamSeasonMutation,
  useCreatePlayerMutation,
  useUpdatePlayerMutation,
  useSendPlayerInviteMutation,
  useDeletePlayerMutation,
  useGetPlayersQuery,
  useGetPlayerByIdQuery,
  useGetApplyMetaQuery,
  useSearchPlayersQuery,
  useConfirmApplyMutation,
  useRenameApplyMutation,
  useGetMyLeagueQuery,
  useUploadPlayerImageMutation,
  useUploadTeamLogoMutation,
  useGetActiveInviteQuery,
  useCheckPlayerEmailQuery,
  useLazyCheckPlayerEmailQuery,
  useDeclineApplyMutation,
  useGetSystemLogsQuery,
  // Admin users hooks
  useAdminGetUsersQuery,
  useAdminCreateUserMutation,
  useAdminUpdateUserMutation,
  useAdminLinkPlayerMutation,
  useAdminUnlinkPlayerMutation,
  useAdminSetPasswordMutation,
  useAdminSendSetPasswordLinkMutation,
} = apiSlice;

export default dataSlice.reducer;
