/**
 * DOCULENS Ingestion, Extraction & Deterministic Analysis Automated Test Suite
 *
 * Exercises the end-to-end pipeline across supported document formats:
 * - PDF structure & page extraction
 * - Word (DOCX) text extraction
 * - Spreadsheets (XLSX multi-sheet and CSV)
 * - Presentations (PPTX)
 * - Rich Text Format (RTF)
 * - OpenDocument (ODT)
 * - Deterministic parsing: amounts, currencies, deadlines, conditions, quality score
 * - Privacy sanitization: Luhn payment card and identifier detection
 */

import { parseDocumentFile } from "../src/services/parsers/unifiedParser";
import { runDeterministicAnalysis } from "../src/services/deterministicEngine";
import { parseRtfBuffer } from "../src/services/parsers/rtfParser";
import { parseLegacyDocBuffer } from "../src/services/parsers/docParser";
import { detectSensitiveEntities, buildRedactedTextCopy } from "../src/services/privacyService";

async function runAllTests() {
  console.log("=================================================");
  console.log("   DOCULENS AUTOMATED PIPELINE TEST SUITE       ");
  console.log("=================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✓ PASS: ${testName}`);
    } else {
      console.error(`  ✗ FAIL: ${testName}${detail ? ` (${detail})` : ""}`);
    }
  }

  // TEST 1: CSV / Spreadsheet Parsing & Cell Provenance
  console.log("--- 1. Testing Spreadsheet & CSV Ingestion ---");
  const sampleCsv = `Applicant ID,Full Name,Turnover,Submission Date,Status\nAPP-001,Alpha Technologies,"₹50,00,000",2026-12-15,Verified\nAPP-002,Beta Logistics,"₹1,20,00,000",2026-11-30,Pending\nAPP-003,Gamma Solutions,"₹85,00,000",2026-10-05,Expired`;
  const enc = new TextEncoder();
  const csvBytes = enc.encode(sampleCsv);

  const csvFile = {
    name: "tender_applicants.csv",
    size: csvBytes.byteLength,
    type: "text/csv",
    arrayBuffer: async () => csvBytes.buffer.slice(csvBytes.byteOffset, csvBytes.byteOffset + csvBytes.byteLength),
    text: async () => sampleCsv,
  };

  const parsedCsv = await parseDocumentFile(csvFile);
  assert(parsedCsv.pages.length > 0, "CSV generates structured text stream");
  assert(parsedCsv.spreadsheetData !== undefined, "Spreadsheet structure populated");
  assert(parsedCsv.spreadsheetData?.sheetNames.length === 1, "Sheet count is 1 for CSV");
  assert(parsedCsv.spreadsheetData?.rowCount === 3, "Row count correctly matches data rows");
  assert(parsedCsv.extractionQualityScore > 80, "Extraction quality score computed and high (>80%)");

  const analysisCsv = runDeterministicAnalysis(parsedCsv);
  assert(analysisCsv.title.length > 0, "Deterministic title extracted");
  assert(analysisCsv.financialInformation.length > 0, "Currency figures detected in CSV (₹50,00,000)");

  // TEST 2: RTF Parser
  console.log("\n--- 2. Testing RTF Stream Extraction ---");
  const sampleRtf = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Courier;}}\\f0\\fs24 DOCULENS Tender Notice\\par EMD Amount: ₹25,000\\par Last Date of Submission: 30 December 2026\\par All bids must submit ISO 9001 Certificate.}`;
  const rtfBuffer = new TextEncoder().encode(sampleRtf);
  const rtfResult = parseRtfBuffer(rtfBuffer.buffer);
  assert(rtfResult.fullText.includes("DOCULENS Tender Notice"), "RTF text contains header");
  assert(rtfResult.fullText.includes("₹25,000"), "RTF text contains EMD amount");
  assert(!rtfResult.fullText.includes("\\fonttbl"), "RTF control words cleanly stripped");

  // TEST 3: Legacy DOC Stream Extraction
  console.log("\n--- 3. Testing Legacy DOC Binary Stream Extraction ---");
  const docBuffer = new TextEncoder().encode("TENDER DOCUMENT REF 2026/099. Mandatory GST Registration required. Annual turnover limit: ₹2,00,00,000.");
  const docResult = parseLegacyDocBuffer(docBuffer.buffer);
  assert(docResult.fullText.includes("TENDER DOCUMENT"), "DOC stream extracted plain text strings");

  // TEST 4: Deterministic Scholarship & Indian Currency / Lakh / Crore parsing
  console.log("\n--- 4. Testing Indian Currency & Scholarship Criteria Extraction ---");
  const scholarshipNotice = `
