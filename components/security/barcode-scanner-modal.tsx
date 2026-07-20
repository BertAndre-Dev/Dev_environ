"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";

const DEFAULT_SCANNER_ELEMENT_ID = "visitor-barcode-scanner";

interface BarcodeScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (value: string) => void;
  /** Unique DOM id when multiple scanners exist on the same page. */
  scannerElementId?: string;
}

async function waitForElement(id: string, timeoutMs = 4000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const el = document.getElementById(id);
    if (el) return el;
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
  return null;
}

export default function BarcodeScannerModal({
  open,
  onClose,
  onScan,
  scannerElementId = DEFAULT_SCANNER_ELEMENT_ID,
}: BarcodeScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!open) return;

    handledRef.current = false;
    setError(null);
    setStarting(true);

    let cancelled = false;

    const stopScanner = async (scanner: Html5Qrcode | null) => {
      if (!scanner) return;
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        scanner.clear();
      } catch {
        try {
          scanner.clear();
        } catch {
          // Scanner may already be cleared
        }
      }
    };

    const start = async () => {
      // Modal mounts its children asynchronously — wait for the scanner node.
      const el = await waitForElement(scannerElementId);
      if (cancelled) return;

      if (!el) {
        setStarting(false);
        setError("Scanner failed to initialize. Please try again.");
        return;
      }

      const scanner = new Html5Qrcode(scannerElementId);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          async (decodedText) => {
            if (handledRef.current || cancelled) return;
            handledRef.current = true;
            const value = decodedText.trim();
            await stopScanner(scanner);
            if (!cancelled) onScanRef.current(value);
          },
          () => {
            // Ignore frame-by-frame "not found" noise
          },
        );
        if (!cancelled) setStarting(false);
      } catch (err: unknown) {
        if (cancelled) return;
        setStarting(false);
        setError(
          (err as { message?: string })?.message ??
            "Unable to access the camera. Check permissions and try again.",
        );
        await stopScanner(scanner);
        scannerRef.current = null;
      }
    };

    void start();

    return () => {
      cancelled = true;
      const active = scannerRef.current;
      scannerRef.current = null;
      void stopScanner(active);
    };
  }, [open, scannerElementId]);

  return (
    <Modal
      visible={open}
      onClose={onClose}
      contentClassName="md:w-[420px] max-w-[420px] p-4"
    >
      <div className="space-y-4 pt-2">
        <div>
          <h2 className="font-heading text-lg font-bold">Scan barcode / QR</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Point the camera at the visitor barcode or QR code.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-black/90 min-h-[280px]">
          <div id={scannerElementId} className="w-full" />
          {starting && !error && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-white bg-black/40">
              Starting camera...
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <Button type="button" variant="outline" className="w-full" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
