"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Select from "react-select";
import { toast } from "react-toastify";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api-error";
import { labelForEstateModule } from "@/lib/estate-module-labels";
import type { SubscriptionPlan } from "@/lib/plans";
import { FALLBACK_PLANS, formatPlanRate } from "@/lib/plans";
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
  const [plans, setPlans] = useState<SubscriptionPlan[]>(FALLBACK_PLANS);
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
  const selected = plans.find((plan) => plan.key === value) ?? null;
  const rate = selected ? formatPlanRate(selected) : "";

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

      {selected ? (
        <div className="mt-3 space-y-2">
          {rate ? <p className="text-sm font-medium text-foreground">{rate}</p> : null}
          {selected.description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {selected.description}
            </p>
          ) : null}
          {selected.modules.length ? (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">
                Included modules ({selected.modules.length})
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {selected.modules.map((moduleKey) => (
                  <li
                    key={moduleKey}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground"
                  >
                    {labelForEstateModule(moduleKey)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
