"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Cpu,
  Layers,
  Shield,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AuthPage() {
  const router = useRouter();
  const { login, signup, user } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (isSignUp) {
      if (!email.trim() || !password) {
        setError("Please enter your email and password.");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        setLoading(false);
        return;
      }

      const res = await signup(email, password, name);
      if (!res.success) {
        setError(res.error || "Failed to create account.");
        setLoading(false);
      } else {
        setSuccessMsg("Account created! Redirecting to dashboard...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 500);
      }
    } else {
      if (!email.trim() || !password) {
        setError("Please enter your email and password.");
        setLoading(false);
        return;
      }

      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || "Invalid email or password.");
        setLoading(false);
      } else {
        setSuccessMsg("Signed in! Redirecting to dashboard...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 500);
      }
    }
  };

  const handleDemoFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-[#08090e] bg-grid-pattern text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none bg-radial-gradient"></div>

      <div className="max-w-4xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 rounded-2xl bg-[#0e111a] border border-slate-800 shadow-2xl overflow-hidden relative z-10">
        {/* Left Form Area */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="flex items-center justify-between mb-8">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="font-semibold text-lg text-white">WavePipe</span>
              </Link>
              <Link
                href="/"
                className="text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
              >
                ← Back to Home
              </Link>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {isSignUp ? "Create your developer account" : "Welcome back to Wavepipe"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                {isSignUp
                  ? "Get started with 5 free audio pipeline processing credits."
                  : "Access your audio transcription jobs and pipeline analytics."}
              </p>
            </div>

            {/* Auth Mode Toggle Tabs */}
            <div className="flex p-1 bg-slate-900/80 rounded-lg border border-slate-800 my-6">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                  !isSignUp
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                  isSignUp
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Status alerts */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Full Name <span className="text-slate-500 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Rivers"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@wavepipe.dev"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono text-slate-300">Password</label>
                  {isSignUp && (
                    <span className="text-[11px] text-slate-500 font-mono">Min 6 characters</span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isSignUp ? "Creating account..." : "Authenticating..."}</span>
                  </>
                ) : (
                  <>
                    <span>{isSignUp ? "Create Wavepipe Account" : "Sign In to Dashboard"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-500">
            <span>By continuing, you agree to Wavepipe's Terms and Privacy Policy.</span>
          </div>
        </div>

        {/* Right Feature Showcase Panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 p-8 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" /> Pipeline Capabilities
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight">
              Enterprise-grade audio transcription & intelligence
            </h3>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mt-0.5">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Local-First Whisper Acceleration</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Execute Whisper large-v3 turbo locally or across cloud worker pools with C++ optimizations.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mt-0.5">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Multi-Stage Chaining</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Automatically pipe transcripts through summarization, speaker diarization, and keyword extraction.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mt-0.5">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Postgres & Role-Based Auth</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Secure password hashing with bcrypt, JWT sessions, and isolated job datasets.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 mt-6 text-xs font-mono text-slate-400">
            <span className="text-slate-500">// Quick test credentials</span>
            <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-800/80">
              <span className="text-slate-300">test@wavepipe.dev</span>
              <button
                type="button"
                onClick={() => handleDemoFill("test@wavepipe.dev", "password123")}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
              >
                Auto-fill
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
