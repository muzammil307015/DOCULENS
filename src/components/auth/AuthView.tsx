/**
 * DOCULENS Authentication View (Sign In & Sign Up)
 * Supports Email/Password registration, Email/Password login, Google Sign-In,
 * real-time input validation, password security meter, and Firestore user profile initialization.
 */

import React, { useState } from "react";
import {
  auth,
  googleProvider,
  db,
} from "../../config/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { storage } from "../../services/storageAdapter";
import {
  ShieldCheck,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  KeyRound,
  Building2,
} from "lucide-react";

interface AuthViewProps {
  initialMode?: "signin" | "signup";
  onSuccess?: () => void;
  onContinueAsGuest?: () => void;
  isModal?: boolean;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode = "signin",
  onSuccess,
  onContinueAsGuest,
  isModal = false,
}) => {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [organization, setOrganization] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: "Empty", color: "bg-slate-700" };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
    if (score <= 3) return { score: 2, label: "Moderate", color: "bg-amber-400" };
    return { score: 3, label: "Strong", color: "bg-emerald-400" };
  };

  const strength = getPasswordStrength(password);

  const formatFirebaseError = (err: any): string => {
    const code = err?.code || "";
    switch (code) {
      case "auth/email-already-in-use":
        return "An account with this email address already exists. Please sign in instead.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/operation-not-allowed":
        return "Email/Password sign-in is not enabled. Please use Google Sign-In or contact support.";
      case "auth/weak-password":
        return "Password is too weak. Please use at least 6 characters with mixed letters and numbers.";
      case "auth/user-disabled":
        return "This user account has been disabled. Please contact administrator.";
      case "auth/user-not-found":
        return "No account found with this email. Please check your spelling or create an account.";
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Invalid email or password. Please verify your credentials.";
      case "auth/too-many-requests":
        return "Too many unsuccessful attempts. Access temporarily disabled. Please reset password or try again later.";
      case "auth/popup-closed-by-user":
        return "Google sign-in popup was closed before completing authentication.";
      case "auth/cancelled-popup-request":
        return "Google sign-in was cancelled.";
      case "auth/popup-blocked":
        return "Popup was blocked by your browser. Please allow popups for this site.";
      case "auth/network-request-failed":
        return "Network connection error. Please verify your internet connection and try again.";
      default:
        return err?.message || "An unexpected error occurred during authentication.";
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg("Email address is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setErrorMsg("Password is required.");
      return;
    }

    if (mode === "signup") {
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match.");
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === "signup") {
        // Register new account
        const userCred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        const user = userCred.user;

        const effectiveName = displayName.trim() || trimmedEmail.split("@")[0];
        try {
          await updateProfile(user, { displayName: effectiveName });
        } catch {
          // ignore profile update warning
        }

        // Initialize user document in Cloud Firestore
        try {
          await setDoc(
            doc(db, "users", user.uid),
            {
              userId: user.uid,
              email: trimmedEmail,
              displayName: effectiveName,
              organization: organization.trim(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (dbErr) {
          console.warn("User profile document creation notice:", dbErr);
        }

        // Migrate any guest analyses or documents
        await storage.migrateGuestDataToUser(user.uid);

        setSuccessMsg("Account created successfully! Redirecting to dashboard...");
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 600);
      } else {
        // Sign In
        const userCred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
        const user = userCred.user;

        // Migrate guest items if any
        await storage.migrateGuestDataToUser(user.uid);

        setSuccessMsg("Authenticated successfully! Loading your private workspace...");
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 500);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setErrorMsg(formatFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsGoogleLoading(true);

    try {
      const userCred = await signInWithPopup(auth, googleProvider);
      const user = userCred.user;

      // Ensure profile document exists in Firestore
      try {
        await setDoc(
          doc(db, "users", user.uid),
          {
            userId: user.uid,
            email: user.email || "",
            displayName: user.displayName || user.email?.split("@")[0] || "User",
            photoURL: user.photoURL || "",
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (dbErr) {
        console.warn("Google user profile save notice:", dbErr);
      }

      // Migrate guest documents into user's private cloud collection
      await storage.migrateGuestDataToUser(user.uid);

      setSuccessMsg("Signed in with Google! Loading your private workspace...");
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 500);
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      setErrorMsg(formatFirebaseError(err));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrorMsg("Please enter your email address to receive a password reset link.");
      return;
    }
    setErrorMsg(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
      setSuccessMsg("Password reset email sent. Please check your inbox.");
    } catch (err: any) {
      setErrorMsg(formatFirebaseError(err));
    }
  };

  const containerClasses = isModal
    ? "w-full"
    : "max-w-md w-full mx-auto my-8 p-8 rounded-2xl bg-[#0B0D12] border border-[rgba(226,232,240,0.12)] shadow-2xl space-y-6";

  return (
    <div className={containerClasses}>
      {/* Brand & Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#1E222D] to-[#0D0F14] border border-[#E5C158]/40 shadow-lg text-[#E5C158] font-mono font-black text-lg">
          DL
        </div>
        <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-white tracking-tight">
          {mode === "signin" ? "Sign In to DOCULENS" : "Create Your Account"}
        </h2>
        <p className="text-xs text-slate-400">
          {mode === "signin"
            ? "Access your private documents, saved analyses, and AI chat sessions"
            : "Get started with private, cloud-persisted document intelligence"}
        </p>
      </div>

      {/* Tabs: Sign In vs Sign Up */}
      <div className="grid grid-cols-2 p-1 rounded-xl bg-[#141822] border border-[#1E2838]">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          className={`py-2 text-xs font-bold rounded-lg transition-all ${
            mode === "signin"
              ? "bg-[#E5C158] text-[#060608] shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          className={`py-2 text-xs font-bold rounded-lg transition-all ${
            mode === "signup"
              ? "bg-[#E5C158] text-[#060608] shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Create Account
        </button>
      </div>

      {/* Feedback Messages */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/60 flex items-start gap-2.5 text-xs text-red-200">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-start gap-2.5 text-xs text-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{successMsg}</span>
        </div>
      )}

      {/* Google Sign In Button */}
      <button
        type="button"
        disabled={isGoogleLoading || isLoading}
        onClick={handleGoogleSignIn}
        className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-900 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer"
      >
        {isGoogleLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            Connecting to Google...
          </span>
        ) : (
          <>
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </>
        )}
      </button>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#1E2838]" />
        </div>
        <span className="relative bg-[#0B0D12] px-3 text-[11px] font-mono uppercase text-slate-500">
          Or with Email & Password
        </span>
      </div>

      {/* Email / Password Form */}
      <form onSubmit={handleEmailAuth} className="space-y-4">
        {mode === "signup" && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name / Display Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#12151E] border border-[#252A38] text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-[#E5C158]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Organization / Company (Optional)
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={organization}
                  onChange={e => setOrganization(e.target.value)}
                  placeholder="e.g. Acme Aerospace Corp"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#12151E] border border-[#252A38] text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-[#E5C158]"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#12151E] border border-[#252A38] text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-[#E5C158]"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Password
            </label>
            {mode === "signin" && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-[11px] text-[#E5C158] hover:underline"
              >
                Forgot password?
              </button>
            )}
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "At least 6 characters" : "Your account password"}
              className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#12151E] border border-[#252A38] text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-[#E5C158]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Password Strength Meter for Signup */}
          {mode === "signup" && password && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Security strength:</span>
                <span
                  className={
                    strength.score === 3
                      ? "text-emerald-400"
                      : strength.score === 2
                      ? "text-amber-400"
                      : "text-red-400"
                  }
                >
                  {strength.label}
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#1A1F2C] rounded-full overflow-hidden flex gap-1">
                <div
                  className={`h-full flex-1 rounded-full transition-all ${
                    strength.score >= 1 ? strength.color : "bg-transparent"
                  }`}
                />
                <div
                  className={`h-full flex-1 rounded-full transition-all ${
                    strength.score >= 2 ? strength.color : "bg-transparent"
                  }`}
                />
                <div
                  className={`h-full flex-1 rounded-full transition-all ${
                    strength.score >= 3 ? strength.color : "bg-transparent"
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        {mode === "signup" && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#12151E] border text-white text-xs placeholder:text-slate-600 focus:outline-none ${
                  confirmPassword && confirmPassword !== password
                    ? "border-red-500 focus:border-red-500"
                    : "border-[#252A38] focus:border-[#E5C158]"
                }`}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="btn-gold-imperial w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-[#060608] border-t-transparent rounded-full animate-spin" />
              {mode === "signin" ? "Signing In..." : "Creating Account..."}
            </span>
          ) : (
            <>
              <span>{mode === "signin" ? "Sign In to Workspace" : "Register Private Account"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Security & Data Isolation Notice */}
      <div className="p-3.5 rounded-xl bg-[#0E1119] border border-[#1A202E] flex items-start gap-2.5 text-[11px] text-slate-400">
        <ShieldCheck className="h-4 w-4 text-[#E5C158] shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          Your account is protected by Firebase Auth and zero-trust Firestore ABAC rules. Documents, evidence, and chat history are restricted exclusively to your UID (<code className="text-[#E5C158] font-mono">user_id === currentUser.uid</code>).
        </span>
      </div>

      {/* Continue as Guest option */}
      {onContinueAsGuest && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onContinueAsGuest}
            className="text-xs text-slate-500 hover:text-slate-300 font-mono transition-colors"
          >
            ← Or continue as Guest (temporary in-browser session)
          </button>
        </div>
      )}
    </div>
  );
};
