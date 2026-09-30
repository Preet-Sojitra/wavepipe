import React from "react";
import { Terminal, Cpu, Database, Layers } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-[#07080c] py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-semibold text-white">Wavepipe</span>
            <span className="text-xs text-slate-500 font-mono">
              High-throughput audio transcription & ML intelligence pipeline
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Whisper.cpp / Faster-Whisper
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" /> Celery/Redis Queue
            </span>
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" /> PostgreSQL
            </span>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Wavepipe Engineering. Built for scalable audio workloads.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 transition-colors">API Docs</span>
            <span>•</span>
            <span className="hover:text-slate-400 transition-colors">Architecture</span>
            <span>•</span>
            <span className="hover:text-slate-400 transition-colors">Benchmarks</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
