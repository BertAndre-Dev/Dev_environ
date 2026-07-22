"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import VerifyVisitorForm from "@/components/security/verify-visitor-form";
import ViewVisitorSearch from "@/components/security/view-visitor-search";
import { Card } from "@/components/ui/card";
import { IdCard } from "lucide-react";
import ResidentDetails from "@/components/security/resident-detail";
import ClockedCard from "@/components/security/clockinouttime";
import RecentVisitorInvites from "@/components/security/recent-visitor-invites";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getAllVisitors } from "@/redux/slice/security/visitor/visitor";
import type { RootState, AppDispatch } from "@/redux/store";
import { toast } from "react-toastify";
import type { VisitorDetailsData } from "@/app/dashboard/security/types";
import Loader from "@/components/ui/Loader";
import {
  getVerificationFlags,
  resolveVisitorVerificationDescription,
  resolveVisitorVerificationMode,
} from "@/lib/visitor-verification-mode";
import { VisitorVerificationMode } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
import { readStoredAuth } from "@/utils/auth-storage";

export default function VisitorManagementPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState<string | null>(null);
  const [visitorDetails, setVisitorDetails] =
    useState<VisitorDetailsData | null>(null);
  const [lookupSource, setLookupSource] = useState<"code" | "scan" | null>(
    null,
  );
  const [visitorVerificationMode, setVisitorVerificationMode] = useState(
    VisitorVerificationMode.VIEW_AND_VERIFY,
  );
  const [verificationDescription, setVerificationDescription] = useState<
    string | null
  >(null);

  const authUser = useSelector((state: RootState) => state.auth.user);

  const { allVisitors, loading } = useSelector((state: RootState) => {
    const v = state.securityVisitor;
    return {
      allVisitors: v?.allVisitors ?? null,
      loading: v?.getAllVisitorsStatus === "isLoading",
    };
  });

  const verificationFlags = useMemo(
    () => getVerificationFlags(visitorVerificationMode),
    [visitorVerificationMode],
  );

  useEffect(() => {
    (async () => {
      try {
        const priorUser = (authUser ??
          readStoredAuth()?.user) as Record<string, unknown> | null;
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const rawEstateId =
          data?.estateId ?? data?.estate ?? null;
        const id =
          typeof rawEstateId === "string"
            ? rawEstateId
            : (rawEstateId as { id?: string; _id?: string })?._id ||
              (rawEstateId as { id?: string; _id?: string })?.id ||
              "";

        const mode =
          resolveVisitorVerificationMode(data) ??
          resolveVisitorVerificationMode(priorUser) ??
          VisitorVerificationMode.VIEW_AND_VERIFY;
        setVisitorVerificationMode(mode);
        setVerificationDescription(
          resolveVisitorVerificationDescription(data) ??
            resolveVisitorVerificationDescription(priorUser),
        );

        if (!id) return;
        setEstateId(id);
        await dispatch(
          getAllVisitors({ estateId: id, page: 1, limit: 20 }),
        ).unwrap();
      } catch (err: unknown) {
        toast.error((err as { message?: string })?.message ?? "Failed to load");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const clockedIn =
    visitorDetails?.checkedInAt ??
    visitorDetails?.updatedAt ??
    null;
  const clockedOut = visitorDetails?.checkedOutAt ?? null;

  return (
    <div className="relative">
      {loading && <Loader fullScreen label="Loading visitors..." />}

      <div
        className={`space-y-6${loading ? " pointer-events-none select-none" : ""}`}
      >
      <div className="grid grid-cols-1 gap-4">
        {[
          {
            label: verificationFlags.viewOnly
              ? "Total Views"
              : "Total Verifications",
            value: 0,
            icon: IdCard,
            color: "bg-[#D0DFF280]",
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="font-heading text-2xl font-bold mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <ViewVisitorSearch
        verificationFlags={verificationFlags}
        verificationDescription={verificationDescription}
        onLookupSource={setLookupSource}
        onDetailsLoaded={(visitor) => {
          setVisitorDetails(visitor);
          if (!visitor) setLookupSource(null);
        }}
      />

      {visitorDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VerifyVisitorForm
            visitorDetails={visitorDetails}
            initialCode={visitorDetails?.visitorCode}
            verificationFlags={verificationFlags}
            lookupSource={lookupSource}
            verificationDescription={verificationDescription}
            onVerified={(visitor) => {
              if (visitor) setVisitorDetails(visitor);
              if (estateId) {
                dispatch(
                  getAllVisitors({ estateId, page: 1, limit: 20 }),
                ).catch(() => {});
              }
            }}
          />
          <ResidentDetails visitorDetails={visitorDetails} />
        </div>
      )}

      <ClockedCard
        clockedIn={clockedIn}
        clockedOut={clockedOut}
        initialClockOutCode={visitorDetails?.visitorCode}
      />
      <RecentVisitorInvites visitors={allVisitors?.data ?? []} loading={false} />
      </div>
    </div>
  );
}
