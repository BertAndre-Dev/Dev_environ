"use client";

import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Modal from "@/components/modal/page";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  getBanks,
  verifyBankAccount,
  type BankItem,
} from "@/redux/slice/estate-admin/fund-wallet/fund-wallet";
import { clearVerifiedAccount } from "@/redux/slice/estate-admin/fund-wallet/fund-wallet-slice";
import type { RevenueWithdrawalRole } from "@/redux/slice/wallet-mgt/create-revenue-withdrawal-module";
import {
  resetSetRevenueWithdrawalAccountState as resetCompanySetState,
  setCompanyRevenueWithdrawalAccount,
} from "@/redux/slice/company/wallet-mgt/revenue-withdrawal-account-slice";
import {
  resetSetRevenueWithdrawalAccountState as resetEstateAdminSetState,
  setEstateAdminRevenueWithdrawalAccount,
} from "@/redux/slice/estate-admin/wallet-mgt/revenue-withdrawal-account-slice";
import {
  resetSetRevenueWithdrawalAccountState as resetEnergyProviderSetState,
  setEnergyProviderRevenueWithdrawalAccount,
} from "@/redux/slice/energy-provider/wallet-mgt/revenue-withdrawal-account-slice";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const COUNTRY = "NG";

const ROLE_API = {
  company: {
    setAccount: setCompanyRevenueWithdrawalAccount,
    resetSetState: resetCompanySetState,
    selectSetState: (state: RootState) =>
      state.companyRevenueWithdrawalAccount.setAccountState,
  },
  estateAdmin: {
    setAccount: setEstateAdminRevenueWithdrawalAccount,
    resetSetState: resetEstateAdminSetState,
    selectSetState: (state: RootState) =>
      state.estateAdminRevenueWithdrawalAccount.setAccountState,
  },
  energyProvider: {
    setAccount: setEnergyProviderRevenueWithdrawalAccount,
    resetSetState: resetEnergyProviderSetState,
    selectSetState: (state: RootState) =>
      state.energyProviderRevenueWithdrawalAccount.setAccountState,
  },
} as const;

export interface SetRevenueWithdrawalAccountModalProps {
  role: RevenueWithdrawalRole;
  visible: boolean;
  revenueType: string;
  revenueTypeLabel: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SetRevenueWithdrawalAccountModal({
  role,
  visible,
  revenueType,
  revenueTypeLabel,
  onClose,
  onSuccess,
}: Readonly<SetRevenueWithdrawalAccountModalProps>) {
  const dispatch = useDispatch<AppDispatch>();
  const api = ROLE_API[role];
  const {
    banks,
    getBanksState,
    verifyBankAccountState,
    verifiedAccountName,
    error: paymentError,
  } = useSelector((state: RootState) => state.estateAdminFundWallet);
  const setState = useSelector(api.selectSetState);

  const [accountNumber, setAccountNumber] = useState("");
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [accountOwnerName, setAccountOwnerName] = useState("");
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const bankDropdownRef = useRef<HTMLDivElement>(null);
  const bankSearchInputRef = useRef<HTMLInputElement>(null);

  const loadingBanks = getBanksState === "isLoading";
  const submitting = setState === "isLoading";
  const selectedBank = banks.find((b) => b.code === selectedBankCode);
  const selectedBankName = selectedBank?.name ?? "";
  const filteredBanks = bankSearchQuery.trim()
    ? banks.filter((b) =>
        b.name.toLowerCase().includes(bankSearchQuery.toLowerCase()),
      )
    : banks;
  const verifyingAccount = verifyBankAccountState === "isLoading";
  const accountVerified =
    verifyBankAccountState === "succeeded" && !!verifiedAccountName;

  useEffect(() => {
    if (!visible) return;
    dispatch(getBanks({ country: COUNTRY, gatewayType: "flutterwave" }));
    return () => {
      dispatch(clearVerifiedAccount());
      dispatch(ROLE_API[role].resetSetState());
    };
  }, [visible, dispatch, role]);

  useEffect(() => {
    if (!visible) {
      setAccountNumber("");
      setSelectedBankCode("");
      setAccountOwnerName("");
      setBankDropdownOpen(false);
      setBankSearchQuery("");
    }
  }, [visible]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        bankDropdownRef.current &&
        !bankDropdownRef.current.contains(event.target as Node)
      ) {
        setBankDropdownOpen(false);
      }
    }
    if (bankDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [bankDropdownOpen]);

  useEffect(() => {
    if (bankDropdownOpen) {
      setBankSearchQuery("");
      setTimeout(() => bankSearchInputRef.current?.focus(), 0);
    }
  }, [bankDropdownOpen]);

  useEffect(() => {
    if (!visible) return;
    if (
      COUNTRY === "NG" &&
      accountNumber.trim().length >= 10 &&
      selectedBankCode
    ) {
      const timeoutId = setTimeout(() => {
        dispatch(
          verifyBankAccount({
            accountNumber: accountNumber.trim(),
            bankCode: selectedBankCode,
            gatewayType: "flutterwave",
          }),
        );
      }, 500);
      return () => clearTimeout(timeoutId);
    }
    dispatch(clearVerifiedAccount());
  }, [accountNumber, selectedBankCode, dispatch, visible]);

