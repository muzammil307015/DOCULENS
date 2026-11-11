/**
 * DOCULENS Core TypeScript Type Definitions
 */

export type DocumentCategory =
  | "rfp_tender"
  | "scholarship"
  | "admission"
  | "job"
  | "contract"
  | "scheme"
  | "spreadsheet"
  | "general";

export type RequirementVerificationStatus =
  | "FOUND"
  | "MISSING_EVIDENCE"
  | "NEEDS_VERIFICATION"
  | "NOT_APPLICABLE"
  | "CONFLICT_DETECTED";

export type RiskIndicatorType =
  | "Expired"
  | "Outdated"
  | "Inconsistent"
  | "Potentially suspicious"
  | "Verified through an actual external source"
  | "Not independently verified"
  | "Unable to verify";

export type SensitiveCategory =
  | "companyName"
  | "personName"
  | "emailAddress"
  | "phoneNumber"
  | "personalAddress"
  | "governmentId"
  | "bankAccount"
  | "paymentCard"
  | "passwordOrToken";

export type VisibilityState = "VISIBLE" | "HIDDEN";

export interface SensitiveDetection {
  id: string;
  category: SensitiveCategory;
  rawText: string;
  maskedText: string;
  start: number;
  end: number;
  sourceContext?: string;
  page?: number;
  sheet?: string;
  cell?: string;
  isLuhnValid?: boolean;
  visibility: VisibilityState;
  userOverridden?: boolean;
}

export interface SourceLocation {
  page?: number;
  sheet?: string;
  row?: number;
  cell?: string;
  section?: string;
  snippet?: string;
}

export interface RequirementItem {
  id: string;
  name: string;
  description: string;
  mandatory: boolean;
  category?: string;
  sourceLocation: SourceLocation;
  confidence: number; // 0 to 1
  verificationStatus: RequirementVerificationStatus;
  matchedEvidenceId?: string;
  matchedEvidenceText?: string;
  notes?: string;
}

export interface ImportantDateItem {
  id: string;
  label: string;
  rawText: string;
  isoDate?: string;
  type: "official_deadline" | "target_date" | "expiry_date" | "reminder_date";
  sourceLocation: SourceLocation;
  isUrgent?: boolean;
  isExpired?: boolean;
  daysRemaining?: number;
}

export interface FinancialItem {
  id: string;
  label: string;
  amountText: string;
  currency?: string;
  numericValue?: number;
  type: "grant_amount" | "tender_value" | "emd" | "fee" | "turnover" | "salary" | "penalty" | "other";
  sourceLocation: SourceLocation;
  notes?: string;
}

export interface RiskWarningItem {
  id: string;
  title: string;
  indicator: RiskIndicatorType;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  whyFired: string;
  sourceLocation: SourceLocation;
  recommendedAction: string;
}

export interface ActionChecklistItem {
  id: string;
  title: string;
  description: string;
  stepNumber: number;
  status: "pending" | "in_progress" | "completed" | "blocked";
  priority: "low" | "medium" | "high";
  officialDeadline?: string;
  personalTargetDate?: string;
  notes?: string;
  sourceLocation?: SourceLocation;
  linkedRequirementId?: string;
  completedAt?: string;
}

export interface DocumentQAPair {
  id: string;
  question: string;
  answer: string;
  mode: "deterministic" | "ai_assisted";
  citations: SourceLocation[];
  confidence: number;
  timestamp: string;
  notFoundInDocument?: boolean;
}

export interface ColumnSummary {
  name: string;
  type: "string" | "number" | "date" | "boolean" | "mixed";
  totalCount: number;
  nullCount: number;
  distinctCount: number;
  sum?: number;
  average?: number;
  min?: number | string;
  max?: number | string;
  sampleValues: (string | number)[];
}

export interface SpreadsheetAnalysisData {
  sheetNames: string[];
  activeSheet: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  rows: Record<string, any>[];
  columnSummaries: ColumnSummary[];
  duplicateRowCount: number;
  missingValueCellCount: number;
  anomalies: { row: number; column: string; message: string }[];
  formulasDetected: { cell: string; formula: string }[];
  charts: {
    title: string;
    type: "bar" | "pie" | "line";
    xAxisKey: string;
    dataKey: string;
    data: any[];
    sourceNote: string;
  }[];
}

export interface DocumentPage {
  pageNumber: number;
  text: string;
  confidence?: number;
  isOcr?: boolean;
  pageLabel?: string;
}

