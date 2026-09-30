import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wavepipe | Audio Transcription & ML Processing Pipeline",
  description:
    "High-throughput audio transcription, speaker diarization, and insights pipeline built on Whisper and LLM extraction.",
};

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased min-h-screen flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

