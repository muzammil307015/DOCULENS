/**
 * DOCULENS Docling Node.js Extraction Middleware
 *
 * Handles file uploads, communicates with the Python Docling conversion microservice
 * using the actual synchronous contract (GET /health, POST /v1/convert),
 * validates responses to ensure binary data is never accepted as extracted text,
 * and maintains an asynchronous job queue for the frontend with live stage transitions.
 */

import multer from "multer";
import { Request, Response } from "express";
import {
  DocumentCategory,
  DocumentPage,
  ParsedDocumentData,
} from "../../types";
import { detectSensitiveEntities, buildRedactedTextCopy } from "../privacyService";
import { parseSpreadsheetBuffer, buildSpreadsheetDocumentRepresentation } from "../parsers/sheetParser";
import { parseLegacyDocBuffer } from "../parsers/docParser";
import { parseDocxBuffer } from "../parsers/docxParser";
import { parseRtfBuffer } from "../parsers/rtfParser";
import { parseOdtArchiveBuffer } from "../parsers/odtParser";
import { parsePptxBuffer } from "../parsers/pptxParser";
import { parsePdfBuffer, isSuspiciousPdfBinaryGarbage } from "../parsers/pdfParser";
import { processImageOcr } from "../parsers/ocrParser";
import { parsePlainText } from "../parsers/textParser";

// Default to port 8001 to match services/docling_service/app.py
const DOCLING_SERVICE_URL = (process.env.DOCLING_SERVICE_URL || "http://localhost:8001").replace(/\/+$/, "");
const DOCLING_TIMEOUT_MS = parseInt(process.env.DOCLING_TIMEOUT_MS || "60000", 10);

// Configure Multer for in-memory processing up to 50MB
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = /\.(pdf|docx|doc|xlsx|xls|csv|ods|pptx|ppt|odp|rtf|odt|txt|md|html|png|jpg|jpeg|webp|tiff)$/i;
    if (allowedExtensions.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.originalname}. DOCULENS supports PDF, DOCX, DOC, XLSX, XLS, CSV, ODS, PPTX, RTF, ODT, TXT, and Image formats.`));
    }
  },
});

export interface DoclingRawTable {
  table_index: number;
  page?: number;
  num_rows: number;
  num_cols: number;
  headers: string[];
  rows: string[][];
  markdown: string;
}

export interface DoclingRawHeading {
  title: string;
  level: number;
  page?: number;
}

export interface DoclingRawPage {
  page_number: number;
  text: string;
  headings?: string[];
}

export interface DoclingRawResponse {
  status: string;
  engine: string;
  fileName: string;
  fileSizeBytes: number;
  pageCount: number;
  wordCount: number;
  tableCount: number;
  fullText: string;
  markdown: string;
  pages?: DoclingRawPage[];
  tables?: DoclingRawTable[];
  headings?: DoclingRawHeading[];
  ocrApplied?: boolean;
  qualityScore?: number;
  warnings?: string[];
  processingTimeMs?: number;
}

/**
 * Health check status cache with 15-second TTL to avoid blocking requests
 */
let cachedHealth: {
  online: boolean;
  serviceUrl: string;
  doclingAvailable: boolean;
  engineVersion?: string;
  supportedFormats?: string[];
  timestamp: number;
} | null = null;

export async function probeDoclingHealth(forceRefresh = false): Promise<{
  online: boolean;
  serviceUrl: string;
  doclingAvailable: boolean;
  engineVersion?: string;
  supportedFormats?: string[];
  error?: string;
}> {
  const now = Date.now();
  if (!forceRefresh && cachedHealth && now - cachedHealth.timestamp < 15000) {
    return cachedHealth;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    const res = await fetch(`${DOCLING_SERVICE_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data: any = await res.json();
      const status = {
        online: true,
        serviceUrl: DOCLING_SERVICE_URL,
        doclingAvailable: Boolean(data.docling_available ?? false),
        engineVersion: data.engine_version || "docling-2.1",
        supportedFormats: data.supported_formats || ["pdf", "docx", "xlsx", "pptx", "html"],
        timestamp: now,
      };
      cachedHealth = status;
      return status;
    }

    const failureStatus = {
      online: false,
      serviceUrl: DOCLING_SERVICE_URL,
      doclingAvailable: false,
      timestamp: now,
      error: `HTTP ${res.status}`,
    };
    cachedHealth = failureStatus;
    return failureStatus;
  } catch (err: any) {
    const failureStatus = {
      online: false,
      serviceUrl: DOCLING_SERVICE_URL,
      doclingAvailable: false,
      timestamp: now,
      error: err?.message || "Service connection refused",
    };
    cachedHealth = failureStatus;
    return failureStatus;
  }
}