export interface ParsedDocumentData {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  fileType: string;
  detectedFormat: string;
  uploadedAt: string;
  pages: DocumentPage[];
  fullText: string;
  markdownText?: string;
  redactedText: string;
  sensitiveDetections: SensitiveDetection[];
  spreadsheetData?: SpreadsheetAnalysisData;
  ocrApplied?: boolean;
  ocrConfidence?: number;
  wordCount: number;
  tableCount: number;
  sheetCount: number;
  extractionQualityScore: number; // 0 to 100
  parserEngineUsed: string;
  extractionWarnings: string[];
  extractedTables?: Array<{
    tableIndex: number;
    page: number;
    headers: string[];
    rows: string[][];
    markdown: string;
  }>;
  detectedCategory: DocumentCategory;
  userCategory?: DocumentCategory;
  extractedTitle: string;
  issuingOrganisation?: string;
  documentDate?: string;
  contentHash?: string; // SHA-256
  originalFilename?: string;
  isDemo?: boolean;
  extractionAudit?: ExtractionAudit;
  rfpIntelligence?: RfpIntelligenceData;
}

export interface ExtractionAudit {
  documentId: string;
  originalFilename: string;
  contentHash: string; // SHA-256
  detectedFormat: string;
  parserName: string;
  parserVersion: string;
  expectedPageCount: number;
  successfullyParsedPages: number;
  pagesWithUsableText: number;
  blankPages: number;
  ocrPages: number;
  nativeTextPages: number;
  totalWordCount: number;
  tableCount: number;
  worksheetCount: number;
  slideCount?: number;
  extractionQualityScore: number; // 0-100
  isScanned: boolean;
  extractionWarnings: string[];
  extractionTimestamp: string;
  processingDurationMs: number;
  extractionStatus: "SUCCESS" | "PARTIAL" | "FAILED" | "QUALITY_WARNING";
}

export interface RfpSnapshot {
  issuingAuthority: string;
  rfpTitle: string;
  rfpNumber: string;
  publicationDate: string;
  amendmentInfo?: string;
  proposalDeadline: string;
  submissionTimezone?: string;
  submissionChannel: string;
  mainContact: string;
  procurementCategory: string;
  contractType: string;
  contractTerm: string;
  opportunityStatus: "Open" | "Closing soon" | "Closed" | "Historical / Expired" | "Cancelled" | "Status unclear";
  sourceCitation: SourceLocation;
}

export interface RfpOpportunitySummary {
  issuingOrg: string;
  primaryObjective: string;
  requestedServices: string[];
  vendorProfile: string;
  procurementStructure: string;
  budgetDisclosed: boolean;
  budgetNotes: string;
  guaranteedWork: boolean;
  guaranteedWorkCaveat: string;
  postSelectionNextSteps: string;
  plainLanguageSummary: string;
}

export interface RfpScheduleItem {
  event: string;
  date: string;
  time?: string;
  timezone?: string;
  nature: "Mandatory" | "Encouraged" | "Informational";
  page: number;
  status: "Historical / Passed" | "Upcoming" | "Active" | "Urgent";
  snippet: string;
}

export interface RfpScopeItem {
  category: "Objective" | "Workstream" | "Deliverable" | "Technical" | "Security" | "Operating Environment" | "Reporting" | "Support";
  title: string;
  description: string;
  page: number;
  snippet: string;
}

export interface RfpEligibilityItem {
  requirement: string;
  explanation: string;
  mandatory: boolean;
  passFail: boolean;
  evidenceNeeded: string;
  page: number;
  snippet: string;
}

export interface RfpResponseChecklistItem {
  component: string;
  description: string;
  maxPages?: string;
  format: string;
  page: number;
  mandatory: boolean;
  snippet: string;
}

export interface RfpKeyPersonnelRole {
  roleTitle: string;
  minExperienceYears: number;
  requiredQualifications: string;
  certifications?: string;
  page: number;
  snippet: string;
}

export interface RfpCommercialTerms {
  contractValueType: string;
  contractValue: string;
  hourlyRateRequirement: string;
  onshoreOffshoreSplit: boolean;
  paymentTerms: string;
  retainageHoldback: string;
  taxesAndCurrency: string;
  page: number;
  snippet: string;
}

export interface RfpScoringCategory {
  category: string;
  maxPoints: number;
  description: string;
  subcategories?: { name: string; points: number }[];
  page: number;
}

export interface RfpEvaluationMatrix {
  totalPoints: number;
  technicalMaxPoints: number;
  feeMaxPoints: number;
  minimumQualifyingScore: number;
  feeScoringFormula: string;
  categories: RfpScoringCategory[];
  notes: string;
}

export interface RfpComplianceObligation {
  clause: string;
  topic: "IP Ownership" | "Confidentiality" | "Data Protection / Privacy" | "Insurance" | "Indemnification" | "Termination" | "Subcontracting / Offshore" | "Governing Law";
  summary: string;
  flagForLegalReview: boolean;
  page: number;
  snippet: string;
}

export interface RfpRiskItem {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  reason: string;
  page: number;
  snippet: string;
  recommendation: string;
}

export interface RfpMissingItem {
  item: string;
  category: string;
  impact: string;
  recommendation: string;
  status: "Not specified in this document" | "Deferred to future Statement of Work" | "Referenced but missing attachment";
}

export interface RfpQaItem {
  number: number;
  question: string;
  answer: string;
  page: number;
}

