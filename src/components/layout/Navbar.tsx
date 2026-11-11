/**
 * DOCULENS Navigation Bar
 *
 * Implements the clean 6-item primary navigation:
 * 1. Overview (welcome banner, prominent upload dropzone, recent documents, upcoming deadlines, quick actions)
 * 2. New Analysis (clean upload workflow with category shortcuts)
 * 3. My Documents (dedicated document and reports repository)
 * 4. Compare (multi-document comparison)
 * 5. Profile (evidence vault, credentials, and fact management)
 * 6. Settings (AI provider, BYOK vault with connection test button, and privacy controls)
 * Plus persistent Firebase Authentication state and functional Sign Out.
 */

import React, { useState, useEffect } from "react";
import {
  Compass,
  FilePlus2,
  FolderOpen,
  Layers,
  UserCheck,
  Settings,
  Sparkles,
  Lock,
  Unlock,
  Clock,
  LogOut,
  User as UserIcon,
  Cloud,
} from "lucide-react";
import { APP_CONFIG } from "../../config/appConfig";
import { isVaultUnlocked, subscribeToVaultLock } from "../../services/byokVault";
import { storage } from "../../services/storageAdapter";
import { auth } from "../../config/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenVaultModal: () => void;
  onOpenAuthModal: () => void;
  isAiConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenVaultModal,
  onOpenAuthModal,
  isAiConnected = false,
}) => {
  const [vaultUnlocked, setVaultUnlocked] = useState(isVaultUnlocked());
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const hoursRemaining = storage.getExpiryRemainingHours();

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
    });

    const unsubVault = subscribeToVaultLock(() => {
      setVaultUnlocked(false);
    });

    return () => {
      unsubAuth();
      unsubVault();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      storage.clearLocalGuestState();
      onNavigate("landing");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const navLinks = [
    { id: "landing", label: "Home", icon: Sparkles },
    { id: "overview", label: "Overview", icon: Compass },
    { id: "new_analysis", label: "New Analysis", icon: FilePlus2, highlight: true },
    { id: "my_documents", label: "My Documents", icon: FolderOpen },
    { id: "compare", label: "Compare", icon: Layers },
    { id: "profile", label: "Profile", icon: UserCheck },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[rgba(226,232,240,0.12)] bg-[#060608]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigate("landing")}
            className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all shadow-sm"
              style={{
                background: "linear-gradient(135deg, #1E222D 0%, #0D0F14 100%)",
                borderColor: "rgba(229, 193, 88, 0.48)",
                boxShadow: "0 0 18px rgba(229, 193, 88, 0.15)",
              }}
            >
              <span className="font-mono text-base font-black text-[#E5C158] tracking-tighter">DL</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Space_Grotesk'] text-lg font-bold tracking-tight text-[#F5F6F8] group-hover:text-[#E5C158] transition-colors">
                  {APP_CONFIG.name}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#E5C158] border border-[#E5C158]/35 bg-[#E5C158]/10 px-1.5 py-0.2 rounded">
                  v{APP_CONFIG.version}
                </span>
              </div>
              <p className="text-[10px] text-[#94A3B8] hidden sm:block -mt-0.5">Gold & Platinum Intelligence</p>
            </div>
          </button>

          {/* Primary Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 pl-4 border-l border-[rgba(226,232,240,0.12)]">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive =
                currentView === link.id ||
                (link.id === "overview" && currentView === "dashboard") ||
                (link.id === "new_analysis" && currentView === "analyze") ||
                (link.id === "profile" && currentView === "vault") ||
                (link.id === "settings" && (currentView === "settings_ai" || currentView === "privacy_center"));

              return (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    link.highlight
                      ? "bg-[#E5C158]/15 text-[#E5C158] border border-[#E5C158]/45 hover:bg-[#E5C158]/25 shadow-sm"
                      : isActive
                      ? "text-[#F5F6F8] bg-[#161A25] border border-[rgba(229,193,88,0.35)]"
                      : "text-[#94A3B8] hover:text-[#F5F6F8] hover:bg-[#12151E]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Status Actions */}
        <div className="flex items-center gap-2.5">
          {/* Cloud Sync or Guest Mode Badge */}
          {currentUser ? (
            <div
              title={`Authenticated as ${currentUser.email}. Documents saved to private Firestore account.`}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-600/30 text-[11px] text-emerald-300 font-mono"
            >
              <Cloud className="h-3 w-3 text-emerald-400" />
              <span>Cloud Synced</span>
            </div>
          ) : (
            <div
              title={`Guest mode: session data stored locally. Auto-expires in ${hoursRemaining} hours.`}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0E1017] border border-[rgba(226,232,240,0.14)] text-[11px] text-[#CBD5E1] font-mono"
            >
              <Clock className="h-3 w-3 text-[#E5C158]" />
              <span>Guest ({hoursRemaining}h left)</span>
            </div>
          )}

          {/* AI Status Button */}
          <button
            onClick={() => onNavigate("settings")}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0E1017] hover:bg-[#161A25] border border-[rgba(226,232,240,0.14)] text-[11px] text-[#CBD5E1] transition-colors cursor-pointer"
            title="Configure OpenRouter / Gemini AI models or test connection"
          >
            <Sparkles className="h-3 w-3 text-[#E5C158]" />
            <span className="hidden sm:inline">AI Layer</span>
            {isAiConnected ? (
              <span className="h-2 w-2 rounded-full bg-emerald-400" title="Connected" />
            ) : (
              <span className="text-[10px] text-[#94A3B8] font-mono">Offline OK</span>
            )}
          </button>

          {/* BYOK Encrypted Vault Lock Trigger */}
          <button
            onClick={onOpenVaultModal}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition-colors cursor-pointer ${
              vaultUnlocked
                ? "bg-emerald-950/40 border-emerald-600/40 text-emerald-400 hover:bg-emerald-900/40"
                : "bg-[#0E1017] border-[rgba(226,232,240,0.14)] text-[#CBD5E1] hover:bg-[#161A25]"
            }`}
            title="Encrypted BYOK Key Vault"
          >
            {vaultUnlocked ? <Unlock className="h-3 w-3 text-emerald-400" /> : <Lock className="h-3 w-3 text-[#E5C158]" />}
            <span className="hidden sm:inline font-mono">Vault</span>
          </button>

          {/* Authentication State & Actions */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-1">
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#141822] hover:bg-[#1C2230] border border-[#2B3142] text-xs text-white transition-all cursor-pointer"
                title={`Account: ${currentUser.email}`}
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || "User"}
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-[#E5C158]/20 text-[#E5C158] flex items-center justify-center font-bold text-[10px]">
                    {(currentUser.displayName || currentUser.email || "U")[0].toUpperCase()}
                  </div>
                )}
                <span className="max-w-[100px] truncate hidden sm:inline text-[11px] font-semibold">
                  {currentUser.displayName || currentUser.email?.split("@")[0]}
                </span>
              </button>

              {/* Functional Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-lg bg-[#141822] hover:bg-red-950/60 border border-[#2B3142] hover:border-red-800/60 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
                title="Sign out of account"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-1">
              <button
                onClick={onOpenAuthModal}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={onOpenAuthModal}
                className="btn-gold-imperial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