/**
 * Communicates with the Python Docling microservice via POST /v1/convert
 * with configurable realistic timeout and strict response validation.
 */
export async function extractWithDoclingService(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<DoclingRawResponse> {
  if (!buffer || buffer.byteLength === 0) {
    throw new Error("Cannot extract empty file buffer (0 bytes).");
  }

  const health = await probeDoclingHealth();
  if (!health.online) {
    throw new Error(`Docling microservice offline at ${DOCLING_SERVICE_URL}`);
  }

  const isBinaryExt = /\.(pdf|docx|doc|xlsx|xls|ods|pptx|ppt|odp|odt|png|jpg|jpeg|webp|tiff)$/i.test(fileName);
  if (isBinaryExt && !health.doclingAvailable) {
    throw new Error(`Docling binary converter unavailable on ${DOCLING_SERVICE_URL}; routing to native parser.`);
  }

  const formData = new FormData();
  const fileBlob = new Blob([new Uint8Array(buffer)], { type: mimeType || "application/octet-stream" });
  formData.append("file", fileBlob, fileName);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DOCLING_TIMEOUT_MS);

  try {
    const response = await fetch(`${DOCLING_SERVICE_URL}/v1/convert`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`Docling microservice returned HTTP ${response.status}: ${errText.slice(0, 200)}`);
    }

    const json = (await response.json()) as DoclingRawResponse;
    const candidateText = (json.fullText || json.markdown || "").trim();

    if (json.status !== "success" || !candidateText) {
      throw new Error("Docling returned empty or unsuccessful extraction payload.");
    }

    if (isSuspiciousPdfBinaryGarbage(candidateText)) {
      throw new Error("Docling response contained raw PDF binary stream tokens; rejecting invalid output.");
    }

    return json;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

function getFileExtension(filename: string): string {
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : "txt";
}

function isBinaryBuffer(buffer: Buffer): boolean {
  if (buffer.byteLength >= 4) {
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return true; // %PDF
    if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) return true; // ZIP/OpenXML
    if (buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0) return true; // OLE2
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true; // PNG
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true; // JPEG
  }
  const sampleLen = Math.min(buffer.byteLength, 2048);
  for (let i = 0; i < sampleLen; i++) {
    if (buffer[i] === 0x00) return true;
  }
  return false;
}

function classifyCategory(text: string, fileName: string): DocumentCategory {
  const lower = (text + " " + fileName).toLowerCase();
  if (/\.(xlsx|xls|csv|ods)$/i.test(fileName)) return "spreadsheet";
  if (/tender|bid\s*security|procurement|gem\s*portal|rfp|solicitation|turnover\s*mandate|emd\s*amount/i.test(lower)) return "rfp_tender";
  if (/scholarship|stipend|financial\s*aid|fellowship|annual\s*family\s*income|marksheet/i.test(lower)) return "scholarship";
  if (/master\s*services|non-disclosure|indemnif|termination\s*clause|governing\s*law/i.test(lower)) return "contract";
  if (/job\s*description|role\s*responsibilities|years\s*of\s*experience|skills\s*required/i.test(lower)) return "job";
  if (/college\s*admission|undergraduate|postgraduate|entrance\s*examination|semester\s*fee/i.test(lower)) return "admission";
  if (/government\s*of|ministry\s*of|welfare\s*scheme|pradhan\s*mantri|subsidy/i.test(lower)) return "scheme";
  return "general";
}

