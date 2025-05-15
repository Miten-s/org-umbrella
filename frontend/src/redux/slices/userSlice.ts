import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  currentUser: any | null;
}

const initialState: UserState = {
  currentUser: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<any>) => {
      state.currentUser = action.payload;
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },
     updateCurrentUser: (state, action: PayloadAction<any>) => {
      state.currentUser = action.payload;
    },
  },
});

export const { setCurrentUser, clearCurrentUser,updateCurrentUser } = userSlice.actions;
export default userSlice.reducer;
