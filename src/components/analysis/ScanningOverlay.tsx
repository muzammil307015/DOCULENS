/**
 * DOCULENS Cinematic Scanning Overlay
 * Features a laser scanning beam traveling down the document viewport,
 * progressive token emergence, and real-time redaction animations.
 */

import React, { useEffect, useState } from "react";
import { Shield, Sparkles, Check, FileText } from "lucide-react";

interface ScanningOverlayProps {
  fileName: string;
  stage: string;
  progress: number;
}

export const ScanningOverlay: React.FC<ScanningOverlayProps> = ({
  fileName,
  stage,
  progress,
}) => {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPulse(p => (p + 1) % 4);
    }, 400);
    return () => clearInterval(timer);
  }, []);

  const scanningStages = [
    { threshold: 15, label: "Parsing structure & page boundaries" },
    { threshold: 40, label: "Deterministic sensitive entity scanning" },
    { threshold: 65, label: "Enforcing default redaction visibility policy" },
    { threshold: 85, label: "Extracting requirements & calculating deadlines" },
    { threshold: 100, label: "Synthesizing executive summary & action plan" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060608]/95 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-2xl bg-[#0D121B] border border-[#2B3142] p-8 shadow-2xl relative overflow-hidden">
        {/* Scanning Beam Animation */}
        <div
          className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E5C158] to-transparent shadow-[0_0_15px_#E5C158] pointer-events-none transition-all duration-700 ease-in-out"
          style={{ top: `${(progress % 100)}%` }}
        />

        <div className="text-center space-y-4">
          {/* Radar Ring Visual */}
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#131B26] border border-[#233348]">
            <div className="absolute inset-0 rounded-full border border-[#E5C158]/20 animate-ping" />
            <FileText className="h-8 w-8 text-[#E5C158]" />
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#E5C158]">
              ANALYSIS IN PROGRESS
            </span>
            <h3 className="font-['Space_Grotesk'] text-xl font-bold text-white mt-0.5 truncate px-4">
              {fileName}
            </h3>
          </div>

          {/* Current Stage */}
          <p className="text-xs text-slate-300 font-mono flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E5C158]" />
            {stage}
          </p>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#182230]">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-[#E5C158] to-teal-400 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-slate-500">
              <span>Deterministic Core</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
          </div>

          {/* Stepper Status */}
          <div className="pt-4 border-t border-[#1C2636] text-left space-y-2">
            {scanningStages.map((s, idx) => {
              const isDone = progress >= s.threshold;
              const isCurrent = progress < s.threshold && (idx === 0 || progress >= scanningStages[idx - 1].threshold);

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2.5 text-xs transition-colors ${
                    isDone
                      ? "text-emerald-400"
                      : isCurrent
                      ? "text-[#E5C158] font-medium"
                      : "text-slate-600"
                  }`}
                >
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current text-[10px]">
                    {isDone ? <Check className="h-2.5 w-2.5" /> : idx + 1}
                  </div>
                  <span className="truncate">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
