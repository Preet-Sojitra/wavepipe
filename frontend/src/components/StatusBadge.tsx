import React from "react";
import { Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export type JobStatusType = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "submitted";

interface StatusBadgeProps {
  status: JobStatusType | string;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export function StatusBadge({ status, size = "md", showIcon = true }: StatusBadgeProps) {
  const normStatus = status.toUpperCase();

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-medium";

  switch (normStatus) {
    case "QUEUED":
    case "SUBMITTED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400 font-mono ${sizeClasses}`}
        >
          {showIcon && <Clock className="w-3 h-3 animate-pulse text-amber-400" />}
          <span>QUEUED</span>
        </span>
      );
    case "PROCESSING":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 font-mono ${sizeClasses}`}
        >
          {showIcon && <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />}
          <span>PROCESSING</span>
        </span>
      );
    case "COMPLETED":
    case "DONE":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-mono ${sizeClasses}`}
        >
          {showIcon && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          <span>COMPLETED</span>
        </span>
      );
    case "FAILED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-400 font-mono ${sizeClasses}`}
        >
          {showIcon && <AlertCircle className="w-3 h-3 text-rose-400" />}
          <span>FAILED</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 text-slate-300 font-mono ${sizeClasses}`}
        >
          <span>{normStatus}</span>
        </span>
      );
  }
}
