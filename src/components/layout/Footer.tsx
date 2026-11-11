/**
 * DOCULENS Global Footer
 */

import React from "react";
import { ShieldCheck, Scale, Cpu, Lock, Terminal } from "lucide-react";
import { APP_CONFIG } from "../../config/appConfig";

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-[#252A38] bg-[#060608] text-slate-400 py-12 px-4 sm:px-6 lg:px-8 mt-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#1A2332]">
          {/* Col 1: Brand & Promise */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-[#17202E] border border-[#2B3B52]">
                <span className="font-mono text-xs font-bold text-[#E5C158]">DL</span>
              </div>
              <span className="font-['Space_Grotesk'] text-base font-bold text-white tracking-tight">
                {APP_CONFIG.name}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {APP_CONFIG.subhead}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <span>Deterministic Core</span>
              <span>·</span>
              <span>100% Client-Side Privacy</span>
            </div>
          </div>

          {/* Col 2: Solutions */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Capabilities</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate("analyze")} className="hover:text-white transition-colors">
                  RFP & Tender Scrutiny
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("analyze")} className="hover:text-white transition-colors">
                  Scholarship & Admissions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("analyze")} className="hover:text-white transition-colors">
                  Job Match & CV Alignment
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("analyze")} className="hover:text-white transition-colors">
                  Contract Clause Intelligence
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("analyze")} className="hover:text-white transition-colors">
                  Spreadsheet Data Profiling
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Architecture & Security */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Trust & Security</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate("privacy_center")} className="hover:text-white transition-colors">
                  Privacy-First Pipeline
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("privacy_center")} className="hover:text-white transition-colors">
                  Deterministic vs AI Matrix
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("settings_ai")} className="hover:text-white transition-colors">
                  BYOK Encrypted Vault
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate("privacy_center")} className="hover:text-white transition-colors">
                  Redaction Policy Audit
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Disclaimer */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Disclaimer</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              DOCULENS is an analytical verification tool. Automated requirement checks, readiness scores, and risk flags do not constitute legal counsel, statutory certification, or a guarantee of tender or scholarship award. Always cross-verify critical deadlines with official gazettes.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 {APP_CONFIG.name}. Built with privacy and deterministic precision.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Zero Plaintext Stored</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Cpu className="h-3.5 w-3.5 text-[#E5C158]" />
              <span>Offline Core Active</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