  useEffect(() => {
    if (verifiedAccountName?.trim()) {
      setAccountOwnerName(verifiedAccountName.trim());
    }
  }, [verifiedAccountName]);

  useEffect(() => {
    if (getBanksState === "failed" && paymentError) {
      toast.error(paymentError);
    }
  }, [getBanksState, paymentError]);

  const handleClose = () => {
    dispatch(clearVerifiedAccount());
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountVerified) {
      if (paymentError) toast.error(paymentError);
      return;
    }
    if (!selectedBankCode) {
      toast.error("Please select a bank.");
      return;
    }
    if (!accountNumber.trim() || accountNumber.trim().length < 10) {
      toast.error("Please enter a valid 10-digit account number.");
      return;
    }
    if (!accountOwnerName.trim()) {
      toast.error("Account name is required.");
      return;
    }

    try {
      await dispatch(
        api.setAccount({
          revenueType,
          bankCode: selectedBankCode,
          accountNumber: accountNumber.trim(),
          accountName: accountOwnerName.trim(),
        }),
      ).unwrap();
      toast.success(`${revenueTypeLabel} settlement account saved.`);
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message;
      if (message) toast.error(message);
    }
  };

  return (
    <Modal visible={visible} onClose={handleClose}>
      <Card className="mx-auto w-full max-w-md border-0 shadow-none">
        <form onSubmit={handleSubmit}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Set {revenueTypeLabel} account
            </CardTitle>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Settlements for this revenue type go to this bank account after
              T+1 when auto-settlement is on.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Bank name</Label>
              <div ref={bankDropdownRef} className="relative mt-1">
                <button
                  type="button"
                  className={cn(
                    "flex min-h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-left text-sm shadow-xs outline-none",
                    "transition-transform duration-100 ease-out active:scale-[0.99]",
                    "focus-visible:ring-2 focus-visible:ring-ring",
                    "disabled:pointer-events-none disabled:opacity-50",
                  )}
                  onClick={() =>
                    !loadingBanks && setBankDropdownOpen((o) => !o)
                  }
                  disabled={loadingBanks || submitting}
                  aria-expanded={bankDropdownOpen}
                  aria-haspopup="listbox"
                >
                  <span
                    className={selectedBankCode ? "" : "text-muted-foreground"}
                  >
                    {selectedBankName || "Select bank"}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </button>
                {bankDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
                    <div className="border-b border-border p-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          ref={bankSearchInputRef}
                          type="text"
                          placeholder="Search banks..."
                          value={bankSearchQuery}
                          onChange={(e) => setBankSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") setBankDropdownOpen(false);
                          }}
                          className="h-9 pl-8"
                        />
                      </div>
                    </div>
                    <div
                      className="max-h-60 overflow-auto py-1"
                      role="listbox"
                      aria-label="Banks"
                    >
                      {filteredBanks.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          {loadingBanks
                            ? "Loading banks..."
                            : "No banks match your search."}
                        </div>
                      ) : (
                        filteredBanks.map((bank: BankItem) => (
                          <button
                            key={bank.id}
                            type="button"
                            role="option"
                            className="w-full cursor-pointer rounded-none px-3 py-2 text-left text-sm outline-none hover:bg-accent focus:bg-accent"
                            onClick={() => {
                              setSelectedBankCode(bank.code);
                              dispatch(clearVerifiedAccount());
                              setBankDropdownOpen(false);
                            }}
                          >
                            {bank.name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {loadingBanks && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Loading banks...
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="revenueWithdrawalAccountNumber">
                Account number
              </Label>
              <Input
                id="revenueWithdrawalAccountNumber"
                type="text"
                inputMode="numeric"
                value={accountNumber}
                onChange={(e) => {
                  const v = e.target.value.replaceAll(/\D/g, "").slice(0, 10);
                  setAccountNumber(v);
                }}
                placeholder="10 digits"
                maxLength={10}
                className="mt-1"
                disabled={submitting}
              />
              {verifyingAccount && accountNumber.trim() && selectedBankCode && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Verifying account...
                </p>
              )}
              {accountVerified && !verifyingAccount && (
                <p className="mt-1 text-sm font-medium text-green-600">
                  Account name: {verifiedAccountName}
                </p>
              )}
              {verifyBankAccountState === "failed" &&
                paymentError &&
                !verifyingAccount &&
                accountNumber.trim().length >= 10 &&
                selectedBankCode && (
                  <p className="mt-1 text-sm text-red-600">{paymentError}</p>
                )}
            </div>

            <div>
              <Label htmlFor="revenueWithdrawalAccountOwnerName">
                Account owner name
              </Label>
              <Input
                id="revenueWithdrawalAccountOwnerName"
                type="text"
                value={accountOwnerName}
                onChange={(e) => setAccountOwnerName(e.target.value)}
                placeholder="Fills automatically when account is verified"
                readOnly={!!verifiedAccountName}
                className="mt-1 bg-muted/50 read-only:cursor-default"
                disabled={submitting}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 transition-transform duration-100 ease-out active:scale-[0.97]"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !accountVerified}
                className="flex-1 transition-transform duration-100 ease-out active:scale-[0.97]"
              >
                {submitting ? "Saving..." : "Save account"}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </Modal>
  );
}
