"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { getBill } from "@/redux/slice/admin/bills-mgt/bills";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  formatAmountInput,
  parseFormattedNumber,
} from "@/lib/format-number";

/** Form state: yearlyAmount can be string (empty input) or number */
interface BillFormState {
  estateId: string;
  name: string;
  description: string;
  yearlyAmount: number | string;
  compulsory: boolean;
  id?: string;
}

/** Payload passed to onSubmit: yearlyAmount is always number */
export interface BillSubmitData {
  estateId: string;
  name: string;
  description: string;
  yearlyAmount: number;
  compulsory?: boolean;
  id?: string;
}

interface BillsFormProps {
  estateId: string;
  initialData?: BillSubmitData | null;
  onSubmit: (data: BillSubmitData) => void | Promise<void>;
}

export default function BillsForm({ estateId, initialData, onSubmit }: BillsFormProps) {
  const [formData, setFormData] = useState<BillFormState>({
    estateId,
    name: "",
    description: "",
    yearlyAmount: "",
    compulsory: false,
  });
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  // Fetch bill if editing
  useEffect(() => {
    const fetchExistingBill = async () => {
      if (!initialData?.id) return;

      try {
        setLoading(true);
        const res = await dispatch(getBill(initialData.id)).unwrap();
        const fetchData = res?.data;

        if (fetchData) {
          setFormData({
            estateId: estateId,
            id: fetchData.id,
            name: fetchData.name || "",
            description: fetchData.description || "",
            yearlyAmount: fetchData.yearlyAmount
              ? formatAmountInput(String(fetchData.yearlyAmount))
              : "",
            compulsory: Boolean(fetchData.compulsory),
          });
        }
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingBill();
  }, [dispatch, estateId, initialData]);

  const handleChange = (
    field: keyof BillFormState,
    value: string | number | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: BillSubmitData = {
      estateId: formData.estateId,
      name: formData.name,
      description: formData.description,
      yearlyAmount: parseFormattedNumber(formData.yearlyAmount),
      compulsory: formData.compulsory,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader className="px-0 md:px-0">
        <CardTitle className="text-lg pb-2 pt-2 font-semibold">
          {initialData?.id ? "Update Estate Bill" : "Create Estate Bill"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 px-0 md:px-0">
        {loading ? (
          <p className="text-gray-500 italic">Loading...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                type="text"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Yearly Amount (₦)</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={formData.yearlyAmount}
                onChange={(e) =>
                  handleChange("yearlyAmount", formatAmountInput(e.target.value))
                }
                placeholder="1,200,000"
                required
              />
            </div>

            <div className="flex items-start gap-3">
              <input
                id="estate-bill-compulsory"
                type="checkbox"
                checked={formData.compulsory}
                onChange={(e) => handleChange("compulsory", e.target.checked)}
                className="mt-1 rounded border-input"
              />
              <div>
                <Label
                  htmlFor="estate-bill-compulsory"
                  className="cursor-pointer font-medium"
                >
                  Compulsory bill
                </Label>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4">
          <Button type="submit" className="w-full" disabled={!formData.name.trim()}>
            {initialData?.id ? "Update Bill" : "Create Bill"}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}
