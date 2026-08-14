"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import {
  generateTxRef,
  requestEstateAdminOtp,
  transferFunds,
} from "@/redux/slice/estate-admin/transaction/transaction";
import {
  requestResidentOwnerWithdrawalOtp,
  transferFundsResident,
} from "@/redux/slice/resident/transaction/transaction";
import {
  getWallet,
  getEstateCredits,
  getEstateT1Breakdown,
} from "@/redux/slice/estate-admin/wallet-mgt/wallet-mgt";
import { getWallet as getResidentWallet } from "@/redux/slice/resident/wallet-mgt/wallet-mgt";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import OtpVerification from "@/components/otp-modal/otp-verification/page";

const DEFAULT_CURRENCY = "NGN";
const WITHDRAWAL_GATEWAY = "flutterwave";
const ESTATE_FLAT_FEE = 2000;
const RESIDENT_FEE_RATE = 0.015;
const SUCCESS_TOAST =
  "Withdrawal submitted. Balance updates after bank confirmation.";

interface FundWalletFormProps {
  userId: string;
  walletId: string;
  estateId: string;
  defaultAccountNumber?: string;
  bankCode?: string;
  bankName?: string;
  /** Max amount that can be withdrawn (T+1 withdrawableBalance). */
  maxWithdrawableAmount?: number;
  /** Flat service charge for estate admin (resident owner uses 1.5% instead). */
  serviceFee?: number;
  onClose?: () => void;
  /** When true, use resident-owner withdrawal APIs instead of estate-admin ones. */
  isResidentOwner?: boolean;
}

export default function FundWalletForm({
  userId,
  walletId,
  estateId,
  defaultAccountNumber = "",
  bankCode,
  bankName,
  maxWithdrawableAmount,
  serviceFee = ESTATE_FLAT_FEE,
  onClose,
  isResidentOwner = false,
}: FundWalletFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [amount, setAmount] = useState<number>();
  const [accountNumber, setAccountNumber] =
    useState<string>(defaultAccountNumber);

  useEffect(() => {
    if (defaultAccountNumber) setAccountNumber(defaultAccountNumber);
  }, [defaultAccountNumber]);
  const [description, setDescription] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [txRef, setTxRef] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [emailHint, setEmailHint] = useState<string | undefined>(undefined);

  const enteredAmount = Number(amount) || 0;
  const appliedFee = isResidentOwner
    ? Math.round(enteredAmount * RESIDENT_FEE_RATE)
    : serviceFee;
  const totalDebit = enteredAmount + (appliedFee > 0 ? appliedFee : 0);

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

  const buildNarration = (value: number) =>
    description || `Withdrawal of ${DEFAULT_CURRENCY} ${value.toLocaleString()}`;

  const refreshAfterWithdraw = async () => {
    if (isResidentOwner) {
      if (userId) await dispatch(getResidentWallet(userId));
      return;
    }
    if (!estateId) return;
    await dispatch(getWallet(estateId));
    await dispatch(getEstateCredits({ estateId, page: 1, limit: 10 }));
    if (userId) {
      await dispatch(getEstateT1Breakdown({ estateId, userId }));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!userId || !walletId) {
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

    if (!accountNumber || accountNumber.trim() === "") {
      toast.error("Account number is missing.");
      return;
    }

    if (!bankCode) {
      toast.error("Bank information is missing.");
      return;
    }

    setSubmitting(true);

    try {
      if (!otpRequested) {
        const { tx_ref } = await dispatch(generateTxRef()).unwrap();
        setTxRef(tx_ref);

        if (isResidentOwner) {
          await dispatch(
            requestResidentOwnerWithdrawalOtp({
              userId,
              estateId,
              amount,
              currency: DEFAULT_CURRENCY,
              bankCode: bankCode ?? "",
              accountNumber,
              narration: buildNarration(amount),
              tx_ref,
              gatewayType: WITHDRAWAL_GATEWAY,
            }),
          ).unwrap();
        } else {
          await dispatch(
            requestEstateAdminOtp({
              estateId,
              amount,
              currency: DEFAULT_CURRENCY,
              bankCode,
              accountNumber,
              narration: buildNarration(amount),
              tx_ref,
              gatewayType: WITHDRAWAL_GATEWAY,
            }),
          ).unwrap();
        }

        setOtpError(null);
        setOtpRequested(true);
        toast.success("OTP sent to your email. Please enter it to confirm.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to process withdrawal.");
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
      if (isResidentOwner) {
        await dispatch(
          transferFundsResident({
            userId,
            estateId,
            amount: amount ?? 0,
            currency: DEFAULT_CURRENCY,
            bankCode: bankCode ?? "",
            accountNumber,
            narration: buildNarration(amount ?? 0),
            tx_ref: txRef,
            gatewayType: WITHDRAWAL_GATEWAY,
            otp: code,
          }),
        ).unwrap();
      } else {
        await dispatch(
          transferFunds({
            estateId,
            amount: amount ?? 0,
            currency: DEFAULT_CURRENCY,
            bankCode: bankCode ?? "",
            accountNumber,
            narration: buildNarration(amount ?? 0),
            tx_ref: txRef,
            gatewayType: WITHDRAWAL_GATEWAY,
            otp: code,
          }),
        ).unwrap();
      }

      toast.success(SUCCESS_TOAST);
      await refreshAfterWithdraw();
      onClose?.();
    } catch (err: any) {
      setOtpError(err?.message || "Failed to verify OTP. Please try again.");
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
      if (isResidentOwner) {
        await dispatch(
          requestResidentOwnerWithdrawalOtp({
            userId,
            estateId,
            amount: amount ?? 0,
            currency: DEFAULT_CURRENCY,
            bankCode: bankCode ?? "",
            accountNumber,
            narration: buildNarration(amount ?? 0),
            tx_ref: txRef,
            gatewayType: WITHDRAWAL_GATEWAY,
          }),
        ).unwrap();
      } else {
        await dispatch(
          requestEstateAdminOtp({
            estateId,
            amount: amount ?? 0,
            currency: DEFAULT_CURRENCY,
            bankCode: bankCode ?? "",
            accountNumber,
            narration: buildNarration(amount ?? 0),
            tx_ref: txRef,
            gatewayType: WITHDRAWAL_GATEWAY,
          }),
        ).unwrap();
      }
    } catch (err: any) {
      setOtpError(err?.message || "Failed to resend OTP. Please try again.");
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
                <p className="text-red-600 text-sm mt-1.5">
                  {isResidentOwner
                    ? enteredAmount > 0
                      ? `A 1.5% service charge of ₦${appliedFee.toLocaleString()} will be applied. Total debit: ₦${totalDebit.toLocaleString()}.`
                      : "A 1.5% service charge will be applied to this withdrawal."
                    : enteredAmount > 0
                      ? `A service charge of ₦${appliedFee.toLocaleString()} will be applied. You will receive ₦${enteredAmount.toLocaleString()}. Total debit: ₦${totalDebit.toLocaleString()}.`
                      : `A service charge of ₦${serviceFee.toLocaleString()} will be applied. You need this amount plus the fee in your withdrawable balance.`}
                </p>
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
