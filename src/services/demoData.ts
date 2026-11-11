/**
 * DOCULENS Interactive Demo Documents
 *
 * Realistically constructed fictional documents across 5 major categories.
 * Each document runs through the real parser, privacy scanner, and deterministic engine.
 */

import { DocumentCategory, UserProfile } from "../types";

export interface DemoDocumentSpec {
  id: string;
  title: string;
  fileName: string;
  category: DocumentCategory;
  summaryNote: string;
  rawText: string;
}

export const SAMPLE_PROFILES: Record<string, UserProfile> = {
  enterprise_vendor: {
    id: "prof_sample_biz",
    profileType: "business",
    displayName: "Nexura Infrastructure Solutions Ltd.",
    organizationName: "Nexura Infrastructure Solutions Ltd.",
    fieldOrIndustry: "Smart Urban Systems & Civil Engineering",
    experienceYears: 8,
    qualifications: ["Class-1 Registered Contractor", "ISO 9001:2015 Quality Management"],
    skills: ["IoT Telemetry", "Traffic Signal Automation", "SCADA Architecture", "Public Works Delivery"],
    certifications: ["CMMI Level 3", "Cybersecurity Baseline ISO 27001"],
    annualTurnover: "$4,200,000 USD (3-Year Average)",
    gstNumber: "07AABCN8921M1Z4",
    companyRegistrationNumber: "U72200DL2018PTC329182",
    panNumber: "AABCN8921M",
    updatedAt: "2026-11-01T10:00:00Z",
  },
  student_scholar: {
    id: "prof_sample_student",
    profileType: "student",
    displayName: "Aarav Sharma",
    fieldOrIndustry: "Computer Science & Engineering",
    qualifications: ["B.Tech Computer Science (3rd Year, 8.9 CGPA)"],
    skills: ["Python", "Machine Learning", "Data Structures", "Technical Writing"],
    certifications: ["NPTEL Deep Learning Honor", "AWS Certified Cloud Practitioner"],
    updatedAt: "2026-11-01T10:00:00Z",
  },
  ai_engineer: {
    id: "prof_sample_engineer",
    profileType: "professional",
    displayName: "Elena Rostova",
    fieldOrIndustry: "AI Systems Engineering & Distributed Cloud",
    experienceYears: 6,
    qualifications: ["M.S. Software Engineering", "B.S. Mathematics & Computing"],
    skills: ["TypeScript", "Python", "Kubernetes", "LLM Fine-tuning", "Vector Databases", "Distributed Systems"],
    certifications: ["Google Cloud Professional Machine Learning Engineer"],
    updatedAt: "2026-11-01T10:00:00Z",
  },
};

import { buildWciRfpPages, WCI_RFP_SPEC } from "./fixtures/wciRfpFixture";

