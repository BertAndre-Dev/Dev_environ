"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import {
  getEnergyProviderCredits,
  getEnergyProviderWallet,
  requestEnergyProviderWithdrawOtp,
  transferEnergyProviderFunds,
} from "@/redux/slice/energy-provider/wallet-mgt/energy-provider-wallet-mgt";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import OtpVerification from "@/components/otp-modal/otp-verification/page";
import PaymentGatewaySelect from "@/components/payment/PaymentGatewaySelect";

const DEFAULT_CURRENCY = "NGN";
const CREDITS_LIMIT = 10;

function createTxRef(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `tx-${crypto.randomUUID()}`;
  }
  return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

interface EnergyProviderWithdrawFundFormProps {
  userId: string;
  walletId: string;
  estateId: string;
  defaultAccountNumber?: string;
  bankCode?: string;
  bankName?: string;
  maxWithdrawableAmount?: number;
  creditsPage?: number;
  sortBy?: "amount" | "date";
  sortOrder?: "asc" | "desc";
  onClose?: () => void;
}

export default function EnergyProviderWithdrawFundForm({
  userId,
  walletId,
  estateId,
  defaultAccountNumber = "",
  bankCode,
  bankName,
  maxWithdrawableAmount,
  creditsPage = 1,
  sortBy = "date",
  sortOrder = "desc",
  onClose,
}: EnergyProviderWithdrawFundFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [amount, setAmount] = useState<number>();
  const [accountNumber, setAccountNumber] =
    useState<string>(defaultAccountNumber);
  const [description, setDescription] = useState<string>("");
  const [gatewayType, setGatewayType] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [txRef, setTxRef] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [emailHint, setEmailHint] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (defaultAccountNumber) setAccountNumber(defaultAccountNumber);
  }, [defaultAccountNumber]);

  useEffect(() => {
    (async () => {
      try {
        const res = await dispatch(getSignedInUser()).unwrap();
        const user = res?.data ?? (res as Record<string, unknown>) ?? null;
        const email = (user?.email as string) ?? "";
        if (!email) return;
        const [local, domain] = email.split("@");
        if (!local || !domain) {
          setEmailHint(email);
          return;
        }
        const visible = local.slice(0, 2);
        const masked = `${visible}${"*".repeat(Math.max(local.length - 2, 3))}`;
        setEmailHint(`${masked}@${domain}`);
      } catch {
        // ignore email hint failure
      }
    })();
  }, [dispatch]);

  const refreshWalletData = async () => {
    await dispatch(getEnergyProviderWallet(userId));
    await dispatch(
      getEnergyProviderCredits({
        userId,
        estateId,
        page: creditsPage,
        limit: CREDITS_LIMIT,
        sortBy,
        sortOrder,
      }),
    );
  };

  const buildNarration = (value: number) =>
    description ||
    `Withdrawal of ${DEFAULT_CURRENCY} ${value.toLocaleString()}`;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!userId || !walletId || !estateId) {
      toast.error("Missing user, estate, or wallet information.");
      return;
    }

    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    if (
      typeof maxWithdrawableAmount === "number" &&
      amount > maxWithdrawableAmount
    ) {
      toast.error(
        `Amount cannot exceed withdrawable balance (₦${maxWithdrawableAmount.toLocaleString()}).`,
      );
      return;
    }

    if (!accountNumber?.trim()) {
      toast.error("Account number is missing.");
      return;
    }

    if (!bankCode) {
      toast.error("Bank information is missing.");
      return;
    }

    if (!gatewayType) {
      toast.error("Please select a payment gateway.");
      return;
    }

    setSubmitting(true);

    try {
      const tx_ref = createTxRef();
      setTxRef(tx_ref);

      await dispatch(
        requestEnergyProviderWithdrawOtp({
          estateId,
          amount,
          currency: DEFAULT_CURRENCY,
          bankCode,
          accountNumber,
          narration: buildNarration(amount),
          tx_ref,
          gatewayType,
        }),
      ).unwrap();

      setOtpError(null);
      setOtpRequested(true);
      toast.success("OTP sent to your email. Please enter it to confirm.");
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Failed to process withdrawal.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmOtp = async (code: string) => {
    if (!txRef) {
      setOtpError("Missing transaction reference. Please close and try again.");
      return;
    }

    if (code.length !== 6) {
      setOtpError("Please enter the 6-digit code.");
      return;
    }

    setSubmitting(true);
    setOtpError(null);

    try {
      await dispatch(
        transferEnergyProviderFunds({
          estateId,
          amount: amount ?? 0,
          currency: DEFAULT_CURRENCY,
          bankCode: bankCode ?? "",
          accountNumber,
          narration: buildNarration(amount ?? 0),
          tx_ref: txRef,
          gatewayType,
          otp: code,
        }),
      ).unwrap();

      toast.success("Withdrawal successful!");
      await refreshWalletData();
      onClose?.();
    } catch (err: unknown) {
      setOtpError(
        (err as { message?: string })?.message ||
          "Failed to verify OTP. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!txRef) {
      setOtpError("Missing transaction reference. Please close and try again.");
      return;
    }

    setSubmitting(true);
    setOtpError(null);

    try {
      await dispatch(
        requestEnergyProviderWithdrawOtp({
          estateId,
          amount: amount ?? 0,
          currency: DEFAULT_CURRENCY,
          bankCode: bankCode ?? "",
          accountNumber,
          narration: buildNarration(amount ?? 0),
          tx_ref: txRef,
          gatewayType,
        }),
      ).unwrap();
    } catch (err: unknown) {
      setOtpError(
        (err as { message?: string })?.message ||
          "Failed to resend OTP. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-blue-600 mx-auto">
            {otpRequested ? "OTP Verification" : "Withdraw Fund"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {!otpRequested ? (
            <>
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div>
                <Label>Bank</Label>
                <Input
                  type="text"
                  value={bankName || ""}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                  placeholder="Bank linked to this wallet"
                />
              </div>

              <div>
                <Label>Account Number</Label>
                <Input
                  type="text"
                  value={accountNumber}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                  placeholder="Account number linked to this wallet"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                />
              </div>

              <PaymentGatewaySelect
                id="energy-provider-withdraw-payment-gateway"
                value={gatewayType}
                onChange={setGatewayType}
                disabled={submitting}
              />

              <Button
                type="submit"
                className="w-full mt-4"
                disabled={submitting || !gatewayType}
              >
                {submitting ? "Processing..." : "Request OTP"}
              </Button>
            </>
          ) : (
            <OtpVerification
              length={6}
              initialCountdown={60}
              submitting={submitting}
              errorMessage={otpError}
              emailHint={emailHint}
              onCancel={onClose ?? (() => undefined)}
              onConfirm={handleConfirmOtp}
              onResend={handleResendOtp}
            />
          )}
        </CardContent>
      </form>
    </Card>
  );
}