function extractTitle(text: string, fallbackFileName: string, metadataTitle?: string): string {
  if (metadataTitle && metadataTitle.trim().length > 3 && !metadataTitle.startsWith("%PDF")) {
    return metadataTitle.trim();
  }

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 3 &&
        !l.startsWith("---") &&
        !l.startsWith("[Page") &&
        !l.startsWith("Spreadsheet Document:") &&
        !/^%PDF/i.test(l) &&
        !/^%\w+/i.test(l) &&
        !/^(?:obj|xref|trailer|endobj|stream|endstream|<<|>>)$/i.test(l)
    );

  if (lines.length > 0) {
    const candidate = lines[0].replace(/^#+\s*/, "");
    if (candidate.length < 120 && !candidate.startsWith("%")) {
      return candidate;
    }
  }
  return fallbackFileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
}

export function mapDoclingToParsedDocumentData(
  doclingData: DoclingRawResponse,
  file: Express.Multer.File
): ParsedDocumentData {
  const fullText = (doclingData.fullText || doclingData.markdown || "").trim();
  if (isSuspiciousPdfBinaryGarbage(fullText)) {
    throw new Error("Rejected Docling output containing binary PDF syntax.");
  }

  const detectedExt = getFileExtension(file.originalname);
  const detectedCategory = classifyCategory(fullText, file.originalname);
  const extractedTitle = extractTitle(fullText, file.originalname);

  const pages: DocumentPage[] = [];
  if (doclingData.pages && doclingData.pages.length > 0) {
    doclingData.pages.forEach((p, idx) => {
      // Never duplicate fullText across pages if a single page has empty text
      const pageText = (p.text ?? "").trim();
      pages.push({
        pageNumber: p.page_number || idx + 1,
        text: pageText,
        confidence: pageText ? 0.98 : 0,
        isOcr: Boolean(doclingData.ocrApplied),
        pageLabel: p.headings && p.headings.length > 0 ? p.headings[0] : undefined,
      });
    });
    // If single-page document had empty page text array item, populate page 1 with fullText
    if (pages.length === 1 && !pages[0].text && fullText) {
      pages[0].text = fullText;
      pages[0].confidence = 0.98;
    }
  } else {
    const pageChunks = fullText.split(/(?:---\s*)?\[Page\s+(\d+)\](?:\s*---)?/i);
    if (pageChunks.length > 1) {
      for (let i = 1; i < pageChunks.length; i += 2) {
        const pageNum = parseInt(pageChunks[i], 10) || Math.floor(i / 2) + 1;
        const pageContent = pageChunks[i + 1] || "";
        pages.push({
          pageNumber: pageNum,
          text: pageContent.trim(),
          confidence: 0.95,
          isOcr: Boolean(doclingData.ocrApplied),
        });
      }
    } else {
      pages.push({
        pageNumber: 1,
        text: fullText,
        confidence: 0.95,
        isOcr: Boolean(doclingData.ocrApplied),
      });
    }
  }

  const extractedTables = (doclingData.tables || []).map((t, idx) => ({
    tableIndex: t.table_index || idx + 1,
    page: t.page || 1,
    headers: t.headers || [],
    rows: t.rows || [],
    markdown: t.markdown || "",
  }));

  const sensitiveDetections = detectSensitiveEntities(fullText);
  const redactedText = buildRedactedTextCopy(fullText, sensitiveDetections);

  const wordCount = doclingData.wordCount || fullText.split(/\s+/).filter(Boolean).length;
  const extractionQualityScore =
    doclingData.qualityScore || Math.min(100, Math.max(30, Math.round((wordCount / (wordCount + 40)) * 100)));

  const extractionWarnings: string[] = [...(doclingData.warnings || [])];
  if (wordCount < 15) {
    extractionWarnings.push("Low word count detected. Document may contain scanned raster images or sparse text.");
  }
  if (sensitiveDetections.length > 0) {
    extractionWarnings.push(
      `${sensitiveDetections.length} sensitive identifier(s) detected and sanitized in accordance with default privacy policy.`
    );
  }

  const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  return {
    id: docId,
    fileName: file.originalname,
    fileSizeBytes: file.size,
    fileType: file.mimetype || "application/octet-stream",
    detectedFormat: detectedExt,
    uploadedAt: new Date().toISOString(),
    pages,
    fullText,
    markdownText: doclingData.markdown || fullText,
    redactedText,
    sensitiveDetections,
    wordCount,
    tableCount: extractedTables.length,
    sheetCount: 0,
    extractionQualityScore,
    parserEngineUsed: `docling-primary (${doclingData.engine || "docling-native"})`,
    extractionWarnings,
    extractedTables,
    detectedCategory,
    extractedTitle,
    ocrApplied: Boolean(doclingData.ocrApplied),
  };
}

