"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  FileText,
  Sparkles,
  Tag,
  Code2,
  Play,
  Pause,
  Clock,
  Cpu,
  Layers,
  Download,
  Volume2,
  VolumeX,
  RotateCcw,
} from "lucide-react";
import { StatusBadge, JobStatusType } from "./StatusBadge";

export interface MockJob {
  id: string;
  fileName: string;
  fileSize: string;
  status: JobStatusType;
  duration: string;
  processingTime: string;
  model: string;
  submittedAt: string;
  audioUrl?: string | null;
  currentStage?: string;
  summary: string;
  keywords: string[];
  sentiment?: string;
  transcript: {
    start: string;
    end: string;
    speaker: string;
    text: string;
  }[];
}

interface JobDetailDrawerProps {
  job: MockJob | null;
  onClose: () => void;
}

function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(":");
  if (parts.length === 2) {
    const mins = parseFloat(parts[0]) || 0;
    const secs = parseFloat(parts[1]) || 0;
    return mins * 60 + secs;
  }
  return parseFloat(timeStr) || 0;
}

function formatSeconds(secs: number): string {
  if (isNaN(secs) || secs < 0) return "00:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function JobDetailDrawer({ job, onClose }: JobDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<"transcript" | "summary" | "keywords" | "json">("transcript");
  const [copied, setCopied] = useState(false);

  // Audio Player State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);

  // Reset audio whenever job changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setIsAudioLoaded(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [job?.id]);

  if (!job) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(job.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePlay = () => {
    if (!audioRef.current || !job.audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error("Audio playback error:", err);
          setIsPlaying(false);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setTotalDuration(audioRef.current.duration || parseTimeToSeconds(job.duration));
      setIsAudioLoaded(true);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current || totalDuration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * totalDuration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleJumpToSegment = (startStr: string) => {
    const seconds = parseTimeToSeconds(startStr);
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      {/* Hidden Audio Element */}
      {job.audioUrl && (
        <audio
          ref={audioRef}
          src={job.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          preload="metadata"
        />
      )}

      <div className="w-full max-w-2xl bg-[#0e111a] border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <StatusBadge status={job.status} />
              <button
                onClick={handleCopyId}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-[11px] font-mono text-slate-400 hover:text-slate-200 border border-slate-700/60 transition-colors"
                title="Copy Job ID"
              >
                <span>{job.id}</span>
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-xl font-semibold text-white tracking-tight break-all">
            {job.fileName}
          </h2>

          {/* Quick Metrics Bar */}
          <div className="mt-4 grid grid-cols-3 gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs">
            <div>
              <div className="text-slate-400 text-[11px] flex items-center gap-1">
                <Clock className="w-3 h-3" /> Audio Length
              </div>
              <div className="font-mono text-slate-200 font-medium mt-0.5">{job.duration}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] flex items-center gap-1">
                <Cpu className="w-3 h-3" /> Processing Latency
              </div>
              <div className="font-mono text-slate-200 font-medium mt-0.5">{job.processingTime}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] flex items-center gap-1">
                <Layers className="w-3 h-3" /> Model
              </div>
              <div className="font-mono text-indigo-300 font-medium mt-0.5 truncate">{job.model}</div>
            </div>
          </div>

          {/* Interactive Audio Player Bar */}
          <div className="mt-3.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
            <button
              onClick={togglePlay}
              disabled={!job.audioUrl}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md shrink-0 cursor-pointer ${
                job.audioUrl
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-95"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-60"
              }`}
              title={job.audioUrl ? (isPlaying ? "Pause audio" : "Play audio") : "No audio file available"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
            </button>

            {/* Clickable Seekable Progress Track */}
            <div className="flex-1 cursor-pointer py-2" ref={progressBarRef} onClick={handleSeek}>
              <div className="h-2 bg-slate-800/90 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-400 rounded-full transition-all duration-100"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-400 shrink-0 select-none">
              <span className="text-slate-200 font-medium">{formatSeconds(currentTime)}</span>
              <span className="text-slate-600 mx-1">/</span>
              <span>{formatSeconds(totalDuration || parseTimeToSeconds(job.duration))}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 border-b border-slate-800 bg-slate-900/20">
          <button
            onClick={() => setActiveTab("transcript")}
            className={`flex items-center gap-2 py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "transcript"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Transcript ({job.transcript.length} segments)
          </button>
          <button
            onClick={() => setActiveTab("summary")}
            className={`flex items-center gap-2 py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "summary"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Summary
          </button>
          <button
            onClick={() => setActiveTab("keywords")}
            className={`flex items-center gap-2 py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "keywords"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Keywords ({job.keywords.length})
          </button>
          <button
            onClick={() => setActiveTab("json")}
            className={`flex items-center gap-2 py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "json"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            JSON Output
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "transcript" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span>Whisper ASR Timestamped Segments</span>
                <span className="font-mono text-[11px] text-emerald-400">Click timestamp to seek</span>
              </div>
              {job.transcript.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-slate-500">
                  No transcript available for this job yet.
                </div>
              ) : (
                job.transcript.map((seg, idx) => {
                  const segStartSec = parseTimeToSeconds(seg.start);
                  const segEndSec = parseTimeToSeconds(seg.end);
                  const isCurrentSeg = currentTime >= segStartSec && (currentTime <= segEndSec || segEndSec === 0);

                  return (
                    <div
                      key={idx}
                      onClick={() => handleJumpToSegment(seg.start)}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer group ${
                        isCurrentSeg
                          ? "bg-indigo-950/40 border-indigo-500/80 shadow-md shadow-indigo-950/50"
                          : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-semibold ${isCurrentSeg ? "text-indigo-300" : "text-slate-300"}`}>
                          {seg.speaker}
                        </span>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-400 hover:text-indigo-300 px-1.5 py-0.5 rounded bg-indigo-950/40 border border-indigo-800/40"
                        >
                          <Play className="w-2.5 h-2.5" />
                          <span>
                            {seg.start} - {seg.end}
                          </span>
                        </button>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">{seg.text}</p>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "summary" && (
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/40 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 font-medium text-xs">
                <Sparkles className="w-4 h-4" />
                Pipeline Extracted Executive Summary
              </div>
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                {job.summary}
              </p>
              <div className="pt-3 border-t border-indigo-900/30 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  Model: <span className="text-indigo-300">google/flan-t5-small</span>
                </span>
                <span>Latency: {job.processingTime}</span>
              </div>
            </div>
          )}

          {activeTab === "keywords" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Key entities, technical topics, and phrases extracted from the transcript.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {job.keywords.length === 0 ? (
                  <span className="text-xs font-mono text-slate-500">No keywords extracted yet.</span>
                ) : (
                  job.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-700/80 text-xs font-mono text-indigo-300 shadow-sm"
                    >
                      <Tag className="w-3 h-3 text-indigo-400" />
                      {kw}
                    </span>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "json" && (
            <div className="relative">
              <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                {JSON.stringify(job, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Job submitted at {job.submittedAt}
          </span>
          <button
            onClick={() => {
              const element = document.createElement("a");
              const file = new Blob([JSON.stringify(job, null, 2)], {
                type: "application/json",
              });
              element.href = URL.createObjectURL(file);
              element.download = `${job.id}-results.json`;
              document.body.appendChild(element);
              element.click();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download Result JSON
          </button>
        </div>
      </div>
    </div>
  );
}
