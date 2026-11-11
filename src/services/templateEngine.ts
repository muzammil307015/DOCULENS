/**
 * DOCULENS Category Template Definitions
 * Data-driven template rules per document type
 */

import { DocumentCategory } from "../types";

export interface CategoryTemplateConfig {
  category: DocumentCategory;
  name: string;
  expectedFields: string[];
  mandatoryDocumentKeywords: string[];
  riskCheckKeywords: string[];
  eligibilityKeywords: string[];
  financialKeywords: string[];
}

export const CATEGORY_TEMPLATES: Record<DocumentCategory, CategoryTemplateConfig> = {
  rfp_tender: {
    category: "rfp_tender",
    name: "RFP / Government Tender",
    expectedFields: [
      "Tender Reference Number",
      "Department / Procuring Entity",
      "Estimated Tender Value",
      "Earnest Money Deposit (EMD)",
      "Tender Processing Fee",
      "Technical Bid Submission Deadline",
      "Financial Bid Opening Date",
      "Minimum Turnover Requirement",
      "Years of Experience",
      "Contract Duration / Completion Period",
      "Performance Bank Guarantee",
    ],
    mandatoryDocumentKeywords: [
      "GST registration certificate",
      "Company incorporation / PAN certificate",
      "Audited balance sheet (last 3 financial years)",
      "EMD deposit receipt / Bank guarantee",
      "Non-blacklisting affidavit on stamp paper",
      "Experience certificates of similar completed works",
      "Power of Attorney in favor of signatory",
    ],
    riskCheckKeywords: [
      "forfeiture of emd",
      "liquidated damages",
      "blacklisting",
      "sole discretion",
      "indemnify without limit",
      "disqualification",
      "arbitration clause",
    ],
    eligibilityKeywords: [
      "minimum annual turnover",
      "years in business",
      "oem authorization",
      "iso certification",
      "class-1 local supplier",
    ],
    financialKeywords: ["emd", "tender value", "turnover", "guarantee", "penalty", "security deposit"],
  },
  scholarship: {
    category: "scholarship",
    name: "Scholarship & Academic Grant",
    expectedFields: [
      "Scholarship Scheme Name",
      "Award Amount / Stipend",
      "Sponsoring Foundation / Ministry",
      "Eligible Study Levels / Courses",
      "Minimum Qualifying Percentage / CGPA",
      "Family Annual Income Ceiling",
      "Application Deadline",
      "Renewal Conditions",
    ],
    mandatoryDocumentKeywords: [
      "Government photo ID (Passport / Aadhaar / National ID)",
      "Income certificate issued by competent authority",
      "Previous academic marksheets & passing certificates",
      "Admission proof / Bona fide student certificate",
      "Bank account details (linked with applicant name)",
      "Category / Caste / Disability certificate (if applicable)",
    ],
    riskCheckKeywords: [
      "discontinuation of stipend",
      "repayment of grant upon dropping out",
      "non-transferable",
      "verification fraud penalty",
    ],
    eligibilityKeywords: [
      "minimum aggregate marks",
      "family income not exceeding",
      "regular full-time student",
      "age limit",
    ],
    financialKeywords: ["scholarship amount", "disbursement", "tuition waiver", "maintenance allowance"],
  },
  admission: {
    category: "admission",
    name: "College & University Admission",
    expectedFields: [
      "Institution Name",
      "Academic Programme / Degree",
      "Total Intake / Available Seats",
      "Tuition Fee & Deposit Schedule",
      "Entrance Exam Cutoff / Qualifying Score",
      "Counselling & Registration Dates",
    ],
    mandatoryDocumentKeywords: [
      "High school / Bachelor's graduation certificate",
      "Entrance examination scorecard / Admit card",
      "Transfer certificate (TC) and Migration certificate",
      "Character certificate from head of institution",
      "Passport size photographs",
    ],
    riskCheckKeywords: [
      "fee refund policy",
      "cancellation charges",
      "provisional admission subject to scrutiny",
      "seat forfeiture",
    ],
    eligibilityKeywords: [
      "minimum qualifying marks",
      "recognized university",
      "entrance exam merit list",
    ],
    financialKeywords: ["tuition fee", "admission fee", "hostel caution deposit", "refund rules"],
  },
  job: {
    category: "job",
    name: "Job Description & Career Notice",
    expectedFields: [
      "Job Title / Designation",
      "Employer / Department",
      "Workplace Location & Remote Policy",
      "Offered Compensation / Band",
      "Required Years of Experience",
      "Technical Core Competencies",
      "Application Deadline",
    ],
    mandatoryDocumentKeywords: [
      "Updated Curriculum Vitae (CV) / Resume",
      "Degree / Diploma certificates",
      "Relieving letter / Experience proof from previous employers",
      "Government Photo ID",
    ],
    riskCheckKeywords: [
      "service bond / employment bond",
      "non-compete restriction",
      "probation period without notice",
      "unpaid overtime expectations",
    ],
    eligibilityKeywords: [
      "bachelor's or master's degree",
      "minimum relevant experience",
      "proficiency in required tech stack",
    ],
    financialKeywords: ["salary", "ctc", "bonus", "equity", "benefits"],
  },
  contract: {
    category: "contract",
    name: "Contract & Agreement",
    expectedFields: [
      "Contracting Parties",
      "Effective Commencement Date",
      "Agreement Duration / Term",
      "Payment Terms & Milestones",
      "Termination Notice Period",
      "Governing Law & Jurisdiction",
    ],
    mandatoryDocumentKeywords: [
      "Corporate registration / certificate of good standing",
      "Signatory authorization resolution",
      "Insurance certificate / Professional liability coverage",
    ],
    riskCheckKeywords: [
      "unilateral termination",
      "uncapped liability",
      "strict non-compete clause",
      "indemnification of third-party claims",
      "automatic renewal clause",
      "late payment penalty",
    ],
    eligibilityKeywords: ["authority to bind", "corporate status", "representations and warranties"],
    financialKeywords: ["retainer", "hourly rate", "milestone payment", "late fee interest", "withholding tax"],
  },
  scheme: {
    category: "scheme",
    name: "Government Welfare Scheme",
    expectedFields: [
      "Scheme Title",
      "Implementing Ministry / Department",
      "Target Beneficiary Group",
      "Subsidy / Direct Benefit Amount",
      "Enrollment Portal / Process",
      "Validity Period",
    ],
    mandatoryDocumentKeywords: [
      "Proof of citizenship / National identity card",
      "Proof of residence / Domicile certificate",
      "Income proof / BPL ration card",
      "Bank passbook / Direct Benefit Transfer (DBT) account",
    ],
    riskCheckKeywords: [
      "revocation of benefits upon false declaration",
      "mandatory biometric authentication",
      "scheme subject to annual fund sanction",
    ],
    eligibilityKeywords: ["resident citizen", "age threshold", "land holding limits", "priority category"],
    financialKeywords: ["direct transfer", "subsidy percentage", "financial assistance", "installment"],
  },
  spreadsheet: {
    category: "spreadsheet",
    name: "Spreadsheet & Tabular Records",
    expectedFields: [
      "Primary Entity Sheet",
      "Total Active Rows",
      "Total Valid Columns",
      "Numeric Metrics",
      "Duplicate Record Count",
      "Missing Cell Count",
    ],
    mandatoryDocumentKeywords: [
      "Consistent header row",
      "Unique identification key column",
      "Valid date/currency formats",
    ],
    riskCheckKeywords: [
      "duplicate rows detected",
      "missing critical identifiers",
      "extreme value outliers",
      "inconsistent date format",
    ],
    eligibilityKeywords: ["complete records", "verified rows", "reconciled totals"],
    financialKeywords: ["sum", "total", "average", "credit", "debit", "balance"],
  },
  general: {
    category: "general",
    name: "General Official Document",
    expectedFields: [
      "Document Subject",
      "Issuing Authority",
      "Promulgation Date",
      "Action Requirements",
      "Focal Point Contact",
    ],
    mandatoryDocumentKeywords: ["Supporting verification documentation", "Official seal / signature"],
    riskCheckKeywords: ["compliance notice", "penalty for default", "mandatory audit"],
    eligibilityKeywords: ["stakeholders addressed", "applicability scope"],
    financialKeywords: ["fee", "costs", "disbursements"],
  },
};
