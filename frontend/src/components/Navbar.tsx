"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  UploadCloud,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Coins,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const links = [
    { href: "/", label: "Overview", icon: Activity },
    { href: "/submit", label: "Submit Job", icon: UploadCloud },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#090a0f]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-sm shadow-indigo-500/20 group-hover:border-indigo-400 transition-colors">
              <div className="flex items-end gap-[2px] h-4">
                <span className="w-1 bg-indigo-400 h-2 rounded-full animate-[wave_1.2s_ease-in-out_infinite_100ms]"></span>
                <span className="w-1 bg-cyan-400 h-4 rounded-full animate-[wave_1.2s_ease-in-out_infinite_300ms]"></span>
                <span className="w-1 bg-indigo-400 h-3 rounded-full animate-[wave_1.2s_ease-in-out_infinite_200ms]"></span>
                <span className="w-1 bg-cyan-400 h-1.5 rounded-full animate-[wave_1.2s_ease-in-out_infinite_400ms]"></span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight text-white group-hover:text-indigo-200 transition-colors">
                WavePipe
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-semibold tracking-wide">
                v1.0
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? "bg-slate-800/90 text-white shadow-sm border border-slate-700/60"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Action Items & Cluster Health Indicator */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Whisper Cluster:</span>
            <span className="text-emerald-400 font-medium">Ready</span>
          </div>

          {!loading && user ? (
            <div className="flex items-center gap-2">
              {/* Credits badge */}
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-950/40 border border-indigo-800/50 text-indigo-300 text-xs font-mono">
                <Coins className="w-3.5 h-3.5 text-indigo-400" />
                <span>{user.credits.toFixed(1)} cr</span>
              </div>

              {/* User email badge */}
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <div className="w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 text-[10px] font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </div>
                <span className="font-mono text-slate-300 max-w-[120px] truncate">
                  {user.name || user.email.split("@")[0]}
                </span>
              </div>

              {/* Sign out button */}
              <button
                onClick={() => logout()}
                title="Sign out"
                className="flex items-center gap-1 p-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-900/50 bg-slate-900 hover:bg-red-950/20 transition-all shadow-sm"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            !loading && (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white border border-slate-700/80 hover:border-slate-600 bg-slate-800/60 hover:bg-slate-800 transition-all shadow-sm"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )
          )}

          <Link
            href="/submit"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 shadow-md shadow-indigo-600/25 transition-all"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>New Job</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
