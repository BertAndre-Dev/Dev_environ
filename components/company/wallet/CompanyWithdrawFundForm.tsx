"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  generateTxRef,
  getCompanyCredits,
  getCompanyWallet,
  requestCompanyWithdrawOtp,
  transferCompanyFunds,
} from "@/redux/slice/company/wallet-mgt/company-wallet-mgt";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import OtpVerification from "@/components/otp-modal/otp-verification/page";

const DEFAULT_CURRENCY = "NGN";
const WITHDRAWAL_GATEWAY = "flutterwave";
const CREDITS_LIMIT = 10;
const SUCCESS_TOAST =
  "Withdrawal submitted. Balance updates after bank confirmation.";

interface CompanyWithdrawFundFormProps {
  userId: string;
  walletId: string;
  companyId: string;
  estateId?: string;
  defaultAccountNumber?: string;
  bankCode?: string;
  bankName?: string;
  maxWithdrawableAmount?: number;
  /** Service charge applied on withdrawal. */
  serviceFee?: number;
  creditsPage?: number;
  onClose?: () => void;
}

export default function CompanyWithdrawFundForm({
  userId,
  walletId,
  companyId,
  estateId,
  defaultAccountNumber = "",
  bankCode,
  bankName,
  maxWithdrawableAmount,
  serviceFee = 2000,
  creditsPage = 1,
  onClose,
}: CompanyWithdrawFundFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [amount, setAmount] = useState<number>();
  const [accountNumber, setAccountNumber] =
    useState<string>(defaultAccountNumber);
  const [description, setDescription] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [txRef, setTxRef] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [emailHint, setEmailHint] = useState<string | undefined>(undefined);

  const enteredAmount = Number(amount) || 0;
  const totalDebit = enteredAmount + (serviceFee > 0 ? serviceFee : 0);

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
    await dispatch(getCompanyWallet(companyId));
    await dispatch(
      getCompanyCredits({
        companyId,
        estateId,
        page: creditsPage,
        limit: CREDITS_LIMIT,
      }),
    );
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!userId || !walletId || !companyId) {
      toast.error("Missing user or wallet information.");
      return;
    }

    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    if (
      typeof maxWithdrawableAmount === "number" &&
      totalDebit > maxWithdrawableAmount
    ) {
      toast.error(
        `You need ₦${totalDebit.toLocaleString()} in withdrawable balance (amount + fee). Available: ₦${maxWithdrawableAmount.toLocaleString()}.`,
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

    setSubmitting(true);

    try {
      const { tx_ref } = await dispatch(generateTxRef()).unwrap();
      setTxRef(tx_ref);

      await dispatch(
        requestCompanyWithdrawOtp({
          companyId,
          amount,
          currency: DEFAULT_CURRENCY,
          bankCode,
          accountNumber,
          narration:
            description ||
            `Withdrawal of ${DEFAULT_CURRENCY} ${amount.toLocaleString()}`,
          tx_ref,
          gatewayType: WITHDRAWAL_GATEWAY,
        }),
      ).unwrap();

      setOtpError(null);
      setOtpRequested(true);
      toast.success("OTP sent to your email. Please enter it to confirm.");
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
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
        transferCompanyFunds({
          companyId,
          amount: amount ?? 0,
          currency: DEFAULT_CURRENCY,
          bankCode: bankCode ?? "",
          accountNumber,
          narration:
            description ||
            `Withdrawal of ${DEFAULT_CURRENCY} ${(amount ?? 0).toLocaleString()}`,
          tx_ref: txRef,
          gatewayType: WITHDRAWAL_GATEWAY,
          otp: code,
        }),
      ).unwrap();

      toast.success(SUCCESS_TOAST);
      await refreshWalletData();
      onClose?.();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      setOtpError(message ?? null);
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
        requestCompanyWithdrawOtp({
          companyId,
          amount: amount ?? 0,
          currency: DEFAULT_CURRENCY,
          bankCode: bankCode ?? "",
          accountNumber,
          narration:
            description ||
            `Withdrawal of ${DEFAULT_CURRENCY} ${(amount ?? 0).toLocaleString()}`,
          tx_ref: txRef,
          gatewayType: WITHDRAWAL_GATEWAY,
        }),
      ).unwrap();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      setOtpError(message ?? null);
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
                {enteredAmount > 0 && serviceFee > 0 && (
                  <p className="text-red-600 text-sm mt-1.5">
                    A service charge of ₦{serviceFee.toLocaleString()} will be
                    applied. You will receive ₦{enteredAmount.toLocaleString()}.
                    Total debit: ₦{totalDebit.toLocaleString()}.
                  </p>
                )}
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

              <Button
                type="submit"
                className="w-full mt-4"
                disabled={submitting}
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
