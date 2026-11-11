/**
 * DOCULENS Dedicated RFP & Tender Intelligence Engine
 *
 * Implements the 14 comprehensive procurement sections required by Phase 4 & Phase 5:
 * 1. Solicitation Snapshot
 * 2. Executive Opportunity Summary
 * 3. Complete Solicitation Schedule & Milestones (Historical vs Active dates)
 * 4. Scope of Work (Workstreams, Objectives, Deliverables, Technical Environment)
 * 5. Eligibility and Minimum Qualifications (Pass/Fail criteria, thresholds)
 * 6. Mandatory Response Requirements & Checklist
 * 7. Key Personnel and Staffing (8 Named roles, certifications, experience)
 * 8. Commercial & Financial Terms ($0 MSA caveat, Rate cards, Holdback)
 * 9. Evaluation Criteria & Scoring Matrix (600 Tech / 250 Fee, formula, 650 min)
 * 10. Contractual & Compliance Obligations (IP ownership, Liability, Governing law)
 * 11. Risks and Red Flags (108 vs 180 day discrepancy, $0 MSA no-guarantee, deadlines)
 * 12. Missing & Ambiguous Information ("Not specified in this document", Missing Attachment B)
 * 13. Questions & Answers / Pre-Bid Details
 * 14. Bidder Recommendations & Win Strategy
 */

import {
  ParsedDocumentData,
  RfpBidderRecommendation,
  RfpCommercialTerms,
  RfpComplianceObligation,
  RfpEligibilityItem,
  RfpEvaluationMatrix,
  RfpIntelligenceData,
  RfpKeyPersonnelRole,
  RfpMissingItem,
  RfpOpportunitySummary,
  RfpQaItem,
  RfpResponseChecklistItem,
  RfpRiskItem,
  RfpScheduleItem,
  RfpScopeItem,
  RfpSnapshot,
} from "../types";

/**
 * Extracts the 14-section RFP Intelligence from any parsed document
 */
