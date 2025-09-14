import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Season {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface CreateSeasonRequest {
  name: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateSeasonRequest extends Partial<CreateSeasonRequest> {
  id: string;
  isActive?: boolean;
}

export const seasonApi = createApi({
  reducerPath: 'seasonApi',
  baseQuery: fetchBaseQuery({
    // A szezon endpoint nem az /api alatt fut és külön szolgáltatáson lehet
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_HOST || 'http://localhost:3001',
  }),
  tagTypes: ['Season'],
  endpoints: (builder) => ({
    getSeasons: builder.query<Season[], void>({
      query: () => '/season',
      providesTags: ['Season'],
    }),
    getSeasonById: builder.query<Season, number>({
      query: (id) => `/season/${id}`,
      providesTags: ['Season'],
    }),
    createSeason: builder.mutation<Season, CreateSeasonRequest>({
      query: (data) => ({
        url: '/season',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Season'],
    }),
    updateSeason: builder.mutation<Season, UpdateSeasonRequest>({
      query: ({ id, ...data }) => ({
        url: `/season/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Season'],
    }),
    deleteSeason: builder.mutation<void, string>({
      query: (id) => ({
        url: `/season/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Season'],
    }),
  }),
});

export const {
  useGetSeasonsQuery,
  useGetSeasonByIdQuery,
  useCreateSeasonMutation,
  useUpdateSeasonMutation,
  useDeleteSeasonMutation,
} = seasonApi; 