/**
 * High-performance native extraction fallback for all supported formats
 */
export async function fallbackNativeExtraction(file: Express.Multer.File): Promise<ParsedDocumentData> {
  if (!file.buffer || file.buffer.byteLength === 0) {
    throw new Error(`Uploaded file '${file.originalname}' is empty (0 bytes).`);
  }

  const ext = getFileExtension(file.originalname);
  const buffer = file.buffer;
  let fullText = "";
  let pages: DocumentPage[] = [];
  let spreadsheetData = undefined;
  let extractedTables: Array<{ tableIndex: number; page: number; headers: string[]; rows: string[][]; markdown: string }> = [];
  let parserEngineUsed = "native-engine";
  let ocrApplied = false;
  let ocrConfidence: number | undefined = undefined;
  let metadataTitle: string | undefined = undefined;
  const extractionWarnings: string[] = [];

  if (ext === "pdf" || (buffer.byteLength >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46)) {
    parserEngineUsed = "pdfjs-dist-native";
    const pdfResult = await parsePdfBuffer(buffer);
    fullText = pdfResult.fullText;
    pages = pdfResult.pages;
    metadataTitle = pdfResult.metadata?.title;
    extractionWarnings.push(...pdfResult.warnings);

    // If PDF had 0 pages with native selectable text (scanned PDF), attempt OCR honestly
    if (pdfResult.nativeTextPages === 0) {
      const ocrResult = await processImageOcr(new Uint8Array(buffer), file.originalname);
      if (ocrResult.ocrSucceeded && ocrResult.wordCount > 0) {
        fullText = ocrResult.fullText;
        pages = ocrResult.pages;
        ocrApplied = true;
        ocrConfidence = ocrResult.confidence;
        parserEngineUsed = "pdf-scanned-ocr";
      }
      if (ocrResult.warningMessage) {
        extractionWarnings.push(ocrResult.warningMessage);
      }
    }
  } else if (ext === "xlsx" || ext === "xls" || ext === "csv" || ext === "ods") {
    parserEngineUsed = "sheetjs-native";
    spreadsheetData = parseSpreadsheetBuffer(new Uint8Array(buffer), file.originalname);
    const sheetRep = buildSpreadsheetDocumentRepresentation(spreadsheetData, file.originalname);
    fullText = sheetRep.fullText;
    pages = sheetRep.pages;
    extractedTables = sheetRep.extractedTables;
  } else if (ext === "docx") {
    parserEngineUsed = "mammoth-docx-native";
    const docxResult = await parseDocxBuffer(buffer);
    fullText = docxResult.fullText;
    pages = docxResult.pages;
  } else if (ext === "doc") {
    parserEngineUsed = "ole2-doc-native";
    const docResult = parseLegacyDocBuffer(buffer);
    fullText = docResult.fullText;
    pages = docResult.pages;
  } else if (ext === "pptx" || ext === "ppt") {
    parserEngineUsed = "openxml-pptx-native";
    const pptxResult = await parsePptxBuffer(buffer);
    fullText = pptxResult.fullText;
    pages = pptxResult.pages;
  } else if (ext === "rtf") {
    parserEngineUsed = "rtf-native";
    const rtfResult = parseRtfBuffer(buffer);
    fullText = rtfResult.fullText;
    pages = rtfResult.pages;
  } else if (ext === "odt" || ext === "odp") {
    parserEngineUsed = "odt-xml-native";
    const odtResult = await parseOdtArchiveBuffer(buffer);
    fullText = odtResult.fullText;
    pages = odtResult.pages;
  } else if (["png", "jpg", "jpeg", "webp", "tiff"].includes(ext)) {
    parserEngineUsed = "tesseract-ocr-native";
    const ocrResult = await processImageOcr(new Uint8Array(buffer), file.originalname);
    fullText = ocrResult.fullText;
    pages = ocrResult.pages.length > 0 ? ocrResult.pages : [{ pageNumber: 1, text: "", confidence: 0, isOcr: true }];
    ocrApplied = ocrResult.ocrSucceeded;
    ocrConfidence = ocrResult.ocrSucceeded ? ocrResult.confidence : undefined;
    if (ocrResult.warningMessage) {
      extractionWarnings.push(ocrResult.warningMessage);
    }
  } else {
    // Plain text / Markdown / HTML fallback — reject binary payloads disguised as text
    if (isBinaryBuffer(buffer)) {
      throw new Error(`File '${file.originalname}' contains binary data that does not match a supported document format.`);
    }
    parserEngineUsed = "text-stream-native";
    const rawText = buffer.toString("utf-8");
    const txtResult = parsePlainText(rawText);
    fullText = txtResult.fullText;
    pages = txtResult.pages;
  }

  const sensitiveDetections = detectSensitiveEntities(fullText);
  const redactedText = buildRedactedTextCopy(fullText, sensitiveDetections);
  const wordCount = fullText.split(/\s+/).filter(Boolean).length;
  const detectedCategory = classifyCategory(fullText, file.originalname);
  const extractedTitle = extractTitle(fullText, file.originalname, metadataTitle);

  let extractionQualityScore = Math.min(100, Math.max(30, Math.round((wordCount / (wordCount + 40)) * 100)));
  if (wordCount === 0) {
    extractionQualityScore = 0;
  } else if (wordCount < 15) {
    extractionQualityScore = 20;
  }

  return {
    id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    fileName: file.originalname,
    fileSizeBytes: file.size,
    fileType: file.mimetype || "application/octet-stream",
    detectedFormat: ext,
    uploadedAt: new Date().toISOString(),
    pages,
    fullText,
    markdownText: fullText,
    redactedText,
    sensitiveDetections,
    spreadsheetData,
    ocrApplied,
    ocrConfidence,
    wordCount,
    tableCount: extractedTables.length,
    sheetCount: spreadsheetData ? spreadsheetData.sheetNames.length : 0,
    extractionQualityScore,
    parserEngineUsed,
    extractionWarnings,
    extractedTables,
    detectedCategory,
    extractedTitle,
  };
}

