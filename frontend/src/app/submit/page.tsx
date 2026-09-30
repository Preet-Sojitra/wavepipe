"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StatusBadge } from "@/components/StatusBadge";
import {
  UploadCloud,
  FileAudio,
  CheckCircle2,
  Cpu,
  Sparkles,
  ArrowRight,
  Sliders,
  Layers,
  Clock,
  Trash2,
  Play,
  RotateCcw,
  Check,
  AlertCircle,
  FileText,
  Volume2,
  Lock,
  LogIn,
  UserCheck,
} from "lucide-react";

interface RecentJobItem {
  id: string;
  fileName: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  time: string;
  duration?: string;
}

export default function SubmitJobPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [realFile, setRealFile] = useState<File | null>(null);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: string;
    duration: string;
  } | null>({
    name: "harvard.wav",
    size: "3.1 MB",
    duration: "00:18",
  });

  const [isDragging, setIsDragging] = useState(false);
  const [model, setModel] = useState("whisper-base.en");
  const [stages, setStages] = useState<{ [key: string]: boolean }>({
    transcribe: true,
    summary: true,
    keywords: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submittedJob, setSubmittedJob] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentJobItem[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const sampleFiles = [
    { name: "harvard.wav", size: "3.1 MB", duration: "00:18" },
    { name: "quarterly_earnings_call.wav", size: "8.4 MB", duration: "05:12" },
    { name: "standup_ai_sync_meeting.mp3", size: "3.1 MB", duration: "02:18" },
  ];

  const fetchRecentJobs = useCallback(async () => {
    try {
      setLoadingRecent(true);
      const res = await fetch("/api/jobs?limit=5");
      if (res.ok) {
        const data = await res.json();
        if (data.jobs && data.jobs.length > 0) {
          const formatted: RecentJobItem[] = data.jobs.map((j: any) => ({
            id: j.id,
            fileName: j.fileName,
            status: j.status,
            time: new Date(j.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            duration: j.duration ? `${Math.floor(j.duration / 60)}:${Math.floor(j.duration % 60).toString().padStart(2, "0")}` : "00:00",
          }));
          setRecentSubmissions(formatted);
          return;
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentJobs();
  }, [fetchRecentJobs]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setRealFile(file);
      setSelectedFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        duration: "03:00",
      });
      setSubmittedJob(null);
      setErrorMessage(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setRealFile(file);
      setSelectedFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        duration: "03:00",
      });
      setSubmittedJob(null);
      setErrorMessage(null);
    }
  };

  const handleSelectSample = (sample: { name: string; size: string; duration: string }) => {
    setRealFile(null);
    setSelectedFile(sample);
    setSubmittedJob(null);
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    if (!user) {
      setErrorMessage("You must be logged in to submit jobs.");
      return;
    }

    if (!selectedFile) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setUploadProgress(15);

    try {
      const selectedStages = Object.entries(stages)
        .filter(([_, active]) => active)
        .map(([key]) => key);

      const formData = new FormData();
      if (realFile) {
        formData.append("file", realFile);
      } else {
        formData.append("fileName", selectedFile.name);
        const approxBytes = Math.round(parseFloat(selectedFile.size) * 1024 * 1024);
        formData.append("fileSize", approxBytes.toString());
      }
      formData.append("model", model);
      formData.append("stages", JSON.stringify(selectedStages));

      setUploadProgress(40);

      const response = await fetch("/api/jobs", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(85);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to submit job");
      }

      setUploadProgress(100);
      setSubmittedJob(data.job);
      fetchRecentJobs();

      // Poll until worker finishes processing
      if (data.job?.id) {
        let attempts = 0;
        const intervalId = setInterval(async () => {
          attempts++;
          try {
            const res = await fetch(`/api/jobs/${data.job.id}`);
            if (res.ok) {
              const resData = await res.json();
              if (resData.job) {
                setSubmittedJob(resData.job);
                if (
                  resData.job.status === "COMPLETED" ||
                  resData.job.status === "FAILED" ||
                  attempts >= 25
                ) {
                  clearInterval(intervalId);
                  fetchRecentJobs();
                }
              }
            }
          } catch {
            clearInterval(intervalId);
          }
        }, 1500);
      }
    } catch (err: any) {
      console.error("Submission failed:", err);
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStage = (key: keyof typeof stages) => {
    setStages((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#08090e] bg-grid-pattern text-slate-100">
      <Navbar />

      <main className="flex-1 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono mb-2">
                <UploadCloud className="w-3.5 h-3.5" /> Stage 1 Ingestion & Asynchronous Redis Queue
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Submit Audio Job
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Upload audio files to queue for background Whisper worker processing.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                <span>View Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Authentication Guard Banner if Not Logged In */}
          {!authLoading && !user && (
            <div className="mb-8 p-6 rounded-2xl bg-amber-950/20 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Authentication Required
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    You must be signed in to submit audio files and process transcription jobs.
                  </p>
                </div>
              </div>
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Upload & Pipeline Config (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Error Banner */}
              {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Submission error:</span> {errorMessage}
                  </div>
                </div>
              )}

              {/* Success Banner if job was just submitted */}
              {submittedJob && (
                <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 animate-in fade-in slide-in-from-top-2 duration-300 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mt-0.5">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          Job Processed Successfully!
                        </h3>
                        <p className="text-xs text-slate-300 mt-1">
                          Job ID: <span className="font-mono text-emerald-300 font-medium">{submittedJob.id}</span>
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-mono">
                          <span>Status: <span className="text-emerald-400 font-semibold">{submittedJob.status}</span></span>
                          {submittedJob.processingMs > 0 && (
                            <span>• Latency: <span className="text-cyan-300">{submittedJob.processingMs}ms</span></span>
                          )}
                          {submittedJob.duration > 0 && (
                            <span>• Audio: <span className="text-slate-300">{submittedJob.duration}s</span></span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href="/dashboard"
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-sm"
                      >
                        Open in Dashboard
                      </Link>
                    </div>
                  </div>

                  {submittedJob.transcript && (
                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 font-mono mt-2">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Whisper Transcription Output:</div>
                      <p className="text-slate-200 leading-relaxed line-clamp-3">
                        {typeof submittedJob.transcript === "string" && submittedJob.transcript.startsWith("[")
                          ? JSON.parse(submittedJob.transcript).map((s: any) => s.text).join(" ")
                          : submittedJob.transcript}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Dropzone */}
              <div className="p-6 rounded-2xl bg-[#0e111a] border border-slate-800 shadow-xl">
                <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <FileAudio className="w-4 h-4 text-indigo-400" />
                  Select or Drag Audio File
                </h2>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${isDragging
                    ? "border-indigo-500 bg-indigo-950/20 scale-[1.01]"
                    : selectedFile
                      ? "border-slate-700 bg-slate-900/40 hover:border-slate-600"
                      : "border-slate-800 bg-slate-950/50 hover:border-indigo-500/50 hover:bg-slate-900/30"
                    }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.flac,.ogg"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-3 shadow-inner">
                    <UploadCloud className="w-6 h-6" />
                  </div>

                  <p className="text-sm font-medium text-slate-200">
                    Drag and drop audio file here, or{" "}
                    <span className="text-indigo-400 underline underline-offset-4">browse files</span>
                  </p>
                  <p className="text-xs text-slate-500 font-mono mt-1.5">
                    Accepted: WAV, MP3, M4A, FLAC, OGG (Max size: 100MB)
                  </p>
                </div>

                {/* Selected File Card */}
                {selectedFile && (
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-300">
                        <Volume2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{selectedFile.name}</div>
                        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{selectedFile.size}</span>
                          {realFile ? (
                            <span className="text-emerald-400 font-mono text-[10px]">Local File Ready</span>
                          ) : (
                            <span className="text-indigo-400 font-mono text-[10px]">Preloaded Disk Sample</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRealFile(null);
                        setSelectedFile(null);
                        setSubmittedJob(null);
                        setErrorMessage(null);
                      }}
                      className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Preset sample audio picker */}
                <div className="mt-5 pt-4 border-t border-slate-800/80">
                  <div className="text-xs font-mono text-slate-400 mb-2.5">
                    Or select preloaded audio sample:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sampleFiles.map((sample, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectSample(sample)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors border ${selectedFile?.name === sample.name && !realFile
                          ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                          : "bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                          }`}
                      >
                        <FileAudio className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{sample.name}</span>
                        <span className="text-slate-500 text-[10px]">({sample.size})</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pipeline Configuration Options */}
              <div className="p-6 rounded-2xl bg-[#0e111a] border border-slate-800 shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    Pipeline & Model Parameters
                  </h2>
                  <span className="text-[11px] font-mono text-slate-500">Config: Ready</span>
                </div>

                {/* Model Selection */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-2">
                    Whisper ASR Inference Engine
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: "whisper-base.en",
                        name: "Base.en (Active)",
                        desc: "Local Metal GPU model. Ultra-fast <1s transcription.",
                        speed: "12x realtime",
                      },
                      {
                        id: "whisper-large-v3-turbo",
                        name: "Large-v3-Turbo",
                        desc: "High accuracy multi-lingual production model.",
                        speed: "5.2x realtime",
                      },
                      {
                        id: "whisper-large-v3",
                        name: "Large-v3 Full",
                        desc: "Maximum accuracy across complex accents.",
                        speed: "2.1x realtime",
                      },
                    ].map((m) => (
                      <div
                        key={m.id}
                        onClick={() => setModel(m.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${model === m.id
                          ? "bg-indigo-950/30 border-indigo-500 shadow-sm"
                          : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{m.name}</span>
                          {model === m.id && (
                            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">{m.desc}</p>
                        <div className="mt-2 text-[10px] font-mono text-indigo-300">{m.speed}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pipeline Stage Toggles */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-2">
                    Pipeline Stages to Chain (3 Core ML Services)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        key: "transcribe" as const,
                        label: "1. Whisper ASR Transcription",
                        desc: "Generates time-stamped utterances via whisper.cpp",
                        required: true,
                      },
                      {
                        key: "summary" as const,
                        label: "2. AI Executive Summary",
                        desc: "Distills core points via FLAN-T5 Seq2Seq model",
                        required: false,
                      },
                      {
                        key: "keywords" as const,
                        label: "3. Semantic Keyword Extraction",
                        desc: "Extracts key topics & tags via KeyBERT",
                        required: false,
                      },
                    ].map((stage) => (
                      <div
                        key={stage.key}
                        onClick={() => !stage.required && toggleStage(stage.key)}
                        className={`p-3 rounded-lg border flex items-start gap-3 transition-colors ${stage.required
                          ? "bg-slate-900/60 border-slate-700/80 cursor-default"
                          : stages[stage.key]
                            ? "bg-indigo-950/20 border-indigo-500/60 cursor-pointer"
                            : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700 cursor-pointer"
                          }`}
                      >
                        <div
                          className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-colors ${stages[stage.key]
                            ? "bg-indigo-600 border-indigo-500 text-white"
                            : "border-slate-700 bg-slate-900"
                            }`}
                        >
                          {stages[stage.key] && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                            {stage.label}
                            {stage.required && (
                              <span className="text-[9px] uppercase font-mono px-1 rounded bg-slate-800 text-slate-400">
                                Required
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{stage.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Action Bar */}
                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedFile || isSubmitting || !user}
                    className="w-full sm:w-auto px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RotateCcw className="w-4 h-4 animate-spin" />
                        <span>Transcribing & Saving ({uploadProgress}%)...</span>
                      </>
                    ) : !user ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Log in to Submit Job</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Submit & Transcribe</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Sidebar: Recent Submissions & Pipeline Info (4 Cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Recent Submissions List */}
              <div className="p-5 rounded-2xl bg-[#0e111a] border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    Recent Submissions
                  </h3>
                  <button
                    onClick={fetchRecentJobs}
                    className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    Refresh
                  </button>
                </div>

                <div className="space-y-3">
                  {recentSubmissions.length === 0 ? (
                    <div className="text-xs font-mono text-slate-500 py-4 text-center">
                      No submissions found.
                    </div>
                  ) : (
                    recentSubmissions.map((job) => (
                      <div
                        key={job.id}
                        className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-semibold text-slate-200 truncate">
                            {job.fileName}
                          </span>
                          <StatusBadge status={job.status} size="sm" />
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span className="truncate max-w-[140px]">{job.id}</span>
                          <span>{job.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Link
                  href="/dashboard"
                  className="w-full mt-2 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Open Full Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
