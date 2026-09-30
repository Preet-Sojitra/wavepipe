"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StatusBadge, JobStatusType } from "@/components/StatusBadge";
import { JobDetailDrawer, MockJob } from "@/components/JobDetailDrawer";
import {
  LayoutDashboard,
  UploadCloud,
  Search,
  Filter,
  RefreshCw,
  FileAudio,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  Download,
  Terminal,
  Activity,
  Layers,
  Trash2,
} from "lucide-react";

const INITIAL_MOCK_JOBS: MockJob[] = [
  {
    id: "job_c9a17e04",
    fileName: "q3_ai_infrastructure_briefing.wav",
    fileSize: "4.2 MB",
    status: "COMPLETED",
    duration: "02:45",
    processingTime: "840ms",
    model: "whisper-large-v3-turbo",
    submittedAt: "2 mins ago",
    audioUrl: "/samples-audio/harvard.wav",
    currentStage: "completed",
    summary:
      "• Scaled worker pool from 2 to 8 nodes to eliminate peak-hour Redis queue latency.\n• Integrated quantized summarizer reducing Stage 2 pipeline latency to 120ms.\n• Ready for load-testing up to 500 concurrent transcription requests.",
    keywords: ["Distributed Worker", "Whisper ASR", "Redis Queue", "Quantized Model", "KEDA Autoscaling"],
    sentiment: "Positive",
    transcript: [
      {
        start: "00:00.00",
        end: "00:08.40",
        speaker: "Speaker 1 (DevOps Lead)",
        text: "Good morning team. We have completed the deployment of our asynchronous audio processing pipeline on the cluster.",
      },
      {
        start: "00:08.50",
        end: "00:18.20",
        speaker: "Speaker 2 (ML Engineer)",
        text: "The Whisper.cpp inference workers are pulling tasks off Redis with sub-hundred millisecond queue latency.",
      },
      {
        start: "00:18.30",
        end: "00:29.80",
        speaker: "Speaker 1 (DevOps Lead)",
        text: "Excellent. Stage 2 summarization and keyword extraction are also verified end to end.",
      },
    ],
  },
];

