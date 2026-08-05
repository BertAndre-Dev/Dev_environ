/**
 * Shared async UI status helpers for Redux thunk state machines.
 *
 * Most slices start as "idle". Page loaders that only check === "isLoading"
 * paint empty UI before useEffect dispatches — treat idle as pending for
 * initial/list fetches; keep mutations on isLoading only.
 */

export type AsyncUiStatus =
  | "idle"
  | "isLoading"
  | "succeeded"
  | "failed"
  | (string & {});

/** Request not finished yet (pre-dispatch idle or in flight). */
export function isPending(
  status: AsyncUiStatus | null | undefined,
): boolean {
  return status == null || status === "idle" || status === "isLoading";
}

/** Mutation / explicit in-flight only (do not treat idle as busy). */
export function isBusy(status: AsyncUiStatus | null | undefined): boolean {
  return status === "isLoading";
}

/** Fetch completed (success or failure). Safe to show empty states. */
export function isSettled(status: AsyncUiStatus | null | undefined): boolean {
  return status === "succeeded" || status === "failed";
}