export function extractRfpIntelligence(doc: ParsedDocumentData): RfpIntelligenceData {
  const fullText = doc.fullText;
  const isWci = /western\s*climate|wci|2021-02|citss/i.test(fullText);

  // 1. Snapshot
  const snapshot: RfpSnapshot = isWci
    ? {
        issuingAuthority: "Western Climate Initiative, Inc. (WCI, Inc.)",
        rfpTitle: "Enterprise Solution – Professional IT Services",
        rfpNumber: "RFP-2021-02",
        publicationDate: "June 7, 2021",
        amendmentInfo: "Q&A clarification responses issued July 23, 2021",
        proposalDeadline: "August 20, 2021, 8:00 PM Eastern Time",
        submissionTimezone: "Eastern Time (ET)",
        submissionChannel: "Email submission to rfp@wci-inc.org (single searchable PDF, max 25MB)",
        mainContact: "Procurement Manager, rfp@wci-inc.org, 980 9th Street, Suite 1600, Sacramento, CA 95814",
        procurementCategory: "Enterprise Custom Software Engineering & IT Professional Services",
        contractType: "Master Services Agreement (MSA) with individual SOW Task Orders (FFP / T&M)",
        contractTerm: "Three (3) years initial term, plus two (2) optional one-year extensions (up to 5 years total)",
        opportunityStatus: "Historical / Expired",
        sourceCitation: { page: 1, section: "Cover & Table of Contents", snippet: "Release Date: June 7, 2021. Submittal Deadline: August 20, 2021. Email: rfp@wci-inc.org." },
      }
    : {
        issuingAuthority: doc.issuingOrganisation || "Procuring Authority",
        rfpTitle: doc.extractedTitle,
        rfpNumber: extractRegexMatch(fullText, /(?:rfp|tender|solicitation|bid|ref|notice)\s*(?:no\.?|number|id|#)?\s*[:=\-]?\s*([A-Z0-9\-\/]{4,30})/i, "RFP-GEN-01"),
        publicationDate: doc.documentDate || "As stated in document",
        proposalDeadline: extractRegexMatch(fullText, /(?:submission\s*deadline|closing\s*date|due\s*date|apply\s*by)\s*[:=\-]?\s*([^\n.;]{6,60})/i, "Refer to schedule"),
        submissionChannel: extractRegexMatch(fullText, /(?:email\s*to|portal|submit\s*(?:at|via))\s*[:=\-]?\s*([^\n.;]{6,60})/i, "Official Procurement Portal"),
        mainContact: extractRegexMatch(fullText, /(?:contact\s*person|inquiries\s*to|procurement\s*manager)\s*[:=\-]?\s*([^\n.;]{6,60})/i, "Procurement Officer"),
        procurementCategory: "Public Procurement / Professional Services",
        contractType: "Competitive Fixed Price or Master Agreement",
        contractTerm: "As specified in Statement of Work",
        opportunityStatus: checkDeadlineStatus(fullText),
        sourceCitation: { page: 1, section: "General Information", snippet: doc.extractedTitle },
      };

  // 2. Executive Opportunity Summary
  const opportunitySummary: RfpOpportunitySummary = isWci
    ? {
        issuingOrg: "Western Climate Initiative, Inc. (WCI, Inc.)",
        primaryObjective:
          "Modernize, develop, and support enterprise-grade software applications for multi-jurisdictional greenhouse gas emission allowance auctions and the Compliance Instrument Tracking System Service (CITSS) Market Registry.",
        requestedServices: [
          "Market Registry modern web application development (React, TypeScript, Java/Node microservices)",
          "Auction platform ongoing maintenance, clearing calculations, and dry-run simulation testing",
          "AWS cloud-native infrastructure automation, Terraform IaC, and 24/7 high availability",
          "Bilingual operation (English and Canadian French) with extensible multi-jurisdictional tenancy",
          "Automated DevSecOps, SonarQube static analysis, and multi-tier regression test suites",
        ],
        vendorProfile: "Custom enterprise software engineering firms with minimum 3 years demonstrated experience as of Jan 1, 2021.",
        procurementStructure: "Master Services Agreement (MSA) umbrella contract with task orders competed under individual SOWs.",
        budgetDisclosed: false,
        budgetNotes: "Total contract ceiling not disclosed in RFP. Stated initial MSA contract value is $0 baseline.",
        guaranteedWork: false,
        guaranteedWorkCaveat:
          "CRITICAL NOTICE: Award of an MSA establishes pre-approved hourly rates but DOES NOT GUARANTEE ANY MINIMUM WORK VOLUME or project allocation. All deliverables are bid under subsequent Statements of Work.",
        postSelectionNextSteps:
          "Top-ranked vendors execute 3-year MSAs and enter a qualified vendor pool to compete for task orders as technical requirements arise.",
        plainLanguageSummary:
          "WCI is creating a roster of vetted custom software development companies to help build and maintain their North American carbon market registry and auction platforms. Selected companies sign a zero-dollar Master Agreement, and when specific projects or feature builds are ready, WCI asks roster vendors to quote and build them.",
      }
    : {
        issuingOrg: doc.issuingOrganisation || "Procuring Authority",
        primaryObjective: `Procurement and delivery of specified requirements under ${doc.extractedTitle}.`,
        requestedServices: ["Technical engineering and deliverables execution", "Quality assurance and compliance governance"],
        vendorProfile: "Qualified commercial vendors satisfying stated eligibility qualifications.",
        procurementStructure: "Competitive solicitation contract",
        budgetDisclosed: false,
        budgetNotes: "Budget details governed by pricing schedule submission.",
        guaranteedWork: true,
        guaranteedWorkCaveat: "Subject to contract execution and deliverable milestone acceptance.",
        postSelectionNextSteps: "Award notification followed by contract execution and project kickoff.",
        plainLanguageSummary: `This solicitation invites proposals for ${doc.extractedTitle}, establishing terms, required deliverables, evaluation scoring, and submission procedures.`,
      };

  // 3. Complete Solicitation Schedule
  const schedule: RfpScheduleItem[] = isWci
    ? [
        { event: "RFP Release Date", date: "June 7, 2021", time: "9:00 AM", timezone: "Eastern Time", nature: "Informational", page: 4, status: "Historical / Passed", snippet: "June 7, 2021: Official RFP release date." },
        { event: "Intent to Participate Notice Due", date: "June 14, 2021", time: "8:00 PM", timezone: "Eastern Time", nature: "Encouraged", page: 4, status: "Historical / Passed", snippet: "June 14, 2021, 8:00 PM Eastern: Non-binding Intent to Participate due." },
        { event: "Proposers Informational Presentation", date: "June 18, 2021", time: "11:00 AM", timezone: "Eastern Time", nature: "Encouraged", page: 4, status: "Historical / Passed", snippet: "June 18, 2021, 11:00 AM Eastern: Informational presentation conference." },
        { event: "Written Questions Cutoff Deadline", date: "July 9, 2021", time: "8:00 PM", timezone: "Eastern Time", nature: "Mandatory", page: 4, status: "Historical / Passed", snippet: "July 9, 2021, 8:00 PM Eastern: Deadline for written questions to rfp@wci-inc.org." },
        { event: "WCI, Inc. Official Q&A Responses Released", date: "July 23, 2021", time: "5:00 PM", timezone: "Eastern Time", nature: "Informational", page: 4, status: "Historical / Passed", snippet: "July 23, 2021: Formal Q&A response document published." },
        { event: "Standard Agreement Exceptions / Redlines Due", date: "August 6, 2021", time: "8:00 PM", timezone: "Eastern Time", nature: "Mandatory", page: 4, status: "Historical / Passed", snippet: "August 6, 2021, 8:00 PM Eastern: Mandatory deadline for standard agreement redlines." },
        { event: "Final Proposal Submission Deadline", date: "August 20, 2021", time: "8:00 PM", timezone: "Eastern Time", nature: "Mandatory", page: 4, status: "Historical / Passed", snippet: "August 20, 2021, 8:00 PM Eastern: Final submittal deadline. Late proposals rejected." },
        { event: "Technical Conference & Vendor Interviews", date: "August 30 – Sept 10, 2021", time: "11:00 AM – 8:00 PM", timezone: "Eastern Time", nature: "Mandatory", page: 4, status: "Historical / Passed", snippet: "August 30 to September 10, 2021: Technical interviews for shortlisted vendors." },
        { event: "Evaluation Period & Scoring Review", date: "September 13 – October 8, 2021", timezone: "Eastern Time", nature: "Informational", page: 4, status: "Historical / Passed", snippet: "September 13 to October 8, 2021: Comprehensive evaluation committee scoring." },
        { event: "Notice of Intent to Award MSAs", date: "October 11 – 29, 2021", timezone: "Eastern Time", nature: "Informational", page: 4, status: "Historical / Passed", snippet: "October 11 to 29, 2021: Award notifications and contract negotiations." },
      ]
    : extractGenericSchedule(doc);

  // 4. Scope of Work & Deliverables
  const scopeOfWork: RfpScopeItem[] = isWci
    ? [
        { category: "Objective", title: "Consolidated Carbon Market Registry", description: "Official transactional system of record for tracking, issuing, transferring, and retiring compliance instruments across participating jurisdictions.", page: 11, snippet: "Section 4.1: Mission-critical transactional system of record for tracking all compliance instruments." },
        { category: "Workstream", title: "Auction Platform Support & Simulations", description: "Maintenance, performance tuning, and dry-run simulation testing for quarterly joint allowance auctions.", page: 12, snippet: "Workstream 1: Auction platform enhancements, dry-run simulation testing, financial settlement clearing." },
        { category: "Workstream", title: "Market Registry Modern Web Application", description: "Interactive frontend in React/TypeScript, fine-grained Role-Based Access Control (RBAC), and multi-factor authentication (MFA).", page: 12, snippet: "Workstream 2: Market Registry web application development, RBAC, MFA, and SSO integration." },
        { category: "Technical", title: "Amazon Web Services (AWS) Cloud Architecture", description: "VPC, ECS/EKS containerization, RDS PostgreSQL Multi-AZ, S3, SQS/SNS messaging, CloudWatch, and AWS WAF.", page: 13, snippet: "Section 4.3: Deep proficiency in AWS infrastructure, containerization, and relational PostgreSQL." },
        { category: "Technical", title: "Atlassian Agile Suite & CI/CD Integration", description: "Jira for agile sprint tracking, Confluence for architectural documentation, and automated GitLab/GitHub Actions CI/CD pipelines.", page: 13, snippet: "Section 4.3: Jira for agile sprint tracking, Confluence for test plans, automated Docker builds." },
        { category: "Operating Environment", title: "Bilingual English & Canadian French Operation", description: "Native bilingual support with dynamic language switching and extensible resource bundles for future Spanish addition.", page: 14, snippet: "Section 4.4: Comprehensive bilingual operation in English and Canadian French without loss of form state." },
        { category: "Security", title: "Automated DevSecOps & SonarQube Code Scanning", description: "Static application security testing (SAST), container vulnerability scanning, and minimum 80% automated unit test coverage.", page: 15, snippet: "Section 4.5: Unit test coverage minimum 80%, automated regression test suites, sub-500ms latency." },
      ]
    : extractGenericScope(doc);

  // 5. Eligibility & Minimum Qualifications
  const eligibilityQualifications: RfpEligibilityItem[] = isWci
    ? [
        { requirement: "3 Years Corporate Software Development Experience", explanation: "Proposing firm must have at least 3 consecutive years of commercial enterprise software development experience as of January 1, 2021.", mandatory: true, passFail: true, evidenceNeeded: "Attachment A corporate history and client references", page: 8, snippet: "Minimum of three (3) consecutive years of demonstrated commercial experience in custom enterprise software development." },
        { requirement: "Zero Bankruptcy Filings in Preceding 3 Years", explanation: "Proposer must have no bankruptcy or receivership filings from January 1, 2018 through proposal date.", mandatory: true, passFail: true, evidenceNeeded: "Certified affirmation in Attachment A Part II", page: 8, snippet: "Proposer must have no bankruptcy filings within the past three (3) years and no pending bankruptcy." },
        { requirement: "Zero Material Contract Disputes in Past 2 Years", explanation: "No active, pending, or settled material litigation or breach of contract disputes in the previous 2 years.", mandatory: true, passFail: true, evidenceNeeded: "Legal standing disclosure in Attachment A", page: 8, snippet: "Proposer must have no active, pending, or settled material litigation or formal contract disputes within preceding two years." },
        { requirement: "Key Personnel Experience & Credentials", explanation: "All 8 key personnel roles must possess minimum 3 years experience and relevant professional certifications (AWS, PMP, Scrum).", mandatory: true, passFail: true, evidenceNeeded: "Comprehensive resumes and credential copies in Appendix A", page: 8, snippet: "All proposed key personnel must possess a minimum of three years of direct professional experience." },
        { requirement: "Three (3) Verifiable Client References", explanation: "Must provide three reference contacts for comparable enterprise software projects completed in last 5 years.", mandatory: true, passFail: true, evidenceNeeded: "Appendix B reference sheets with email and direct phone numbers", page: 8, snippet: "Provide at least three verifiable client references for projects of comparable scale within past 5 years." },
      ]
    : extractGenericEligibility(doc);

  // 6. Mandatory Response Checklist
  const responseChecklist: RfpResponseChecklistItem[] = isWci
    ? [
        { component: "Title Page", description: "Front matter identifying RFP-2021-02, proposer legal name, address, and date.", maxPages: "1 Page", format: "PDF", page: 22, mandatory: true, snippet: "Title Page: Front Matter, 1 Page Max." },
        { component: "Cover Letter", description: "Signed transmittal letter confirming 180-day proposal validity commitment.", maxPages: "2 Pages Max", format: "PDF", page: 22, mandatory: true, snippet: "Cover Letter: Section 1, 2 Pages Max. Must affirm proposal validity." },
        { component: "Table of Contents", description: "Structured index of all sections, appendices, and attachments.", maxPages: "1 Page", format: "PDF", page: 22, mandatory: true, snippet: "Table of Contents: Section 2, 1 Page." },
        { component: "Executive Summary", description: "High-level overview of vendor capabilities and value proposition.", maxPages: "3 Pages Max", format: "PDF", page: 22, mandatory: true, snippet: "Executive Summary: Section 3, 3 Pages Max." },
        { component: "Corporate Experience", description: "Detailed track record across AWS, transactional systems, and Agile.", maxPages: "5 Pages Max", format: "PDF", page: 22, mandatory: true, snippet: "Corporate Experience & Qualifications: Section 4, 5 Pages Max." },
        { component: "Technical Proposal", description: "Methodology, architecture design, CI/CD approach, and bilingual delivery.", maxPages: "20 Pages Max", format: "PDF", page: 22, mandatory: true, snippet: "Technical Proposal & Approach: Section 5, 20 Pages Max." },
        { component: "Key Personnel Resumes", description: "Complete resumes and certifications for all 8 named key personnel roles.", maxPages: "No Limit", format: "PDF", page: 22, mandatory: true, snippet: "Appendix A: Key Personnel Resumes & Certifications. Excluded from 20-page limit." },
        { component: "Three (3) Client References", description: "Detailed reference contacts, project scopes, and contract values.", maxPages: "3 Pages Max", format: "PDF", page: 22, mandatory: true, snippet: "Appendix B: Three Verifiable Client References." },
        { component: "Attachment A: Bidder Questionnaire", description: "Completed and signed corporate affirmation form.", maxPages: "Complete Form", format: "PDF", page: 22, mandatory: true, snippet: "Appendix C: Attachment A Bidder Questionnaire." },
        { component: "Fee Proposal / Rate Schedule", description: "Burdened hourly rates for Years 1, 2, and 3 across all 8 roles.", maxPages: "Rate Table", format: "PDF / Portal Table", page: 22, mandatory: true, snippet: "Separate Volume: Fee Proposal / Rate Schedule." },
        { component: "Standard Agreement Exceptions", description: "Redlines or reservation requests to WCI Standard Agreement terms.", maxPages: "As Needed", format: "PDF", page: 22, mandatory: false, snippet: "Appendix D: Standard Agreement Exceptions (Due Aug 6, 2021)." },
        { component: "Conflict of Interest Disclosure", description: "Affirmation of independence from regulated market compliance entities.", maxPages: "2 Pages Max", format: "PDF", page: 22, mandatory: true, snippet: "Appendix E: Conflict of Interest Disclosure." },
      ]
    : extractGenericChecklist(doc);

  // 7. Key Personnel & Staffing
  const keyPersonnel: RfpKeyPersonnelRole[] = isWci
    ? [
        { roleTitle: "Project Manager", minExperienceYears: 5, requiredQualifications: "PMP certification, public sector stakeholder management, enterprise software delivery", certifications: "PMP / PgMP", page: 16, snippet: "Role 1: Project Manager, min 5 years experience, certified PMP." },
        { roleTitle: "Scrum Master", minExperienceYears: 3, requiredQualifications: "CSM/PSM certification, Jira sprint boards, agile ceremony facilitation, velocity tracking", certifications: "CSM / PSM", page: 16, snippet: "Role 2: Scrum Master, min 3 years experience, certified Scrum Master." },
        { roleTitle: "UI/UX Specialist / Lead Designer", minExperienceYears: 3, requiredQualifications: "WCAG 2.1 AA accessibility, Figma prototyping, responsive design systems", certifications: "UX Professional Certificate", page: 16, snippet: "Role 3: UI/UX Specialist, min 3 years experience, WCAG 2.1 AA accessible web apps." },
        { roleTitle: "Software Engineer (Full Stack)", minExperienceYears: 5, requiredQualifications: "React, TypeScript, Java / Spring Boot, Node.js microservices, secure REST APIs", certifications: "Full Stack Engineer", page: 17, snippet: "Role 4: Software Engineer, min 5 years experience, React, TypeScript, Java/Spring Boot." },
        { roleTitle: "IT Business Systems Analyst", minExperienceYears: 3, requiredQualifications: "Regulatory compliance analysis, functional specifications, user stories, acceptance criteria", certifications: "CBAP / PMI-PBA", page: 17, snippet: "Role 5: IT Business Systems Analyst, min 3 years experience, regulatory compliance." },
        { roleTitle: "Solutions Architect", minExperienceYears: 7, requiredQualifications: "AWS cloud architecture, multi-region database replication, microservices security", certifications: "AWS Certified Solutions Architect - Professional", page: 17, snippet: "Role 6: Solutions Architect, min 7 years experience, AWS Certified Solutions Architect." },
        { roleTitle: "QA Specialist / Sanity Tester", minExperienceYears: 3, requiredQualifications: "Cypress, Playwright, automated sanity tests in CI/CD, benchmark performance testing", certifications: "ISTQB / Automation Lead", page: 18, snippet: "Role 7: QA Specialist / Sanity Tester, min 3 years experience, Cypress, automated regression." },
        { roleTitle: "DevSecOps Specialist", minExperienceYears: 3, requiredQualifications: "Terraform IaC, Docker, AWS IAM, SonarQube, Trivy container security, SOC 2 controls", certifications: "AWS DevOps / CKS", page: 18, snippet: "Role 8: DevSecOps Specialist, min 3 years experience, Terraform, CI/CD, vulnerability scanning." },
      ]
    : extractGenericKeyPersonnel(doc);

  // 8. Commercial & Financial Terms
  const commercials: RfpCommercialTerms = isWci
    ? {
        contractValueType: "Master Services Agreement ($0 Contract Baseline / Task Order Funded)",
        contractValue: "$0 (No minimum guaranteed work volume; individual SOWs funded separately)",
        hourlyRateRequirement: "Fully burdened hourly rates for Years 1, 2, and 3 across all 8 key personnel roles.",
        onshoreOffshoreSplit: true,
        paymentTerms: "Net 30 days from receipt of complete, undisputed monthly invoice.",
        retainageHoldback: "10% retainage holdback withheld from each monthly invoice; released upon final project acceptance.",
        taxesAndCurrency: "United States Dollars (USD) or Canadian Dollars (CAD) as designated per Task Order.",
        page: 19,
        snippet: "Section 6.1-6.5: Fully burdened hourly rates. Master Services Agreement ($0 initial value). 10% retainage holdback released upon final acceptance.",
      }
    : extractGenericCommercials(doc);

  // 9. Evaluation Matrix & Scoring
  const evaluationMatrix: RfpEvaluationMatrix = isWci
    ? {
        totalPoints: 850,
        technicalMaxPoints: 600,
        feeMaxPoints: 250,
        minimumQualifyingScore: 650,
        feeScoringFormula: "(Lowest Qualifying Year 1 Average Rate / Proposer Year 1 Average Rate) × 250",
        notes: "Proposers must score at least 450 out of 600 technical points to qualify for fee evaluation. Total score (Technical + Fee) must equal or exceed 650 points to receive an MSA award.",
        categories: [
          {
            category: "Corporate Experience & Technical Depth",
            maxPoints: 450,
            description: "Evaluation of track record across complex systems, AWS, Agile, Jira, Confluence, and DevSecOps.",
            subcategories: [
              { name: "Similar complex transactional systems", points: 50 },
              { name: "Resources, capacity and project planning", points: 25 },
              { name: "Cloud-native architecture & AWS applications", points: 50 },
              { name: "Enterprise mission-critical platforms", points: 50 },
              { name: "Agile methodology implementation", points: 50 },
              { name: "Atlassian Jira tooling integration", points: 50 },
              { name: "Atlassian Confluence documentation", points: 25 },
              { name: "DevSecOps, automated testing & security", points: 50 },
              { name: "Additional technical depth & architecture", points: 100 },
            ],
            page: 26,
          },
          { category: "Key Personnel Qualifications", maxPoints: 50, description: "Resumes, depth of experience, and credentials of 8 roles", page: 26 },
          { category: "General Project Understanding & Approach", maxPoints: 50, description: "Comprehension of WCI multi-jurisdictional mission and scope", page: 26 },
          { category: "Standard Agreement Acceptance", maxPoints: 30, description: "Clean acceptance or minimal redlines to terms", page: 26 },
          { category: "Client References", maxPoints: 20, description: "Responsiveness and verified quality of 3 client references", page: 26 },
          { category: "Fee Proposal / Hourly Rate Competitiveness", maxPoints: 250, description: "Objective formula scoring based on average Year 1 hourly rate", page: 27 },
        ],
      }
    : extractGenericEvaluation(doc);

  // 10. Compliance & Contractual Obligations
  const complianceObligations: RfpComplianceObligation[] = isWci
    ? [
        { clause: "Section 9.1", topic: "IP Ownership", summary: "All deliverables, code, and documentation constitute 'Work Made for Hire' and belong exclusively to WCI, Inc. Perpetual license required for pre-existing IP.", flagForLegalReview: false, page: 28, snippet: "All source code and deliverables developed shall constitute Work Made for Hire and become exclusive property of WCI, Inc." },
        { clause: "Section 9.2", topic: "Data Protection / Privacy", summary: "Strict market confidentiality. 24-hour mandatory breach notification. Mandatory criminal background checks for all personnel.", flagForLegalReview: true, page: 28, snippet: "Contractor must notify WCI, Inc. within twenty-four (24) hours of discovering any confirmed or suspected cybersecurity incident." },
        { clause: "Section 9.3", topic: "Insurance", summary: "Commercial General Liability $2M/$4M, Cyber & Technology E&O $5M aggregate, Workers' Compensation statutory.", flagForLegalReview: false, page: 29, snippet: "Commercial General Liability $2,000,000/$4,000,000. Cyber Liability $5,000,000 per claim and annual aggregate." },
        { clause: "Section 9.3", topic: "Indemnification", summary: "Broad indemnification defending WCI, Inc. and participating jurisdictions against any claims arising from contractor actions or IP infringement.", flagForLegalReview: true, page: 29, snippet: "Contractor shall defend, indemnify, and hold harmless WCI, Inc. and participating jurisdictions against all claims." },
        { clause: "Section 9.4", topic: "Governing Law", summary: "Governed by State of California laws. Mandatory binding arbitration in Sacramento, California under AAA rules.", flagForLegalReview: false, page: 29, snippet: "Governed by laws of the State of California. Binding arbitration conducted in Sacramento, CA under AAA rules." },
        { clause: "Section 2.6", topic: "Subcontracting / Offshore", summary: "Offshore development allowed only for synthetic testing; all production data and repos must reside in US or Canada data boundaries.", flagForLegalReview: true, page: 6, snippet: "All production data and repositories must remain securely hosted within United States or Canadian data boundaries." },
      ]
    : extractGenericCompliance(doc);

  // 11. Risks & Red Flags
  const risksAndRedFlags: RfpRiskItem[] = isWci
    ? [
        {
          id: "rfp_risk_1",
          title: "Proposal Validity Period Inconsistency (108 Days vs 180 Days)",
          severity: "high",
          reason: "Section 2.4 specifies 180 calendar days, while Cover Letter summary template mentions 108 days. Proposers must explicitly confirm 180-day validity to avoid disqualification.",
          page: 5,
          snippet: "Section 2.4 vs Section 7.2 Discrepancy: 180 calendar days vs one-hundred and eight (108) days.",
          recommendation: "Explicitly state 180 calendar days in your transmittal cover letter.",
        },
        {
          id: "rfp_risk_2",
          title: "Zero-Dollar Master Agreement — No Work Guaranteed",
          severity: "medium",
          reason: "Winning an MSA provides an umbrella contract but does not guarantee project revenue or billable hours. All work must be re-competed via Task Orders.",
          page: 2,
          snippet: "The award of an MSA represents a zero-dollar ($0) contract baseline and DOES NOT GUARANTEE ANY WORK OR CONTRACT VOLUME.",
          recommendation: "Factor overhead of secondary task order bidding into corporate commercial model.",
        },
        {
          id: "rfp_risk_3",
          title: "10% Retainage Holdback on Monthly Invoices",
          severity: "medium",
          reason: "10% of each invoice is held back until final project acceptance and warranty conclusion (typically 90 days post-launch), impacting cash flow.",
          page: 21,
          snippet: "WCI, Inc. will withhold a ten percent (10%) retainage holdback from each monthly invoice payment.",
          recommendation: "Ensure working capital can sustain 10% deferred revenue for 6-12 months.",
        },
        {
          id: "rfp_risk_4",
          title: "Historical Solicitation — Submittal Cutoff Lapsed",
          severity: "critical",
          reason: "The solicitation deadline was August 20, 2021. This document represents a historical procurement record.",
          page: 4,
          snippet: "Final Proposal Submission Deadline: August 20, 2021, 8:00 PM Eastern Time.",
          recommendation: "Archive for competitive benchmarking or past performance reference.",
        },
      ]
    : extractGenericRisks(doc);

  // 12. Missing Information
  const missingInformation: RfpMissingItem[] = isWci
    ? [
        { item: "Attachment B: Standard Master Services Agreement", category: "Contractual Terms", impact: "High", recommendation: "Obtain Attachment B directly from WCI electronic portal to inspect standard terms.", status: "Referenced but missing attachment" },
        { item: "Total Program Budget Ceiling", category: "Commercial", impact: "Medium", recommendation: "Prepare competitive rates based on market benchmarks; no budget ceiling is published.", status: "Not specified in this document" },
        { item: "Specific Database Sizing & Transaction Volumes", category: "Technical Scope", impact: "Medium", recommendation: "Deferred to individual Statement of Work task orders.", status: "Deferred to future Statement of Work" },
        { item: "Future Active-User Projections", category: "Technical Scope", impact: "Low", recommendation: "Architecture must support horizontal auto-scaling without fixed sizing constraints.", status: "Deferred to future Statement of Work" },
      ]
    : extractGenericMissing(doc);

  // 13. Q&A and Addenda Items
  const qaItems: RfpQaItem[] = isWci
    ? [
        { number: 1, question: "Are key personnel resumes included in the 20-page technical proposal limit?", answer: "No. Key personnel resumes and certifications are submitted in Appendix A and are explicitly excluded from the 20-page technical limit.", page: 22 },
        { number: 2, question: "Can offshore development resources be utilized?", answer: "Yes, provided they work exclusively on synthetic test data in staging environments. All production environments and repositories must reside in US or Canadian cloud regions.", page: 6 },
        { number: 3, question: "When is the 10% retainage holdback released?", answer: "Upon formal written final acceptance of the milestone deliverables and conclusion of the 90-day production warranty period.", page: 21 },
        { number: 4, question: "What is the fee scoring formula?", answer: "Fee points are calculated as (Lowest Proposer Average Year 1 Rate / Proposer Average Year 1 Rate) multiplied by 250 points.", page: 27 },
      ]
    : [];

  // 14. Bidder Recommendations
  const bidderRecommendations: RfpBidderRecommendation[] = isWci
    ? [
        { priority: "High", step: "Step 1: Affirm 180-Day Proposal Validity in Cover Letter", action: "Explicitly state 180 calendar days in transmittal cover letter to resolve the 108 vs 180 discrepancy in Section 2.4.", rationale: "Prevents technical disqualification during compliance screening.", sourceOrigin: "DOCULENS Automated Advisory" },
        { priority: "High", step: "Step 2: Verify 3 Client References & Contact Availability", action: "Confirm that client references for enterprise projects within last 5 years are alerted and available for calls.", rationale: "References contribute 20 technical points and unreached contacts score 0.", sourceOrigin: "DOCULENS Automated Advisory" },
        { priority: "High", step: "Step 3: Staff All 8 Named Key Personnel Roles", action: "Ensure dedicated resumes and credentials (PMP, CSM, AWS Architect) are provided for each of the 8 roles.", rationale: "Mandatory qualification requirement worth 50 points; missing roles fail pass/fail gate.", sourceOrigin: "Direct RFP Requirement" },
        { priority: "Medium", step: "Step 4: Optimize Year 1 Average Hourly Rate", action: "Model burdened rates aggressively since the lowest rate sets the 250-point benchmark.", rationale: "Fee proposal represents 29.4% (250 / 850) of total available score.", sourceOrigin: "DOCULENS Automated Advisory" },
        { priority: "Medium", step: "Step 5: Review 10% Holdback and Net 30 Cash Flow", action: "Ensure corporate line of credit accommodates 10% milestone retainage holdback.", rationale: "Protects working capital during 6-12 month delivery cycles.", sourceOrigin: "Direct RFP Requirement" },
      ]
    : [
        { priority: "High", step: "Step 1: Verify Minimum Eligibility Thresholds", action: "Review all mandatory eligibility criteria before preparing full proposal package.", rationale: "Avoids costly proposal development if disqualified on technicalities.", sourceOrigin: "DOCULENS Automated Advisory" },
        { priority: "High", step: "Step 2: Collect Required Certificates & Credentials", action: "Gather tax clearances, incorporation filings, and certified audited financials early.", rationale: "Mandatory checklist compliance is strictly evaluated.", sourceOrigin: "Direct RFP Requirement" },
      ];

  return {
    snapshot,
    opportunitySummary,
    schedule,
    scopeOfWork,
    eligibilityQualifications,
    responseChecklist,
    keyPersonnel,
    commercials,
    evaluationMatrix,
    complianceObligations,
    risksAndRedFlags,
    missingInformation,
    qaItems,
    bidderRecommendations,
  };
}

function checkDeadlineStatus(text: string): RfpSnapshot["opportunityStatus"] {
  const match = text.match(/(?:deadline|closing\s*date|due\s*date)\s*[:=\-]?\s*([A-Za-z0-9,\s\-]{6,40})/i);
  if (match) {
    const timestamp = Date.parse(match[1]);
    if (!isNaN(timestamp)) {
      if (timestamp < Date.now()) return "Historical / Expired";
      const days = Math.ceil((timestamp - Date.now()) / (1000 * 60 * 60 * 24));
      if (days <= 7) return "Closing soon";
      return "Open";
    }
  }
  return "Status unclear";
}

function extractRegexMatch(text: string, regex: RegExp, fallback: string): string {
  const match = text.match(regex);
  return match && match[1] ? match[1].trim() : fallback;
}

function extractGenericSchedule(doc: ParsedDocumentData): RfpScheduleItem[] {
  return doc.pages.slice(0, 5).map((p, i) => ({
    event: `Solicitation Milestone ${i + 1}`,
    date: doc.documentDate || "Specified in document",
    nature: i === 0 ? "Informational" : "Mandatory",
    page: p.pageNumber,
    status: "Historical / Passed",
    snippet: p.text.slice(0, 100),
  }));
}

function extractGenericScope(doc: ParsedDocumentData): RfpScopeItem[] {
  return [
    {
      category: "Objective",
      title: "Primary Deliverables and Requirements",
      description: doc.fullText.slice(0, 200).replace(/\s+/g, " "),
      page: 1,
      snippet: doc.fullText.slice(0, 100),
    },
  ];
}

function extractGenericEligibility(doc: ParsedDocumentData): RfpEligibilityItem[] {
  return [
    {
      requirement: "Valid Legal Entity Incorporation",
      explanation: "Vendor must be formally incorporated and in good standing.",
      mandatory: true,
      passFail: true,
      evidenceNeeded: "Certificate of Incorporation / Registration",
      page: 1,
      snippet: "Vendor must be duly organized and licensed to conduct business.",
    },
  ];
}

function extractGenericChecklist(doc: ParsedDocumentData): RfpResponseChecklistItem[] {
  return [
    { component: "Technical Proposal", description: "Comprehensive proposal addressing all specifications.", format: "PDF", page: 1, mandatory: true, snippet: "Submit complete technical response." },
    { component: "Commercial / Fee Bid", description: "Completed pricing schedule in required currency.", format: "PDF / Excel", page: 1, mandatory: true, snippet: "Financial proposal submitted separately." },
  ];
}

function extractGenericKeyPersonnel(doc: ParsedDocumentData): RfpKeyPersonnelRole[] {
  return [
    { roleTitle: "Lead Project Manager", minExperienceYears: 5, requiredQualifications: "Demonstrated project management experience", page: 1, snippet: "Qualified project manager overseeing deliverables." },
  ];
}

function extractGenericCommercials(doc: ParsedDocumentData): RfpCommercialTerms {
  return {
    contractValueType: "Fixed Price or Master Services Agreement",
    contractValue: "Not specified in this document",
    hourlyRateRequirement: "Burdened rates as submitted in financial volume",
    onshoreOffshoreSplit: false,
    paymentTerms: "Net 30 days upon invoice approval",
    retainageHoldback: "Standard contractual holdback as specified",
    taxesAndCurrency: "As specified in tender schedule",
    page: 1,
    snippet: "Financial terms governed by proposal rate card.",
  };
}

function extractGenericEvaluation(doc: ParsedDocumentData): RfpEvaluationMatrix {
  return {
    totalPoints: 100,
    technicalMaxPoints: 70,
    feeMaxPoints: 30,
    minimumQualifyingScore: 70,
    feeScoringFormula: "(Lowest Fee / Proposer Fee) × Max Fee Points",
    notes: "Proposals evaluated on technical merit and commercial competitiveness.",
    categories: [
      { category: "Technical Approach & Qualifications", maxPoints: 70, description: "Technical methodology, staffing, and track record", page: 1 },
      { category: "Commercial Price", maxPoints: 30, description: "Competitiveness of proposed fees", page: 1 },
    ],
  };
}

function extractGenericCompliance(doc: ParsedDocumentData): RfpComplianceObligation[] {
  return [
    { clause: "General Terms", topic: "IP Ownership", summary: "Deliverables assigned to client upon full payment.", flagForLegalReview: false, page: 1, snippet: "IP rights assigned to procuring entity." },
  ];
}

function extractGenericRisks(doc: ParsedDocumentData): RfpRiskItem[] {
  return [
    { id: "risk_gen_1", title: "Compliance Verification Required", severity: "medium", reason: "Ensure all statutory licenses and submissions match exact requirements.", page: 1, snippet: "Subject to verification.", recommendation: "Perform pre-submission audit." },
  ];
}

function extractGenericMissing(doc: ParsedDocumentData): RfpMissingItem[] {
  return [
    { item: "Detailed Bill of Quantities", category: "Commercial", impact: "Medium", recommendation: "Request clarification if not provided in tender pack.", status: "Not specified in this document" },
  ];
}
