"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";

import type { AppDispatch, RootState } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  createWallet,
  getWallet,
} from "@/redux/slice/resident/wallet-mgt/wallet-mgt";
import {
  createTransaction,
  initializePayment,
} from "@/redux/slice/resident/transaction/transaction";

import FundWalletModal from "@/components/resident/transaction/fund-wallet-modal/page";
import type { WalletData } from "@/redux/slice/resident/wallet-mgt/wallet-mgt-slice";
import { ResidentWalletCard } from "@/components/resident/wallet/ResidentWalletCard";
import { SetUpPinCard } from "@/components/resident/pay-bills/SetUpPinCard";

export default function PayBillsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const [open, setOpen] = useState(false);
  const [createWalletModalOpen, setCreateWalletModalOpen] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [residentType, setResidentType] = useState<string | null>(null);

  const wallet = useSelector(
    (state: RootState) => state.wallet.wallet,
  ) as WalletData | null;
  const createWalletState = useSelector(
    (state: RootState) => state.wallet.createWalletState,
  );

  const isOwner = residentType === "owner";
  const formatNaira = (value: number) => `₦${(value ?? 0).toLocaleString()}`;

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const id = userRes?.data?.id;
        const userEmail = userRes?.data?.email;
        const rType =
          userRes?.data?.residentType ?? userRes?.data?.resident_type ?? null;

        if (!id) {
          toast.warning("No user found.");
          return;
        }

        setUserId(id);
        setEmail(userEmail || "");
        setResidentType(rType ?? null);

        // Fetch wallet
        await dispatch(getWallet(id)).unwrap();
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to load data.");
      }
    })();
  }, [dispatch]);

  const handleCreateWalletDirect = async () => {
    if (!userId) return;
    try {
      await dispatch(
        createWallet({ userId, balance: 0, lockedBalance: 0 }),
      ).unwrap();
      toast.success("Wallet created successfully.");
      dispatch(getWallet(userId));
    } catch (error: unknown) {
      const msg =
        (error as { message?: string })?.message || "Failed to create wallet.";
      toast.error(msg);
    }
  };

  const handleCreateWalletClick = () => {
    if (!userId) return;
    if (isOwner) {
      setCreateWalletModalOpen(true);
    } else {
      handleCreateWalletDirect();
    }
  };

  const handleOpenModal = () => setOpen((prev) => !prev);

  const handleFundWallet = async ({
    userId,
    walletId,
    amount,
    description,
    type,
    currency,
    paymentOption,
    country,
  }: {
    userId: string;
    walletId: string;
    amount: number;
    description: string;
    type: "credit";
    currency: string;
    paymentOption: string;
    country: string;
  }) => {
    try {
      const txRes = await dispatch(
        createTransaction({ userId, walletId, amount, description, type }),
      ).unwrap();

      const tx_ref = txRes?.data?.tx_ref;
      if (!tx_ref) throw new Error("Transaction reference not found");

      const paymentRes = await dispatch(
        initializePayment({
          tx_ref,
          amount,
          country,
          currency,
          redirect_url: `${globalThis.location.origin}/dashboard/resident/pay-bills`,
          payment_options: paymentOption,
          customer: { email },
          customizations: { title: "Wallet Funding", description },
        }),
      ).unwrap();

      const paymentUrl = paymentRes?.data?.link || paymentRes?.data?.url;
      if (!paymentUrl) throw new Error("Payment URL not received");

      globalThis.location.href = paymentUrl;
    } catch (err: any) {
      toast.error(err?.message || "Failed to fund wallet.");
    }
  };

  return (
    <div className="space-y-6">
      <ResidentWalletCard
        wallet={wallet}
        isOwner={isOwner}
        formatNaira={formatNaira}
        variant="fundOnly"
        createWalletState={String(createWalletState)}
        createWalletModalOpen={createWalletModalOpen}
        onFundWalletClick={handleOpenModal}
        onWithdrawClick={() => {}}
        onTransferToBalanceClick={() => {}}
        onCreateWalletClick={handleCreateWalletClick}
      />

      <SetUpPinCard />

      <FundWalletModal
        visible={open}
        onClose={handleOpenModal}
        userId={userId}
        walletId={wallet?.id ?? null}
        onSubmit={handleFundWallet}
      />
    </div>
  );
}
