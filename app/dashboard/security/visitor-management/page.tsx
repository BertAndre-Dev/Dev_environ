"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye, ShieldCheck } from "lucide-react";
import RecentVisitorInvites from "@/components/security/recent-visitor-invites";
import ViewVisitorModal from "@/components/security/ViewVisitorModal";
import VerifyModal from "@/components/security/VerifyModal";
import ClockOutCard from "@/components/security/ClockOutCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/ui/Loader";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getAllVisitors } from "@/redux/slice/security/visitor/visitor";
import type { RootState, AppDispatch } from "@/redux/store";
import { toast } from "react-toastify";
import type { VisitorDetailsData } from "@/app/dashboard/security/types";
import {
  getVerificationFlags,
  resolveVisitorVerificationDescription,
  resolveVisitorVerificationMode,
} from "@/lib/visitor-verification-mode";
import { VisitorVerificationMode } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
import { readStoredAuth } from "@/utils/auth-storage";

function readInitialVerificationMode(): VisitorVerificationMode | null {
  if (typeof window === "undefined") return null;
  return resolveVisitorVerificationMode(
    readStoredAuth()?.user as Record<string, unknown> | null,
  );
}

export default function VisitorManagementPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState<string | null>(null);
  const [visitorDetails, setVisitorDetails] =
    useState<VisitorDetailsData | null>(null);
  const [lookupSource, setLookupSource] = useState<"code" | "scan" | null>(
    null,
  );
  const [visitorVerificationMode, setVisitorVerificationMode] =
    useState<VisitorVerificationMode | null>(readInitialVerificationMode);
  const [modeReady, setModeReady] = useState(
    () => readInitialVerificationMode() != null,
  );
  const [verificationDescription, setVerificationDescription] = useState<
    string | null
  >(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  const authUser = useSelector((state: RootState) => state.auth.user);

  const { allVisitors, loading } = useSelector((state: RootState) => {
    const v = state.securityVisitor;
    return {
      allVisitors: v?.allVisitors ?? null,
      loading: v?.getAllVisitorsStatus === "isLoading",
    };
  });

  const verificationFlags = useMemo(
    () =>
      visitorVerificationMode
        ? getVerificationFlags(visitorVerificationMode)
        : null,
    [visitorVerificationMode],
  );

  const refreshVisitors = () => {
    if (!estateId) return;
    dispatch(getAllVisitors({ estateId, page: 1, limit: 20 })).catch(() => {});
  };

  useEffect(() => {
    (async () => {
      try {
        const priorUser = (authUser ??
          readStoredAuth()?.user) as Record<string, unknown> | null;
        // Prefer stored/redux mode immediately so cards don't flash the wrong set.
        const priorMode = resolveVisitorVerificationMode(priorUser);
        if (priorMode) {
          setVisitorVerificationMode(priorMode);
          setModeReady(true);
          setVerificationDescription(
            resolveVisitorVerificationDescription(priorUser),
          );
        }

        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const rawEstateId = data?.estateId ?? data?.estate ?? null;
        const id =
          typeof rawEstateId === "string"
            ? rawEstateId
            : (rawEstateId as { id?: string; _id?: string })?._id ||
              (rawEstateId as { id?: string; _id?: string })?.id ||
              "";

        const mode =
          resolveVisitorVerificationMode(data) ??
          priorMode ??
          VisitorVerificationMode.VIEW_AND_VERIFY;
        setVisitorVerificationMode(mode);
        setVerificationDescription(
          resolveVisitorVerificationDescription(data) ??
            resolveVisitorVerificationDescription(priorUser),
        );
        setModeReady(true);

        if (!id) return;
        setEstateId(id);
        await dispatch(
          getAllVisitors({ estateId: id, page: 1, limit: 20 }),
        ).unwrap();
      } catch (err: unknown) {
        setVisitorVerificationMode(
          (prev) => prev ?? VisitorVerificationMode.VIEW_AND_VERIFY,
        );
        setModeReady(true);
        toast.error((err as { message?: string })?.message ?? "Failed to load");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setVisitorDetails(null);
    setLookupSource(null);
  };

  const showViewCard =
    modeReady &&
    Boolean(
      verificationFlags?.viewOnly || verificationFlags?.viewAndVerify,
    );
  const showVerifyCard =
    modeReady &&
    Boolean(
      verificationFlags?.verifyOnly || verificationFlags?.viewAndVerify,
    );
  const actionCardCount = Number(showViewCard) + Number(showVerifyCard);
  const pageLoading = loading || !modeReady;

  return (
    <div className="relative">
      {pageLoading && <Loader fullScreen label="Loading visitors..." />}

      <div
        className={`space-y-6${pageLoading ? " pointer-events-none select-none" : ""}`}
      >
        <div>
          <h1 className="font-heading text-3xl font-bold">
            Visitor Management
          </h1>
          <p className="text-muted-foreground mt-1">
            View visitors at the gate, or verify and clock them out.
          </p>
        </div>

        <div className="space-y-8 pb-6">
          <div
            className={`grid gap-4 ${
              actionCardCount <= 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
            }`}
          >
            {showViewCard ? (
              <button
                type="button"
                onClick={() => setViewModalOpen(true)}
                className="text-left rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Card className="h-full transition-shadow hover:shadow-md cursor-pointer border-border">
                  <div className="px-4 pt-2 flex items-center gap-2">
                    <Eye className="h-6 w-6" />
                    <CardTitle className="text-xl">
                      Click here to view visitor
                    </CardTitle>
                  </div>

                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Scan or enter a visitor code to view visitor and resident
                      details.
                    </p>
                  </CardContent>
                </Card>
              </button>
            ) : null}

            {showVerifyCard ? (
              <button
                type="button"
                onClick={() => setVerifyModalOpen(true)}
                className="text-left rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Card className="h-full transition-shadow hover:shadow-md cursor-pointer border-border">
                    <div className="px-4 pt-2 flex items-center gap-2">
                      <ShieldCheck className="h-6 w-6" />
                        <CardTitle className="text-xl">Verify</CardTitle>
                    </div>
                  
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Enter a visitor code to verify and allow access.
                    </p>
                  </CardContent>
                </Card>
              </button>
            ) : null}
          </div>

          {modeReady ? <ClockOutCard onClockedOut={refreshVisitors} /> : null}
        </div>

        <RecentVisitorInvites
          visitors={allVisitors?.data ?? []}
          loading={false}
        />
      </div>

      <ViewVisitorModal
        open={viewModalOpen}
        onClose={handleCloseViewModal}
        visitorDetails={visitorDetails}
        lookupSource={lookupSource}
        verificationFlags={
          verificationFlags ??
          getVerificationFlags(VisitorVerificationMode.VIEW_AND_VERIFY)
        }
        verificationDescription={verificationDescription}
        onLookupSource={setLookupSource}
        onDetailsLoaded={(visitor) => {
          setVisitorDetails(visitor);
          if (!visitor) setLookupSource(null);
        }}
        onVerified={(visitor) => {
          if (visitor) setVisitorDetails(visitor);
          refreshVisitors();
        }}
      />

      <VerifyModal
        open={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        initialCode={visitorDetails?.visitorCode}
        onVerified={(visitor) => {
          if (visitor) setVisitorDetails(visitor);
          refreshVisitors();
        }}
      />
    </div>
  );
}