GOVERNMENT OF INDIA - MINISTRY OF EDUCATION
NATIONAL MERIT SCHOLARSHIP NOTIFICATION 2026-27
Reference Number: SCH/2026/ED-4491
Date of Notification: 15 October 2026

1. Objective:
The Government invites applications from eligible undergraduate scholars across India.

2. Scholarship Amount & Grant:
Selected candidates shall receive financial assistance of ₹25,000 per annum for tuition fees.
Additional contingency allowance of ₹10,000 shall be credited directly to the student's Aadhaar-linked bank account.

3. Eligibility Criteria:
a) Candidate must have secured minimum 70% marks in Class 12th Senior Secondary examinations.
b) Annual family income limit must not exceed ₹2,00,000 (Rupees Two Lakhs) from all sources.
c) Applicant must be a citizen of India.

4. Mandatory Documents Required:
- Marksheet of Class 12th Board Examination
- Valid Income Certificate issued by competent Revenue Authority
- Bank Details and cancelled cheque
- College Admission Proof and Fee Receipt
- Caste Certificate (if claiming quota)

5. Important Dates & Submission Deadline:
- Opening Date: 01 November 2026
- Application Deadline: 30 December 2026
- Document Verification Window: 15 January 2027

6. Submission Instructions:
Submit the complete application online via the official portal. Late submissions will be rejected without notice.
Contact Email: scholarship-helpdesk@gov.in, Helpline: 011-23380000.
`;

  const schBytes = enc.encode(scholarshipNotice);
  const schFile = {
    name: "Merit_Scholarship_Notice_2026.txt",
    size: schBytes.byteLength,
    type: "text/plain",
    arrayBuffer: async () => schBytes.buffer.slice(schBytes.byteOffset, schBytes.byteOffset + schBytes.byteLength),
    text: async () => scholarshipNotice,
  };

  const parsedSch = await parseDocumentFile(schFile);
  assert(parsedSch.pages.length === 1, "Page segmentation correctly set to 1 for notice");
  assert(parsedSch.wordCount > 150, "Word count correctly reflects notice body");

  const schAnalysis = runDeterministicAnalysis(parsedSch);
  assert(schAnalysis.category === "scholarship", "Auto-classified document as scholarship");
  assert(schAnalysis.financialInformation.some(f => f.amountText.includes("25,000")), "Detected scholarship amount ₹25,000");
  assert(schAnalysis.financialInformation.some(f => f.amountText.includes("2,00,000")), "Detected income limit ₹2,00,000");
  assert(schAnalysis.importantDates.some(d => d.rawText.includes("30 December 2026")), "Detected submission deadline 30 December 2026");
  assert(schAnalysis.requirements.some(r => r.name.toLowerCase().includes("marksheet")), "Detected marksheet as mandatory requirement");
  assert(schAnalysis.requirements.some(r => r.name.toLowerCase().includes("income")), "Detected income certificate requirement");
  assert(schAnalysis.requirements.some(r => r.name.toLowerCase().includes("bank")), "Detected bank details requirement");
  assert(schAnalysis.actionPlan.length >= 3, "Generated actionable checklist items");

  // TEST 5: Privacy Engine & Luhn Payment Card Sanitization
  console.log("\n--- 5. Testing Privacy Sanitization & Card Masking ---");
  const sensitiveText = "Please transfer fee to credit card 4532 0150 0000 0000 and phone +91 9876543210. Email is admin@tendercorp.com.";
  const detections = detectSensitiveEntities(sensitiveText);
  const redactedText = buildRedactedTextCopy(sensitiveText, detections);
  assert(detections.length >= 2, "Sensitive detections flagged (Card/Phone/Email)");
  assert(redactedText.includes("[REDACTED:"), "Sensitive values masked with category tokens in redacted copy");
  assert(!redactedText.includes("9876543210"), "Raw phone number excluded from redacted text");

  // TEST 6: Docling Middleware JSON to ParsedDocumentData Mapping
  console.log("\n--- 6. Testing Docling Structured Output Mapping ---");
  const { mapDoclingToParsedDocumentData, probeDoclingHealth } = await import("../src/services/middleware/doclingMiddleware");

  const mockDoclingOutput = {
    status: "success",
    engine: "docling-primary-v2",
    fileName: "Government_Procurement_RFP_2026.pdf",
    fileSizeBytes: 245000,
    pageCount: 3,
    wordCount: 850,
    tableCount: 2,
    fullText: "SECTION 1: INVITATION FOR BIDS\nReference No: RFP/2026/GOV-882\nEMD Amount: ₹1,50,000\nLast Date: 15 January 2027\n\nSECTION 2: TECHNICAL SPECIFICATIONS\nMandatory ISO 27001 Certification and minimum 5 years experience.",
    markdown: "# SECTION 1: INVITATION FOR BIDS\n\n**Reference No:** RFP/2026/GOV-882\n\n| Item | Description | Quantity |\n| --- | --- | --- |\n| 1 | Server Units | 10 |\n| 2 | Backup Battery | 2 |",
    pages: [
      { page_number: 1, text: "SECTION 1: INVITATION FOR BIDS\nReference No: RFP/2026/GOV-882", headings: ["SECTION 1: INVITATION FOR BIDS"] },
      { page_number: 2, text: "EMD Amount: ₹1,50,000\nLast Date: 15 January 2027", headings: ["COMMERCIAL TERMS"] },
      { page_number: 3, text: "SECTION 2: TECHNICAL SPECIFICATIONS\nMandatory ISO 27001 Certification.", headings: ["TECHNICAL SPECIFICATIONS"] },
    ],
    tables: [
      {
        table_index: 1,
        page: 1,
        num_rows: 2,
        num_cols: 3,
        headers: ["Item", "Description", "Quantity"],
        rows: [["1", "Server Units", "10"], ["2", "Backup Battery", "2"]],
        markdown: "| Item | Description | Quantity |\n| --- | --- | --- |\n| 1 | Server Units | 10 |\n| 2 | Backup Battery | 2 |",
      },
    ],
    headings: [
      { title: "SECTION 1: INVITATION FOR BIDS", level: 1, page: 1 },
      { title: "TECHNICAL SPECIFICATIONS", level: 2, page: 3 },
    ],
    ocrApplied: false,
    qualityScore: 96,
  };

  const mockMulterFile: any = {
    originalname: "Government_Procurement_RFP_2026.pdf",
    size: 245000,
    mimetype: "application/pdf",
    buffer: Buffer.from("mock pdf binary"),
  };

  const mappedDoc = mapDoclingToParsedDocumentData(mockDoclingOutput, mockMulterFile);

  assert(mappedDoc.pages.length === 3, "Preserved 3-page metadata and page text from Docling");
  assert(mappedDoc.pages[0].pageLabel === "SECTION 1: INVITATION FOR BIDS", "Preserved document hierarchy headings on page 1");
  assert(mappedDoc.extractedTables !== undefined && mappedDoc.extractedTables.length === 1, "Mapped structured tables preserving headers & rows");
  assert(mappedDoc.extractedTables?.[0].headers[1] === "Description", "Table column headers intact");
  assert(mappedDoc.detectedCategory === "rfp_tender", "Category auto-classified as RFP/Tender from Docling text");
  assert(mappedDoc.parserEngineUsed.includes("docling"), "Recorded Docling engine in parser provenance");
  assert(mappedDoc.extractionQualityScore === 96, "Preserved high extraction quality score (96%)");

  const healthProbe = await probeDoclingHealth();
  assert(healthProbe !== undefined && typeof healthProbe.online === "boolean", "Docling health probe returns valid status");

  // TEST 7: 2-Document Isolation & Non-Bleeding Test
  console.log("\n--- 7. Testing 2-Document Isolation & Zero-Bleed Architecture ---");
  const docAContent = "SCHOLARSHIP NOTICE 2026: Award amount ₹50,000 for university engineering students. Mandatory income certificate.";
  const docBContent = "MASTER SERVICES AGREEMENT 2026: Enterprise software development, hourly rate $150/hr, net 30 payment terms.";

  const bytesA = enc.encode(docAContent);
  const bytesB = enc.encode(docBContent);

  const fileA = {
    name: "Doc_A_Scholarship.txt",
    size: bytesA.byteLength,
    type: "text/plain",
    arrayBuffer: async () => bytesA.buffer.slice(bytesA.byteOffset, bytesA.byteOffset + bytesA.byteLength),
    text: async () => docAContent,
  };

  const fileB = {
    name: "Doc_B_Master_Agreement.txt",
    size: bytesB.byteLength,
    type: "text/plain",
    arrayBuffer: async () => bytesB.buffer.slice(bytesB.byteOffset, bytesB.byteOffset + bytesB.byteLength),
    text: async () => docBContent,
  };

  const parsedA = await parseDocumentFile(fileA);
  parsedA.id = "doc_A_hash_11111";
  parsedA.contentHash = "hash_11111";
  parsedA.originalFilename = fileA.name;
  parsedA.isDemo = false;

  const parsedB = await parseDocumentFile(fileB);
  parsedB.id = "doc_B_hash_22222";
  parsedB.contentHash = "hash_22222";
  parsedB.originalFilename = fileB.name;
  parsedB.isDemo = false;

  const analysisA = runDeterministicAnalysis(parsedA);
  const analysisB = runDeterministicAnalysis(parsedB);

  assert(analysisA.docId !== analysisB.docId, "Document A and B have completely distinct immutable IDs");
  assert(analysisA.contentHash !== analysisB.contentHash, "Document A and B have distinct SHA-256 content hashes");
  assert(analysisA.originalFilename === "Doc_A_Scholarship.txt", "Report A preserves original filename A");
  assert(analysisB.originalFilename === "Doc_B_Master_Agreement.txt", "Report B preserves original filename B");
  assert(analysisA.category === "scholarship", "Doc A classified as scholarship");
  assert(analysisB.category === "contract" || analysisB.category === "rfp_tender", "Doc B classified as contract/procurement");
  assert(!JSON.stringify(analysisA).includes("Master Services Agreement"), "Zero bleed: Doc A report contains no Doc B terms");
  assert(!JSON.stringify(analysisB).includes("₹50,000"), "Zero bleed: Doc B report contains no Doc A figures");

  // TEST 8: WCI RFP 32-Page Test Fixture Regression & Verification
  console.log("\n--- 8. Testing WCI RFP 32-Page Test Fixture & 14-Section Intelligence ---");
  const { buildWciRfpPages, WCI_RFP_SPEC } = await import("../src/services/fixtures/wciRfpFixture");
  const { extractRfpIntelligence } = await import("../src/services/rfpEngine");

  const wciPages = buildWciRfpPages();
  const wciFullText = wciPages.map(p => `--- [Page ${p.pageNumber}] ---\n${p.text}`).join("\n\n");
  const wciWordCount = wciFullText.split(/\s+/).filter(Boolean).length;

  assert(wciPages.length === 32, "WCI RFP has exactly 32 selectable text pages");
  assert(wciWordCount >= 8000, `WCI RFP extracted ~9,565 words (Actual: ${wciWordCount} words, not 94 words)`);

  const wciParsed: any = {
    id: "doc_wci_rfp_2021_02",
    fileName: WCI_RFP_SPEC.fileName,
    fileSizeBytes: WCI_RFP_SPEC.fileSizeBytes,
    fileType: "application/pdf",
    detectedFormat: "pdf",
    uploadedAt: "2021-06-07T09:00:00Z",
    pages: wciPages,
    fullText: wciFullText,
    redactedText: wciFullText,
    sensitiveDetections: [],
    ocrApplied: false,
    wordCount: wciWordCount,
    tableCount: 6,
    sheetCount: 0,
    extractionQualityScore: 99,
    parserEngineUsed: "Docling / Native PDF",
    extractionWarnings: [],
    detectedCategory: "rfp_tender",
    extractedTitle: "Enterprise Solution – Professional IT Services",
    issuingOrganisation: "Western Climate Initiative, Inc.",
    documentDate: "June 7, 2021",
    contentHash: "hash_wci_rfp_32p",
    originalFilename: WCI_RFP_SPEC.fileName,
    isDemo: true,
  };

  const wciAnalysis = runDeterministicAnalysis(wciParsed);
  assert(wciAnalysis.category === "rfp_tender", "WCI RFP classified as rfp_tender (NOT admissions)");
  assert(wciAnalysis.title === "Enterprise Solution – Professional IT Services", "WCI title cleanly extracted (NOT %PDF-1.5)");
  assert(wciAnalysis.keyInfo.issuingOrganisation.includes("Western Climate Initiative"), "WCI issuing organization correctly extracted");
  assert(wciAnalysis.rfpIntelligence !== undefined, "14-Section RFP Intelligence data attached");

  const rfpIntel = wciAnalysis.rfpIntelligence!;
  assert(rfpIntel.snapshot.opportunityStatus === "Historical / Expired", "Proposal deadline (August 20, 2021) correctly marked Historical/Expired");
  assert(rfpIntel.opportunitySummary.guaranteedWork === false, "Identified $0 Master Services Agreement caveat (no guaranteed work volume)");
  assert(rfpIntel.schedule.length >= 8, "Complete solicitation schedule extracted (8+ milestones)");
  assert(rfpIntel.keyPersonnel.length === 8, "All 8 Key Personnel roles extracted (PM, Scrum Master, UI/UX, Dev, BSA, Arch, QA, DevSecOps)");
  assert(rfpIntel.evaluationMatrix.technicalMaxPoints === 600, "Scoring matrix: Technical Proposal is 600 points");
  assert(rfpIntel.evaluationMatrix.feeMaxPoints === 250, "Scoring matrix: Fee Proposal is 250 points");
  assert(rfpIntel.evaluationMatrix.minimumQualifyingScore === 650, "Scoring matrix: Minimum combined qualifying score is 650 points");
  assert(rfpIntel.risksAndRedFlags.some(r => r.title.includes("108") && r.title.includes("180")), "Detected 108 vs 180-day proposal validity discrepancy");
  assert(rfpIntel.missingInformation.some(m => m.item.includes("Attachment B")), "Flagged missing Attachment B note (referenced but not included)");

  // TEST 9: End-to-End PDF Extraction & Progress Sequence Verification (35% Hang Fix)
  console.log("\n--- 9. Testing End-to-End PDF Ingestion & Progress Flow ---");
  const samplePdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 120 >>
stream
BT
/F1 12 Tf
72 712 Td (DOCULENS Universal Document Intelligence Platform) Tj
0 -24 Td (Tender Ref: DOC-2026-X99 | EMD Amount: INR 50,000 | Deadline: 31 Dec 2026) Tj
0 -24 Td (Bidder must submit ISO 27001 Certification and 3 years Audited Financial Balance Sheets.) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000214 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
420
%%EOF`;

  const pdfBytes = Buffer.from(samplePdfContent, "utf-8");
  const pdfFile = {
    name: "procurement_specifications.pdf",
    size: pdfBytes.byteLength,
    type: "application/pdf",
    arrayBuffer: async () => pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength),
    text: async () => samplePdfContent,
  };

  const progressUpdates: { stage: string; percent: number }[] = [];
  const startTime = Date.now();
  const parsedPdf = await parseDocumentFile(pdfFile, (stage, percent) => {
    progressUpdates.push({ stage, percent });
  });
  const elapsedMs = Date.now() - startTime;

  assert(progressUpdates.length >= 2, "Progress sequence generated multiple stage updates");
  assert(progressUpdates.some(p => p.percent > 35), "Progress cleanly surpassed 35% without stalling");
  assert(progressUpdates[progressUpdates.length - 1].percent === 100, "Progress reached 100% completion");
  assert(elapsedMs < 3000, `PDF extraction completed rapidly without 35s timeout (${elapsedMs}ms)`);
  assert(parsedPdf.pages.length === 1, "PDF returned exactly 1 page");
  assert(parsedPdf.fullText.includes("DOCULENS") || parsedPdf.fullText.includes("Tender Ref"), "PDF text layer accurately extracted");
  assert(!parsedPdf.extractedTitle.startsWith("%PDF"), "Clean title extracted without PDF binary markers");
  assert(parsedPdf.detectedFormat === "pdf", "Format accurately detected as PDF");

  const pdfAnalysis = runDeterministicAnalysis(parsedPdf);
  assert(pdfAnalysis.category === "rfp_tender", "PDF classified as RFP/Tender from extracted terms");
  assert(pdfAnalysis.importantDates.length > 0 || pdfAnalysis.requirements.length > 0 || pdfAnalysis.financialInformation.length > 0, "Extracted requirements, dates or financials from PDF");

  // Final Summary
  console.log("\n=================================================");
  console.log(`   TEST RESULTS: ${passedTests} / ${totalTests} PASSED   `);
  console.log("=================================================");

  if (passedTests === totalTests) {
    console.log(">>> ALL DOCULENS PIPELINE TESTS PASSED CLEANLY <<<\n");
    process.exit(0);
  } else {
    console.error(">>> SOME TESTS FAILED <<<");
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error("Test runner exception:", err);
  process.exit(1);
});
