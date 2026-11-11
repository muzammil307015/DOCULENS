/**
 * DOCULENS Real OCR Engine (Tesseract.js Integration)
 *
 * Runs genuine optical character recognition on image documents (PNG, JPG, JPEG, WEBP, TIFF)
 * and scanned PDF pages when rasterizable.
 * Never fabricates text or confidence values when OCR is unavailable or fails.
 */

import { DocumentPage } from "../../types";

export interface OcrResult {
  fullText: string;
  pages: DocumentPage[];
  ocrSucceeded: boolean;
  confidence: number;
  isLowConfidence: boolean;
  wordCount: number;
  qualityScore: number;
  redactionSafeForAi: boolean;
  warningMessage?: string;
}

function isPdfBytes(input: string | Uint8Array): boolean {
  if (typeof input === "string") {
    return input.startsWith("%PDF-") || input.startsWith("data:application/pdf");
  }
  if (input.byteLength >= 4) {
    return input[0] === 0x25 && input[1] === 0x50 && input[2] === 0x44 && input[3] === 0x46;
  }
  return false;
}

/**
 * Rasterizes scanned PDF pages in browser via HTMLCanvasElement and runs Tesseract OCR per page.
 * In Node/headless environments without DOM Canvas, returns null so caller can report limitation honestly.
 */
async function rasterizeAndOcrPdfInBrowser(
  pdfBytes: Uint8Array,
  pageNumbersToOcr?: number[]
): Promise<{ pages: DocumentPage[]; avgConfidence: number } | null> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  try {
    const pdfjs = await import("pdfjs-dist");
    if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
      try {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();
      } catch {
        // Fallback
      }
    }

    const Tesseract = await import("tesseract.js");
    const copyBytes = new Uint8Array(pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength));
    const loadingTask = pdfjs.getDocument({ data: copyBytes, disableFontFace: true, verbosity: 0 });
    const doc = await loadingTask.promise;

    const totalPages = doc.numPages || 1;
    const targetPages = pageNumbersToOcr && pageNumbersToOcr.length > 0
      ? pageNumbersToOcr
      : Array.from({ length: Math.min(totalPages, 15) }, (_, i) => i + 1);

    const ocrPages: DocumentPage[] = [];
    let confidenceSum = 0;
    let confidenceCount = 0;

    for (const pageNum of targetPages) {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      await page.render({ canvasContext: ctx as any, viewport } as any).promise;
      const dataUrl = canvas.toDataURL("image/png");

      const res = await Tesseract.recognize(dataUrl, "eng", { logger: () => {} });
      const pageText = (res?.data?.text || "").trim();
      const rawConf = typeof res?.data?.confidence === "number" ? res.data.confidence / 100 : 0;
      const pageConf = Math.round(rawConf * 100) / 100;

      if (pageText.length > 0) {
        confidenceSum += pageConf;
        confidenceCount++;
      }

      ocrPages.push({
        pageNumber: pageNum,
        text: pageText,
        confidence: pageConf,
        isOcr: true,
      });
    }

    const avgConfidence = confidenceCount > 0 ? Math.round((confidenceSum / confidenceCount) * 100) / 100 : 0;
    return { pages: ocrPages, avgConfidence };
  } catch (err) {
    console.warn("Browser PDF rasterization OCR failed:", err);
    return null;
  }
}

/**
 * Runs genuine OCR using Tesseract.js on images or scanned PDFs.
 * Never fabricates text or confidence scores if OCR fails or is unsupported.
 */