export default function DashboardPage() {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<MockJob | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [jobs, setJobs] = useState<MockJob[]>(INITIAL_MOCK_JOBS);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/jobs");
      if (res.ok) {
        const data = await res.json();
        if (data.jobs && data.jobs.length > 0) {
          const formatted: MockJob[] = data.jobs.map((dbJob: any) => {
            let parsedTranscript: { start: string; end: string; speaker: string; text: string }[] = [];
            if (dbJob.transcript) {
              try {
                parsedTranscript = JSON.parse(dbJob.transcript);
              } catch {
                parsedTranscript = [
                  {
                    start: "00:00.00",
                    end: "00:00.00",
                    speaker: "Speaker 1",
                    text: dbJob.transcript,
                  },
                ];
              }
            }

            const sizeInMb = dbJob.fileSize ? `${(dbJob.fileSize / (1024 * 1024)).toFixed(1)} MB` : "N/A";
            const dateStr = new Date(dbJob.createdAt).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return {
              id: dbJob.id,
              fileName: dbJob.fileName,
              fileSize: sizeInMb,
              status: dbJob.status as JobStatusType,
              audioUrl: dbJob.audioUrl || (dbJob.fileName === "harvard.wav" ? "/samples-audio/harvard.wav" : null),
              duration: dbJob.duration ? `${Math.floor(dbJob.duration / 60)}:${Math.floor(dbJob.duration % 60).toString().padStart(2, "0")}` : "--:--",
              processingTime: dbJob.processingMs ? `${dbJob.processingMs}ms` : dbJob.status === "QUEUED" ? "Queued" : "In Flight",
              model: dbJob.model || "whisper-base.en",
              submittedAt: dateStr,
              currentStage: dbJob.currentStage || "queued",
              summary: dbJob.summary || (dbJob.status === "QUEUED" ? "Queued. Whisper processing will run in worker stage." : "No summary available yet."),
              keywords: dbJob.keywords || [],
              sentiment: dbJob.sentiment || "Pending",
              transcript: parsedTranscript,
            };
          });
          setJobs(formatted);
          return;
        }
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();

    // Auto-poll every 2.5 seconds if there are queued or processing jobs
    const interval = setInterval(() => {
      setJobs((currentJobs) => {
        const hasInFlight = currentJobs.some(
          (j) => j.status === "QUEUED" || j.status === "PROCESSING"
        );
        if (hasInFlight) {
          fetchJobs();
        }
        return currentJobs;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [fetchJobs]);

  const handleDeleteJob = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setJobs((prev) => prev.filter((j) => j.id !== id));
        if (selectedJob?.id === id) {
          setSelectedJob(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete job:", err);
    }
  };

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter and search logic
  const filteredJobs = jobs.filter((job) => {
    const matchesStatus =
      filterStatus === "ALL" || job.status.toUpperCase() === filterStatus.toUpperCase();
    const matchesSearch =
      job.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalCount = jobs.length;
  const completedCount = jobs.filter((j) => j.status === "COMPLETED").length;
  const inFlightCount = jobs.filter((j) => j.status === "PROCESSING" || j.status === "QUEUED").length;
  const failedCount = jobs.filter((j) => j.status === "FAILED").length;

  return (
    <div className="min-h-screen flex flex-col bg-[#08090e] bg-grid-pattern text-slate-100">
      <Navbar />

      <main className="flex-1 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono mb-2">
                <Activity className="w-3.5 h-3.5" /> Pipeline State Machine
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Jobs & Pipeline Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Monitor job state transitions, inspect timestamped transcripts, and export extracted metadata.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchJobs}
                className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors shadow-sm cursor-pointer"
                title="Refresh jobs"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-indigo-400" : ""}`} />
              </button>

              <Link
                href="/submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-indigo-600/30 border border-indigo-500 transition-all"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Submit New Audio</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0e111a] border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>Total Jobs Dispatched</span>
                <Layers className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white mt-1">{totalCount}</div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-mono">All-time DB jobs</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0e111a] border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>Completed</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{completedCount}</div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-mono">Transcribed & synthesized</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0e111a] border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>In-Flight / Queued</span>
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              </div>
              <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">{inFlightCount}</div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-mono">Whisper worker queue</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0e111a] border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>Failed</span>
                <AlertCircle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{failedCount}</div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-mono">Invalid audio / decode error</div>
            </div>
          </div>

          {/* Controls: Filter Tabs & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-xl bg-[#0e111a] border border-slate-800">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: "ALL", label: "All Jobs" },
                { id: "COMPLETED", label: "Completed" },
                { id: "PROCESSING", label: "Processing" },
                { id: "QUEUED", label: "Queued" },
                { id: "FAILED", label: "Failed" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono whitespace-nowrap transition-all cursor-pointer ${filterStatus === tab.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search file name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Jobs Table */}
          <div className="rounded-2xl bg-[#0e111a] border border-slate-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Job ID</th>
                    <th className="py-3.5 px-4 font-semibold">Audio File</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold">Model / Pipeline</th>
                    <th className="py-3.5 px-4 font-semibold">Latency / State</th>
                    <th className="py-3.5 px-4 font-semibold">Submitted</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs">
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 font-mono">
                        <FileAudio className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                        No jobs found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((job) => (
                      <tr
                        key={job.id}
                        onClick={() => setSelectedJob(job)}
                        className="hover:bg-slate-900/50 cursor-pointer transition-colors group"
                      >
                        {/* Job ID */}
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          <button
                            onClick={(e) => handleCopyId(e, job.id)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors"
                            title="Click to copy ID"
                          >
                            <span className="truncate max-w-[120px]">{job.id}</span>
                            {copiedId === job.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </button>
                        </td>

                        {/* File Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center text-indigo-400 shrink-0">
                              <FileAudio className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors truncate max-w-[220px]">
                                {job.fileName}
                              </div>
                              <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <span>{job.duration}</span>
                                <span>•</span>
                                <span>{job.fileSize}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <StatusBadge status={job.status} size="sm" />
                        </td>

                        {/* Model */}
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                            {job.model}
                          </span>
                        </td>

                        {/* Latency */}
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          {job.processingTime}
                        </td>

                        {/* Submitted */}
                        <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {job.submittedAt}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedJob(job);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-indigo-600 hover:text-white border border-slate-800 text-slate-300 text-xs font-medium transition-all"
                            >
                              <span>Inspect</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteJob(e, job.id)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                              title="Delete job"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Slide-over Job Details Drawer */}
      <JobDetailDrawer job={selectedJob} onClose={() => setSelectedJob(null)} />

      <Footer />
    </div>
  );
}
