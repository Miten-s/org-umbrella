import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthenticatedUser } from "@/types/common.types";

interface UserState {
  currentUser: AuthenticatedUser | null;
}

const initialState: UserState = {
  currentUser: null
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setCurrentUser: (
      state,
      action: PayloadAction<AuthenticatedUser | null>
    ) => {
      state.currentUser = action.payload;
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },
    updateCurrentUser: (state, action: PayloadAction<AuthenticatedUser>) => {
      state.currentUser = action.payload;
    }
  }
});

export const { setCurrentUser, clearCurrentUser, updateCurrentUser } =
  userSlice.actions;
export default userSlice.reducer;