export async function processImageOcr(
  imageBytesOrBase64: string | Uint8Array,
  fileName: string,
  pageNumbersToOcr?: number[]
): Promise<OcrResult> {
  // Handle PDF bytes passed for scanned-PDF OCR
  if (isPdfBytes(imageBytesOrBase64) && typeof imageBytesOrBase64 !== "string") {
    const browserPdfOcr = await rasterizeAndOcrPdfInBrowser(imageBytesOrBase64, pageNumbersToOcr);
    if (browserPdfOcr && browserPdfOcr.pages.some(p => p.text.trim().length > 0)) {
      const fullText = browserPdfOcr.pages
        .filter(p => p.text.trim().length > 0)
        .map(p => `--- [Page ${p.pageNumber}] ---\n${p.text}`)
        .join("\n\n");
      const words = fullText.split(/\s+/).filter(Boolean);
      const isLowConfidence = browserPdfOcr.avgConfidence < 0.7;
      return {
        fullText,
        pages: browserPdfOcr.pages,
        ocrSucceeded: true,
        confidence: browserPdfOcr.avgConfidence,
        isLowConfidence,
        wordCount: words.length,
        qualityScore: Math.min(100, Math.max(10, Math.round(browserPdfOcr.avgConfidence * 100))),
        redactionSafeForAi: false,
        warningMessage: isLowConfidence
          ? "Low OCR confidence (< 70%). Verify critical numbers and dates against the original scan."
          : "Optical Character Recognition (OCR) applied to scanned PDF pages. Visual bitmap regions are not redacted; only extracted text is sanitized.",
      };
    }

    return {
      fullText: "",
      pages: [],
      ocrSucceeded: false,
      confidence: 0,
      isLowConfidence: true,
      wordCount: 0,
      qualityScore: 0,
      redactionSafeForAi: false,
      warningMessage: `Scanned PDF detected in '${fileName}', but PDF rasterization OCR is unavailable in this runtime environment (Docling OCR service offline and no browser canvas rasterizer available).`,
    };
  }

  let objectUrlToRevoke: string | null = null;

  try {
    const Tesseract = await import("tesseract.js");

    let imageSource: any;
    if (typeof imageBytesOrBase64 === "string") {
      imageSource = imageBytesOrBase64;
    } else {
      if (typeof window !== "undefined" && window.URL && typeof window.URL.createObjectURL === "function") {
        const blob = new Blob([imageBytesOrBase64 as any]);
        objectUrlToRevoke = window.URL.createObjectURL(blob);
        imageSource = objectUrlToRevoke;
      } else {
        imageSource = Buffer.from(imageBytesOrBase64);
      }
    }

    const result = await Tesseract.recognize(imageSource, "eng", {
      logger: () => {},
    });

    const recognizedText = (result?.data?.text || "").trim();
    const hasRawConfidence = typeof result?.data?.confidence === "number";
    const confidence = hasRawConfidence ? Math.round(result.data.confidence) / 100 : 0;
    const words = recognizedText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    if (wordCount === 0) {
      return {
        fullText: "",
        pages: [{ pageNumber: 1, text: "", confidence, isOcr: true }],
        ocrSucceeded: false,
        confidence,
        isLowConfidence: true,
        wordCount: 0,
        qualityScore: 10,
        redactionSafeForAi: false,
        warningMessage: `OCR completed on '${fileName}' but no readable text could be recognized from the image.`,
      };
    }

    const isLowConfidence = confidence < 0.70;
    const qualityScore = Math.min(100, Math.max(10, Math.round(confidence * 100)));

    const warningMessage = isLowConfidence
      ? "Low OCR confidence (< 70%). Text may contain optical noise or misread characters. Please verify critical values against the original scan."
      : "OCR applied to image document. Note: Visual image pixels are not redacted; text redaction applies to extracted text.";

    return {
      fullText: recognizedText,
      pages: [
        {
          pageNumber: 1,
          text: recognizedText,
          confidence,
          isOcr: true,
        },
      ],
      ocrSucceeded: true,
      confidence,
      isLowConfidence,
      wordCount,
      qualityScore,
      redactionSafeForAi: false,
      warningMessage,
    };
  } catch (ocrErr: any) {
    console.warn("Tesseract OCR failed:", ocrErr?.message);
    return {
      fullText: "",
      pages: [],
      ocrSucceeded: false,
      confidence: 0,
      isLowConfidence: true,
      wordCount: 0,
      qualityScore: 0,
      redactionSafeForAi: false,
      warningMessage: `OCR could not be completed for '${fileName}': ${ocrErr?.message || "OCR engine unavailable or image format unsupported"}.`,
    };
  } finally {
    if (objectUrlToRevoke && typeof window !== "undefined" && window.URL) {
      try {
        window.URL.revokeObjectURL(objectUrlToRevoke);
      } catch {
        // ignore
      }
    }
  }
}

