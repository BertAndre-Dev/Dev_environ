"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Loader from "@/components/ui/Loader";
import type { AppDispatch } from "@/redux/store";
import {
  getEstateVendLimits,
  setEstateVendLimits,
} from "@/redux/slice/estate-admin/transaction/transaction";

const FALLBACK_MAX = 250000;

type Props = Readonly<{
  open: boolean;
  estateId: string;
  onClose: () => void;
  onSuccess?: () => void;
}>;

export function SetVendLimitModal({
  open,
  estateId,
  onClose,
  onSuccess,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [minVendAmount, setMinVendAmount] = useState("");
  const [maxVendAmount, setMaxVendAmount] = useState("");
  const [defaultMax, setDefaultMax] = useState(FALLBACK_MAX);

  useEffect(() => {
    if (!open || !estateId) return;

    let cancelled = false;
    (async () => {
      try {
        setLoadingInitial(true);
        const res = await dispatch(getEstateVendLimits({ estateId })).unwrap();
        if (cancelled) return;
        const data = res?.data;
        if (data) {
          setMinVendAmount(String(data.minVendAmount ?? ""));
          setMaxVendAmount(String(data.maxVendAmount ?? ""));
          setDefaultMax(
            data.defaults?.maxVendAmount ?? FALLBACK_MAX,
          );
        }
      } catch (err: unknown) {
        if (!cancelled) {
          toast.error(
            (err as { message?: string })?.message ??
              "Failed to load current vend limits.",
          );
        }
      } finally {
        if (!cancelled) setLoadingInitial(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, estateId, dispatch]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const min = Number(minVendAmount);
    const max = Number(maxVendAmount);

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      toast.error("Enter valid minimum and maximum amounts.");
      return;
    }
    if (min < 1) {
      toast.error("Minimum vend amount must be at least ₦1.");
      return;
    }
    if (max < min) {
      toast.error("Maximum must be greater than or equal to minimum.");
      return;
    }
    if (max > defaultMax) {
      toast.error(
        `Maximum vend amount cannot exceed ₦${defaultMax.toLocaleString()}.`,
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await dispatch(
        setEstateVendLimits({
          estateId,
          minVendAmount: min,
          maxVendAmount: max,
        }),
      ).unwrap();
      toast.success(res?.message ?? "Vend limits updated successfully.");
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ??
          "Failed to update vend limits.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={open}
      onClose={onClose}
      contentClassName="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5 pr-6">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">
            Set / update vend limits
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure the minimum and maximum amounts residents can vend.
          </p>
        </div>

        {loadingInitial ? (
          <div className="py-10">
            <Loader label="Loading current limits..." />
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="min-vend-amount">Minimum vend amount (₦)</Label>
              <Input
                id="min-vend-amount"
                type="number"
                min={1}
                step={1}
                value={minVendAmount}
                onChange={(e) => setMinVendAmount(e.target.value)}
                disabled={submitting}
                placeholder="e.g. 500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="max-vend-amount">Maximum vend amount (₦)</Label>
              <Input
                id="max-vend-amount"
                type="number"
                min={1}
                max={defaultMax}
                step={1}
                value={maxVendAmount}
                onChange={(e) => setMaxVendAmount(e.target.value)}
                disabled={submitting}
                placeholder={`e.g. ${defaultMax.toLocaleString()}`}
                required
              />
              <p className="text-xs text-muted-foreground">
                Maximum cannot exceed ₦{defaultMax.toLocaleString()}.
              </p>
            </div>
          </>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loadingInitial || submitting}
            className="cursor-pointer"
          >
            {submitting ? "Saving..." : "Save limits"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