/**
 * -----------------------------------------------------------------------------
 * ASYNCHRONOUS JOB PROCESSING ARCHITECTURE
 * -----------------------------------------------------------------------------
 */

export interface ExtractionJob {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  stage: string;
  progressPercent: number;
  fileName: string;
  fileSizeBytes: number;
  engine?: string;
  data?: ParsedDocumentData;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

const jobsStore = new Map<string, ExtractionJob>();

// Clean old jobs every 15 minutes
setInterval(() => {
  const cutoff = Date.now() - 3600 * 1000;
  for (const [id, job] of jobsStore.entries()) {
    if (job.createdAt < cutoff) {
      jobsStore.delete(id);
    }
  }
}, 15 * 60 * 1000).unref?.();

/**
 * POST /api/documents/jobs (and /api/extract/jobs)
 * Initiates an asynchronous extraction job with stage-by-stage tracking
 */
export async function handleCreateExtractionJob(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No file uploaded. Supply file in 'file' field." });
    return;
  }

  if (file.size === 0) {
    res.status(400).json({ error: `Uploaded file '${file.originalname}' is empty (0 bytes).` });
    return;
  }

  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const job: ExtractionJob = {
    jobId,
    status: "processing",
    stage: "Uploading file & validating binary signatures...",
    progressPercent: 15,
    fileName: file.originalname,
    fileSizeBytes: file.size,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  jobsStore.set(jobId, job);

  // Return immediate job reference for polling
  res.status(202).json({
    success: true,
    jobId,
    status: job.status,
    stage: job.stage,
    progressPercent: job.progressPercent,
    fileName: job.fileName,
  });

  // Execute extraction in the background
  (async () => {
    try {
      job.stage = "Identifying format & file structure...";
      job.progressPercent = 25;
      job.updatedAt = Date.now();

      let parsedData: ParsedDocumentData;
      let engine = "native";

      const health = await probeDoclingHealth();
      if (health.online && health.doclingAvailable) {
        job.stage = "Extracting content via Docling neural layout engine...";
        job.progressPercent = 45;
        job.updatedAt = Date.now();

        try {
          const doclingData = await extractWithDoclingService(file.buffer, file.originalname, file.mimetype);
          parsedData = mapDoclingToParsedDocumentData(doclingData, file);
          engine = "docling";
        } catch (dErr: any) {
          console.warn(`Docling job fallback for ${file.originalname}:`, dErr?.message);
          job.stage = "Extracting content via specialized native engine...";
          job.progressPercent = 60;
          job.updatedAt = Date.now();
          parsedData = await fallbackNativeExtraction(file);
        }
      } else {
        job.stage = "Extracting content via specialized native engine...";
        job.progressPercent = 50;
        job.updatedAt = Date.now();
        parsedData = await fallbackNativeExtraction(file);
      }

      if (job.status === "cancelled") return;

      job.stage = "Reading tables & document hierarchy...";
      job.progressPercent = 75;
      job.updatedAt = Date.now();

      job.stage = "Scanning text for sensitive identifiers & checking quality...";
      job.progressPercent = 90;
      job.updatedAt = Date.now();

      job.status = "completed";
      job.stage = "Extraction complete. Document ready for analysis.";
      job.progressPercent = 100;
      job.engine = engine;
      job.data = parsedData;
      job.updatedAt = Date.now();
    } catch (err: any) {
      if (job.status !== "cancelled") {
        job.status = "failed";
        job.stage = "Extraction failed";
        job.error = err?.message || "Internal extraction error";
        job.updatedAt = Date.now();
      }
    }
  })();
}

/**
 * GET /api/documents/jobs/:jobId
 * Returns current job progress and result once complete
 */
export function handleGetExtractionJob(req: Request, res: Response): void {
  const { jobId } = req.params;
  const job = jobsStore.get(jobId);

  if (!job) {
    res.status(404).json({ error: "Job not found or expired", jobId });
    return;
  }

  res.json({
    jobId: job.jobId,
    status: job.status,
    stage: job.stage,
    progressPercent: job.progressPercent,
    fileName: job.fileName,
    engine: job.engine,
    data: job.data,
    error: job.error,
    updatedAt: job.updatedAt,
  });
}

/**
 * POST /api/documents/jobs/:jobId/cancel
 * Cancels a running job
 */
export function handleCancelExtractionJob(req: Request, res: Response): void {
  const { jobId } = req.params;
  const job = jobsStore.get(jobId);

  if (!job) {
    res.status(404).json({ error: "Job not found", jobId });
    return;
  }

  job.status = "cancelled";
  job.stage = "Job cancelled by user";
  job.updatedAt = Date.now();

  res.json({ success: true, message: "Job cancelled successfully", jobId });
}

/**
 * Synchronous Express handler for POST /api/extract
 */
export async function handleDocumentExtraction(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file) {
    res.status(400).json({
      error: "No file uploaded. Please supply a file under the 'file' multipart form field.",
    });
    return;
  }

