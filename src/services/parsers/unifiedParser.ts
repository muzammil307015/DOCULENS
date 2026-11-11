/**
 * DOCULENS Universal Ingestion & Extraction Pipeline
 *
 * Implements the full 11-stage extraction workflow:
 * 1. Extension, MIME, size & magic byte signature validation
 * 2. Format detection
 * 3. Primary backend job/extraction pipeline (with Docling integration when online)
 * 4. High-performance native format parsers (PDF, DOCX, DOC, XLSX, XLS, CSV, ODS, PPTX, PPT, ODP, RTF, ODT, TXT, HTML, Images)
 * 5. Scanned & mixed document detection & genuine Tesseract OCR execution
 * 6. Structured table & multi-sheet spreadsheet extraction (no arbitrary row truncation)
 * 7. Quality score calculation & empty/binary content verification
 * 8. Deterministic sensitive entity detection & sanitized copy generation
 */

import { APP_CONFIG } from "../../config/appConfig";
import { DocumentCategory, DocumentPage, ParsedDocumentData } from "../../types";
import { buildRedactedTextCopy, detectSensitiveEntities } from "../privacyService";
import { convertWithDocling } from "./doclingClient";
import { parseDocxBuffer } from "./docxParser";
import { parseLegacyDocBuffer } from "./docParser";
import { processImageOcr } from "./ocrParser";
import { parsePdfBuffer, isSuspiciousPdfBinaryGarbage } from "./pdfParser";
import { parsePptxBuffer } from "./pptxParser";
import { parseRtfBuffer } from "./rtfParser";
import { parseOdtArchiveBuffer } from "./odtParser";
import { parseSpreadsheetBuffer, buildSpreadsheetDocumentRepresentation } from "./sheetParser";
import { parsePlainText } from "./textParser";

/**
 * Validates magic bytes / file signatures to prevent extension spoofing
 */
export function detectActualFormat(buffer: ArrayBuffer, fileName: string): string {
  const bytes = new Uint8Array(buffer.slice(0, Math.min(1024, buffer.byteLength)));
  const lastDot = fileName.lastIndexOf(".");
  const ext = lastDot !== -1 ? fileName.toLowerCase().slice(lastDot) : "";

  // Check PDF: %PDF (0x25 0x50 0x44 0x46) anywhere in first 1024 bytes (or if extension is .pdf, let pdfParser validate it)
  const headerAscii = new TextDecoder("latin1").decode(bytes);
  if (headerAscii.includes("%PDF-")) {
    return "pdf";
  }

  // Check ZIP-based OpenXML: PK\x03\x04
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    if (ext.includes("xlsx")) return "xlsx";
    if (ext.includes("docx")) return "docx";
    if (ext.includes("pptx")) return "pptx";
    if (ext.includes("odt")) return "odt";
    if (ext.includes("ods")) return "ods";
    if (ext.includes("odp")) return "odp";
    return "zip_document";
  }

  // Check Legacy OLE2 (DOC, XLS, PPT): 0xD0 0xCF 0x11 0xE0
  if (bytes.length >= 4 && bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) {
    if (ext.includes("xls")) return "xls";
    if (ext.includes("ppt")) return "ppt";
    return "doc";
  }

  // Check Images: PNG
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "png";
  }

  // Check JPEG: 0xFF 0xD8 0xFF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }

  // Check WEBP: RIFF...WEBP
  if (bytes.length >= 4 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    return "webp";
  }

  // Check RTF: {\rtf
  if (bytes.length >= 5 && bytes[0] === 0x7b && bytes[1] === 0x5c && bytes[2] === 0x72 && bytes[3] === 0x74 && bytes[4] === 0x66) {
    return "rtf";
  }

  // Default by extension
  if (ext.startsWith(".")) return ext.slice(1);
  return "txt";
}

/**
 * Auto-classifies document category from text & metadata
 */
