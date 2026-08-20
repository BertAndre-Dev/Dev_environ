import { toast } from "react-toastify";

import {
  downloadBlob,
  downloadNodeAsPng,
  nodeToPdfFile,
} from "@/lib/download-node-png";

export async function downloadReceiptPng(
  node: HTMLElement,
  filename: string,
): Promise<void> {
  await downloadNodeAsPng(node, filename);
  toast.success("Receipt downloaded");
}

export async function shareReceiptPdf(options: {
  node: HTMLElement;
  title: string;
  filename: string;
}): Promise<void> {
  const { node, title, filename } = options;
  const file = await nodeToPdfFile(node, filename);
  const payload: ShareData = { title, files: [file] };

  if (typeof navigator.share === "function") {
    try {
      if (!navigator.canShare || navigator.canShare(payload)) {
        await navigator.share(payload);
        return;
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
    }
  }

  downloadBlob(file, filename);
  toast.success("Receipt PDF downloaded");
}