export const DEMO_DOCUMENTS: DemoDocumentSpec[] = [
  {
    id: "demo_wci_rfp_2021_02",
    title: "WCI Enterprise Solution – Professional IT Services (32-Page Test Fixture)",
    fileName: WCI_RFP_SPEC.fileName,
    category: "rfp_tender",
    summaryNote: "Comprehensive 32-page WCI RFP fixture with 8 key personnel roles, $0 MSA, 600 tech / 250 fee formula, and 108/180-day discrepancy.",
    rawText: buildWciRfpPages().map(p => `--- [Page ${p.pageNumber}] ---\n${p.text}`).join("\n\n"),
  },
  {
    id: "demo_tender_rfp",
    title: "Municipal Smart City IoT Telemetry & Traffic Management System",
    fileName: "RFP_SmartCity_IoT_Tender_2026.pdf",
    category: "rfp_tender",
    summaryNote: "Comprehensive public procurement tender containing EMD, turnover mandates, and liquidated damages clauses.",
    rawText: `--- [Page 1] ---
METROPOLITAN INFRASTRUCTURE DEVELOPMENT CORPORATION
Notice Inviting Tender (NIT) No: MIDC-RFP-2026-902
Date of Publication: 1st November 2026

REQUEST FOR PROPOSAL (RFP):
Supply, Installation, Testing, and 5-Year Operation of City-Wide Intelligent Traffic Management System (ITMS) and Environmental Telemetry Sensors.

1. CRITICAL TENDER MILESTONES:
- Tender Issuance Date: 1st November 2026
- Pre-Bid Clarification Meeting: 18th November 2026 at 11:00 AM (Virtual Room #4)
- Technical Bid Submission Deadline: 15th December 2026 up to 17:00 HRS UTC
- Financial Bid Opening: 22nd December 2026 at 14:00 HRS
- Contract Validity Period: 180 days from financial opening

2. FINANCIAL PROVISIONS:
- Estimated Tender Value: $3,500,000 USD (Three Million Five Hundred Thousand Dollars)
- Earnest Money Deposit (EMD): $70,000 USD (2% of estimated value) via Bank Guarantee
- Tender Processing Fee: $1,250 USD (Non-refundable)
- Performance Bank Guarantee: 5% of accepted contract value prior to agreement signing
- Payment Milestones: 30% on hardware delivery, 40% on milestone testing, 30% post operational sign-off

--- [Page 2] ---
3. MANDATORY TECHNICAL & STATUTORY ELIGIBILITY:
To participate in the bidding, the primary bidder must strictly meet each of the following criteria:
1. Valid GST Registration Certificate and Permanent Account Number (PAN).
2. Minimum Average Annual Turnover of $3,000,000 USD across the preceding three financial years (FY 2023-24, FY 2024-25, FY 2025-26) certified by a chartered accountant.
3. Minimum 5 years of demonstrated commercial experience in sensor integration or urban telecom.
4. Non-blacklisting affidavit on stamp paper confirming no debarment by any central/state government agency.
5. OEM Authorization Form (Annexure-C) from sensor and compute hardware manufacturers.
6. ISO 9001:2015 and ISO 27001 Cybersecurity Certification.

--- [Page 3] ---
4. LIQUIDATED DAMAGES & PENALTY CLAUSES:
- Time is of the essence. If the contractor fails to deliver completed traffic telemetry zones within the agreed 6-month window, liquidated damages shall be levied at the rate of 0.5% of the total contract value for each week of unauthorized delay, capped at a maximum of 10% of total contract value.
- Continued delay exceeding 30 calendar days beyond the threshold shall empower MIDC to terminate the contract and forfeit the Performance Bank Guarantee.

5. CONTACT & REMITTANCE DETAILS:
- Procurement Officer: Director of Engineering & Telemetry
- Official Portal: https://eprocure.metropolis.gov/tenders/MIDC-902
- Office Address: Room 402, Metro Civic Tower, 742 Montgomery Street, Suite 800
- Direct Phone Inquiry: (555) 019-8392 | procurement-desk@metropolis.gov`,
  },
  {
    id: "demo_scholarship",
    title: "Global Tech Innovation & Future Leaders Academic Scholarship 2026",
    fileName: "Future_Leaders_Tech_Scholarship_2026.pdf",
    category: "scholarship",
    summaryNote: "Academic grant notice featuring income ceilings, CGPA criteria, and renewal terms.",
    rawText: `--- [Page 1] ---
GLOBAL FOUNDATION FOR ADVANCED TECHNOLOGY & EDUCATION
Circular Ref: GFATE-SCH-2026-44B
Announcement: Future Leaders STEM Merit & Need-Based Scholarship 2026-2027

1. PROGRAMME OBJECTIVE & AWARD:
The Foundation invites applications from undergraduate and postgraduate students enrolled in recognized universities for the 2026-2027 academic year.
- Award Amount: $25,000 USD per scholar per academic year (disbursed in two equal semester installments).
- Total Available Grants: 120 Scholarships globally.

2. ELIGIBILITY REQUIREMENTS:
- Enrolled full-time in an accredited undergraduate or master's program in Computer Science, Engineering, Mathematics, or Data Science.
- Academic Performance: Cumulative GPA of 3.5 / 4.0 or minimum 75% aggregate in preceding degree examinations.
- Annual Family Income: Gross total household income must not exceed $60,000 USD (or equivalent local currency) per annum.
- Age Limit: Below 28 years as of 31st December 2026.

--- [Page 2] ---
3. MANDATORY DOCUMENTS CHECKLIST:
All candidates must upload digital certified copies through the application portal:
1. Proof of current full-time university enrollment / Bonafide Student Certificate signed by Dean or Registrar.
2. Official Academic Transcripts for all completed semesters.
3. Official Family Income Certificate or latest certified tax filings of parent/guardian.
4. Valid Government Photo ID (Passport or National Identity Card).
5. Personal Statement of Purpose (maximum 800 words) describing intended research impact.
6. Two Letters of Recommendation on institutional letterhead.

4. IMPORTANT DATES:
- Portal Opens: 15th October 2026
- Application Deadline: 10th January 2027 at 23:59 UTC
- Document Scrutiny & Shortlist Announcement: 5th February 2027
- Virtual Panel Interviews: 15th to 20th February 2027
- Final Award Disbursal: 15th March 2027

5. RENEWAL CONDITIONS & FRAUD WARNING:
- Scholarship renewal for subsequent years is contingent upon maintaining a minimum 3.4 GPA and submission of annual progress reports.
- Any misrepresentation of family income or forged academic credentials will result in immediate cancellation, debarment, and mandatory repayment of disbursed funds.
- Contact: student-aid@globaltechfoundation.org | +1 (800) 555-0144`,
  },
  {
    id: "demo_job",
    title: "Senior Full-Stack AI Systems Architect — Enterprise Platform",
    fileName: "Senior_AI_Architect_Job_Spec.pdf",
    category: "job",
    summaryNote: "Detailed technical job description with skill matrices, remote policies, and compensation.",
    rawText: `--- [Page 1] ---
COGNITIVE CLOUD LABS INC.
Role: Senior Full-Stack AI Systems Architect
Department: Applied AI Platform Engineering
Location: Remote (Global) / San Francisco Hub
Employment Type: Full-Time Regular

ROLE OVERVIEW:
Cognitive Cloud Labs is building the next-generation document understanding and multimodal agent execution platform. We are seeking a senior technical lead to architect high-throughput document extraction pipelines, hybrid search engines, and real-time streaming interfaces.

KEY RESPONSIBILITIES:
- Architect and deploy scalable distributed document parsing microservices handling millions of complex PDF, spreadsheet, and image documents.
- Design low-latency client-side Web Crypto and privacy redaction layers for sensitive enterprise data.
- Benchmark and integrate foundation models, managing rate-limiting, token budgets, and automated fallback routers.
- Lead full-stack web applications using React, TypeScript, Tailwind CSS, and Node.js.

--- [Page 2] ---
QUALIFICATIONS & REQUIREMENTS:
1. Mandatory Education: Bachelor's or Master's degree in Computer Science, Software Engineering, or related technical field.
2. Experience: Minimum 6+ years of professional full-stack software development experience with at least 3 years focused on AI/ML application systems.
3. Core Technical Skills:
   - Deep proficiency in TypeScript, React, Node.js, and modern async patterns.
   - Hands-on experience with vector retrieval, embeddings, and prompt engineering.
   - Familiarity with enterprise compliance standards (SOC2, GDPR, HIPAA data masking).
   - Experience with cloud-native deployment, containerization, and Redis/PostgreSQL architectures.

COMPENSATION & BENEFITS:
- Base Salary Range: $175,000 - $215,000 USD per annum + competitive equity grant.
- Full medical, dental, vision, 401(k) matching, and annual home office stipend.

APPLICATION INSTRUCTIONS & DEADLINE:
- Submit updated CV/Resume, GitHub profile, and a brief description of a complex production system you designed.
- Applications close: 30th November 2026.
- Inquiries: careers@cognitivecloudlabs.io`,
  },
  {
    id: "demo_contract",
    title: "Master Services Agreement (MSA) & Data Processing Agreement",
    fileName: "Master_Services_Agreement_V4.docx",
    category: "contract",
    summaryNote: "Commercial contract containing strict confidentiality, uncapped indemnification, and termination notice rules.",
    rawText: `MASTER SERVICES AGREEMENT (MSA)
This Master Services Agreement ("Agreement") is entered into as of November 1, 2026 ("Effective Date"), by and between:
Client: Apex Global Logistics Inc. ("Client"), with offices at 1200 Harbour Boulevard, New York, NY 10005.
Service Provider: DOCULENS Cloud Technologies Corp. ("Provider"), with offices at 500 Tech Parkway, Suite 300, Austin, TX 78701.

1. SCOPE OF SERVICES:
Provider shall render cloud-based document processing, data extraction, and workflow automation services as detailed in individual Statements of Work ("SOW").

2. FEES AND PAYMENT TERMS:
- Monthly Retainer: $12,500 USD invoiced on the 1st day of each billing month.
- Invoices are due and payable within thirty (30) days from receipt (Net 30).
- Overdue payments shall accrue interest at the rate of 1.5% per month or the maximum rate permitted by law.
- Taxes: All stated fees are exclusive of applicable sales, use, or VAT taxes.

3. TERM AND TERMINATION:
- Initial Term: Two (2) years commencing on the Effective Date.
- Automatic Renewal: This Agreement shall automatically renew for successive one-year terms unless either party gives written notice of non-renewal at least sixty (60) days prior to the expiration of the current term.
- Termination for Convenience: Either party may terminate this Agreement without cause upon providing ninety (90) days prior written notice.
- Termination for Cause: Either party may terminate immediately upon material breach if uncured within thirty (30) days of written notice.

4. CONFIDENTIALITY & DATA PROTECTION:
Each party agrees to safeguard the other's Proprietary Information with the same degree of care it uses for its own confidential assets, but not less than reasonable care. Provider agrees that all raw documents processed remain the exclusive property of Client.

5. RISK CLAUSE - INDEMNIFICATION & LIMITATION OF LIABILITY:
- Section 9.1: Provider agrees to indemnify, defend, and hold harmless Client against any third-party claims alleging infringement of intellectual property.
- Section 9.4 (Unusual Clause Warning): Client insists that Provider's liability for data breach claims shall NOT be subject to the standard 12-month fee cap, creating uncapped exposure for security incidents.

6. GOVERNING LAW & ARBITRATION:
This Agreement shall be governed by the laws of the State of Delaware. Any dispute shall be settled by binding arbitration in Wilmington, Delaware under the rules of the American Arbitration Association.`,
  },
  {
    id: "demo_spreadsheet",
    title: "Regional Community Development Grant Applicants — Q4 Ledger",
    fileName: "Community_Grant_Applicants_Q4.xlsx",
    category: "spreadsheet",
    summaryNote: "Tabular applicant dataset with numeric disbursement totals, duplicate row checks, and statistical outliers.",
    rawText: `Spreadsheet Document: Community_Grant_Applicants_Q4.xlsx
Sheet: Applicants_2026 | Columns (7): Applicant_ID, Organization_Name, Category, Grant_Requested, City, Status, Submission_Date
Total Data Records: 28 | Missing Cells: 3 | Duplicate Rows: 1

Sample Records:
Row 2: Applicant_ID=APP-101, Organization_Name=Green Earth Urban Forestry, Category=Environment, Grant_Requested=25000, City=Seattle, Status=Approved, Submission_Date=2026-10-02
Row 3: Applicant_ID=APP-102, Organization_Name=Youth Coding Academy, Category=Education, Grant_Requested=45000, City=Austin, Status=Under Review, Submission_Date=2026-10-05
Row 4: Applicant_ID=APP-103, Organization_Name=Community Food Rescue, Category=Social Services, Grant_Requested=18500, City=Denver, Status=Approved, Submission_Date=2026-10-09
Row 5: Applicant_ID=APP-104, Organization_Name=Mobile Health Clinic, Category=Healthcare, Grant_Requested=60000, City=Chicago, Status=Approved, Submission_Date=2026-10-12
Row 6: Applicant_ID=APP-105, Organization_Name=Digital Literacy for Seniors, Category=Education, Grant_Requested=15000, City=Portland, Status=Pending Documents, Submission_Date=2026-10-15
Row 7: Applicant_ID=APP-106, Organization_Name=Clean River Project, Category=Environment, Grant_Requested=32000, City=Minneapolis, Status=Under Review, Submission_Date=2026-10-18
Row 8: Applicant_ID=APP-107, Organization_Name=Veterans Transition Shelter, Category=Social Services, Grant_Requested=50000, City=San Diego, Status=Approved, Submission_Date=2026-10-21
Row 9: Applicant_ID=APP-108, Organization_Name=Arts in Public Schools, Category=Arts & Culture, Grant_Requested=20000, City=Boston, Status=Rejected, Submission_Date=2026-10-24
Row 10: Applicant_ID=APP-109, Organization_Name=Youth Coding Academy, Category=Education, Grant_Requested=45000, City=Austin, Status=Duplicate, Submission_Date=2026-10-05
Row 11: Applicant_ID=APP-110, Organization_Name=Solar Power for Clinics, Category=Environment, Grant_Requested=140000, City=Phoenix, Status=Under Review, Submission_Date=2026-10-28
(Outlier Alert: Row 11 requested $140,000, which is 3.8x above the mean grant request of $36,800).`,
  },
];
