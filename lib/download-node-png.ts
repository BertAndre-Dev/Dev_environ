/** Download a DOM node as a PNG. Isolates html-to-image to this helper. */

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function nodeToPngDataUrl(node: HTMLElement): Promise<string> {
  const { toPng } = await import("html-to-image");
  return toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#ffffff",
  });
}

export async function downloadNodeAsPng(
  node: HTMLElement,
  filename: string,
): Promise<void> {
  const dataUrl = await nodeToPngDataUrl(node);
  triggerDownload(dataUrl, filename);
}

export async function pngDataUrlToFile(
  dataUrl: string,
  filename: string,
): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: "image/png" });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load receipt image"));
    image.src = dataUrl;
  });
}

export async function nodeToPdfBlob(node: HTMLElement): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const dataUrl = await nodeToPngDataUrl(node);
  const image = await loadImage(dataUrl);
  const widthMm = 90;
  const heightMm = (image.height / image.width) * widthMm;
  const pdf = new jsPDF({
    orientation: heightMm > widthMm ? "portrait" : "landscape",
    unit: "mm",
    format: [widthMm, heightMm],
  });
  pdf.addImage(dataUrl, "PNG", 0, 0, widthMm, heightMm);
  return pdf.output("blob");
}

export async function nodeToPdfFile(
  node: HTMLElement,
  filename: string,
): Promise<File> {
  const blob = await nodeToPdfBlob(node);
  return new File([blob], filename, { type: "application/pdf" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  triggerDownload(objectUrl, filename);
  URL.revokeObjectURL(objectUrl);
}
