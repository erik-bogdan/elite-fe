import { createSlice } from "@reduxjs/toolkit";

interface MenuState {
  open: boolean;
}

const isDesktop = typeof window !== "undefined" && window.innerWidth >= 900;

const initialState: MenuState = {
  open: isDesktop,
};

export const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    openMenu: (state) => {
      state.open = true;
    },
    closeMenu: (state) => {
      state.open = false;
    },
    toggleMenu: (state) => {
      state.open = !state.open;
    },
  },
});

export const { openMenu, closeMenu, toggleMenu } = menuSlice.actions;
export default menuSlice.reducer;
