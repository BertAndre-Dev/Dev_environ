import { createSlice } from "@reduxjs/toolkit";
import {
  confirmFlutterwaveBvn,
  createFlutterwaveVirtualAccount,
  getFlutterwaveBvnStatus,
  getFlutterwaveVirtualAccount,
  initiateFlutterwaveBvn,
  type BvnVerificationStatus,
  type FlutterwaveVirtualAccount,
} from "./flutterwave-va";

type LoadState = "idle" | "isLoading" | "succeeded" | "failed";

export interface ResidentFlutterwaveVaState {
  getBvnStatusState: LoadState;
  initiateBvnState: LoadState;
  confirmBvnState: LoadState;
  getVirtualAccountState: LoadState;
  createVirtualAccountState: LoadState;
  bvnStatus: BvnVerificationStatus | null;
  virtualAccount: FlutterwaveVirtualAccount | null;
  pendingConsentReference: string | null;
  error: string | null;
}

const initialState: ResidentFlutterwaveVaState = {
  getBvnStatusState: "idle",
  initiateBvnState: "idle",
  confirmBvnState: "idle",
  getVirtualAccountState: "idle",
  createVirtualAccountState: "idle",
  bvnStatus: null,
  virtualAccount: null,
  pendingConsentReference: null,
  error: null,
};

function rejectMessage(action: {
  payload?: unknown;
  error?: { message?: string };
}): string | null {
  const payload = action.payload as { message?: string } | undefined;
  return payload?.message || action.error?.message || null;
}

const residentFlutterwaveVaSlice = createSlice({
  name: "residentFlutterwaveVa",
  initialState,
  reducers: {
    clearFlutterwaveVaError: (state) => {
      state.error = null;
    },
    setPendingConsentReference: (state, action: { payload: string | null }) => {
      state.pendingConsentReference = action.payload;
    },
    resetFlutterwaveVa: () => initialState,
  },
  extraReducers(builder) {
    builder
      .addCase(getFlutterwaveBvnStatus.pending, (state) => {
        state.getBvnStatusState = "isLoading";
        state.error = null;
      })
      .addCase(getFlutterwaveBvnStatus.fulfilled, (state, action) => {
        state.getBvnStatusState = "succeeded";
        state.bvnStatus = action.payload;
      })
      .addCase(getFlutterwaveBvnStatus.rejected, (state, action) => {
        state.getBvnStatusState = "failed";
        state.error = rejectMessage(action);
      })

      .addCase(initiateFlutterwaveBvn.pending, (state) => {
        state.initiateBvnState = "isLoading";
        state.error = null;
      })
      .addCase(initiateFlutterwaveBvn.fulfilled, (state, action) => {
        state.initiateBvnState = "succeeded";
        state.pendingConsentReference = action.payload.reference;
      })
      .addCase(initiateFlutterwaveBvn.rejected, (state, action) => {
        state.initiateBvnState = "failed";
        state.error = rejectMessage(action);
      })

      .addCase(confirmFlutterwaveBvn.pending, (state) => {
        state.confirmBvnState = "isLoading";
        state.error = null;
      })
      .addCase(confirmFlutterwaveBvn.fulfilled, (state, action) => {
        state.confirmBvnState = "succeeded";
        state.bvnStatus = action.payload;
        state.pendingConsentReference = null;
      })
      .addCase(confirmFlutterwaveBvn.rejected, (state, action) => {
        state.confirmBvnState = "failed";
        state.error = rejectMessage(action);
      })

      .addCase(getFlutterwaveVirtualAccount.pending, (state) => {
        state.getVirtualAccountState = "isLoading";
        state.error = null;
      })
      .addCase(getFlutterwaveVirtualAccount.fulfilled, (state, action) => {
        state.getVirtualAccountState = "succeeded";
        state.virtualAccount = action.payload;
      })
      .addCase(getFlutterwaveVirtualAccount.rejected, (state, action) => {
        state.getVirtualAccountState = "failed";
        state.error = rejectMessage(action);
      })

      .addCase(createFlutterwaveVirtualAccount.pending, (state) => {
        state.createVirtualAccountState = "isLoading";
        state.error = null;
      })
      .addCase(createFlutterwaveVirtualAccount.fulfilled, (state, action) => {
        state.createVirtualAccountState = "succeeded";
        state.virtualAccount = action.payload;
      })
      .addCase(createFlutterwaveVirtualAccount.rejected, (state, action) => {
        state.createVirtualAccountState = "failed";
        state.error = rejectMessage(action);
      });
  },
});

export const {
  clearFlutterwaveVaError,
  setPendingConsentReference,
  resetFlutterwaveVa,
} = residentFlutterwaveVaSlice.actions;

export default residentFlutterwaveVaSlice.reducer;