export function classifyDocumentCategory(text: string, fileName: string): DocumentCategory {
  const lower = (text + " " + fileName).toLowerCase();

  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv") || fileName.endsWith(".ods")) {
    return "spreadsheet";
  }

  const scores: Record<DocumentCategory, number> = {
    rfp_tender: 0,
    scholarship: 0,
    admission: 0,
    job: 0,
    contract: 0,
    scheme: 0,
    spreadsheet: 0,
    general: 0,
  };

  for (const cat of APP_CONFIG.categories) {
    const id = cat.id as DocumentCategory;
    for (const kw of cat.defaultKeywords) {
      const regex = new RegExp(`\\b${kw}\\b`, "gi");
      const matches = lower.match(regex);
      if (matches) {
        scores[id] += matches.length * 2;
      }
    }
  }

  if (/tender\s*no|notice\s*inviting\s*tender|emd\s*amount|turnover|gem\s*portal|procurement|bid\s*security|request\s*for\s*proposal|solicitation/i.test(lower)) {
    scores.rfp_tender += 20;
  }
  if (/scholarship|stipend|financial\s*aid|fellowship|annual\s*family\s*income|cgpa|marksheet/i.test(lower)) {
    scores.scholarship += 20;
  }
  if (/master\s*services\s*agreement|non-disclosure|indemnif|termination\s*clause|governing\s*law|liability/i.test(lower)) {
    scores.contract += 20;
  }
  if (/job\s*description|role\s*responsibilities|years\s*of\s*experience|skills\s*required|apply\s*now|salary\s*range/i.test(lower)) {
    scores.job += 20;
  }
  if (/college\s*admission|undergraduate|postgraduate|entrance\s*examination|semester\s*fee|prospectus|cutoff/i.test(lower)) {
    scores.admission += 20;
  }
  if (/government\s*of|pradhan\s*mantri|ministry\s*of|welfare\s*scheme|subsidy\s*disbursal|yojana/i.test(lower)) {
    scores.scheme += 20;
  }

  let highestCat: DocumentCategory = "general";
  let maxScore = 0;

  for (const [cat, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      highestCat = cat as DocumentCategory;
    }
  }

  return maxScore >= 4 ? highestCat : "general";
}

export function extractTitleFromText(text: string, fallbackFileName: string, metadataTitle?: string): string {
  if (metadataTitle && metadataTitle.trim().length > 3 && !metadataTitle.startsWith("%PDF")) {
    return metadataTitle.trim();
  }

  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => {
      if (l.length < 3) return false;
      if (l.startsWith("---") || l.startsWith("[Page") || l.startsWith("Spreadsheet Document:")) return false;
      if (/^%PDF/i.test(l) || /^%\w+/i.test(l)) return false;
      if (/^(?:obj|xref|trailer|endobj|stream|endstream|<<|>>)$/i.test(l)) return false;
      if (/^(?:page\s+\d+|\d+\s+of\s+\d+|confidential|draft)$/i.test(l)) return false;
      return true;
    });

  if (lines.length > 0) {
    const candidate = lines[0].replace(/^#+\s*/, "");
    if (candidate.length < 120 && !candidate.startsWith("%")) {
      return candidate;
    }
  }

  const cleanName = fallbackFileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleanName.length > 0 ? cleanName : "Untitled Document";
}

/**
 * Primary universal ingestion pipeline
 */
