import { createSlice } from "@reduxjs/toolkit";
import { setWithdrawalAccount } from "./withdrawal-account";

type LoadState = "idle" | "isLoading" | "succeeded" | "failed";

export interface WithdrawalAccountState {
  setWithdrawalAccountState: LoadState;
  error: string | null;
}

const initialState: WithdrawalAccountState = {
  setWithdrawalAccountState: "idle",
  error: null,
};

function rejectMessage(action: {
  payload?: unknown;
  error?: { message?: string };
}): string | null {
  const payload = action.payload as { message?: string } | undefined;
  return payload?.message || action.error?.message || null;
}

const withdrawalAccountSlice = createSlice({
  name: "withdrawalAccount",
  initialState,
  reducers: {
    clearWithdrawalAccountError: (state) => {
      state.error = null;
    },
    resetWithdrawalAccountState: () => initialState,
  },
  extraReducers(builder) {
    builder
      .addCase(setWithdrawalAccount.pending, (state) => {
        state.setWithdrawalAccountState = "isLoading";
        state.error = null;
      })
      .addCase(setWithdrawalAccount.fulfilled, (state) => {
        state.setWithdrawalAccountState = "succeeded";
        state.error = null;
      })
      .addCase(setWithdrawalAccount.rejected, (state, action) => {
        state.setWithdrawalAccountState = "failed";
        state.error = rejectMessage(action);
      });
  },
});

export const { clearWithdrawalAccountError, resetWithdrawalAccountState } =
  withdrawalAccountSlice.actions;
export default withdrawalAccountSlice.reducer;
