import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ExampleState {
  count: number;
  message: string;
}

const initialState: ExampleState = {
  count: 0,
  message: "Hello from Redux!",
};

export const exampleSlice = createSlice({
  name: "example",
  initialState,
  reducers: {
    increment: (state) => {
      state.count += 1;
    },
    decrement: (state) => {
      state.count -= 1;
    },
    setMessage: (state, action: PayloadAction<string>) => {
      state.message = action.payload;
    },
  },
});

export const { increment, decrement, setMessage } = exampleSlice.actions;
export default exampleSlice.reducer;