  if (file.size === 0) {
    res.status(400).json({
      error: `Uploaded file '${file.originalname}' is empty (0 bytes).`,
      fileName: file.originalname,
    });
    return;
  }

  const startTime = Date.now();

  try {
    const health = await probeDoclingHealth();
    if (health.online && health.doclingAvailable) {
      const doclingData = await extractWithDoclingService(file.buffer, file.originalname, file.mimetype);
      const parsedData = mapDoclingToParsedDocumentData(doclingData, file);
      const durationMs = Date.now() - startTime;

      res.json({
        success: true,
        engine: "docling",
        processingTimeMs: durationMs,
        data: parsedData,
      });
      return;
    }
  } catch (doclingErr: any) {
    console.warn(`[DOCULENS Ingestion] Docling microservice notice for '${file.originalname}': ${doclingErr?.message}. Proceeding with native parser...`);
  }

  try {
    const fallbackData = await fallbackNativeExtraction(file);
    const durationMs = Date.now() - startTime;

    res.json({
      success: true,
      engine: "native-fallback",
      processingTimeMs: durationMs,
      data: fallbackData,
    });
  } catch (fallbackErr: any) {
    console.error(`[DOCULENS Ingestion] Fatal extraction error for '${file.originalname}':`, fallbackErr?.message);
    res.status(422).json({
      error: `Document extraction failed: ${fallbackErr?.message || "Unknown error"}`,
      fileName: file.originalname,
    });
  }
}

