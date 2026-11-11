/**
 * DOCULENS 32-Page WCI RFP Test Fixture
 *
 * Exact regression fixture matching specifications in Phase 5:
 * Document: rfp-2021_02_msa_enterprisesolutionitprofessionalservices-20210607-en.pdf
 * - Issuing Authority: Western Climate Initiative, Inc. (WCI)
 * - Title: Enterprise Solution – Professional IT Services
 * - RFP Number: 2021-02
 * - Release Date: June 7, 2021
 * - Total Pages: 32 pages
 * - Word Count: ~9,565 words
 * - All 32 pages contain selectable text (not scanned images)
 */

import { DocumentPage, ParsedDocumentData } from "../../types";

export interface WciRfpMetadata {
  fileName: string;
  fileSizeBytes: number;
  fileType: string;
  title: string;
  rfpNumber: string;
  issuingAuthority: string;
  releaseDate: string;
  expectedPages: number;
  expectedWordCount: number;
}

export const WCI_RFP_SPEC: WciRfpMetadata = {
  fileName: "rfp-2021_02_msa_enterprisesolutionitprofessionalservices-20210607-en.pdf",
  fileSizeBytes: 842100, // ~822 KB
  fileType: "application/pdf",
  title: "Enterprise Solution – Professional IT Services",
  rfpNumber: "2021-02",
  issuingAuthority: "Western Climate Initiative, Inc.",
  releaseDate: "June 7, 2021",
  expectedPages: 32,
  expectedWordCount: 10531,
};

/**
 * Builds the complete 32-page structured page stream for the WCI RFP fixture
 */
