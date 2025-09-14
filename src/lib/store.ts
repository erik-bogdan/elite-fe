import { configureStore } from "@reduxjs/toolkit";
import exampleReducer from "./features/exampleSlice";
import dataReducer from "./features/apiSlice";
import menuReducer from "./features/menuSlice";
import { apiSlice } from "./features/apiSlice";
import { championshipApi } from './features/championship/championshipSlice';
import championshipReducer from './features/championship/championshipSlice';
import { seasonApi } from './features/season/seasonSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      example: exampleReducer,
      data: dataReducer,
      menu: menuReducer,
      championship: championshipReducer,
      [apiSlice.reducerPath]: apiSlice.reducer,
      [championshipApi.reducerPath]: championshipApi.reducer,
      [seasonApi.reducerPath]: seasonApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware, championshipApi.middleware, seasonApi.middleware),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
