import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import { getMeterByAddress } from "@/redux/slice/resident/meter-mgt/meter-mgt";
import {
  getAddressIdsFromUser,
  normalizeMeterFromApiResponse,
  type MeterLookupUser,
} from "@/lib/user-address-meters";

export function useUserListMeterNumbers(users: MeterLookupUser[]) {
  const dispatch = useDispatch<AppDispatch>();
  const [meterByAddressId, setMeterByAddressId] = useState<
    Record<string, string | null>
  >({});
  const [loading, setLoading] = useState(false);

  const addressIds = useMemo(() => {
    const ids = new Set<string>();
    users.forEach((user) => {
      getAddressIdsFromUser(user).forEach((id) => ids.add(id));
    });
    return Array.from(ids);
  }, [users]);

  const addressIdsKey = addressIds.join(",");

  useEffect(() => {
    if (!addressIds.length) {
      setMeterByAddressId({});
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const entries = await Promise.all(
          addressIds.map(async (addressId) => {
            try {
              const res = await dispatch(
                getMeterByAddress({ addressId }),
              ).unwrap();
              return [
                addressId,
                normalizeMeterFromApiResponse(res),
              ] as const;
            } catch {
              return [addressId, null] as const;
            }
          }),
        );

        if (!cancelled) {
          setMeterByAddressId(Object.fromEntries(entries));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dispatch, addressIdsKey]);

  return { meterByAddressId, loading };
}
