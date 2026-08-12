"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import RequestManagementView from "@/components/request-mgt/RequestManagementView";
import RequestWorkflowConfigPanel from "@/components/request-mgt/RequestWorkflowConfigPanel";
import { getApiErrorMessage } from "@/lib/api-error";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import type { AppDispatch } from "@/redux/store";
import { parseCompanyFromUser } from "../lib/company";
import {
  mapCompanyEstateRows,
  parseCompanyEstates,
  type EstateOption,
} from "../asset/lib/estate";

type EstateSelectOption = { label: string; value: string };

export default function CompanyRequestPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [companyName, setCompanyName] = useState("Company");
  const [estates, setEstates] = useState<EstateOption[]>([]);
  const [selectedEstate, setSelectedEstate] =
    useState<EstateSelectOption | null>(null);
  const [estatesLoading, setEstatesLoading] = useState(true);
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);

  const estateOptions = useMemo<EstateSelectOption[]>(
    () => estates.map((e) => ({ label: e.name, value: e.id })),
    [estates],
  );

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const company = parseCompanyFromUser(data);
        if (!company) {
          toast.warning("No company linked to your account.");
          setEstatesLoading(false);
          return;
        }
        setCompanyName(company.name);

        let options: EstateOption[] = [];
        try {
          const res = await dispatch(
            getCompanyEstates({ page: 1, limit: 200 }),
          ).unwrap();
          options = mapCompanyEstateRows(res?.data);
        } catch (err: unknown) {
          const message = getApiErrorMessage(err);
          if (message) toast.error(message);
        }
        if (!options.length) options = parseCompanyEstates(data);

        setEstates(options);
        if (options.length) {
          setSelectedEstate({ label: options[0].name, value: options[0].id });
        }
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setEstatesLoading(false);
      }
    })();
  }, [dispatch]);

  const estateId = selectedEstate?.value ?? null;

  return (
    <RequestManagementView
      scope="company"
      description={
        <span>
          Configure approval workflows and review estate requests for{" "}
          <span className="font-bold uppercase underline text-foreground">
            {companyName}
          </span>
          .
        </span>
      }
      estateId={estateId}
      estateOptions={estateOptions}
      selectedEstate={selectedEstate}
      onEstateChange={(next) => {
        setWorkflowModalOpen(false);
        setSelectedEstate(next);
      }}
      estatesLoading={estatesLoading}
      emptyHint="No requests found for this estate."
      headerActions={
        <Button
          onClick={() => setWorkflowModalOpen(true)}
          disabled={!estateId}
          className="shrink-0 rounded-full active:scale-[0.97] transition-transform duration-100 ease-out"
        >
          <Settings2 className="w-4 h-4 mr-2" />
          Set workflow
        </Button>
      }
      beforeList={
        estateId ? (
          <RequestWorkflowConfigPanel
            estateId={estateId}
            enabled={!estatesLoading}
            compact
            estateLabel={selectedEstate?.label}
            hideHeaderButton
            open={workflowModalOpen}
            onOpenChange={setWorkflowModalOpen}
          />
        ) : null
      }
    />
  );
}
