"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Select from "react-select";
import { toast } from "react-toastify";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api-error";
import type { SubscriptionPlan } from "@/lib/plans";
import { FALLBACK_PLANS } from "@/lib/plans";
import { getPlans } from "@/redux/slice/plans/plans";
import type { AppDispatch } from "@/redux/store";

type Props = {
  value: string;
  onChange: (plan: string) => void;
  disabled?: boolean;
  description?: string;
};

export function InvitePlanSelect({
  value,
  onChange,
  disabled,
  description,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await dispatch(getPlans()).unwrap();
        if (!cancelled) setPlans(list.length ? list : FALLBACK_PLANS);
      } catch (err: unknown) {
        if (cancelled) return;
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
        setPlans(FALLBACK_PLANS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const options = plans.map((plan) => ({
    value: plan.key,
    label: plan.name,
  }));

  let placeholder = "Select plan";
  if (loading) placeholder = "Loading plans...";
  else if (!options.length) placeholder = "No plans available";

  return (
    <div>
      <Label>Plan</Label>
      {description ? (
        <p className="mb-1.5 text-sm text-muted-foreground">{description}</p>
      ) : null}
      <Select
        options={options}
        value={options.find((option) => option.value === value) ?? null}
        onChange={(opt) => onChange(opt?.value ?? "")}
        isLoading={loading}
        isDisabled={disabled}
        placeholder={placeholder}
        noOptionsMessage={() => "No plans available"}
      />
    </div>
  );
}
