import { createSlice } from "@reduxjs/toolkit";
import { getApiErrorMessage } from "@/lib/api-error";
import { normalizeMarketplaceStatus } from "@/lib/marketplace";
import {
  activateMarketplaceAd,
  approveMarketplaceAd,
  createMarketplaceAd,
  deleteMarketplaceAd,
  getMarketplaceById,
  getMarketplaceEstates,
  getMarketplaceFeed,
  getMyMarketplaceAds,
  getPendingMarketplaceAds,
  rejectMarketplaceAd,
  suspendMarketplaceAd,
  updateMarketplaceAd,
  type MarketplaceAd,
  type MarketplaceTargetEstate,
} from "./marketplace";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export type MarketplacePagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export interface MarketplaceState {
  feed: MarketplaceAd[];
  mine: MarketplaceAd[];
  pending: MarketplaceAd[];
  current: MarketplaceAd | null;
  targetEstates: MarketplaceTargetEstate[];
  feedPagination: MarketplacePagination | null;
  minePagination: MarketplacePagination | null;
  pendingPagination: MarketplacePagination | null;
  targetEstatesPagination: MarketplacePagination | null;
  getFeedStatus: AsyncStatus;
  getMineStatus: AsyncStatus;
  getPendingStatus: AsyncStatus;
  getByIdStatus: AsyncStatus;
  getEstatesStatus: AsyncStatus;
  createStatus: AsyncStatus;
  updateStatus: AsyncStatus;
  moderateStatus: AsyncStatus;
  error: string | null;
}

const initialState: MarketplaceState = {
  feed: [],
  mine: [],
  pending: [],
  current: null,
  targetEstates: [],
  feedPagination: null,
  minePagination: null,
  pendingPagination: null,
  targetEstatesPagination: null,
  getFeedStatus: "idle",
  getMineStatus: "idle",
  getPendingStatus: "idle",
  getByIdStatus: "idle",
  getEstatesStatus: "idle",
  createStatus: "idle",
  updateStatus: "idle",
  moderateStatus: "idle",
  error: null,
};

function paginationFrom(raw: unknown): MarketplacePagination | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  return {
    page: Number(p.page ?? 1),
    limit: Number(p.limit ?? 10),
    total: Number(p.total ?? 0),
    pages: Number(p.pages ?? 0),
  };
}

function adsFrom(payload: unknown): MarketplaceAd[] {
  const data = (payload as { data?: unknown })?.data;
  return Array.isArray(data) ? (data as MarketplaceAd[]) : [];
}

function adFrom(payload: unknown): MarketplaceAd | null {
  const data = (payload as { data?: unknown })?.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as MarketplaceAd;
  }
  return null;
}

