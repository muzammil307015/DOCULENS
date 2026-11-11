/**
 * DOCULENS Privacy & Data Protection Centre
 *
 * Visualizes the exact default visibility policy, original vs redacted separation,
 * and provides data purge and export controls.
 */

import React, { useState } from "react";
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle,
  FileText,
  Server,
  Clock,
} from "lucide-react";
import { APP_CONFIG } from "../../config/appConfig";
import { storage } from "../../services/storageAdapter";

export const PrivacyCenterView: React.FC = () => {
  const [purged, setPurged] = useState(false);
  const hoursLeft = storage.getExpiryRemainingHours();

  const policyRows = [
    { entity: "Company name", defaultState: APP_CONFIG.defaultVisibilityPolicy.companyName, rationale: "Public entity necessary for commercial compliance matching" },
    { entity: "Person's name", defaultState: APP_CONFIG.defaultVisibilityPolicy.personName, rationale: "Authorized signatory / candidate name required for application" },
    { entity: "Email address", defaultState: APP_CONFIG.defaultVisibilityPolicy.emailAddress, rationale: "Communication channel for inquiry and procurement queries" },
    { entity: "Phone number", defaultState: APP_CONFIG.defaultVisibilityPolicy.phoneNumber, rationale: "Personal identifier; redacted by default from AI inputs" },
    { entity: "Personal address", defaultState: APP_CONFIG.defaultVisibilityPolicy.personalAddress, rationale: "Private residential or street address; masked before AI" },
    { entity: "Government ID numbers", defaultState: APP_CONFIG.defaultVisibilityPolicy.governmentId, rationale: "SSN, Aadhaar, PAN, Passport numbers masked by default" },
    { entity: "Bank account details", defaultState: APP_CONFIG.defaultVisibilityPolicy.bankAccount, rationale: "Account numbers & IBAN tokens strictly withheld" },
    { entity: "Payment card details", defaultState: APP_CONFIG.defaultVisibilityPolicy.paymentCard, rationale: "Luhn-verified 13-19 digit card numbers masked" },
    { entity: "Passwords and access tokens", defaultState: APP_CONFIG.defaultVisibilityPolicy.passwordOrToken, rationale: "API keys, bearer tokens, and credentials sanitized" },
  ];

  const handlePurgeGuestData = () => {
    if (confirm("This will permanently clear all local analyses, parsed document caches, and temporary sessions from your browser. Proceed?")) {
      localStorage.clear();
      sessionStorage.clear();
      setPurged(true);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            <h2 className="font-['Space_Grotesk'] text-xl font-bold text-white">
              Privacy-First Architecture & Audit Centre
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Zero-trust document processing. Deterministic redaction runs before any external AI call. Original files remain untouched on client.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-[#141822] border border-[#252A38] px-3 py-1.5 rounded-lg">
          <Clock className="h-3.5 w-3.5 text-amber-400" />
          <span>Guest Retention: {hoursLeft}h Remaining</span>
        </div>
      </div>

      {/* Default Visibility Policy Table */}
      <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-4">
        <div>
          <h3 className="font-['Space_Grotesk'] text-base font-bold text-white">
            Default Visibility & Redaction Policy
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict default policy rules enforced deterministically prior to external model transit.
          </p>
        </div>

        <div className="rounded-xl border border-[#252A38] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#141822] border-b border-[#252A38] text-slate-400 font-mono">
                <th className="p-3">Entity Type</th>
                <th className="p-3">Default Policy State</th>
                <th className="p-3">Data Protection Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2332]">
              {policyRows.map((row, idx) => {
                const isHidden = row.defaultState === "HIDDEN";
                return (
                  <tr key={idx} className="hover:bg-[#111722] transition-colors">
                    <td className="p-3 font-semibold text-white">{row.entity}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded border ${
                          isHidden
                            ? "bg-rose-950/60 border-rose-800/50 text-rose-300"
                            : "bg-emerald-950/60 border-emerald-800/50 text-emerald-300"
                        }`}
                      >
                        {isHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        <span>{row.defaultState}</span>
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{row.rationale}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Architecture Integrity Assurances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#E5C158] font-mono">
            <CheckCircle className="h-4 w-4" />
            <span>Untouched Original</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your original files are held in local client memory and are never transmitted to third-party AI models. Only sanitized text copies are passed.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 font-mono">
            <AlertTriangle className="h-4 w-4" />
            <span>Scan & Image Restriction</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            If reliable redaction cannot be guaranteed on bitmap scans, external AI is strictly restricted rather than pretending it is safe.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400 font-mono">
            <Lock className="h-4 w-4" />
            <span>No Absolute Security Claim</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            No software can defend against a compromised client host device or malicious browser extension. We provide hardened defenses with complete transparency.
          </p>
        </div>
      </div>

      {/* Data Deletion & Session Purge */}
      <div className="p-6 rounded-2xl bg-[#0E1017] border border-[#252A38] space-y-4">
        <div>
          <h3 className="font-['Space_Grotesk'] text-base font-bold text-white">
            Guest Data Management & Instant Purge
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Guest data expires automatically after 24 hours. You can also wipe all caches immediately.
          </p>
        </div>

        {purged ? (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs font-mono">
            All guest data and local document caches have been successfully purged. Reloading...
          </div>
        ) : (
          <button
            onClick={handlePurgeGuestData}
            className="px-4 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800 text-xs font-semibold transition-colors flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Purge All Guest Data & Document Caches Immediately</span>
          </button>
        )}
      </div>
    </div>
  );
};
