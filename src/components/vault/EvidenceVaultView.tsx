/**
 * DOCULENS Evidence Vault & Profile Manager
 *
 * Manages user credentials, certifications, company registration, and uploaded evidence documents.
 * Feeds facts into the Have-vs-Missing comparison engine.
 */

import React, { useState } from "react";
import {
  Archive,
  User,
  Building,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Plus,
  Shield,
  Edit2,
  Save,
  Check,
} from "lucide-react";
import { EvidenceDocument, ExtractedFact, ProfileType, UserProfile } from "../../types";
import { SAMPLE_PROFILES } from "../../services/demoData";

interface EvidenceVaultViewProps {
  profile: UserProfile | null;
  onSaveProfile: (profile: UserProfile) => void;
  evidenceDocs: EvidenceDocument[];
  onAddEvidenceDoc: (doc: EvidenceDocument) => void;
  onDeleteEvidenceDoc: (id: string) => void;
}

export const EvidenceVaultView: React.FC<EvidenceVaultViewProps> = ({
  profile,
  onSaveProfile,
  evidenceDocs,
  onAddEvidenceDoc,
  onDeleteEvidenceDoc,
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileType, setProfileType] = useState<ProfileType>(profile?.profileType || "business");
  const [displayName, setDisplayName] = useState(profile?.displayName || "Nexura Solutions Inc.");
  const [fieldOrIndustry, setFieldOrIndustry] = useState(profile?.fieldOrIndustry || "Smart Infrastructure");
  const [turnover, setTurnover] = useState(profile?.annualTurnover || "$4,200,000 USD");
  const [gstNumber, setGstNumber] = useState(profile?.gstNumber || "07AABCN8921M1Z4");
  const [registrationNo, setRegistrationNo] = useState(profile?.companyRegistrationNumber || "U72200DL2018PTC329182");
  const [panNumber, setPanNumber] = useState(profile?.panNumber || "AABCN8921M");
  const [qualificationsText, setQualificationsText] = useState(
    profile?.qualifications.join(", ") || "ISO 9001:2015, Class-1 Contractor"
  );
  const [skillsText, setSkillsText] = useState(
    profile?.skills.join(", ") || "IoT Telemetry, SCADA Automation, Public Procurement"
  );

  const handleSaveProfile = () => {
    const updated: UserProfile = {
      id: profile?.id || `prof_${Date.now()}`,
      profileType,
      displayName,
      fieldOrIndustry,
      annualTurnover: turnover,
      gstNumber,
      companyRegistrationNumber: registrationNo,
      panNumber,
      qualifications: qualificationsText.split(",").map(s => s.trim()).filter(Boolean),
      skills: skillsText.split(",").map(s => s.trim()).filter(Boolean),
      certifications: ["ISO 9001:2015", "Cybersecurity Baseline"],
      updatedAt: new Date().toISOString(),
    };
    onSaveProfile(updated);
    setIsEditingProfile(false);
  };

  const loadSampleProfile = (key: string) => {
    const sample = SAMPLE_PROFILES[key];
    if (sample) {
      setProfileType(sample.profileType);
      setDisplayName(sample.displayName);
      setFieldOrIndustry(sample.fieldOrIndustry || "");
      setTurnover(sample.annualTurnover || "");
      setGstNumber(sample.gstNumber || "");
      setRegistrationNo(sample.companyRegistrationNumber || "");
      setPanNumber(sample.panNumber || "");
      setQualificationsText(sample.qualifications.join(", "));
      setSkillsText(sample.skills.join(", "));
      onSaveProfile(sample);
      setIsEditingProfile(false);
    }
  };

  const handleAddSampleEvidenceFile = (type: string) => {
    const newDoc: EvidenceDocument = {
      id: `ev_${Date.now()}`,
      fileName:
        type === "gst"
          ? "GST_Registration_Certificate_2026.pdf"
          : type === "balance"
          ? "Audited_Balance_Sheet_3Years_FY24_26.pdf"
          : type === "iso"
          ? "ISO_9001_Quality_Certificate.pdf"
          : "Professional_Resume_CV_Elena_Rostova.pdf",
      fileType: "application/pdf",
      fileSize: 1024 * 450,
      uploadedAt: new Date().toISOString(),
      category: type.toUpperCase(),
      verificationStatus: "user_confirmed",
      facts: [
        {
          id: `fact_${Date.now()}`,
          field: type === "gst" ? "GST Identification Number" : "Financial Audit",
          value: type === "gst" ? gstNumber : turnover,
          sourceDocumentName: "Uploaded Evidence File",
          sourceLocation: { page: 1, snippet: "Certified statutory document copy" },
          extractionDate: new Date().toISOString(),
          confidence: 0.98,
          verificationStatus: "user_confirmed",
          category: type,
        },
      ],
    };
    onAddEvidenceDoc(newDoc);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-sky-400" />
            <h2 className="font-['Space_Grotesk'] text-xl font-bold text-white">
              Evidence Vault & User Profile
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Store your verified qualifications, certificates, marksheets, and statutory filings for automated Have-vs-Missing requirement matching.
          </p>
        </div>

        {/* Load Preset Profiles */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500">Quick Presets:</span>
          <button
            onClick={() => loadSampleProfile("enterprise_vendor")}
            className="px-2.5 py-1 rounded bg-[#1A1E2B] text-slate-300 hover:text-white border border-[#2B3B52] text-xs font-mono"
          >
            Business
          </button>
          <button
            onClick={() => loadSampleProfile("student_scholar")}
            className="px-2.5 py-1 rounded bg-[#1A1E2B] text-slate-300 hover:text-white border border-[#2B3B52] text-xs font-mono"
          >
            Student
          </button>
          <button
            onClick={() => loadSampleProfile("ai_engineer")}
            className="px-2.5 py-1 rounded bg-[#1A1E2B] text-slate-300 hover:text-white border border-[#2B3B52] text-xs font-mono"
          >
            Engineer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[#E5C158]" />
              <h3 className="font-['Space_Grotesk'] text-sm font-bold text-white">
                Profile Credentials
              </h3>
            </div>
            <button
              onClick={() => {
                if (isEditingProfile) handleSaveProfile();
                else setIsEditingProfile(true);
              }}
              className="text-xs font-semibold text-[#E5C158] hover:underline flex items-center gap-1"
            >
              {isEditingProfile ? <Save className="h-3.5 w-3.5" /> : <Edit2 className="h-3.5 w-3.5" />}
              <span>{isEditingProfile ? "Save Profile" : "Edit Profile"}</span>
            </button>
          </div>

          {isEditingProfile ? (
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Profile Type</label>
                <select
                  value={profileType}
                  onChange={e => setProfileType(e.target.value as ProfileType)}
                  className="w-full rounded bg-[#161A25] border border-[#2B3142] p-2 text-white text-xs"
                >
                  <option value="business">Business / Corporation</option>
                  <option value="startup">Startup</option>
                  <option value="professional">Professional</option>
                  <option value="freelancer">Freelancer</option>
                  <option value="student">Student / Academic</option>
                  <option value="ngo">NGO / Non-profit</option>
                  <option value="individual">General Individual</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Display / Legal Entity Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full rounded bg-[#161A25] border border-[#2B3142] p-2 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Field / Sector</label>
                <input
                  type="text"
                  value={fieldOrIndustry}
                  onChange={e => setFieldOrIndustry(e.target.value)}
                  className="w-full rounded bg-[#161A25] border border-[#2B3142] p-2 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Annual Turnover (USD/INR)</label>
                <input
                  type="text"
                  value={turnover}
                  onChange={e => setTurnover(e.target.value)}
                  className="w-full rounded bg-[#161A25] border border-[#2B3142] p-2 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">GST Number / Tax ID</label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={e => setGstNumber(e.target.value)}
                  className="w-full rounded bg-[#161A25] border border-[#2B3142] p-2 text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Company Registration / PAN</label>
                <input
                  type="text"
                  value={registrationNo}
                  onChange={e => setRegistrationNo(e.target.value)}
                  className="w-full rounded bg-[#161A25] border border-[#2B3142] p-2 text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Qualifications / Degrees</label>
                <input
                  type="text"
                  value={qualificationsText}
                  onChange={e => setQualificationsText(e.target.value)}
                  className="w-full rounded bg-[#161A25] border border-[#2B3142] p-2 text-white text-xs"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#141822] border border-[#1E2838]">
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Entity Name</span>
                <span className="text-sm font-bold text-white block mt-0.5">{displayName}</span>
                <span className="text-[11px] font-mono text-[#E5C158] capitalize">{profileType} · {fieldOrIndustry}</span>
              </div>

              <dl className="divide-y divide-[#1C2636] text-xs">
                {gstNumber && (
                  <div className="py-2 flex justify-between">
                    <dt className="text-slate-400">GST Registration</dt>
                    <dd className="font-mono text-emerald-400">{gstNumber}</dd>
                  </div>
                )}
                {registrationNo && (
                  <div className="py-2 flex justify-between">
                    <dt className="text-slate-400">Incorporation No</dt>
                    <dd className="font-mono text-slate-200">{registrationNo}</dd>
                  </div>
                )}
                {turnover && (
                  <div className="py-2 flex justify-between">
                    <dt className="text-slate-400">Turnover (Avg)</dt>
                    <dd className="font-mono text-[#E5C158] font-semibold">{turnover}</dd>
                  </div>
                )}
                {panNumber && (
                  <div className="py-2 flex justify-between">
                    <dt className="text-slate-400">PAN ID</dt>
                    <dd className="font-mono text-slate-200">{panNumber}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>

        {/* Right 2 Columns: Evidence Documents Repository */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-['Space_Grotesk'] text-sm font-bold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-sky-400" />
              <span>Evidence Repository ({evidenceDocs.length} Documents)</span>
            </h3>

            {/* Quick Add Evidence Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-500 mr-1">Attach Sample:</span>
              <button
                onClick={() => handleAddSampleEvidenceFile("gst")}
                className="px-2 py-1 rounded bg-[#161A25] hover:bg-[#1A2332] text-slate-300 border border-[#2B3142] text-[11px] font-mono"
              >
                + GST Certificate
              </button>
              <button
                onClick={() => handleAddSampleEvidenceFile("balance")}
                className="px-2 py-1 rounded bg-[#161A25] hover:bg-[#1A2332] text-slate-300 border border-[#2B3142] text-[11px] font-mono"
              >
                + Balance Sheet
              </button>
              <button
                onClick={() => handleAddSampleEvidenceFile("iso")}
                className="px-2 py-1 rounded bg-[#161A25] hover:bg-[#1A2332] text-slate-300 border border-[#2B3142] text-[11px] font-mono"
              >
                + ISO 9001
              </button>
              <button
                onClick={() => handleAddSampleEvidenceFile("cv")}
                className="px-2 py-1 rounded bg-[#161A25] hover:bg-[#1A2332] text-slate-300 border border-[#2B3142] text-[11px] font-mono"
              >
                + Resume CV
              </button>
            </div>
          </div>

          {/* Evidence Documents List */}
          {evidenceDocs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 rounded-2xl bg-[#0E1017] border border-dashed border-[#252A38] space-y-2">
              <Archive className="h-8 w-8 mx-auto text-slate-600" />
              <p className="text-xs">No evidence documents uploaded yet.</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Click one of the "Attach Sample" buttons above to simulate verified files in your vault.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {evidenceDocs.map(doc => (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl bg-[#0E1017] border border-[#252A38] flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-sky-400" />
                      <h4 className="text-xs font-bold text-white font-mono">{doc.fileName}</h4>
                      <span className="text-[10px] font-mono uppercase bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 px-1.5 py-0.2 rounded">
                        {doc.verificationStatus.replace("_", " ")}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono">
                      {doc.facts.map((f, i) => (
                        <span key={i} className="mr-3">
                          {f.field}: <strong className="text-slate-200">{f.value}</strong>
                        </span>
                      ))}
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono block pt-1">
                      Uploaded {new Date(doc.uploadedAt).toLocaleDateString()} · Presence proves record existence, not external third-party validity.
                    </span>
                  </div>

                  <button
                    onClick={() => onDeleteEvidenceDoc(doc.id)}
                    className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                    title="Remove from vault"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
