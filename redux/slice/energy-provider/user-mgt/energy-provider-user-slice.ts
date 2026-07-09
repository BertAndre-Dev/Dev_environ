import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import {
  activateEnergyProviderUser,
  deleteEnergyProviderUser,
  getEnergyProviderUser,
  getEnergyProviderUsersByCompany,
  getEnergyProviderUsersByEstate,
  suspendEnergyProviderUser,
} from "./energy-provider-user";

export interface EnergyProviderUserDetails {
  firstName: string;
  lastName: string;
  email: string;
  countryCode?: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
  address?: string;
  role: string;
  image?: string;
  isActive?: boolean;
  serviceCharge?: boolean;
  invitationStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  id?: string;
  _id?: string;
}

export interface Pagination {
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export interface AllEnergyProviderUsersResponse {
  success: boolean;
  message: string;
  data: EnergyProviderUserDetails[];
  pagination: Pagination;
}

export interface EnergyProviderUserState {
  activateUserStatus: "idle" | "isLoading" | "succeeded" | "failed";
  suspendUserStatus: "idle" | "isLoading" | "succeeded" | "failed";
  deleteUserStatus: "idle" | "isLoading" | "succeeded" | "failed";
  getUsersStatus: "idle" | "isLoading" | "succeeded" | "failed";
  getUserStatus: "idle" | "isLoading" | "succeeded" | "failed";
  user: EnergyProviderUserDetails | null;
  allUsers: AllEnergyProviderUsersResponse | null;
  error: string | null;
}

const initialState: EnergyProviderUserState = {
  activateUserStatus: "idle",
  suspendUserStatus: "idle",
  deleteUserStatus: "idle",
  getUsersStatus: "idle",
  getUserStatus: "idle",
  user: null,
  allUsers: null,
  error: null,
};

function userId(u: EnergyProviderUserDetails) {
  return u.id || u._id || "";
}

const energyProviderUserSlice = createSlice({
  name: "energyProviderUser",
  initialState,
  reducers: {
    clearEnergyProviderUserError: (state) => {
      state.error = null;
    },
    resetEnergyProviderUserState: (state) => {
      state.getUsersStatus = "idle";
      state.error = null;
    },
    clearEnergyProviderUsers: (state) => {
      state.allUsers = null;
      state.user = null;
      state.getUsersStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const handleUsersPending = (state: EnergyProviderUserState) => {
      state.getUsersStatus = "isLoading";
      state.error = null;
    };
    const handleUsersFulfilled = (
      state: EnergyProviderUserState,
      action: {
        payload?: {
          success?: boolean;
          message?: string;
          data?: EnergyProviderUserDetails[];
          pagination?: Partial<Pagination>;
        };
      },
    ) => {
      state.getUsersStatus = "succeeded";
      const pagination = action.payload?.pagination;
      state.allUsers = {
        success: action.payload?.success ?? true,
        message: action.payload?.message ?? "Users retrieved successfully",
        data: action.payload?.data ?? [],
        pagination: {
          total: pagination?.total ?? action.payload?.data?.length ?? 0,
          currentPage: Number(pagination?.currentPage) || 1,
          totalPages: Number(pagination?.totalPages) || 1,
          pageSize: Number(pagination?.pageSize) || 10,
        },
      };
    };
    const handleUsersRejected = (
      state: EnergyProviderUserState,
      action: { payload?: unknown; error: { message?: string } },
    ) => {
      state.getUsersStatus = "failed";
      state.error =
        (action.payload as { message?: string } | undefined)?.message ??
        action.error.message ??
        "Failed to fetch users";
    };

    builder
      .addCase(getEnergyProviderUsersByEstate.pending, handleUsersPending)
      .addCase(getEnergyProviderUsersByEstate.fulfilled, handleUsersFulfilled)
      .addCase(getEnergyProviderUsersByEstate.rejected, handleUsersRejected)
      .addCase(getEnergyProviderUsersByCompany.pending, handleUsersPending)
      .addCase(getEnergyProviderUsersByCompany.fulfilled, handleUsersFulfilled)
      .addCase(getEnergyProviderUsersByCompany.rejected, handleUsersRejected);

    builder
      .addCase(getEnergyProviderUser.pending, (state) => {
        state.getUserStatus = "isLoading";
      })
      .addCase(getEnergyProviderUser.fulfilled, (state, action) => {
        state.getUserStatus = "succeeded";
        state.user = action.payload?.data ?? null;
      })
      .addCase(getEnergyProviderUser.rejected, (state, action) => {
        state.getUserStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to fetch user";
      });

    builder
      .addCase(activateEnergyProviderUser.pending, (state) => {
        state.activateUserStatus = "isLoading";
      })
      .addCase(activateEnergyProviderUser.fulfilled, (state, action) => {
        state.activateUserStatus = "succeeded";
        const updated = action.payload?.data as EnergyProviderUserDetails | undefined;
        if (updated && state.allUsers?.data) {
          const id = userId(updated);
          state.allUsers.data = state.allUsers.data.map((u) =>
            userId(u) === id ? { ...u, ...updated, isActive: true } : u,
          );
        }
      })
      .addCase(activateEnergyProviderUser.rejected, (state, action) => {
        state.activateUserStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to activate user";
      });

    builder
      .addCase(suspendEnergyProviderUser.pending, (state) => {
        state.suspendUserStatus = "isLoading";
      })
      .addCase(suspendEnergyProviderUser.fulfilled, (state, action) => {
        state.suspendUserStatus = "succeeded";
        const updated = action.payload?.data as EnergyProviderUserDetails | undefined;
        if (updated && state.allUsers?.data) {
          const id = userId(updated);
          state.allUsers.data = state.allUsers.data.map((u) =>
            userId(u) === id ? { ...u, ...updated, isActive: false } : u,
          );
        }
      })
      .addCase(suspendEnergyProviderUser.rejected, (state, action) => {
        state.suspendUserStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to suspend user";
      });

    builder
      .addCase(deleteEnergyProviderUser.pending, (state) => {
        state.deleteUserStatus = "isLoading";
      })
      .addCase(deleteEnergyProviderUser.fulfilled, (state, action) => {
        state.deleteUserStatus = "succeeded";
        const deletedId = (action.payload as { deletedId?: string })?.deletedId;
        if (deletedId && state.allUsers?.data) {
          state.allUsers.data = state.allUsers.data.filter(
            (u) => userId(u) !== deletedId,
          );
          state.allUsers.pagination.total = Math.max(
            0,
            state.allUsers.pagination.total - 1,
          );
        }
      })
      .addCase(deleteEnergyProviderUser.rejected, (state, action) => {
        state.deleteUserStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to delete user";
      });
  },
});

export const {
  clearEnergyProviderUserError,
  resetEnergyProviderUserState,
  clearEnergyProviderUsers,
} = energyProviderUserSlice.actions;
export default energyProviderUserSlice.reducer;

export const selectEnergyProviderUserState = (
  state: RootState,
): EnergyProviderUserState =>
  state.energyProviderUser ?? initialState;

export const selectEnergyProviderUsersList = (state: RootState) =>
  selectEnergyProviderUserState(state).allUsers?.data ?? [];

export const selectEnergyProviderUsersPagination = (state: RootState) =>
  selectEnergyProviderUserState(state).allUsers?.pagination ?? null;

export const selectEnergyProviderUsersLoading = (state: RootState) =>
  selectEnergyProviderUserState(state).getUsersStatus === "isLoading";
