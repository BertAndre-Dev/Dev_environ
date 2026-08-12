"use client";

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import ReassignMeterForm from "@/components/meter/ReassignMeterForm";

type Props = {
  meterNumber: string;
  companyId: string;
  /** Current estate when reassigning away from an estate. */
  estateId?: string;
  close: () => void;
  refresh: () => void;
};

/**
 * Company: assign meters from company inventory to an estate
 * (or reassign between estates) via PUT /api/v1/meters/reassign-meter.
 */
export default function CompanyAssignMeterToEstateForm({
  meterNumber,
  companyId,
  estateId,
  close,
  refresh,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();

  const { estateOptions, estatesLoading } = useSelector(
    (state: RootState) => {
      const estates = state.companyEstate.allEstates?.data ?? [];
      const options = estates
        .map((e) => {
          const value = String(e.id ?? e._id ?? "").trim();
          if (!value) return null;
          return { value, label: e.name ?? "Unnamed estate" };
        })
        .filter((o): o is { label: string; value: string } => Boolean(o))
        .sort((a, b) => a.label.localeCompare(b.label));

      return {
        estateOptions: options,
        estatesLoading: state.companyEstate.getAllEstatesStatus === "isLoading",
      };
    },
  );

  useEffect(() => {
    if (estateOptions.length > 0 || estatesLoading) return;
    dispatch(getCompanyEstates({ page: 1, limit: 500 }));
  }, [dispatch, estateOptions.length, estatesLoading]);

  const title = useMemo(
    () => (estateId ? "Reassign to estate" : "Assign to estate"),
    [estateId],
  );

  return (
    <ReassignMeterForm
      meterNumber={meterNumber}
      companyId={companyId}
      estateId={estateId}
      estateOptions={estateOptions}
      estatesLoading={estatesLoading}
      close={close}
      refresh={refresh}
      title={title}
    />
  );
}
