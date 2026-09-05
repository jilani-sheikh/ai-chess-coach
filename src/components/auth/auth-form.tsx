"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export function AuthForm() {
  const router = Router();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const validation = loginSchema.safeParse({ email, password });
        if (!validation.success) {
          setErrorMsg(validation.error.issues[0].message);
          setLoading(false);
          return;
        }

        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (res?.error) {
          setErrorMsg("Invalid email or password credentials.");
        } else {
          setSuccessMsg("Signed in successfully! Redirecting...");
          setTimeout(() => {
            router.push("/dashboard");
          }, 800);
        }
      } else {
        const validation = registerSchema.safeParse({ name, email, password });
        if (!validation.success) {
          setErrorMsg(validation.error.issues[0].message);
          setLoading(false);
          return;
        }

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          setErrorMsg(data.error || "Failed to create account.");
        } else {
          setSuccessMsg("Account created successfully! Auto-signing in...");
          const signInRes = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });
          if (signInRes?.error) {
            setMode("signin");
          } else {
            setTimeout(() => {
              router.push("/dashboard");
            }, 800);
          }
        }
      }
    } catch {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setOauthLoading(true);
    setErrorMsg(null);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setErrorMsg("Failed to initialize Google Sign In.");
      setOauthLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto glass-card rounded-2xl p-8 border border-[rgba(223,180,108,0.25)] shadow-2xl space-y-6">
      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-2 p-1 bg-[#0b0b0e] rounded-xl border border-zinc-800 text-sm font-medium">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          className={`py-2.5 rounded-lg transition-all ${
            mode === "signin"
              ? "bg-gold-gradient text-[#0b0b0e] font-bold shadow-md"
              : "text-zinc-400 hover:text-white"
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
          className={`py-2.5 rounded-lg transition-all ${
            mode === "signup"
              ? "bg-gold-gradient text-[#0b0b0e] font-bold shadow-md"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Create Account
        </button>
      </div>

      {/* Title */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-serif font-bold text-white">
          {mode === "signin" ? "Welcome Back" : "Start Your AI Coaching"}
        </h2>
        <p className="text-xs text-zinc-400">
          {mode === "signin"
            ? "Enter your credentials to access your chess dashboard"
            : "Create your free account to start analyzing games"}
        </p>
      </div>

      {/* Error & Success Banners */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={oauthLoading || loading}
        className="w-full py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[rgba(223,180,108,0.4)] text-sm font-semibold text-zinc-200 hover:text-white flex items-center justify-center gap-3 transition-all disabled:opacity-50"
      >
        {oauthLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#dfb46c]" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.4 0 15.3c0 2.9.7 5.6 1.9 8l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
            />
          </svg>
        )}
        <span>Continue with Google</span>
      </button>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-zinc-800" />
        <span className="absolute bg-[#13131a] px-3 text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
          or with email
        </span>
      </div>

      {/* Credentials Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Grandmaster Bobby"
              className="w-full bg-[#0b0b0e] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#dfb46c] transition-colors"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="bobby@chess.com"
            className="w-full bg-[#0b0b0e] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#dfb46c] transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0b0b0e] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white pr-10 focus:outline-none focus:border-[#dfb46c] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || oauthLoading}
          className="w-full py-3.5 px-4 rounded-xl bg-gold-gradient hover:opacity-90 text-[#0b0b0e] font-bold text-sm shadow-xl shadow-[rgba(223,180,108,0.25)] flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#0b0b0e]" />
          ) : (
            <span>{mode === "signin" ? "Sign In" : "Create Account"}</span>
          )}
        </button>
      </form>
    </div>
  );
}

// Router helper wrapper
function Router() {
  return useRouter();
}
