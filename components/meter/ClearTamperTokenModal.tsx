"use client";

import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";

type ClearTamperTokenModalProps = {
  visible: boolean;
  meterNumber: string | null;
  token: string | null;
  onClose: () => void;
};

export function ClearTamperTokenModal({
  visible,
  meterNumber,
  token,
  onClose,
}: Readonly<ClearTamperTokenModalProps>) {
  return (
    <Modal visible={visible} onClose={onClose}>
      <div className="w-full p-2 text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Clear Tamper Token
        </h3>
        {meterNumber ? (
          <p className="text-sm text-muted-foreground mb-1">
            Meter{" "}
            <span className="font-medium text-foreground">{meterNumber}</span>
          </p>
        ) : null}
        <p className="text-sm text-muted-foreground mb-4">
          Enter this STS clear-tamper token on the meter keypad.
        </p>
        {token ? (
          <div className="flex items-center justify-center gap-2 bg-gray-100 rounded-lg px-4 py-3 mb-4">
            <span className="font-mono text-lg break-all select-all">{token}</span>
            <CopyButton value={token} title="Copy clear-tamper token" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">
            No token was returned. Please try again or contact support.
          </p>
        )}
        <Button type="button" className="w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
}