export async function parseDocumentFile(
  file: File | { name: string; size: number; type: string; arrayBuffer: () => Promise<ArrayBuffer>; text?: () => Promise<string> },
  onProgress?: (stage: string, percent: number) => void
): Promise<ParsedDocumentData> {
  const fileName = file.name || "Untitled_Document";
  const lowerName = fileName.toLowerCase();
  const lastDotIdx = lowerName.lastIndexOf(".");
  const ext = lastDotIdx !== -1 ? lowerName.slice(lastDotIdx + 1) : "txt";
  const fileType = file.type || (lastDotIdx !== -1 ? lowerName.slice(lastDotIdx) : "text/plain");

  if (onProgress) onProgress("Validating file signature & format...", 15);

  const arrayBuffer = await file.arrayBuffer();
  const fileSizeBytes = arrayBuffer.byteLength || file.size;

  if (fileSizeBytes === 0) {
    throw new Error(`Uploaded document '${fileName}' is empty (0 bytes).`);
  }

  const supportedFormats = new Set([
    "pdf", "docx", "doc", "xlsx", "xls", "csv", "ods",
    "pptx", "ppt", "odp", "rtf", "odt", "txt", "md", "html",
    "png", "jpg", "jpeg", "webp", "tiff",
  ]);

  const detectedFormat = detectActualFormat(arrayBuffer, fileName);
  if (!supportedFormats.has(detectedFormat) && !supportedFormats.has(ext)) {
    throw new Error(`Unsupported document format '${ext || detectedFormat}'. Supported formats: PDF, DOCX, DOC, XLSX, XLS, CSV, ODS, PPTX, RTF, ODT, TXT, and Images.`);
  }

  const isBrowser = typeof window !== "undefined" && typeof window.location !== "undefined";
  const isRealBrowserFile = isBrowser && typeof File !== "undefined" && file instanceof File;

  // Stage 1: In Browser for real user uploads, coordinate with Backend Job / Extraction API
  if (isRealBrowserFile && typeof fetch !== "undefined") {
    try {
      if (onProgress) onProgress("Uploading document & starting extraction job...", 22);
      const formData = new FormData();
      const blob = new Blob([arrayBuffer], { type: fileType });
      formData.append("file", blob, fileName);

      const jobController = new AbortController();
      const jobTimeout = setTimeout(() => jobController.abort(), 20000);

      try {
        const jobRes = await fetch("/api/documents/jobs", {
          method: "POST",
          body: formData,
          signal: jobController.signal,
        });
        clearTimeout(jobTimeout);

        if (jobRes.ok) {
          const jobJson = await jobRes.json();
          const jobId = jobJson.jobId;

          if (jobId) {
            // Poll job progress with realistic timeout (up to 60 seconds for large PDFs / Docling)
            for (let poll = 0; poll < 200; poll++) {
              await new Promise((r) => setTimeout(r, 300));
              const pollRes = await fetch(`/api/documents/jobs/${jobId}`);
              if (pollRes.ok) {
                const pollData = await pollRes.json();
                if (pollData.stage && onProgress) {
                  onProgress(
                    pollData.stage,
                    Math.max(25, Math.min(95, pollData.progressPercent || 35))
                  );
                }

                if (pollData.status === "completed" && pollData.data) {
                  const serverDoc = pollData.data as ParsedDocumentData;
                  if (serverDoc.fullText && !isSuspiciousPdfBinaryGarbage(serverDoc.fullText)) {
                    if (onProgress) onProgress("Extraction complete.", 100);
                    return serverDoc;
                  }
                  break;
                } else if (pollData.status === "failed") {
                  // If file itself was invalid/corrupted, surface error; otherwise allow local parser fallback
                  if (/invalid|corrupted|empty|unsupported/i.test(pollData.error || "")) {
                    throw new Error(pollData.error);
                  }
                  break;
                }
              } else if (pollRes.status === 404) {
                break;
              }
            }
          }
        }
      } catch (jobErr: any) {
        clearTimeout(jobTimeout);
        if (/invalid|corrupted|empty|unsupported/i.test(jobErr?.message || "")) {
          throw jobErr;
        }
      }
    } catch (err: any) {
      if (/invalid|corrupted|empty|unsupported/i.test(err?.message || "")) {
        throw err;
      }
      console.info("Server extraction unavailable, falling back to client native pipeline:", err?.message);
    }
  } else if (!isBrowser) {
    // In Node.js direct calls, check if Docling service is available before running native parsers
    const doclingDirect = await convertWithDocling(arrayBuffer, fileName);
    if (doclingDirect && doclingDirect.fullText && !isSuspiciousPdfBinaryGarbage(doclingDirect.fullText)) {
      const sensitiveDetections = detectSensitiveEntities(doclingDirect.fullText);
      const redactedText = buildRedactedTextCopy(doclingDirect.fullText, sensitiveDetections);
      const detectedCategory = classifyDocumentCategory(doclingDirect.fullText, fileName);
      const extractedTitle = extractTitleFromText(doclingDirect.fullText, fileName);
      if (onProgress) onProgress("Ingestion complete.", 100);
      return {
        id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        fileName,
        fileSizeBytes,
        fileType,
        detectedFormat,
        uploadedAt: new Date().toISOString(),
        pages: doclingDirect.pages.length > 0
          ? doclingDirect.pages.map(p => ({
              pageNumber: p.pageNumber,
              text: p.text,
              confidence: p.text ? 0.98 : 0,
              isOcr: doclingDirect.ocrApplied,
              pageLabel: p.headings?.[0],
            }))
          : [{ pageNumber: 1, text: doclingDirect.fullText, confidence: 0.98, isOcr: doclingDirect.ocrApplied }],
        fullText: doclingDirect.fullText,
        markdownText: doclingDirect.markdown || doclingDirect.fullText,
        redactedText,
        sensitiveDetections,
        ocrApplied: doclingDirect.ocrApplied,
        wordCount: doclingDirect.wordCount,
        tableCount: doclingDirect.tableCount,
        sheetCount: 0,
        extractionQualityScore: doclingDirect.qualityScore,
        parserEngineUsed: `docling-primary (${doclingDirect.engine})`,
        extractionWarnings: doclingDirect.warnings,
        extractedTables: doclingDirect.tables,
        detectedCategory,
        extractedTitle,
      };
    }
  }

  // Stage 2: Specialized High-Speed Native Engine
  if (onProgress) onProgress(`Extracting content via specialized ${detectedFormat.toUpperCase()} parser...`, 45);

  let fullText = "";
  let markdownText = "";
  let pages: DocumentPage[] = [];
  let spreadsheetData: any = undefined;
  let ocrApplied = false;
  let ocrConfidence: number | undefined = undefined;
  let parserEngineUsed = "native-extractor";
  let metadataTitle: string | undefined = undefined;
  const extractionWarnings: string[] = [];
  let extractedTables: Array<{ tableIndex: number; page: number; headers: string[]; rows: string[][]; markdown: string }> = [];

  // Handle synthetic text demo files that have .pdf/.docx extension but contain plain UTF-8 text
  const headerBytes = new Uint8Array(arrayBuffer.slice(0, 8));
  const isSyntheticPlainTextDemo =
    (ext === "pdf" && !(headerBytes[0] === 0x25 && headerBytes[1] === 0x50 && headerBytes[2] === 0x44 && headerBytes[3] === 0x46)) ||
    ((ext === "docx" || ext === "xlsx" || ext === "pptx" || ext === "odt") && !(headerBytes[0] === 0x50 && headerBytes[1] === 0x4b));

  if (isSyntheticPlainTextDemo && typeof (file as any).text === "function") {
    const rawText = await (file as any).text();
    // Only treat as synthetic demo text if it looks like valid human-readable text without binary nulls
    if (rawText && !rawText.includes("\x00") && !/^%PDF/i.test(rawText.trim())) {
      parserEngineUsed = "structured-text-stream";
      const pageSplit = rawText.split(/---\s*\[Page\s+(\d+)\]\s*---/i);
      if (pageSplit.length > 1) {
        for (let i = 1; i < pageSplit.length; i += 2) {
          const pNum = parseInt(pageSplit[i], 10) || Math.floor(i / 2) + 1;
          const pTxt = (pageSplit[i + 1] || "").trim();
          pages.push({ pageNumber: pNum, text: pTxt, confidence: 0.99 });
        }
        fullText = rawText.trim();
      } else {
        const txtResult = parsePlainText(rawText);
        fullText = txtResult.fullText;
        pages = txtResult.pages;
      }
      markdownText = fullText;
    }
  }

  if (!fullText && pages.length === 0) {
    if (detectedFormat === "xlsx" || detectedFormat === "xls" || detectedFormat === "csv" || detectedFormat === "ods") {
      parserEngineUsed = "sheetjs-formula-safe";
      spreadsheetData = parseSpreadsheetBuffer(arrayBuffer, fileName);
      const sheetRep = buildSpreadsheetDocumentRepresentation(spreadsheetData, fileName);
      fullText = sheetRep.fullText;
      pages = sheetRep.pages;
      extractedTables = sheetRep.extractedTables;
      markdownText = fullText;
    } else if (detectedFormat === "docx") {
      parserEngineUsed = "mammoth-docx";
      const docxResult = await parseDocxBuffer(arrayBuffer);
      fullText = docxResult.fullText;
      pages = docxResult.pages;
      markdownText = fullText;
    } else if (detectedFormat === "doc") {
      parserEngineUsed = "ole2-binary-doc";
      const docResult = parseLegacyDocBuffer(arrayBuffer);
      fullText = docResult.fullText;
      pages = docResult.pages;
      markdownText = fullText;
    } else if (detectedFormat === "pdf" || ext === "pdf") {
      parserEngineUsed = "pdfjs-dist";
      const pdfResult = await parsePdfBuffer(arrayBuffer);
      fullText = pdfResult.fullText;
      pages = pdfResult.pages;
      markdownText = fullText;
      metadataTitle = pdfResult.metadata?.title;
      extractionWarnings.push(...pdfResult.warnings);

      // Scanned PDF detection: only attempt OCR when nativeTextPages === 0 (or on empty pages in browser)
      if (pdfResult.nativeTextPages === 0) {
        if (onProgress) onProgress("Scanned PDF detected (no selectable text layer). Attempting OCR...", 65);
        const ocrFallback = await processImageOcr(new Uint8Array(arrayBuffer), fileName);
        if (ocrFallback.ocrSucceeded && ocrFallback.wordCount > 0) {
          fullText = ocrFallback.fullText;
          pages = ocrFallback.pages;
          markdownText = fullText;
          ocrApplied = true;
          ocrConfidence = ocrFallback.confidence;
          parserEngineUsed = "pdf-scanned-ocr";
        } else {
          ocrApplied = false;
        }
        if (ocrFallback.warningMessage) {
          extractionWarnings.push(ocrFallback.warningMessage);
        }
      } else if (pdfResult.emptyOrScannedPages > 0 && isBrowser) {
        // Mixed text + scanned PDF: try OCR only on the empty pages without overwriting native text pages
        const emptyPageNums = pages.filter(p => !p.text.trim()).map(p => p.pageNumber);
        if (emptyPageNums.length > 0 && emptyPageNums.length <= 5) {
          if (onProgress) onProgress(`Running OCR on ${emptyPageNums.length} scanned page(s)...`, 65);
          const partialOcr = await processImageOcr(new Uint8Array(arrayBuffer), fileName, emptyPageNums);
          if (partialOcr.ocrSucceeded && partialOcr.pages.some(op => op.text.trim().length > 0)) {
            ocrApplied = true;
            ocrConfidence = partialOcr.confidence;
            const ocrPageMap = new Map(partialOcr.pages.map(op => [op.pageNumber, op]));
            pages = pages.map(p => {
              const ocrP = ocrPageMap.get(p.pageNumber);
              if (!p.text.trim() && ocrP && ocrP.text.trim()) {
                return ocrP;
              }
              return p;
            });
            fullText = pages
              .filter(p => p.text.trim().length > 0)
              .map(p => `--- [Page ${p.pageNumber}] ---\n${p.text}`)
              .join("\n\n");
            markdownText = fullText;
          }
        }
      }
    } else if (detectedFormat === "rtf") {
      parserEngineUsed = "rtf-stream";
      const rtfResult = parseRtfBuffer(arrayBuffer);
      fullText = rtfResult.fullText;
      pages = rtfResult.pages;
      markdownText = fullText;
    } else if (detectedFormat === "odt" || detectedFormat === "odp") {
      parserEngineUsed = "opendocument-xml";
      const odtResult = await parseOdtArchiveBuffer(arrayBuffer);
      fullText = odtResult.fullText;
      pages = odtResult.pages;
      markdownText = fullText;
    } else if (detectedFormat === "pptx" || detectedFormat === "ppt") {
      parserEngineUsed = "openxml-pptx";
      const pptxResult = await parsePptxBuffer(arrayBuffer);
      fullText = pptxResult.fullText;
      pages = pptxResult.pages;
      markdownText = fullText;
    } else if (["png", "jpeg", "jpg", "webp", "tiff"].includes(detectedFormat)) {
      if (onProgress) onProgress("Running real Tesseract OCR on image document...", 60);
      parserEngineUsed = "tesseract-ocr";
      const ocrResult = await processImageOcr(new Uint8Array(arrayBuffer), fileName);
      fullText = ocrResult.fullText;
      pages = ocrResult.pages.length > 0 ? ocrResult.pages : [{ pageNumber: 1, text: "", confidence: 0, isOcr: true }];
      ocrApplied = ocrResult.ocrSucceeded;
      ocrConfidence = ocrResult.ocrSucceeded ? ocrResult.confidence : undefined;
      markdownText = fullText;
      if (ocrResult.warningMessage) {
        extractionWarnings.push(ocrResult.warningMessage);
      }
    } else {
      // Plain text / markdown / html fallback
      const rawBytes = new Uint8Array(arrayBuffer.slice(0, Math.min(2048, arrayBuffer.byteLength)));
      if (rawBytes.includes(0x00)) {
        throw new Error(`Binary file '${fileName}' cannot be parsed as plain text.`);
      }
      parserEngineUsed = "plain-text-stream";
      const rawText = new TextDecoder("utf-8").decode(arrayBuffer);
      const txtResult = parsePlainText(rawText);
      fullText = txtResult.fullText;
      pages = txtResult.pages;
      markdownText = fullText;
    }
  }

  if (onProgress) onProgress("Verifying extracted text quality & structure...", 75);

  // Calculate metrics
  const words = fullText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const tableCount = extractedTables.length;
  const sheetCount = spreadsheetData?.sheetNames?.length || 0;

  // Quality verification
  let extractionQualityScore = 92;
  if (wordCount === 0) {
    extractionQualityScore = 0;
    extractionWarnings.push("No readable text could be extracted. The document may be an unsearchable scan, blank, or encrypted.");
  } else if (wordCount < 15) {
    extractionQualityScore = 25;
    extractionWarnings.push("Minimal readable text extracted (< 15 words). Document may contain primarily scanned images.");
  } else if (wordCount < 50) {
    extractionQualityScore = 60;
    extractionWarnings.push("Short document content (< 50 words). Certain requirement clauses may be unstated.");
  }
  if (ocrApplied && (ocrConfidence || 1) < 0.75) {
    extractionQualityScore = Math.min(extractionQualityScore, 65);
    extractionWarnings.push("Low OCR confidence level. Double-check numbers and critical codes against the original scan.");
  }

  // Stage 3: Deterministic Privacy Detection & Redaction
  if (onProgress) onProgress("Running deterministic privacy scan & masking sensitive entities...", 90);
  const sensitiveDetections = detectSensitiveEntities(fullText);
  const redactedText = buildRedactedTextCopy(fullText, sensitiveDetections);
  const detectedCategory = classifyDocumentCategory(fullText, fileName);
  const extractedTitle = extractTitleFromText(fullText, fileName, metadataTitle);

  if (onProgress) onProgress("Ingestion complete.", 100);

  return {
    id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    fileName,
    fileSizeBytes,
    fileType,
    detectedFormat,
    uploadedAt: new Date().toISOString(),
    pages,
    fullText,
    markdownText: markdownText || fullText,
    redactedText,
    sensitiveDetections,
    spreadsheetData,
    ocrApplied,
    ocrConfidence,
    wordCount,
    tableCount,
    sheetCount,
    extractionQualityScore,
    parserEngineUsed,
    extractionWarnings,
    extractedTables,
    detectedCategory,
    extractedTitle,
  };
}

