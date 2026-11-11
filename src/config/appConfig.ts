/**
 * DOCULENS Application Configuration
 * The product name is centralized here so it can be renamed in one place.
 */

export const APP_CONFIG = {
  name: "DOCULENS",
  tagline: "Universal Document Intelligence Platform",
  headline: "Documents don't tell you what to do. DOCULENS does.",
  subhead: "Turn complex documents into clear requirements, verified evidence, and your next best actions.",
  primaryCta: "Analyse a document",
  secondaryCta: "Explore the platform",
  version: "1.0.0",
  storageKeyPrefix: "doculens_",
  guestDataExpiryHours: 24,
  maxUploadSizeBytes: 30 * 1024 * 1024, // 30 MB
  supportedExtensions: [
    ".pdf", ".docx", ".doc", ".xlsx", ".xls", ".csv", ".ods", ".pptx", ".ppt", ".odp",
    ".rtf", ".odt", ".txt", ".md", ".html", ".jpg", ".jpeg", ".png", ".webp", ".tiff"
  ],
  defaultVisibilityPolicy: {
    companyName: "VISIBLE" as const,
    personName: "VISIBLE" as const,
    emailAddress: "VISIBLE" as const,
    phoneNumber: "HIDDEN" as const,
    personalAddress: "HIDDEN" as const,
    governmentId: "HIDDEN" as const,
    bankAccount: "HIDDEN" as const,
    paymentCard: "HIDDEN" as const,
    passwordOrToken: "HIDDEN" as const,
  },
  categories: [
    {
      id: "rfp_tender",
      name: "RFPs & Tenders",
      description: "Government tenders, public procurement, EMD, turnover & vendor criteria",
      icon: "FileSignature",
      defaultKeywords: ["tender", "rfp", "bid", "procurement", "emd", "turnover", "gem portal", "technical bid", "financial bid", "annexure"],
      color: "amber"
    },
    {
      id: "scholarship",
      name: "Scholarships",
      description: "Educational grants, merit criteria, income limits & renewal conditions",
      icon: "GraduationCap",
      defaultKeywords: ["scholarship", "grant", "stipend", "fellowship", "merit", "tuition", "marks", "financial aid", "gpa"],
      color: "emerald"
    },
    {
      id: "admission",
      name: "College Admissions",
      description: "University circulars, programme entrance criteria, fee breakdowns & seats",
      icon: "School",
      defaultKeywords: ["admission", "university", "faculty", "entrance exam", "prospectus", "cutoff", "degree", "semester"],
      color: "cyan"
    },
    {
      id: "job",
      name: "Jobs & Careers",
      description: "Job descriptions, role responsibilities, required skills & CV alignment",
      icon: "Briefcase",
      defaultKeywords: ["job", "role", "responsibilities", "qualifications", "experience required", "skills", "salary", "hiring"],
      color: "blue"
    },
    {
      id: "contract",
      name: "Contracts & Agreements",
      description: "Client agreements, MSAs, deliverables, penalties, SLA & termination risks",
      icon: "Scale",
      defaultKeywords: ["agreement", "contract", "parties", "deliverables", "termination", "indemnity", "confidentiality", "clause", "penalty"],
      color: "purple"
    },
    {
      id: "scheme",
      name: "Government Schemes",
      description: "Citizen welfare schemes, beneficiary eligibility, documentation & portals",
      icon: "Landmark",
      defaultKeywords: ["scheme", "ministry", "beneficiary", "subsidy", "citizen", "welfare", "yojana", "department", "entitlement"],
      color: "rose"
    },
    {
      id: "spreadsheet",
      name: "Financial & Spreadsheets",
      description: "Applicant lists, financial statements, tabular data with formula safety & charts",
      icon: "Table2",
      defaultKeywords: ["csv", "xlsx", "xls", "sheet", "applicants", "budget", "ledger", "balance", "row", "column"],
      color: "teal"
    },
    {
      id: "general",
      name: "General Documents",
      description: "Official circulars, regulatory notices, reports & general paperwork",
      icon: "FileText",
      defaultKeywords: ["notice", "circular", "office memo", "policy", "guidelines", "compliance", "memo"],
      color: "slate"
    }
  ]
};