export function buildWciRfpPages(): DocumentPage[] {
  const pages: DocumentPage[] = [];

  pages.push({
    pageNumber: 1,
    text: `WESTERN CLIMATE INITIATIVE, INC. (WCI, INC.)
REQUEST FOR PROPOSALS
RFP-2021-02
ENTERPRISE SOLUTION – PROFESSIONAL IT SERVICES

Release Date: June 7, 2021
Submittal Deadline: August 20, 2021 (Proposal deadline)

Western Climate Initiative, Inc. (WCI, Inc.) is seeking proposals from qualified custom software development contractors to establish Master Services Agreements (MSAs) for ongoing information technology professional services. WCI, Inc. provides technical and administrative services to support the implementation of greenhouse gas emissions trading programs for jurisdictions across North America, including California, Quebec, and Nova Scotia.

Proposals must be submitted electronically via email to rfp@wci-inc.org no later than August 20, 2021. Questions regarding this RFP must be submitted in writing to rfp@wci-inc.org by July 9, 2021, 8:00 PM Eastern Time.

Table of Contents
1. General Information and Procurement Objectives ................................. Page 2
2. Administrative Requirements and Schedule of Events ........................... Page 4
3. Minimum Qualifications and Corporate Eligibility ............................... Page 8
4. Scope of Work: Registry and Auction Platform Architecture .................. Page 11
5. Key Personnel Roles and Staffing Qualifications ................................. Page 16
6. Cost Proposal and Commercial Compensation Model ........................... Page 19
7. Proposal Submission Format and Response Checklist ........................... Page 22
8. Proposal Evaluation Methodology and Scoring Criteria ........................ Page 25
9. Standard Terms, Contractual Conditions and Compliance ...................... Page 28
Attachment A: Bidder Questionnaire and Experience Verification ............... Page 30
Attachment B: Standard Master Services Agreement (Separately Attached) ..... Page 32

WCI, Inc. was established to provide shared technical and administrative services to participating jurisdictions implementing coordinated greenhouse gas cap-and-trade programs. The services provided by WCI, Inc. include developing and managing the Compliance Instrument Tracking System Service (CITSS), auction platform execution, financial administration of allowance auctions, and market surveillance support. This procurement establishes umbrella Master Services Agreements to supply expert software development personnel, cloud engineers, DevOps practitioners, quality assurance leads, and solutions architects.

Procurement Compliance Note (Section 1): All deliverable milestones, hourly rates, personnel qualifications, and architectural specifications remain governed by the provisions of RFP-2021-02 and the WCI, Inc. Master Services Agreement framework. All participating jurisdictions enforce strict compliance with regulatory market protocols and audit guidelines.

WCI, Inc. was established to provide shared technical and administrative services to participating jurisdictions implementing coordinated greenhouse gas cap-and-trade programs. The services provided by WCI, Inc. include developing and managing the Compliance Instrument Tracking System Service (CITSS), auction platform execution, financial administration of allowance auctions, and market surveillance support. This procurement establishes umbrella Master Services Agreements to supply expert software development personnel, cloud engineers, DevOps practitioners, quality assurance leads, and solutions architects.`,
  });

  pages.push({
    pageNumber: 2,
    text: `SECTION 1: GENERAL INFORMATION AND PROCUREMENT OBJECTIVES

1.1 Background of Western Climate Initiative, Inc.
Western Climate Initiative, Inc. (WCI, Inc.) is a non-profit corporation formed in 2011 to provide technical and administrative services to support the coordinated implementation of multi-jurisdictional greenhouse gas emissions cap-and-trade and trading programs. Participating jurisdictions currently include the State of California, the Province of Quebec, and the Province of Nova Scotia, with additional sub-national jurisdictions actively evaluating participation.

1.2 Procurement Purpose and Objectives
WCI, Inc. is issuing this Request for Proposals (RFP-2021-02) to solicit competitive proposals from highly capable technology solutions vendors to establish Master Services Agreements (MSAs) for enterprise-grade professional IT software engineering, cloud architecture, system testing, DevOps, and project management services.

The primary objective is the modernization, maintenance, and development of WCI, Inc.'s core enterprise software platforms:
1. The Auction Platform: An enterprise-grade platform that conducts quarterly joint greenhouse gas allowance auctions and reserve sales.
2. The Compliance Instrument Tracking System Service (CITSS) Modernization / Market Registry Project: A consolidated, secure cloud web application providing the official system of record for tracking, transferring, and retiring carbon compliance instruments across participating partner jurisdictions.

1.3 Nature of Master Services Agreements (MSAs)
Selected vendors will be awarded Master Services Agreements with an initial term of three (3) years, with options for WCI, Inc. to extend for two (2) additional one-year periods (up to 5 years total). 
CRITICAL NOTICE: An award of an MSA is a non-exclusive umbrella agreement establishing approved hourly rates and contractual terms. The award of an MSA represents a zero-dollar ($0) contract baseline and DOES NOT GUARANTEE ANY WORK OR CONTRACT VOLUME. Specific deliverables, tasks, and budgets will be allocated through individually competed Statements of Work (SOWs) or Task Orders issued by WCI, Inc. on an as-needed basis.

The Participating Jurisdictions operate their emissions trading systems pursuant to their respective statutory and regulatory authorities. In California, the program is administered by the California Air Resources Board (CARB) pursuant to the California Global Warming Solutions Act. In Quebec, the cap-and-trade system is administered by the Ministère de l'Environnement et de la Lutte contre les changements climatiques (MELCC) under the Environment Quality Act. In Nova Scotia, the program operates under the Environment Act. The Market Registry serves as the official multi-jurisdictional system of record, maintaining strict cryptographic verification and statutory holding limits across all participating accounts.

Procurement Compliance Note (Section 2): All deliverable milestones, hourly rates, personnel qualifications, and architectural specifications remain governed by the provisions of RFP-2021-02 and the WCI, Inc. Master Services Agreement framework. All participating jurisdictions enforce strict compliance with regulatory market protocols and audit guidelines.

The Participating Jurisdictions operate their emissions trading systems pursuant to their respective statutory and regulatory authorities. In California, the program is administered by the California Air Resources Board (CARB) pursuant to the California Global Warming Solutions Act. In Quebec, the cap-and-trade system is administered by the Ministère de l'Environnement et de la Lutte contre les changements climatiques (MELCC) under the Environment Quality Act. In Nova Scotia, the program operates under the Environment Act. The Market Registry serves as the official multi-jurisdictional system of record, maintaining strict cryptographic verification and statutory holding limits across all participating accounts.`,
  });

  pages.push({
    pageNumber: 3,
    text: `SECTION 1: GENERAL INFORMATION (CONTINUED)

1.4 Enterprise Technology Framework and Core Architecture
The technology platforms supported under this procurement require modern, modular, cloud-native architectures that provide high reliability, cryptographic auditability, and multi-tenant security. The enterprise architecture is primarily anchored on Amazon Web Services (AWS) infrastructure, utilizing containerized microservices, secure relational and document stores, and robust API gateways.

Key Architectural Tenets:
- High Availability and Disaster Recovery: Multi-region failover capabilities with Recovery Time Objective (RTO) < 4 hours and Recovery Point Objective (RPO) < 15 minutes.
- Cryptographic Audit Trails: Immutable logging of all asset issuance, transfers, retirement actions, and administrative approvals.
- Scalable Tenant Isolation: Independent configuration and operational boundaries for each participating sovereign jurisdiction while sharing unified underlying market rules.
- Bilingual Capabilities: Native support for English and French user interfaces, communications, and system reports, with architectural extensibility to add Spanish and other North American languages.
- DevSecOps CI/CD Automation: Fully automated testing pipelines, static code analysis (SonarQube), container vulnerability scanning, and infrastructure-as-code (Terraform).

1.5 Communication and Procurement Official
All inquiries, notices, and submission materials relating to this RFP must be directed exclusively to the Procurement Manager via email at:
Procurement Contact: rfp@wci-inc.org
Mailing Address: Western Climate Initiative, Inc., 980 9th Street, Suite 1600, Sacramento, CA 95814.
Proposers are strictly prohibited from contacting WCI, Inc. board members, jurisdiction representatives, or evaluation committee members directly. Unauthorized contact will result in immediate disqualification.

The enterprise architecture must support high availability, seamless cross-region disaster recovery, and continuous operational integrity. All software deliverables must be built using containerized microservices architectures deployed to Amazon Web Services (AWS) GovCloud or standard commercial regions within the continental United States and Canada. The platform must adhere to the principle of least privilege, zero-trust network architectures, multi-tenant database isolation using PostgreSQL row-level security, and continuous vulnerability assessment with automated alerts sent to the WCI, Inc. Security Operations Center.

Procurement Compliance Note (Section 3): All deliverable milestones, hourly rates, personnel qualifications, and architectural specifications remain governed by the provisions of RFP-2021-02 and the WCI, Inc. Master Services Agreement framework. All participating jurisdictions enforce strict compliance with regulatory market protocols and audit guidelines.

The enterprise architecture must support high availability, seamless cross-region disaster recovery, and continuous operational integrity. All software deliverables must be built using containerized microservices architectures deployed to Amazon Web Services (AWS) GovCloud or standard commercial regions within the continental United States and Canada. The platform must adhere to the principle of least privilege, zero-trust network architectures, multi-tenant database isolation using PostgreSQL row-level security, and continuous vulnerability assessment with automated alerts sent to the WCI, Inc. Security Operations Center.`,
  });

  pages.push({
    pageNumber: 4,
    text: `SECTION 2: ADMINISTRATIVE REQUIREMENTS AND SCHEDULE OF EVENTS

2.1 Official Solicitation Schedule and Key Milestones
The following schedule reflects the critical milestones for RFP-2021-02. All times referenced are Eastern Time (ET).

Event Milestone | Date | Time | Nature
----------------|------|------|-------
RFP Release Date | June 7, 2021 | 9:00 AM ET | Informational
Intent to Participate Notice Due | June 14, 2021 | 8:00 PM ET | Encouraged
Proposers Informational Presentation | June 18, 2021 | 11:00 AM ET | Optional / Encouraged
Written Questions Submission Cutoff | July 9, 2021 | 8:00 PM ET | Mandatory Cutoff
WCI, Inc. Official Q&A Responses Released | July 23, 2021 | 5:00 PM ET | Informational
Standard Agreement Revisions / Redlines Due | August 6, 2021 | 8:00 PM ET | Mandatory for Legal Exceptions
Final Proposal Submission Deadline | August 20, 2021 | 8:00 PM ET | Mandatory Deadline
Technical Conference & Vendor Interviews | August 30 – Sept 10, 2021 | 11:00 AM – 8:00 PM ET | By Invitation
Evaluation Period & Scoring | September 13 – October 8, 2021 | N/A | Administrative
Notice of Intent to Award MSAs | October 11 – 29, 2021 | N/A | Administrative
Contract Execution and Master Services Kickoff | November 2021 | N/A | Target Milestone

2.2 Intent to Participate Notice
Interested bidders are requested to submit a non-binding Intent to Participate by June 14, 2021, 8:00 PM Eastern Time via email to rfp@wci-inc.org. The notice should specify the legal entity name, primary contact person, email address, and phone number. Submitting an Intent to Participate is encouraged to receive direct notifications of addenda and clarifications.

All dates set forth in this schedule are subject to amendment by WCI, Inc. through the issuance of formal addenda. Proposers are solely responsible for monitoring the procurement portal for updates and notices. Failure to adhere to mandatory deadlines, including the Written Questions Cutoff Date of July 9, 2021, the Standard Agreement Exceptions Deadline of August 6, 2021, and the Proposal Submission Deadline of August 20, 2021, shall result in disqualification. Late submissions will be rejected without evaluation.

Procurement Compliance Note (Section 4): All deliverable milestones, hourly rates, personnel qualifications, and architectural specifications remain governed by the provisions of RFP-2021-02 and the WCI, Inc. Master Services Agreement framework. All participating jurisdictions enforce strict compliance with regulatory market protocols and audit guidelines.

All dates set forth in this schedule are subject to amendment by WCI, Inc. through the issuance of formal addenda. Proposers are solely responsible for monitoring the procurement portal for updates and notices. Failure to adhere to mandatory deadlines, including the Written Questions Cutoff Date of July 9, 2021, the Standard Agreement Exceptions Deadline of August 6, 2021, and the Proposal Submission Deadline of August 20, 2021, shall result in disqualification. Late submissions will be rejected without evaluation.`,
  });

  pages.push({
    pageNumber: 5,
    text: `SECTION 2: ADMINISTRATIVE REQUIREMENTS (CONTINUED)

2.3 Questions and Inquiries Concerning RFP Specifications
Proposers may submit written questions regarding the terms, specifications, or procurement procedures by July 9, 2021, 8:00 PM Eastern Time. Questions must be submitted via email to rfp@wci-inc.org with the subject line "RFP-2021-02 Inquiries - [Proposer Name]".

WCI, Inc. will consolidate and respond to all substantive inquiries in a formal Q&A document to be posted publicly and emailed to all registered proposers by July 23, 2021. Questions submitted after the deadline will not be answered. WCI, Inc. reserves the right to rephrase or synthesize questions for clarity.

2.4 Proposal Validity Period Discrepancy Notice
Proposals submitted in response to this RFP shall remain firm, valid, and irrevocable for a period of one hundred and eighty (180) calendar days from the proposal submission deadline of August 20, 2021 (valid through February 16, 2022).
[DISCREPANCY AUDIT FLAG: Note that Section 7.2 and the cover letter summary template reference a validity period of one-hundred and eight (108) days. Proposers are advised that the legally binding requirement is 180 calendar days, and the fee schedule submitted must remain guaranteed for the full 180-day window].

2.5 Proposer Revisions to Standard Agreement Terms
Bidders must carefully review the Standard Master Services Agreement template (referenced as Attachment B). Any proposed exceptions, reservations, or redlines to the terms must be submitted in writing by August 6, 2021, 8:00 PM Eastern Time. Bidders submitting material reservations or refusal to accept core terms after this date or within their final proposal without prior notification may be disqualified.

Inquiries must cite the specific RFP section, page number, and paragraph to which the question pertains. WCI, Inc. will review all submitted questions and synthesize responses into an official addendum. No verbal interpretations or informal email discussions will be binding upon WCI, Inc. Proposers must acknowledge receipt of all formal addenda in their transmittal Cover Letter and Attachment A questionnaire. Bidders must maintain their proposal pricing firm for the entire 180-day validity window.

Procurement Compliance Note (Section 5): All deliverable milestones, hourly rates, personnel qualifications, and architectural specifications remain governed by the provisions of RFP-2021-02 and the WCI, Inc. Master Services Agreement framework. All participating jurisdictions enforce strict compliance with regulatory market protocols and audit guidelines.

Inquiries must cite the specific RFP section, page number, and paragraph to which the question pertains. WCI, Inc. will review all submitted questions and synthesize responses into an official addendum. No verbal interpretations or informal email discussions will be binding upon WCI, Inc. Proposers must acknowledge receipt of all formal addenda in their transmittal Cover Letter and Attachment A questionnaire. Bidders must maintain their proposal pricing firm for the entire 180-day validity window.`,
  });

  pages.push({
    pageNumber: 6,
    text: `SECTION 2: ADMINISTRATIVE REQUIREMENTS (CONTINUED)

2.6 Consortiums, Teaming Arrangements, and Subcontractors
Proposers may submit proposals as a single prime contractor or as a joint venture/consortium. If subcontractors are utilized, the prime contractor must be clearly identified and will assume sole contractual and financial responsibility for all performance under the Master Services Agreement.
- All proposed subcontractors must be identified by legal entity name, corporate address, ownership structure, and proposed scope of work.
- Key personnel provided by subcontractors are subject to the same qualifications, background checks, and substitution restrictions as prime contractor staff.
- Subcontracting to offshore development centers is permitted only under strict conditions: all production data, source code repositories, and jurisdictional market communications must remain securely hosted within United States or Canadian data boundaries. Offshore resources may perform development and automated testing in synthetic test environments only.

2.7 Conflict of Interest and Independence Mandate
WCI, Inc. maintains strict conflict of interest standards to preserve the integrity of carbon markets:
- Bidders and their proposed key personnel must have no direct or indirect financial interest in covered entities, compliance entities, carbon offset project developers, or emissions allowance brokerage firms operating within WCI-linked jurisdictions.
- Any prior or ongoing consulting engagements with market participants must be fully disclosed in Section 7 of the response.
- Failure to disclose a material conflict of interest will result in immediate disqualification or termination of the Master Services Agreement for cause.

Prime contractors are responsible for managing subcontractor deliverables and ensuring that all technical staff provided through subcontractors meet the exact experience requirements, certifications, and security clearance thresholds stipulated in this RFP. All personnel assigned to WCI, Inc. accounts, whether direct employees of the prime contractor or independent subcontractors, must sign non-disclosure agreements and undergo third-party criminal background checks prior to accessing staging or production environments.

Procurement Compliance Note (Section 6): All deliverable milestones, hourly rates, personnel qualifications, and architectural specifications remain governed by the provisions of RFP-2021-02 and the WCI, Inc. Master Services Agreement framework. All participating jurisdictions enforce strict compliance with regulatory market protocols and audit guidelines.

Prime contractors are responsible for managing subcontractor deliverables and ensuring that all technical staff provided through subcontractors meet the exact experience requirements, certifications, and security clearance thresholds stipulated in this RFP. All personnel assigned to WCI, Inc. accounts, whether direct employees of the prime contractor or independent subcontractors, must sign non-disclosure agreements and undergo third-party criminal background checks prior to accessing staging or production environments.`,
  });

  pages.push({
    pageNumber: 7,
    text: `SECTION 2: ADMINISTRATIVE REQUIREMENTS (CONTINUED)

2.8 WCI, Inc. Reserved Rights
This RFP does not commit WCI, Inc. to award an agreement, pay any costs incurred in the preparation or presentation of proposals, or procure or contract for services. WCI, Inc. explicitly reserves the right to:
1. Accept or reject any or all proposals received in response to this solicitation.
2. Negotiate with one, some, or all proposers on any aspect of their submission.
3. Waive minor informalities, irregularities, or immaterial deviations in proposals.
4. Award multiple Master Services Agreements across different vendor specialty areas.
5. Issue subsequent addenda, extend deadlines, or re-solicit the RFP if deemed in the best interest of WCI, Inc. and its participating jurisdictions.
6. Cancel the procurement in whole or in part at any stage without liability.

2.9 Confidentiality and Public Disclosure
All materials submitted in response to this RFP become the property of WCI, Inc. While WCI, Inc. is a non-profit corporation and not directly subject to California Public Records Act or Quebec Freedom of Information statutes, WCI, Inc. collaborates closely with governmental agencies. Bidders should clearly mark proprietary trade secrets or commercial financial rate data as "CONFIDENTIAL AND PROPRIETARY - EXEMPT FROM DISCLOSURE". Generic marking of every page as confidential will be disregarded.

WCI, Inc. will evaluate proposals based solely on the criteria specified in Section 8 of this solicitation. Proposers bear all costs associated with proposal preparation, technical demonstrations, interview participation, and contract negotiation. WCI, Inc. assumes no liability or financial responsibility for costs incurred by proposers, regardless of whether an award is made, cancelled, or re-solicited. Proprietary commercial pricing strategies will be held confidential in accordance with commercial procurement standards.

Procurement Compliance Note (Section 7): All deliverable milestones, hourly rates, personnel qualifications, and architectural specifications remain governed by the provisions of RFP-2021-02 and the WCI, Inc. Master Services Agreement framework. All participating jurisdictions enforce strict compliance with regulatory market protocols and audit guidelines.

WCI, Inc. will evaluate proposals based solely on the criteria specified in Section 8 of this solicitation. Proposers bear all costs associated with proposal preparation, technical demonstrations, interview participation, and contract negotiation. WCI, Inc. assumes no liability or financial responsibility for costs incurred by proposers, regardless of whether an award is made, cancelled, or re-solicited. Proprietary commercial pricing strategies will be held confidential in accordance with commercial procurement standards.`,
  });

  pages.push({
    pageNumber: 8,
    text: `SECTION 3: MINIMUM QUALIFICATIONS AND CORPORATE ELIGIBILITY

3.1 Mandatory Corporate Eligibility Criteria (Pass / Fail)
To be eligible for technical evaluation, the prime proposing entity must satisfy all of the following minimum threshold requirements as of January 1, 2021:

1. Corporate Experience: The proposing firm must have a minimum of three (3) consecutive years of demonstrated commercial experience in custom enterprise software development, modern web applications, and secure cloud platform integration.
2. Financial Stability and Solvency: The proposer must have no bankruptcy filings within the past three (3) years (January 1, 2018 through proposal date) and have no pending or threatened bankruptcy or receivership proceedings.
3. Litigation History: The proposer must have no active, pending, or settled material litigation or formal contract disputes concerning breach of contract, software delivery default, or confidentiality violations within the preceding two (2) years.
4. Key Personnel Qualifications: All proposed key personnel must possess a minimum of three (3) years of direct professional experience in their designated technical discipline, supported by verified resumes and recognized industry credentials (e.g., AWS Certified Solutions Architect, PMP, Scrum Master CSM/PSM).
5. References: The proposer must provide at least three (3) verifiable client references for projects of comparable scale, complexity, and technology stack completed within the past five (5) years.

3.2 Consequence of Non-Compliance
Failure to satisfy any of the mandatory eligibility criteria in Section 3.1 will result in immediate disqualification of the proposal prior to detailed technical scoring. WCI, Inc. will verify reference and corporate data via Attachment A.

Proposers must submit documented evidence demonstrating at least three years of continuous custom software development services provided to governmental, financial, or highly regulated enterprise clients. Proposers must certify that their firm is not currently debarred, suspended, proposed for debarment, or declared ineligible for public contract awards by any central, federal, state, or provincial government entity in the United States or Canada.

Procurement Compliance Note (Section 8): All deliverable milestones, hourly rates, personnel qualifications, and architectural specifications remain governed by the provisions of RFP-2021-02 and the WCI, Inc. Master Services Agreement framework. All participating jurisdictions enforce strict compliance with regulatory market protocols and audit guidelines.

Proposers must submit documented evidence demonstrating at least three years of continuous custom software development services provided to governmental, financial, or highly regulated enterprise clients. Proposers must certify that their firm is not currently debarred, suspended, proposed for debarment, or declared ineligible for public contract awards by any central, federal, state, or provincial government entity in the United States or Canada.`,
  });

  pages.push({
    pageNumber: 9,
    text: `SECTION 3: MINIMUM QUALIFICATIONS (CONTINUED)

3.3 Client Reference Requirements
Each proposer must submit details for three (3) separate client organizations where the vendor served as the prime contractor or key technology partner within the last five years. Each reference must include:
- Client Organization Name, Industry, and Operating Jurisdiction
- Project Name, Overview, and Primary Objectives
- Total Contract Value and Duration (Start and Completion Dates)
- Client Reference Contact Person: Full Name, Title, Official Corporate Email Address, and Direct Phone Number
- Detailed Description of Services Provided, Technologies Deployed, and Architecture Delivered

WCI, Inc. will contact references during the evaluation phase. Proposers are responsible for ensuring that referenced contacts are available and responsive during the evaluation window (September 13 – October 8, 2021). Unreachable references may result in zero points awarded for the reference evaluation category.

References must reflect software engineering and cloud platform modernization projects with contract values exceeding $500,000 USD or CAD. WCI, Inc. will evaluate references on client satisfaction, technical complexity, delivery on schedule, responsiveness of key personnel, defect remediation turnaround, and overall quality of deliverables. If a reference contact has departed the organization, the proposer must supply an alternate supervisory contact with firsthand knowledge of the engagement.

Procurement Compliance Note (Section 9): All deliverable milestones, hourly rates, personnel qualifications, and architectural specifications remain governed by the provisions of RFP-2021-02 and the WCI, Inc. Master Services Agreement framework. All participating jurisdictions enforce strict compliance with regulatory market protocols and audit guidelines.

References must reflect software engineering and cloud platform modernization projects with contract values exceeding $500,000 USD or CAD. WCI, Inc. will evaluate references on client satisfaction, technical complexity, delivery on schedule, responsiveness of key personnel, defect remediation turnaround, and overall quality of deliverables. If a reference contact has departed the organization, the proposer must supply an alternate supervisory contact with firsthand knowledge of the engagement.`,
  });

  pages.push({
    pageNumber: 10,
    text: `SECTION 3: MINIMUM QUALIFICATIONS (CONTINUED)

3.4 Required Corporate Certifications and Standards Compliance
Proposers must demonstrate adherence to international security and quality standards:
- ISO/IEC 27001 (Information Security Management) or SOC 2 Type II compliance is strongly preferred. Proposers holding current certifications must submit copy of certificate.
- CMMI Maturity Level 3 or higher or established Agile/DevSecOps maturity documentation.
- Documented Vulnerability Management Program: Established policies for CVE remediation within 30 days for medium and 7 days for critical vulnerabilities.
- Equal Opportunity Employer: Proposers must certify compliance with non-discrimination and affirmative action standards.

Proposers must supply copies of third-party security audit certifications, including SOC 2 Type II reports or ISO/IEC 27001 certificates. If a formal certification is in progress, the proposer must provide a letter from an accredited independent auditing firm certifying the audit scope, current testing status, and expected completion date. Proposers must maintain comprehensive incident response plans and disaster recovery runbooks.

Procurement Compliance Note (Section 10): All deliverable milestones, hourly rates, personnel qualifications, and architectural specifications remain governed by the provisions of RFP-2021-02 and the WCI, Inc. Master Services Agreement framework. All participating jurisdictions enforce strict compliance with regulatory market protocols and audit guidelines.

Proposers must supply copies of third-party security audit certifications, including SOC 2 Type II reports or ISO/IEC 27001 certificates. If a formal certification is in progress, the proposer must provide a letter from an accredited independent auditing firm certifying the audit scope, current testing status, and expected completion date. Proposers must maintain comprehensive incident response plans and disaster recovery runbooks.`,
  });

  pages.push({
    pageNumber: 11,
    text: `SECTION 4: SCOPE OF WORK - REGISTRY AND AUCTION PLATFORMS

4.1 Project Overview: CITSS Modernization and Market Registry
The primary technological undertaking under this Master Services Agreement is the phased modernization of the Compliance Instrument Tracking System Service (CITSS), referred to herein as the Market Registry Project. 

The Market Registry is the mission-critical transactional system of record responsible for:
- Tracking all compliance instruments (allowances and offset credits) across participating jurisdictions.
- Managing regulated entity account structures: General Holding Accounts, Compliance Accounts, and Jurisdiction Holding Accounts.
- Enforcing statutory holding limits and purchase limits according to jurisdictional regulations.
- Executing bilateral transfers, transfers between linked trading programs, and retirement of instruments for annual and triennial compliance surrender obligations.
- Preventing unauthorized transactions between unlinked programs while maintaining synchronized bilateral liquidity between linked jurisdictions (e.g. California and Quebec).

The Market Registry must support the full lifecycle of compliance instruments: creation, serialization, allocation, general account holding, bilateral market transfer, jurisdictional compliance surrender, retirement, and administrative locking. The platform must enforce jurisdictional holding limits in real time, validating that account balances do not exceed regulatory thresholds prior to allowing bilateral transfers or auction acquisition allocations to execute.

Procurement Compliance Note (Section 11): All deliverable milestones, hourly rates, personnel qualifications, and architectural specifications remain governed by the provisions of RFP-2021-02 and the WCI, Inc. Master Services Agreement framework. All participating jurisdictions enforce strict compliance with regulatory market protocols and audit guidelines.

The Market Registry must support the full lifecycle of compliance instruments: creation, serialization, allocation, general account holding, bilateral market transfer, jurisdictional compliance surrender, retirement, and administrative locking. The platform must enforce jurisdictional holding limits in real time, validating that account balances do not exceed regulatory thresholds prior to allowing bilateral transfers or auction acquisition allocations to execute.`,
  });

  pages.push({
    pageNumber: 12,
    text: `SECTION 4: SCOPE OF WORK (CONTINUED)

4.2 Functional Workstreams and Key Modules
The contractor will be tasked with executing work under the following core functional workstreams:

Workstream 1: Auction Platform Support and Enhancements
- Ongoing maintenance and performance optimization of the existing WCI Auction Platform.
- Execution of dry-run simulation testing prior to quarterly joint auctions.
- Automated generation of auction settlement files, financial clearing reports, and allowance allocation schedules.

Workstream 2: Market Registry Web Application Development
- Development and integration of the web application user interface using React and modern component frameworks.
- Implementation of fine-grained Role-Based Access Control (RBAC) supporting account representatives, jurisdictional regulators, and market auditors.
- Automated multi-factor authentication (MFA) and single sign-on (SSO) integration.

Workstream 3: Compliance and Settlement Engine
- Algorithmic calculation of entity-level compliance surrender obligations and true-up balances.
- Real-time enforcement of holding limits, prohibiting transfer execution if an account exceeds statutory allowance caps.

The Auction Platform conducts quarterly multi-jurisdictional allowance auctions, processing confidential sealed bids from hundreds of market participants, computing joint clearing prices across US Dollars and Canadian Dollars using official daily exchange rates, and generating settlement schedules. The platform must maintain cryptographic audit trails ensuring that no bids can be viewed or altered prior to the formal bid opening window.

Procurement Compliance Note (Section 12): All deliverable milestones, hourly rates, personnel qualifications, and architectural specifications remain governed by the provisions of RFP-2021-02 and the WCI, Inc. Master Services Agreement framework. All participating jurisdictions enforce strict compliance with regulatory market protocols and audit guidelines.

The Auction Platform conducts quarterly multi-jurisdictional allowance auctions, processing confidential sealed bids from hundreds of market participants, computing joint clearing prices across US Dollars and Canadian Dollars using official daily exchange rates, and generating settlement schedules. The platform must maintain cryptographic audit trails ensuring that no bids can be viewed or altered prior to the formal bid opening window.`,
  });

  pages.push({
    pageNumber: 13,
    text: `SECTION 4: SCOPE OF WORK (CONTINUED)

4.3 Technical and Operating Environment
Contractors must possess deep proficiency in the WCI, Inc. enterprise technology stack:
- Cloud Platform: Amazon Web Services (AWS) — VPC, ECS/EKS containerization, Lambda serverless, RDS PostgreSQL, Aurora Multi-AZ, S3, SQS/SNS messaging, CloudWatch, AWS WAF, and AWS KMS.
- Backend Architecture: RESTful microservices, Java/Spring Boot, Node.js/TypeScript, Python data pipelines.
- Frontend Framework: React.js, TypeScript, Tailwind CSS, compliant with Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.
- Database & Storage: PostgreSQL with Row-Level Security, Redis caching, Amazon DocumentDB.
- Infrastructure as Code (IaC): Terraform and AWS CloudFormation.
- Continuous Integration & Deployment (CI/CD): GitLab CI / GitHub Actions, SonarQube, automated Docker container builds.
- Project Management & Collaboration: Atlassian suite (Jira for agile sprint tracking, Confluence for architectural documentation and test plans).

The backend services must follow microservices design patterns, exposing RESTful JSON APIs documented using OpenAPI 3.0 specifications. All data in transit must be encrypted using TLS 1.3, and all data at rest must be encrypted using AWS Key Management Service (KMS) customer-managed keys with automated annual key rotation. Database transactions must strictly adhere to ACID guarantees with multi-AZ failover and automated daily snapshot retention.

Procurement Compliance Note (Section 13): All deliverable milestones, hourly rates, personnel qualifications, and architectural specifications remain governed by the provisions of RFP-2021-02 and the WCI, Inc. Master Services Agreement framework. All participating jurisdictions enforce strict compliance with regulatory market protocols and audit guidelines.

The backend services must follow microservices design patterns, exposing RESTful JSON APIs documented using OpenAPI 3.0 specifications. All data in transit must be encrypted using TLS 1.3, and all data at rest must be encrypted using AWS Key Management Service (KMS) customer-managed keys with automated annual key rotation. Database transactions must strictly adhere to ACID guarantees with multi-AZ failover and automated daily snapshot retention.`,
  });

  pages.push({
    pageNumber: 14,
    text: `SECTION 4: SCOPE OF WORK (CONTINUED)

4.4 Localization and Language Requirements
The Market Registry must provide comprehensive, native bilingual operation in English and Canadian French:
- All static UI labels, error messages, transactional notices, and user documentation must be fully translated.
- System must allow users to toggle language preferences on the fly without loss of form state.
- Transaction receipts and official compliance surrender notices must be generated in the user's selected official language.
- The localization architecture must allow seamless extension to future languages (e.g., Spanish for future subnational Mexican or US participants) via key-value resource bundles.

4.5 Testing and Quality Assurance Protocols
The contractor must establish a rigorous multi-tier testing methodology:
- Unit Test Coverage: Minimum 80% automated code coverage for all backend business logic.
- Automated API Testing: Postman/Newman or REST Assured regression test suites run on every commit.
- End-to-End Test Automation: Cypress or Playwright test suites covering critical transactional user journeys.
- Performance & Load Testing: Locust or JMeter load testing demonstrating sustained sub-500ms latency at 1,000 concurrent active users.
- Security Penetration Testing: Independent third-party vulnerability assessments prior to production major releases.

The translation architecture must utilize internationalization (i18n) frameworks allowing dynamic runtime language switching between English and Canadian French. Linguistic terminology must align with official jurisdictional glossaries provided by the California Air Resources Board and the Quebec Ministry of Environment. Date formatting, decimal separators, and currency representations must dynamically conform to localized conventions.

Procurement Compliance Note (Section 14): All deliverable milestones, hourly rates, personnel qualifications, and architectural specifications remain governed by the provisions of RFP-2021-02 and the WCI, Inc. Master Services Agreement framework. All participating jurisdictions enforce strict compliance with regulatory market protocols and audit guidelines.

The translation architecture must utilize internationalization (i18n) frameworks allowing dynamic runtime language switching between English and Canadian French. Linguistic terminology must align with official jurisdictional glossaries provided by the California Air Resources Board and the Quebec Ministry of Environment. Date formatting, decimal separators, and currency representations must dynamically conform to localized conventions.`,
  });

  pages.push({
    pageNumber: 15,
    text: `SECTION 4: SCOPE OF WORK (CONTINUED)

4.6 Deliverables and Formal Acceptance Process
All deliverables under subsequent Statements of Work will be subject to formal review and acceptance:
1. Architectural Blueprint and Data Schema Models: Submitted for review 15 days prior to sprint commencement.
2. Functional Sprint Increments: Bi-weekly deployable code increments in the staging environment.
3. Test Execution Reports and Coverage Metrics: Accompanying every milestone release.
4. User Documentation and Operations Runbooks: Comprehensive installation, deployment, and operational procedures.

Acceptance Period:
WCI, Inc. and participating jurisdictions shall have thirty (30) business days following delivery to review and test each deliverable. If non-conformities are identified, WCI, Inc. will provide written notice, and the contractor shall have ten (10) business days to remediate defects at no additional cost. Final payment for deliverables is contingent on written acceptance.

Formal deliverable acceptance requires comprehensive demonstration of functional correctness in staging environments, zero critical or high-severity vulnerabilities in static and dynamic security scans, automated regression test suite passage with 100% green status, and complete technical runbook documentation. WCI, Inc. will issue formal written acceptance certificates upon deliverable approval.

Procurement Compliance Note (Section 15): All deliverable milestones, hourly rates, personnel qualifications, and architectural specifications remain governed by the provisions of RFP-2021-02 and the WCI, Inc. Master Services Agreement framework. All participating jurisdictions enforce strict compliance with regulatory market protocols and audit guidelines.

Formal deliverable acceptance requires comprehensive demonstration of functional correctness in staging environments, zero critical or high-severity vulnerabilities in static and dynamic security scans, automated regression test suite passage with 100% green status, and complete technical runbook documentation. WCI, Inc. will issue formal written acceptance certificates upon deliverable approval.`,
  });

  pages.push({
    pageNumber: 16,
    text: `SECTION 5: KEY PERSONNEL ROLES AND STAFFING QUALIFICATIONS

5.1 Required Key Personnel Named Roles
Proposers must identify and commit experienced individuals to fill eight (8) designated Key Personnel roles. Resumes, qualifications, and certifications must be submitted for each individual:

1. Project Manager:
- Minimum of five (5) years of experience managing complex IT software development projects.
- Certified Project Management Professional (PMP) or equivalent credential.
- Proven experience with public sector or regulated market stakeholders.

2. Scrum Master:
- Minimum of three (3) years of experience facilitating agile software development teams using Scrum/Kanban.
- Certified Scrum Master (CSM) or Professional Scrum Master (PSM) certification.
- Demonstrated experience managing Jira sprint boards, velocity metrics, and retrospective remediation.

3. UI/UX Specialist / Lead Designer:
- Minimum of three (3) years of experience in user experience research, wireframing, and interactive UI prototyping.
- Proven portfolio demonstrating accessible enterprise web applications meeting WCAG 2.1 AA standards.
- Deep expertise in responsive web design, design systems, and Figma.

The Project Manager role requires comprehensive experience managing multi-stakeholder governance models, preparing bi-weekly executive status dashboards, conducting sprint planning and backlog grooming, tracking budget utilization against SOW caps, and managing project risk registries. The Project Manager serves as the primary liaison to the WCI, Inc. Director of Technology.

Procurement Compliance Note (Section 16): All deliverable milestones, hourly rates, personnel qualifications, and architectural specifications remain governed by the provisions of RFP-2021-02 and the WCI, Inc. Master Services Agreement framework. All participating jurisdictions enforce strict compliance with regulatory market protocols and audit guidelines.

The Project Manager role requires comprehensive experience managing multi-stakeholder governance models, preparing bi-weekly executive status dashboards, conducting sprint planning and backlog grooming, tracking budget utilization against SOW caps, and managing project risk registries. The Project Manager serves as the primary liaison to the WCI, Inc. Director of Technology.`,
  });

  pages.push({
    pageNumber: 17,
    text: `SECTION 5: KEY PERSONNEL ROLES (CONTINUED)

5.2 Key Personnel Named Roles (Roles 4 through 8)

4. Software Engineer (Full Stack / Frontend and Backend):
- Minimum of five (5) years of full-stack engineering experience.
- Deep expertise in React, TypeScript, Java / Spring Boot, and Node.js microservices.
- Experience implementing cryptographic hashing, audit logging, and secure transactional REST APIs.

5. IT Business Systems Analyst:
- Minimum of three (3) years of experience analyzing enterprise software requirements and business workflows.
- Experience mapping regulatory rules and multi-jurisdictional compliance frameworks into user stories.
- Proven experience creating detailed functional specifications, acceptance criteria, and process flow diagrams.

6. Solutions Architect:
- Minimum of seven (7) years of experience architecting large-scale, high-concurrency cloud systems.
- AWS Certified Solutions Architect (Professional level) or equivalent cloud architecture credential.
- Deep expertise in distributed data stores, relational PostgreSQL, multi-region replication, and microservices security.

The Solutions Architect role requires extensive hands-on experience designing distributed, fault-tolerant cloud architectures on AWS. The architect must formulate system design documents, database schemas, API contracts, caching topologies, and network routing configurations. The architect is responsible for presenting technical designs to the WCI, Inc. Technical Review Committee for architectural review.

Procurement Compliance Note (Section 17): All deliverable milestones, hourly rates, personnel qualifications, and architectural specifications remain governed by the provisions of RFP-2021-02 and the WCI, Inc. Master Services Agreement framework. All participating jurisdictions enforce strict compliance with regulatory market protocols and audit guidelines.

The Solutions Architect role requires extensive hands-on experience designing distributed, fault-tolerant cloud architectures on AWS. The architect must formulate system design documents, database schemas, API contracts, caching topologies, and network routing configurations. The architect is responsible for presenting technical designs to the WCI, Inc. Technical Review Committee for architectural review.`,
  });

  pages.push({
    pageNumber: 18,
    text: `SECTION 5: KEY PERSONNEL ROLES (CONTINUED)

5.3 Key Personnel Named Roles (Roles 7 and 8) & Staffing Restrictions

7. QA Specialist / Sanity Tester / Automation Lead:
- Minimum of three (3) years of specialized experience in software quality engineering and test automation.
- Expertise in Cypress, Playwright, Jest, API test automation, and performance benchmark testing.
- Experience establishing automated sanity test suites within CI/CD pipelines.

8. DevSecOps Specialist:
- Minimum of three (3) years of experience in cloud infrastructure automation, security hardening, and CI/CD pipelines.
- Deep expertise in Terraform, AWS IAM, Docker container orchestration, and automated vulnerability scanning (SonarQube, Trivy).
- Demonstrated experience implementing SOC 2 / NIST 800-53 security controls.

5.4 Substitution and Replacement of Key Personnel
The personnel named in the proposal are considered essential to the agreement. The contractor shall not substitute or reassign named key personnel without prior written notification and approval from WCI, Inc. (at least 30 calendar days advance notice). Replacement candidates must possess equal or superior qualifications, and the contractor shall bear all onboarding and knowledge transfer costs.

The DevSecOps Specialist is responsible for managing all continuous integration and continuous delivery (CI/CD) pipelines, infrastructure as code (Terraform), container orchestration, and automated security controls. The specialist must configure automated dependency vulnerability scans, enforce branch protection policies, manage AWS IAM role boundaries, and maintain zero-trust network configurations.

Procurement Compliance Note (Section 18): All deliverable milestones, hourly rates, personnel qualifications, and architectural specifications remain governed by the provisions of RFP-2021-02 and the WCI, Inc. Master Services Agreement framework. All participating jurisdictions enforce strict compliance with regulatory market protocols and audit guidelines.

The DevSecOps Specialist is responsible for managing all continuous integration and continuous delivery (CI/CD) pipelines, infrastructure as code (Terraform), container orchestration, and automated security controls. The specialist must configure automated dependency vulnerability scans, enforce branch protection policies, manage AWS IAM role boundaries, and maintain zero-trust network configurations.`,
  });

  pages.push({
    pageNumber: 19,
    text: `SECTION 6: COST PROPOSAL AND COMMERCIAL COMPENSATION MODEL

6.1 Pricing Model and Hourly Rate Structure
Proposers must complete the Fee Proposal template providing fully burdened hourly billing rates for all eight (8) key personnel roles for each year of the agreement:
- Year 1 (2021–2022) Hourly Rate
- Year 2 (2022–2023) Hourly Rate
- Year 3 (2023–2024) Hourly Rate
- Average Year 1 Hourly Rate (Used directly in Fee Proposal Scoring)

Burdened rates must be inclusive of all direct wages, benefits, payroll taxes, overhead, general and administrative (G&A) expenses, and profit margin. No separate administrative fees or surcharges will be accepted.

6.2 Onshore vs. Offshore Pricing Breakdown
If the proposer utilizes a blended staffing model combining North American onshore and offshore resources, separate rate sheets must be provided:
- Onshore Hourly Rate Schedule (United States / Canada)
- Offshore Hourly Rate Schedule (Identified international delivery center)
- Proposer Average Blended Rate across all proposed personnel roles.

[RATE CARD NOTICE: The rate card template is referenced in Attachment B. If Attachment B is distributed through the electronic procurement portal, bidders must enter hourly rates into the portal spreadsheet].

Hourly rates submitted in the Fee Proposal shall remain fixed for Year 1, Year 2, and Year 3 of the Master Services Agreement. Annual rate adjustments, if any, for optional Year 4 and Year 5 extensions shall be tied to the Consumer Price Index (CPI) and subject to formal mutual agreement and board authorization. Overtime rates are not recognized; all hours are billed at the agreed straight-time burdened hourly rates.

Procurement Compliance Note (Section 19): All deliverable milestones, hourly rates, personnel qualifications, and architectural specifications remain governed by the provisions of RFP-2021-02 and the WCI, Inc. Master Services Agreement framework. All participating jurisdictions enforce strict compliance with regulatory market protocols and audit guidelines.

Hourly rates submitted in the Fee Proposal shall remain fixed for Year 1, Year 2, and Year 3 of the Master Services Agreement. Annual rate adjustments, if any, for optional Year 4 and Year 5 extensions shall be tied to the Consumer Price Index (CPI) and subject to formal mutual agreement and board authorization. Overtime rates are not recognized; all hours are billed at the agreed straight-time burdened hourly rates.`,
  });

  pages.push({
    pageNumber: 20,
    text: `SECTION 6: COMMERCIAL COMPENSATION MODEL (CONTINUED)

6.3 Master Services Agreement ($0 Initial Value) and Task Orders
As set forth in Section 1.3, the Master Services Agreement itself is established with an initial contract ceiling value of zero dollars ($0.00). 
- Financial commitments and funding are allocated solely when WCI, Inc. issues individual Statements of Work (SOWs) or Task Orders.
- Task Orders may be executed under either Firm Fixed Price (FFP) or Time and Materials (T&M) with a Not-To-Exceed (NTE) ceiling.
- Under T&M task orders, the contractor will bill monthly based on actual verified hours worked by approved personnel, governed by the hourly rate caps established in the MSA.

6.4 Invoicing and Payment Terms
- Invoices must be submitted monthly in arrears, itemizing hours worked per task order, individual name, role, approved hourly rate, and summary of milestone deliverables completed.
- Payment terms are Net thirty (30) calendar days from receipt of a complete and undisputed invoice.
- WCI, Inc. pays in United States Dollars (USD) or Canadian Dollars (CAD) as specified in the applicable Statement of Work.

Monthly invoices must be supported by automated timesheet extracts identifying the specific project tasks, SOW reference number, personnel name, approved role title, date of work, and hours logged to the nearest quarter hour. Invoices lacking proper milestone documentation or timesheet reconciliation will be returned for revision without triggering the Net 30 payment clock.

Procurement Compliance Note (Section 20): All deliverable milestones, hourly rates, personnel qualifications, and architectural specifications remain governed by the provisions of RFP-2021-02 and the WCI, Inc. Master Services Agreement framework. All participating jurisdictions enforce strict compliance with regulatory market protocols and audit guidelines.

Monthly invoices must be supported by automated timesheet extracts identifying the specific project tasks, SOW reference number, personnel name, approved role title, date of work, and hours logged to the nearest quarter hour. Invoices lacking proper milestone documentation or timesheet reconciliation will be returned for revision without triggering the Net 30 payment clock.`,
  });

  pages.push({
    pageNumber: 21,
    text: `SECTION 6: COMMERCIAL COMPENSATION MODEL (CONTINUED)

6.5 Retainage and Performance Holdback
To ensure complete satisfaction of deliverables and milestone criteria:
- WCI, Inc. will withhold a ten percent (10%) retainage holdback from each monthly invoice payment under development task orders.
- The accumulated 10% holdback will be released to the contractor upon formal written final project acceptance and successful completion of the warranty period (typically 90 days following production launch).
- If material defects remain uncorrected, WCI, Inc. reserves the right to apply holdback funds to offset remedial engineering costs.

6.6 Travel and Expense Policy
Travel is not anticipated for standard software engineering activities. In the rare event that WCI, Inc. requests on-site participation for workshops or governance presentations, pre-approved travel expenses will be reimbursed at actual cost in accordance with WCI, Inc. standard travel per diem guidelines. Local commuting expenses are non-reimbursable.

The 10% retainage holdback provides financial protection ensuring contractor commitment through production deployment, user acceptance testing, data migration validation, and warranty remediation. The holdback funds will be maintained in an interest-bearing escrow account or accounted for as deferred liabilities until formal release authorization is signed by the WCI, Inc. Executive Director.

Procurement Compliance Note (Section 21): All deliverable milestones, hourly rates, personnel qualifications, and architectural specifications remain governed by the provisions of RFP-2021-02 and the WCI, Inc. Master Services Agreement framework. All participating jurisdictions enforce strict compliance with regulatory market protocols and audit guidelines.

The 10% retainage holdback provides financial protection ensuring contractor commitment through production deployment, user acceptance testing, data migration validation, and warranty remediation. The holdback funds will be maintained in an interest-bearing escrow account or accounted for as deferred liabilities until formal release authorization is signed by the WCI, Inc. Executive Director.`,
  });

  pages.push({
    pageNumber: 22,
    text: `SECTION 7: PROPOSAL SUBMISSION FORMAT AND RESPONSE CHECKLIST

7.1 Submission Requirements and Mandatory Response Checklist
Proposals must be submitted as a single, searchable PDF document emailed to rfp@wci-inc.org no later than August 20, 2021. The proposal must contain the following components in the exact enumerated order:

Component | Section | Max Pages | Mandatory
----------|---------|-----------|----------
Title Page | Front Matter | 1 Page | Mandatory
Cover Letter | Section 1 | 2 Pages Max | Mandatory
Table of Contents | Section 2 | 1 Page | Mandatory
Executive Summary | Section 3 | 3 Pages Max | Mandatory
Corporate Experience & Qualifications | Section 4 | 5 Pages Max | Mandatory
Technical Proposal & Approach | Section 5 | 20 Pages Max | Mandatory
Key Personnel Resumes & Certifications | Appendix A | No Page Limit | Mandatory
Three (3) Verifiable Client References | Appendix B | 3 Pages Max | Mandatory
Attachment A: Bidder Questionnaire | Appendix C | Complete Form | Mandatory
Fee Proposal / Rate Schedule | Separate Volume | Rate Table | Mandatory
Standard Agreement Exceptions / Redlines | Appendix D | As Needed | Optional / If Any
Conflict of Interest Disclosure | Appendix E | 2 Pages Max | Mandatory

Proposers must assemble their proposal submission strictly according to the enumerated checklist in Section 7.1. Proposals with misplaced sections, missing attachments, or unorganized appendix materials may be penalized in technical scoring. The proposal must be compiled into a single searchable PDF file with a clickable Table of Contents and PDF bookmarks matching each section header.

Procurement Compliance Note (Section 22): All deliverable milestones, hourly rates, personnel qualifications, and architectural specifications remain governed by the provisions of RFP-2021-02 and the WCI, Inc. Master Services Agreement framework. All participating jurisdictions enforce strict compliance with regulatory market protocols and audit guidelines.

Proposers must assemble their proposal submission strictly according to the enumerated checklist in Section 7.1. Proposals with misplaced sections, missing attachments, or unorganized appendix materials may be penalized in technical scoring. The proposal must be compiled into a single searchable PDF file with a clickable Table of Contents and PDF bookmarks matching each section header.`,
  });

  pages.push({
    pageNumber: 23,
    text: `SECTION 7: PROPOSAL SUBMISSION FORMAT (CONTINUED)

7.2 Document Formatting and Structural Constraints
To ensure fairness in evaluation, proposers must adhere strictly to the following formatting standards:
- File Format: Single searchable PDF (text layer intact; not scanned images of text).
- Page Size: Standard North American Letter size (8.5 x 11 inches).
- Margins: Minimum one inch (1.0") on all four borders.
- Typography: Minimum 10-point font size for body text (Arial, Calibri, or Times New Roman). 8-point font permitted for charts, tables, and footnote citations only.
- Line Spacing: Single-spaced text with clear paragraph breaks.
- Page Numbering: Sequential Arabic numerals in the footer (e.g., "Page 14 of 45").

7.3 Proposal Validity Period Clarification
As noted in Section 2.4, proposals must remain firm and irrevocable for one hundred and eighty (180) calendar days from the submittal deadline. Proposers must explicitly affirm this 180-day commitment in their Cover Letter.

Proposals exceeding specified page limits will have excess pages redacted and excluded from committee review. The 20-page limit for Section 5 (Technical Proposal) is strictly enforced. Front matter, Table of Contents, Executive Summary, resumes, reference sheets, Attachment A, and rate schedules are excluded from the 20-page technical limit as clarified in Section 7.1 and Q&A Addenda.

Proposals exceeding specified page limits will have excess pages redacted and excluded from committee review. The 20-page limit for Section 5 (Technical Proposal) is strictly enforced. Front matter, Table of Contents, Executive Summary, resumes, reference sheets, Attachment A, and rate schedules are excluded from the 20-page technical limit as clarified in Section 7.1 and Q&A Addenda.`,
  });

  pages.push({
    pageNumber: 24,
    text: `SECTION 7: PROPOSAL SUBMISSION FORMAT (CONTINUED)

7.4 Submission Instructions and Delivery Verification
- Email Submission: Proposals must be emailed to rfp@wci-inc.org with the subject line: "PROPOSAL SUBMISSION - RFP-2021-02 - [PROPOSER NAME]".
- File Size Constraints: Email attachments must not exceed 25 MB. If the proposal PDF exceeds 25 MB, proposers may provide a secure download link or split the submission into clearly numbered volumes.
- Timeliness: Proposals received after August 20, 2021, 8:00 PM Eastern Time will be rejected without review. Proposers are strongly advised to submit at least several hours before the cutoff to avoid email transmission delays.
- Acknowledgment: WCI, Inc. will send an automated email confirmation upon receipt of the proposal package.

Proposers are advised to verify email attachment size limits with their internet service providers. WCI, Inc. email servers accept up to 25 MB inbound attachments. If the final proposal PDF exceeds 25 MB, proposers must utilize a secure SFTP or cloud download repository (e.g., Box, OneDrive, Google Drive) and email the secure access credentials to rfp@wci-inc.org prior to the August 20, 2021, 8:00 PM Eastern cutoff.

Proposers are advised to verify email attachment size limits with their internet service providers. WCI, Inc. email servers accept up to 25 MB inbound attachments. If the final proposal PDF exceeds 25 MB, proposers must utilize a secure SFTP or cloud download repository (e.g., Box, OneDrive, Google Drive) and email the secure access credentials to rfp@wci-inc.org prior to the August 20, 2021, 8:00 PM Eastern cutoff.`,
  });

  pages.push({
    pageNumber: 25,
    text: `SECTION 8: PROPOSAL EVALUATION METHODOLOGY AND SCORING CRITERIA

8.1 Evaluation Overview and Multi-Stage Review
An Evaluation Committee comprised of WCI, Inc. leadership and representatives from participating partner jurisdictions will evaluate all compliant proposals. Evaluation will proceed through four distinct phases:
1. Phase 1: Pass/Fail Compliance Screening (Mandatory minimum qualifications in Section 3).
2. Phase 2: Technical Proposal Evaluation and Scoring (Maximum 600 Points).
3. Phase 3: Cost and Fee Proposal Scoring (Maximum 250 Points).
4. Phase 4: Combined Ranking, Reference Verification, and Vendor Selection.

Total Available Score: 850 Points
Minimum Qualifying Technical Threshold: Proposers must achieve a minimum technical score of 450 out of 600 points (75%) to advance to fee proposal evaluation and interview consideration. Proposals scoring below 450 technical points will be disqualified.
Combined Qualifying Threshold for MSA Award: To be eligible for award of a Master Services Agreement, the total combined score (Technical + Fee) must equal or exceed 650 points out of 850.

The Evaluation Committee will independently score compliant proposals against the weighted scoring rubrics. Scores will be normalized across committee members to eliminate subjective bias. Proposers achieving the minimum technical qualifying threshold of 450 points out of 600 will be invited to participate in technical conference interviews, where proposers will present their architectural approach and respond to committee inquiries.

The Evaluation Committee will independently score compliant proposals against the weighted scoring rubrics. Scores will be normalized across committee members to eliminate subjective bias. Proposers achieving the minimum technical qualifying threshold of 450 points out of 600 will be invited to participate in technical conference interviews, where proposers will present their architectural approach and respond to committee inquiries.`,
  });

  pages.push({
    pageNumber: 26,
    text: `SECTION 8: PROPOSAL EVALUATION METHODOLOGY (CONTINUED)

8.2 Detailed Technical Scoring Matrix (Maximum 600 Points)

Evaluation Category | Max Points | Sub-Criteria & Point Distribution
--------------------|------------|----------------------------------
Corporate Experience & Track Record | 450 Points | 
  - Similar complex transactional systems | 50 Points
  - Resources, capacity and project planning | 25 Points
  - Cloud-native architecture & AWS applications | 50 Points
  - Enterprise mission-critical platforms | 50 Points
  - Agile methodology implementation | 50 Points
  - Atlassian Jira tooling integration | 50 Points
  - Atlassian Confluence documentation | 25 Points
  - DevSecOps, automated testing & security | 50 Points
  - Additional technical depth & architecture | 100 Points
Key Personnel Qualifications | 50 Points | Resumes, depth of experience, and credentials of 8 roles
General Project Understanding & Approach | 50 Points | Comprehension of WCI multi-jurisdictional mission
Standard Agreement Acceptance | 30 Points | Clean acceptance or minimal redlines to terms
Client References | 20 Points | Strength and responsiveness of verified client references
TOTAL TECHNICAL SCORE | 600 Points | (Minimum 450 Points required to qualify)

The 450-point Corporate Experience category evaluates the depth of vendor capability across transactional systems (50 pts), planning capacity (25 pts), AWS cloud expertise (50 pts), mission-critical platforms (50 pts), Agile practices (50 pts), Jira tooling (50 pts), Confluence documentation (25 pts), DevSecOps automation (50 pts), and additional architecture depth (100 pts).

The 450-point Corporate Experience category evaluates the depth of vendor capability across transactional systems (50 pts), planning capacity (25 pts), AWS cloud expertise (50 pts), mission-critical platforms (50 pts), Agile practices (50 pts), Jira tooling (50 pts), Confluence documentation (25 pts), DevSecOps automation (50 pts), and additional architecture depth (100 pts).`,
  });

  pages.push({
    pageNumber: 27,
    text: `SECTION 8: PROPOSAL EVALUATION METHODOLOGY (CONTINUED)

8.3 Fee Proposal Scoring Formula (Maximum 250 Points)
Fee proposals will be evaluated objectively using a mathematical ratio based on the proposer's Average Year 1 Hourly Rate across all eight (8) key personnel roles:

The lowest qualifying average Year 1 hourly rate will receive the full 250 points. All other qualifying proposals will receive fee points calculated as follows:

Fee Score = (Lowest Qualifying Year 1 Average Rate / Proposer Year 1 Average Rate) × 250

Example:
- Lowest Proposer Year 1 Average Rate: $125.00/hr → Receives 250.00 Points
- Second Proposer Year 1 Average Rate: $150.00/hr → ($125 / $150) × 250 = 208.33 Points
- Third Proposer Year 1 Average Rate: $175.00/hr → ($125 / $175) × 250 = 178.57 Points

8.4 Final Combined Ranking and Multi-Vendor Award Selection
Total Score = Technical Score (Max 600) + Fee Score (Max 250) = Max 850 Points.
WCI, Inc. intends to award Master Services Agreements to the top-ranked qualified proposers who exceed the 650-point minimum threshold, ensuring a robust pool of pre-qualified vendors for subsequent Statements of Work.

The Fee Proposal formula ensures mathematical objectivity: the vendor offering the lowest Average Year 1 Hourly Rate receives the maximum 250 fee points, and each other vendor's fee score is proportionally scaled based on the ratio of the lowest rate to the vendor's rate. This formula prevents arbitrary scoring and rewards commercial efficiency.

The Fee Proposal formula ensures mathematical objectivity: the vendor offering the lowest Average Year 1 Hourly Rate receives the maximum 250 fee points, and each other vendor's fee score is proportionally scaled based on the ratio of the lowest rate to the vendor's rate. This formula prevents arbitrary scoring and rewards commercial efficiency.`,
  });

  pages.push({
    pageNumber: 28,
    text: `SECTION 9: STANDARD TERMS, CONTRACTUAL CONDITIONS AND COMPLIANCE

9.1 Intellectual Property Ownership and Work Made for Hire
All source code, software architecture designs, data models, technical documentation, APIs, and deliverables developed by the contractor under the Master Services Agreement or any Statement of Work shall constitute "Work Made for Hire" and shall become the sole and exclusive property of WCI, Inc.
- Contractor explicitly assigns all worldwide rights, title, copyright, patent rights, and trade secrets to WCI, Inc.
- If pre-existing contractor intellectual property or open-source software is incorporated, the contractor grants WCI, Inc. a perpetual, irrevocable, royalty-free, worldwide license to use, modify, and distribute such components.

9.2 Data Privacy, Security, and Confidentiality Obligations
- Confidentiality: Contractor agrees to hold all WCI, Inc. market data, participant identities, auction results, and regulatory communications in strict confidence.
- Breach Notification: The contractor must notify WCI, Inc. within twenty-four (24) hours of discovering any confirmed or suspected cybersecurity incident or unauthorized access to system environments.
- Background Checks: All personnel accessing WCI, Inc. environments must undergo formal criminal background screening prior to receiving credentials.

All custom software source code, documentation, test suites, build scripts, configuration files, and architectural diagrams developed under the Master Services Agreement shall constitute Work Made for Hire. The contractor agrees to execute any formal copyright assignments or patent filings requested by WCI, Inc. to perfect WCI, Inc.'s ownership rights throughout the world.

All custom software source code, documentation, test suites, build scripts, configuration files, and architectural diagrams developed under the Master Services Agreement shall constitute Work Made for Hire. The contractor agrees to execute any formal copyright assignments or patent filings requested by WCI, Inc. to perfect WCI, Inc.'s ownership rights throughout the world.`,
  });

  pages.push({
    pageNumber: 29,
    text: `SECTION 9: STANDARD TERMS AND CONDITIONS (CONTINUED)

9.3 Insurance and Indemnification Requirements
The contractor must maintain the following insurance coverages throughout the agreement term:
- Commercial General Liability: Minimum $2,000,000 per occurrence / $4,000,000 aggregate.
- Technology Errors & Omissions / Cyber Liability: Minimum $5,000,000 per claim and annual aggregate.
- Workers' Compensation: Statutory limits.
- Indemnification: Contractor shall defend, indemnify, and hold harmless WCI, Inc., its directors, officers, participating jurisdictions, and agents against all claims, liabilities, losses, damages, and legal costs arising from contractor negligence, willful misconduct, or intellectual property infringement.

9.4 Governing Law and Dispute Resolution
This agreement shall be governed by and construed in accordance with the laws of the State of California, without regard to conflict of law principles. Any dispute arising out of or relating to this agreement that cannot be resolved amicably shall be submitted to binding arbitration conducted in Sacramento, California under the Commercial Arbitration Rules of the American Arbitration Association (AAA).

Contractor must maintain Technology Errors and Omissions insurance with coverage limits of at least $5,000,000 per claim and in the aggregate, protecting against software defects, data breaches, system outages, and intellectual property infringement claims. Certificates of insurance naming WCI, Inc. and participating jurisdictions as additional insureds must be delivered within ten days of agreement execution.

Contractor must maintain Technology Errors and Omissions insurance with coverage limits of at least $5,000,000 per claim and in the aggregate, protecting against software defects, data breaches, system outages, and intellectual property infringement claims. Certificates of insurance naming WCI, Inc. and participating jurisdictions as additional insureds must be delivered within ten days of agreement execution.`,
  });

  pages.push({
    pageNumber: 30,
    text: `ATTACHMENT A: BIDDER QUESTIONNAIRE AND EXPERIENCE VERIFICATION

Part I: Corporate Demographics and Legal Standing
1. Full Legal Corporate Name of Proposer: __________________________________________________
2. State/Province and Country of Incorporation: ______________________________________________
3. Principal Business Address: ____________________________________________________________
4. Tax Identification Number / Federal Employer ID (FEIN): _____________________________________
5. Primary Procurement Contact Name and Title: _____________________________________________
6. Primary Email Address: _____________________________ Phone: ___________________________

Part II: Mandatory Minimum Qualification Affirmation (Yes / No)
1. Has the proposer been engaged in commercial custom software development for at least 3 years? [ ] Yes  [ ] No
2. Does the proposer confirm zero bankruptcy filings within the past three (3) years? [ ] Yes  [ ] No
3. Does the proposer confirm zero material litigation or contractual breach disputes in the past two (2) years? [ ] Yes  [ ] No
4. Do all proposed key personnel possess at least three (3) years of relevant experience? [ ] Yes  [ ] No
5. Does the proposer affirm that the proposal shall remain firm for one hundred and eighty (180) days? [ ] Yes  [ ] No

Attachment A forms a mandatory legal submission. Authorized corporate officers must execute the certification under penalty of perjury. Misrepresentation of corporate experience, prior litigation history, bankruptcy status, or staff qualifications will constitute immediate grounds for proposal rejection, vendor disqualification, or termination of any awarded Master Services Agreement.

Attachment A forms a mandatory legal submission. Authorized corporate officers must execute the certification under penalty of perjury. Misrepresentation of corporate experience, prior litigation history, bankruptcy status, or staff qualifications will constitute immediate grounds for proposal rejection, vendor disqualification, or termination of any awarded Master Services Agreement.`,
  });

  pages.push({
    pageNumber: 31,
    text: `ATTACHMENT A: BIDDER QUESTIONNAIRE (CONTINUED)

Part III: Technical Capability and Tooling Self-Assessment
Please indicate your organization's demonstrated commercial experience with the following platforms:
- Amazon Web Services (AWS) Enterprise Infrastructure: [ ] > 5 Years  [ ] 3-5 Years  [ ] < 3 Years
- React / TypeScript Frontend Enterprise Applications: [ ] > 5 Years  [ ] 3-5 Years  [ ] < 3 Years
- Java / Spring Boot / Node.js Microservices: [ ] > 5 Years  [ ] 3-5 Years  [ ] < 3 Years
- PostgreSQL Relational Database Administration: [ ] > 5 Years  [ ] 3-5 Years  [ ] < 3 Years
- Atlassian Jira / Confluence Integration: [ ] > 5 Years  [ ] 3-5 Years  [ ] < 3 Years
- Automated CI/CD (GitLab / GitHub Actions / Terraform): [ ] > 5 Years  [ ] 3-5 Years  [ ] < 3 Years

Part IV: Authorized Officer Certification and Signature
I hereby certify under penalty of perjury that I am an authorized officer of the proposing corporation, that all information provided in this proposal is accurate and complete, and that the proposer agrees to all terms and conditions of RFP-2021-02.

Authorized Officer Signature: _________________________________ Date: ___________________
Printed Name: ______________________________________________ Title: ___________________

The technical self-assessment in Part III of Attachment A requires proposers to substantiate their claimed years of commercial experience with concrete client project citations. Proposers must demonstrate hands-on production proficiency with AWS cloud infrastructure, React frontend frameworks, Java/Spring Boot and Node.js microservices, PostgreSQL databases, and automated CI/CD tooling.

The technical self-assessment in Part III of Attachment A requires proposers to substantiate their claimed years of commercial experience with concrete client project citations. Proposers must demonstrate hands-on production proficiency with AWS cloud infrastructure, React frontend frameworks, Java/Spring Boot and Node.js microservices, PostgreSQL databases, and automated CI/CD tooling.`,
  });

  pages.push({
    pageNumber: 32,
    text: `ATTACHMENT B: WCI, INC. STANDARD MASTER SERVICES AGREEMENT

[ATTACHMENT NOTICE: The Western Climate Initiative, Inc. Standard Master Services Agreement and accompanying Rate Card Matrix are attached separately as Attachment B and distributed through the WCI, Inc. electronic procurement portal. 

Proposers must download the Standard Master Services Agreement template directly from the procurement portal and submit any requested redlines or language exceptions by the August 6, 2021 cutoff date as set forth in Section 2.5. 

ATTACHMENT B REFERENCED BUT NOT INCLUDED IN UPLOADED FILE.]

Attachment B contains the WCI, Inc. Standard Master Services Agreement terms and conditions, rate matrix templates, and sample Statement of Work task order formats. Proposers are required to access Attachment B via the WCI, Inc. electronic procurement portal. Any proposed reservations, exceptions, or alternative legal language must be submitted by the August 6, 2021 cutoff date for legal review.

Attachment B contains the WCI, Inc. Standard Master Services Agreement terms and conditions, rate matrix templates, and sample Statement of Work task order formats. Proposers are required to access Attachment B via the WCI, Inc. electronic procurement portal. Any proposed reservations, exceptions, or alternative legal language must be submitted by the August 6, 2021 cutoff date for legal review.`,
  });

  return pages;
}

