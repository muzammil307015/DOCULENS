/**
 * DOCULENS Docling Client Bridge
 *
 * Connects to the official Docling extraction microservice (/health and POST /v1/convert).
 * Checks service health, submits documents with realistic timeouts, and validates responses.
 */

import { isSuspiciousPdfBinaryGarbage } from "./pdfParser";

export interface DoclingHealthStatus {
  online: boolean;
  doclingAvailable: boolean;
  serviceUrl: string;
  version?: string;
  error?: string;
}

export interface DoclingConversionResult {
  fullText: string;
  markdown: string;
  pageCount: number;
  wordCount: number;
  tableCount: number;
  pages: Array<{
    pageNumber: number;
    text: string;
    headings?: string[];
  }>;
  tables: Array<{
    tableIndex: number;
    page: number;
    headers: string[];
    rows: string[][];
    markdown: string;
  }>;
  ocrApplied: boolean;
  qualityScore: number;
  warnings: string[];
  engine: string;
}

const DEFAULT_DOCLING_URL = typeof window !== "undefined"
  ? (window as any).__DOCLING_URL__ || "http://localhost:8001"
  : process.env.DOCLING_SERVICE_URL || "http://localhost:8001";

const DEFAULT_DOCLING_TIMEOUT_MS = 60000;

/**
 * Checks if Docling microservice is reachable
 */
export async function checkDoclingHealth(serviceUrl: string = DEFAULT_DOCLING_URL): Promise<DoclingHealthStatus> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(`${serviceUrl}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        online: true,
        doclingAvailable: Boolean(data.docling_available),
        serviceUrl,
        version: data.engine_version,
      };
    }
    return {
      online: false,
      doclingAvailable: false,
      serviceUrl,
      error: `HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      online: false,
      doclingAvailable: false,
      serviceUrl,
      error: err?.message || "Connection refused",
    };
  }
}

/**
 * Attempts extraction using Docling service synchronous POST /v1/convert
 */
export async function convertWithDocling(
  fileBlobOrBuffer: Blob | ArrayBuffer,
  fileName: string,
  serviceUrl: string = DEFAULT_DOCLING_URL,
  timeoutMs: number = DEFAULT_DOCLING_TIMEOUT_MS
): Promise<DoclingConversionResult | null> {
  try {
    const health = await checkDoclingHealth(serviceUrl);
    if (!health.online || !health.doclingAvailable) {
      return null;
    }

    const formData = new FormData();
    const blob = fileBlobOrBuffer instanceof Blob
      ? fileBlobOrBuffer
      : new Blob([fileBlobOrBuffer]);

    formData.append("file", blob, fileName);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(`${serviceUrl}/v1/convert`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`Docling microservice returned HTTP ${res.status}. Falling back to native engine.`);
      return null;
    }

    const data = await res.json();
    const fullText = (data.fullText || data.markdown || "").trim();
    if (!fullText || isSuspiciousPdfBinaryGarbage(fullText)) {
      console.warn("Docling returned empty or invalid binary text. Falling back to native engine.");
      return null;
    }

    return {
      fullText,
      markdown: data.markdown || fullText,
      pageCount: data.pageCount || (Array.isArray(data.pages) ? data.pages.length : 1),
      wordCount: data.wordCount || fullText.split(/\s+/).filter(Boolean).length,
      tableCount: data.tableCount || (Array.isArray(data.tables) ? data.tables.length : 0),
      pages: (data.pages || []).map((p: any, idx: number) => ({
        pageNumber: p.page_number || idx + 1,
        text: p.text ?? "",
        headings: p.headings || [],
      })),
      tables: (data.tables || []).map((t: any, idx: number) => ({
        tableIndex: t.table_index || idx + 1,
        page: t.page || 1,
        headers: t.headers || [],
        rows: t.rows || [],
        markdown: t.markdown || "",
      })),
      ocrApplied: Boolean(data.ocrApplied),
      qualityScore: data.qualityScore || 85,
      warnings: Array.isArray(data.warnings) ? data.warnings : [],
      engine: data.engine || "docling-native",
    };
  } catch (err: any) {
    console.info("Docling microservice not reachable or timed out, using built-in native extractor:", err?.message);
    return null;
  }
}

