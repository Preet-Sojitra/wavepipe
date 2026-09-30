"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  UploadCloud,
  LayoutDashboard,
  Cpu,
  Zap,
  Sparkles,
  ArrowRight,
  Terminal,
  Layers,
  FileAudio,
  CheckCircle2,
  Play,
  Pause,
  Clock,
  ShieldCheck,
  Server,
  Workflow,
  Copy,
  Check,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

export default function LandingPage() {
  const [selectedDemo, setSelectedDemo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const demoAudios = [
    {
      title: "q3_ai_infrastructure_briefing.wav",
      duration: "02:45",
      size: "4.2 MB",
      model: "Whisper-Large-v3-Turbo",
      summary:
        "• Scaled worker pool from 2 to 8 nodes to eliminate peak-hour Redis queue latency.\n• Integrated quantized summarizer reducing Stage 2 pipeline latency to 120ms.\n• Ready for load-testing up to 500 concurrent transcription requests.",
      keywords: ["Distributed Worker", "Whisper ASR", "Redis Queue", "Quantized Model", "KEDA Autoscaling"],
      transcript:
        "[00:00 - 00:15] 'Good morning team. We have successfully deployed the Whisper inference workers with worker autoscaling...'\n[00:15 - 00:32] 'The end-to-end latency dropped by 48% across multi-channel audio files.'",
    },
    {
      title: "earnings_call_discussion.mp3",
      duration: "04:12",
      size: "6.8 MB",
      model: "Whisper-Large-v3",
      summary:
        "• Reported 32% year-over-year revenue increase powered by cloud ML pipeline adoption.\n• Gross margins expanded by 240bps due to in-house self-hosted model execution.\n• Pipeline processing reliability achieved 99.98% uptime.",
      keywords: ["Revenue Growth", "Margin Expansion", "Cloud ML", "Inference Cost", "SLA Uptime"],
      transcript:
        "[00:00 - 00:20] 'Welcome to the quarterly briefing. Our focus this quarter has been reducing cloud inference overhead...'\n[00:20 - 00:45] 'By standardizing on a local-first queue pipeline, we cut latency in half.'",
    },
    {
      title: "product_tech_demo_clip.m4a",
      duration: "01:20",
      size: "1.9 MB",
      model: "Whisper-Base.en",
      summary:
        "• Demonstration of real-time audio drag-and-drop ingestion.\n• Multi-stage processing automatically extracts speaker diarization and semantic topic tags.",
      keywords: ["Audio Ingestion", "Speaker Diarization", "Realtime WebSocket", "Zero Latency"],
      transcript:
        "[00:00 - 00:10] 'Simply drop your audio file into the queue to watch the multi-stage pipeline trigger.'\n[00:10 - 00:25] 'Transcripts are indexed and queryable within seconds.'",
    },
  ];

  const curlExample = `curl -X POST https://api.wavepipe.dev/v1/jobs \\
  -H "Authorization: Bearer wp_live_token" \\
  -F "file=@meeting_audio.wav" \\
  -F "pipeline=transcribe,summarize,keywords" \\
  -F "model=whisper-large-v3-turbo"`;

  const copyCurl = () => {
    navigator.clipboard.writeText(curlExample);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#08090e] bg-grid-pattern text-slate-100">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-radial-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Tag pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-mono mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>Next-Gen Audio Intelligence Infrastructure</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight sm:leading-tight md:leading-tight">
              Upload audio, get transcripts and insights,{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-300 bg-clip-text text-transparent">
                at scale.
              </span>
            </h1>

            {/* Subhead */}
            <p className="mt-6 text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Wavepipe is an asynchronous audio processing pipeline built for developers.
              Ingest raw audio, run high-performance Whisper ASR, and chain multi-stage
              semantic extraction with zero infrastructure headache.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 border border-indigo-500/60 transition-all hover:translate-y-[-1px]"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Submit Audio Job</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>

              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-medium text-sm border border-slate-700/80 hover:border-slate-600 transition-all"
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                <span>Open Dashboard</span>
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/60">
                <div className="text-[11px] font-mono text-slate-400">Inference Speed</div>
                <div className="text-xl font-bold font-mono text-white mt-0.5">5.2x <span className="text-xs font-normal text-cyan-400">Realtime</span></div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/60">
                <div className="text-[11px] font-mono text-slate-400">Word Accuracy</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">99.4%</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/60">
                <div className="text-[11px] font-mono text-slate-400">Queue Latency</div>
                <div className="text-xl font-bold font-mono text-indigo-300 mt-0.5">&lt; 85ms</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/60">
                <div className="text-[11px] font-mono text-slate-400">Audio Formats</div>
                <div className="text-xl font-bold font-mono text-white mt-0.5">MP3 / WAV / M4A</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Pipeline Architecture Section */}
      <section className="py-16 border-y border-slate-800/80 bg-[#090b11]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-mono uppercase tracking-widest text-indigo-400">
              The Architecture
            </h2>
            <p className="text-2xl font-bold text-white tracking-tight mt-1">
              How the Multi-Stage Pipeline Operates
            </p>
            <p className="text-sm text-slate-400 mt-2">
              From raw audio upload to structured JSON insights in milliseconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/90 relative group hover:border-indigo-500/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 font-mono font-bold text-sm">
                01
              </div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-indigo-400" />
                Ingest & Validate
              </h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Accepts WAV, MP3, M4A, FLAC, and OGG. Files are normalized, verified for audio integrity, and buffered into Redis / SQS job queues.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500">
                <span>Stage 1</span>
                <span className="text-amber-400">QUEUED / BUFFERED</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/90 relative group hover:border-cyan-500/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-cyan-600/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 font-mono font-bold text-sm">
                02
              </div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Whisper ASR Inference
              </h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Asynchronous worker processes poll the queue and execute Whisper.cpp / Faster-Whisper. Generates millisecond-accurate timestamps and speaker segments.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500">
                <span>Stage 2</span>
                <span className="text-cyan-400">TRANSCRIPTION</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/90 relative group hover:border-emerald-500/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 font-mono font-bold text-sm">
                03
              </div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Insights & Synthesis
              </h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Chains secondary lightweight ML models to distill executive summaries (FLAN-T5), semantic keyword tags (KeyBERT), and structured JSON results into PostgreSQL.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500">
                <span>Stage 3</span>
                <span className="text-emerald-400">COMPLETED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Playground Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 uppercase tracking-wide">
                <Zap className="w-3.5 h-3.5" /> Interactive Output Preview
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
                Explore real pipeline outputs
              </h2>
              <p className="text-sm text-slate-400 mt-2 max-w-xl">
                Select a sample processed audio file below to inspect how transcripts, executive summaries, and keyword tags are structured.
              </p>
            </div>

            {/* Sample Selector Buttons */}
            <div className="flex flex-wrap gap-2">
              {demoAudios.map((demo, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDemo(idx);
                    setIsPlaying(false);
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition-all ${
                    selectedDemo === idx
                      ? "bg-indigo-600 text-white border border-indigo-400 shadow-md shadow-indigo-600/30"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  <FileAudio className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[150px]">{demo.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Card */}
          <div className="rounded-xl bg-[#0d1017] border border-slate-800 shadow-2xl overflow-hidden">
            {/* Top Bar */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <StatusBadge status="COMPLETED" />
                <span className="font-mono text-xs text-slate-400">
                  {demoAudios[selectedDemo].title}
                </span>
                <span className="hidden sm:inline text-xs text-slate-500 font-mono">
                  ({demoAudios[selectedDemo].size})
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-indigo-300 px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/50">
                  {demoAudios[selectedDemo].model}
                </span>
              </div>
            </div>

            {/* Audio Waveform Simulator */}
            <div className="p-6 border-b border-slate-800/80 bg-slate-950/40">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
                </button>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>Playback Waveform Simulation</span>
                    <span>{demoAudios[selectedDemo].duration}</span>
                  </div>
                  <div className="h-8 flex items-center gap-[3px] overflow-hidden">
                    {Array.from({ length: 48 }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          isPlaying
                            ? "bg-gradient-to-t from-indigo-500 to-cyan-400 animate-[wave_1.2s_ease-in-out_infinite]"
                            : "bg-slate-800 hover:bg-slate-700"
                        }`}
                        style={{
                          height: `${Math.max(15, Math.sin(i * 0.4) * 80 + 30)}%`,
                          animationDelay: `${(i % 10) * 100}ms`,
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Output Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
              {/* Transcript */}
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileAudio className="w-3.5 h-3.5 text-indigo-400" />
                    Whisper Transcript (Time-stamped)
                  </h4>
                  <span className="text-[11px] font-mono text-emerald-400">ASR v3</span>
                </div>
                <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800/80 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {demoAudios[selectedDemo].transcript}
                </div>
              </div>

              {/* Summary & Keywords */}
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    AI Executive Summary
                  </h4>
                  <div className="p-4 rounded-lg bg-indigo-950/20 border border-indigo-900/30 text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                    {demoAudios[selectedDemo].summary}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                    Extracted Semantic Keywords
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {demoAudios[selectedDemo].keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700/70 text-[11px] font-mono text-indigo-300"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer API / CLI Code Snippet */}
      <section className="py-16 border-t border-slate-800/80 bg-[#090b10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                <Terminal className="w-3.5 h-3.5" /> REST & Webhook Ready
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Integrate audio jobs into your stack in 5 lines
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Trigger audio processing asynchronously from any backend. Wavepipe returns an immediate job UUID and pushes real-time status updates via Webhooks or WebSocket channels.
              </p>
              <div className="pt-2">
                <Link
                  href="/submit"
                  className="inline-flex items-center gap-2 text-xs font-mono text-indigo-400 hover:text-indigo-300 group"
                >
                  <span>Test with file upload UI</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
                <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                    <span className="text-xs font-mono text-slate-400 ml-2">POST /v1/jobs</span>
                  </div>
                  <button
                    onClick={copyCurl}
                    className="flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded hover:bg-slate-800 transition-colors"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-5 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
                  <code>{curlExample}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ready to launch CTA Banner */}
      <section className="py-16 bg-gradient-to-b from-[#090a0f] to-[#0d0f1a] border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Ready to process your audio workloads?
          </h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Try the job submission portal with preloaded audio files or inspect the running worker cluster on the dashboard.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/submit"
              className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 border border-indigo-500/60 transition-all"
            >
              Upload Audio File
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition-all"
            >
              View Pipeline Dashboard
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