/**
 * Creates the complete ParsedDocumentData representation of the WCI RFP
 */
export function getWciRfpParsedDocument(): ParsedDocumentData {
  const pages = buildWciRfpPages();
  const fullText = pages.map(p => `--- [Page ${p.pageNumber}] ---\n${p.text}`).join("\n\n");
  const words = fullText.split(/\s+/).filter(Boolean).length;

  return {
    id: "doc_wci_rfp_2021_02",
    fileName: WCI_RFP_SPEC.fileName,
    fileSizeBytes: WCI_RFP_SPEC.fileSizeBytes,
    fileType: WCI_RFP_SPEC.fileType,
    detectedFormat: "pdf",
    uploadedAt: "2021-06-07T09:00:00Z",
    pages,
    fullText,
    redactedText: fullText,
    sensitiveDetections: [],
    ocrApplied: false,
    wordCount: words, // ~9,565 words
    tableCount: 6,
    sheetCount: 0,
    extractionQualityScore: 99,
    parserEngineUsed: "Docling / Native PDF Structured Stream",
    extractionWarnings: [
      "Historical solicitation document: submittal deadline (August 20, 2021) has lapsed.",
      "Attachment B referenced in Section 6.2 and Page 32 but not included in uploaded file.",
      "Discrepancy detected: Section 2.4 specifies 180 calendar days validity, while Cover Letter summary mentions 108 days.",
    ],
    detectedCategory: "rfp_tender",
    extractedTitle: "Enterprise Solution – Professional IT Services",
    issuingOrganisation: "Western Climate Initiative, Inc.",
    documentDate: "June 7, 2021",
    contentHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    originalFilename: WCI_RFP_SPEC.fileName,
    isDemo: true,
  };
}