export interface RfpBidderRecommendation {
  priority: "High" | "Medium" | "Low";
  step: string;
  action: string;
  rationale: string;
  sourceOrigin: "DOCULENS Automated Advisory" | "Direct RFP Requirement";
}

export interface RfpIntelligenceData {
  snapshot: RfpSnapshot;
  opportunitySummary: RfpOpportunitySummary;
  schedule: RfpScheduleItem[];
  scopeOfWork: RfpScopeItem[];
  eligibilityQualifications: RfpEligibilityItem[];
  responseChecklist: RfpResponseChecklistItem[];
  keyPersonnel: RfpKeyPersonnelRole[];
  commercials: RfpCommercialTerms;
  evaluationMatrix: RfpEvaluationMatrix;
  complianceObligations: RfpComplianceObligation[];
  risksAndRedFlags: RfpRiskItem[];
  missingInformation: RfpMissingItem[];
  qaItems: RfpQaItem[];
  bidderRecommendations: RfpBidderRecommendation[];
}

export interface FullDocumentAnalysis {
  id: string;
  docId: string;
  title: string;
  category: DocumentCategory;
  processingMode: "deterministic" | "ai_assisted";
  modelUsed?: string;
  analyzedAt: string;
  contentHash?: string;
  originalFilename?: string;
  isDemo?: boolean;
  extractionAudit?: ExtractionAudit;
  rfpIntelligence?: RfpIntelligenceData;
  executiveSummary: string;
  keyInfo: {
    title: string;
    type: string;
    issuingOrganisation: string;
    documentDate: string;
    referenceNumber?: string;
    primaryContact?: string;
    portalUrl?: string;
  };
  requirements: RequirementItem[];
  eligibilityConditions: string[];
  requiredDocuments: string[];
  importantDates: ImportantDateItem[];
  financialInformation: FinancialItem[];
  simplifiedTerms: { clauseTitle: string; explanation: string; source: SourceLocation }[];
  risksAndWarnings: RiskWarningItem[];
  actionPlan: ActionChecklistItem[];
  qaHistory: DocumentQAPair[];
  spreadsheetStats?: SpreadsheetAnalysisData;
  aiCharts?: {
    id: string;
    title: string;
    type: "bar" | "pie" | "line" | "timeline";
    description: string;
    xAxisKey: string;
    dataKeys: string[];
    data: any[];
    verifiedAgainstSource: boolean;
    sourceCitation: string;
  }[];
  readinessScore?: {
    score: number; // 0 to 100
    formulaExplanation: string;
    foundCount: number;
    totalMandatoryCount: number;
    missingCount: number;
  };
  extractionVerification?: {
    wordCount: number;
    pageCount: number;
    tableCount: number;
    sheetCount: number;
    ocrStatus: "not_needed" | "applied" | "restricted_scan";
    qualityScore: number;
    engineUsed: string;
    warnings: string[];
    sourceCoveragePercent: number;
  };
  explanationLevel?: "simple" | "professional" | "technical";
  explanationLanguage?: string;
}

export type ProfileType =
  | "student"
  | "individual"
  | "professional"
  | "freelancer"
  | "business"
  | "startup"
  | "ngo"
  | "institution"
  | "other";

export interface UserProfile {
  id: string;
  profileType: ProfileType;
  displayName: string;
  organizationName?: string;
  fieldOrIndustry?: string;
  experienceYears?: number;
  qualifications: string[];
  skills: string[];
  certifications: string[];
  annualTurnover?: string;
  gstNumber?: string;
  companyRegistrationNumber?: string;
  panNumber?: string;
  updatedAt: string;
}

export interface ExtractedFact {
  id: string;
  field: string;
  value: string;
  sourceDocumentName: string;
  sourceLocation: SourceLocation;
  extractionDate: string;
  confidence: number;
  verificationStatus: "user_confirmed" | "extracted" | "verified_external";
  expiryDate?: string;
  category: string;
}

export interface EvidenceDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  category: string;
  facts: ExtractedFact[];
  expiryDate?: string;
  verificationStatus: "unverified" | "user_confirmed" | "not_independently_verified";
}

export interface AIModelCatalogueItem {
  id: string;
  name: string;
  contextLength: number;
  promptPricePerMillion: number;
  completionPricePerMillion: number;
  isFree: boolean;
  modalities: string[];
  description?: string;
}

export interface EncryptedVaultRecord {
  ciphertextBase64: string;
  ivBase64: string;
  saltBase64: string;
  iterations: number;
  updatedAt: string;
  maskedKey: string;
  provider: "openrouter" | "gemini";
}

export interface DocumentMemoryItem {
  id: string;
  sourceDocId: string;
  sourceDocName: string;
  key: string;
  value: string;
  category: string;
  savedAt: string;
  lastUsedAt?: string;
  sourceLocation?: SourceLocation;
  userApprovedForReuse: boolean;
  expiryDate?: string;
}