function patchById(
  list: MarketplaceAd[],
  id: string,
  patch: Partial<MarketplaceAd>,
): MarketplaceAd[] {
  return list.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

function removeById(list: MarketplaceAd[], id: string): MarketplaceAd[] {
  return list.filter((item) => item.id !== id);
}

const marketplaceSlice = createSlice({
  name: "marketplace",
  initialState,
  reducers: {
    clearMarketplaceCurrent: (state) => {
      state.current = null;
      state.getByIdStatus = "idle";
    },
    resetMarketplaceMutation: (state) => {
      state.createStatus = "idle";
      state.updateStatus = "idle";
      state.moderateStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getMarketplaceFeed.pending, (state) => {
        state.getFeedStatus = "isLoading";
        state.error = null;
      })
      .addCase(getMarketplaceFeed.fulfilled, (state, action) => {
        state.getFeedStatus = "succeeded";
        state.feed = adsFrom(action.payload);
        state.feedPagination = paginationFrom(action.payload?.pagination);
      })
      .addCase(getMarketplaceFeed.rejected, (state, action) => {
        state.getFeedStatus = "failed";
        state.feed = [];
        state.feedPagination = null;
        state.error = getApiErrorMessage(action.payload) ?? null;
      })
      .addCase(getMyMarketplaceAds.pending, (state) => {
        state.getMineStatus = "isLoading";
        state.error = null;
      })
      .addCase(getMyMarketplaceAds.fulfilled, (state, action) => {
        state.getMineStatus = "succeeded";
        state.mine = adsFrom(action.payload);
        state.minePagination = paginationFrom(action.payload?.pagination);
      })
      .addCase(getMyMarketplaceAds.rejected, (state, action) => {
        state.getMineStatus = "failed";
        state.mine = [];
        state.minePagination = null;
        state.error = getApiErrorMessage(action.payload) ?? null;
      })
      .addCase(getPendingMarketplaceAds.pending, (state) => {
        state.getPendingStatus = "isLoading";
        state.error = null;
      })
      .addCase(getPendingMarketplaceAds.fulfilled, (state, action) => {
        state.getPendingStatus = "succeeded";
        state.pending = adsFrom(action.payload);
        state.pendingPagination = paginationFrom(action.payload?.pagination);
      })
      .addCase(getPendingMarketplaceAds.rejected, (state, action) => {
        state.getPendingStatus = "failed";
        state.pending = [];
        state.pendingPagination = null;
        state.error = getApiErrorMessage(action.payload) ?? null;
      })
      .addCase(getMarketplaceById.pending, (state) => {
        state.getByIdStatus = "isLoading";
        state.error = null;
      })
      .addCase(getMarketplaceById.fulfilled, (state, action) => {
        state.getByIdStatus = "succeeded";
        state.current = adFrom(action.payload);
      })
      .addCase(getMarketplaceById.rejected, (state, action) => {
        state.getByIdStatus = "failed";
        state.current = null;
        state.error = getApiErrorMessage(action.payload) ?? null;
      })
      .addCase(getMarketplaceEstates.pending, (state) => {
        state.getEstatesStatus = "isLoading";
        state.error = null;
      })
      .addCase(getMarketplaceEstates.fulfilled, (state, action) => {
        state.getEstatesStatus = "succeeded";
        const data = action.payload?.data;
        state.targetEstates = Array.isArray(data)
          ? (data as MarketplaceTargetEstate[])
          : [];
        state.targetEstatesPagination = paginationFrom(
          action.payload?.pagination,
        );
      })
      .addCase(getMarketplaceEstates.rejected, (state, action) => {
        state.getEstatesStatus = "failed";
        state.targetEstates = [];
        state.targetEstatesPagination = null;
        state.error = getApiErrorMessage(action.payload) ?? null;
      })
      .addCase(createMarketplaceAd.pending, (state) => {
        state.createStatus = "isLoading";
        state.error = null;
      })
      .addCase(createMarketplaceAd.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        const created = adFrom(action.payload);
        if (created) {
          state.mine = [created, ...state.mine];
          if (state.minePagination) {
            state.minePagination.total += 1;
          }
        }
      })
      .addCase(createMarketplaceAd.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      })
      .addCase(updateMarketplaceAd.pending, (state) => {
        state.updateStatus = "isLoading";
        state.error = null;
      })
      .addCase(updateMarketplaceAd.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        const updated = adFrom(action.payload);
        if (!updated?.id) return;
        state.mine = patchById(state.mine, updated.id, updated);
        state.pending = patchById(state.pending, updated.id, updated);
        const nextStatus = normalizeMarketplaceStatus(updated.status);
        if (nextStatus !== "ACTIVE") {
          state.feed = removeById(state.feed, updated.id);
        } else {
          state.feed = patchById(state.feed, updated.id, updated);
        }
        if (state.current?.id === updated.id) {
          state.current = { ...state.current, ...updated };
        }
      })
      .addCase(updateMarketplaceAd.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      })
      .addCase(approveMarketplaceAd.pending, (state) => {
        state.moderateStatus = "isLoading";
        state.error = null;
      })
      .addCase(approveMarketplaceAd.fulfilled, (state, action) => {
        state.moderateStatus = "succeeded";
        const id = action.payload?.marketPlaceId as string | undefined;
        const updated = adFrom(action.payload);
        const patch = updated
          ? { ...updated, status: updated.status ?? "ACTIVE" }
          : { status: "ACTIVE" };
        if (!id) return;
        state.pending = removeById(state.pending, id);
        state.mine = patchById(state.mine, id, patch);
        if (state.pendingPagination) {
          state.pendingPagination.total = Math.max(
            0,
            state.pendingPagination.total - 1,
          );
        }
      })
      .addCase(approveMarketplaceAd.rejected, (state, action) => {
        state.moderateStatus = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      })
      .addCase(rejectMarketplaceAd.pending, (state) => {
        state.moderateStatus = "isLoading";
        state.error = null;
      })
      .addCase(rejectMarketplaceAd.fulfilled, (state, action) => {
        state.moderateStatus = "succeeded";
        const id = action.payload?.marketPlaceId as string | undefined;
        const updated = adFrom(action.payload);
        const patch = updated
          ? { ...updated, status: updated.status ?? "REJECTED" }
          : { status: "REJECTED" };
        if (!id) return;
        state.pending = removeById(state.pending, id);
        state.mine = patchById(state.mine, id, patch);
        if (state.pendingPagination) {
          state.pendingPagination.total = Math.max(
            0,
            state.pendingPagination.total - 1,
          );
        }
      })
      .addCase(rejectMarketplaceAd.rejected, (state, action) => {
        state.moderateStatus = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      })
      .addCase(suspendMarketplaceAd.fulfilled, (state, action) => {
        const id = action.payload?.marketPlaceId as string | undefined;
        if (!id) return;
        const patch = { status: "SUSPENDED" };
        state.feed = removeById(state.feed, id);
        state.mine = patchById(state.mine, id, patch);
        state.pending = patchById(state.pending, id, patch);
        if (state.current?.id === id) state.current.status = "SUSPENDED";
      })
      .addCase(activateMarketplaceAd.fulfilled, (state, action) => {
        const id = action.payload?.marketPlaceId as string | undefined;
        if (!id) return;
        const patch = { status: "ACTIVE" };
        state.mine = patchById(state.mine, id, patch);
        if (state.current?.id === id) state.current.status = "ACTIVE";
      })
      .addCase(deleteMarketplaceAd.fulfilled, (state, action) => {
        const id = (action.payload as { deletedId?: string })?.deletedId;
        if (!id) return;
        state.feed = removeById(state.feed, id);
        state.mine = removeById(state.mine, id);
        state.pending = removeById(state.pending, id);
        if (state.current?.id === id) state.current = null;
        if (state.minePagination) {
          state.minePagination.total = Math.max(0, state.minePagination.total - 1);
        }
      });
  },
});

export const { clearMarketplaceCurrent, resetMarketplaceMutation } =
  marketplaceSlice.actions;
export default marketplaceSlice.reducer;
