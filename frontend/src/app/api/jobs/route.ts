import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";
import { redis, QUEUE_NAME } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to submit transcription jobs." },
        { status: 401 }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    let fileName = "audio.wav";
    let fileSize: number | null = null;
    let audioUrl: string | null = null;
    let diskFilePath: string | null = null;
    let model = "whisper-base.en";
    let stages: string[] = ["transcribe", "summary", "keywords"];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const modelField = formData.get("model") as string | null;
      const stagesField = formData.get("stages") as string | null;
      const customFileName = formData.get("fileName") as string | null;

      if (modelField) model = modelField;
      if (stagesField) {
        try {
          stages = JSON.parse(stagesField);
        } catch {
          stages = stagesField.split(",").map((s) => s.trim());
        }
      }

      if (file && typeof file === "object" && "arrayBuffer" in file) {
        fileName = file.name || customFileName || "recording.wav";
        fileSize = file.size;

        // Ensure uploads directory exists in public folder
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await mkdir(uploadDir, { recursive: true });

        const uniquePrefix = crypto.randomBytes(6).toString("hex");
        const safeName = `${uniquePrefix}_${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const filePath = path.join(uploadDir, safeName);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        audioUrl = `/uploads/${safeName}`;
        diskFilePath = filePath;
      } else if (customFileName) {
        fileName = customFileName;
        const sizeField = formData.get("fileSize") as string | null;
        if (sizeField) fileSize = parseInt(sizeField, 10) || null;

        // Check if matching sample file exists in samples-audio
        const samplePath = path.join(process.cwd(), "public", "samples-audio", customFileName);
        if (existsSync(samplePath)) {
          diskFilePath = samplePath;
          audioUrl = `/samples-audio/${customFileName}`;
        } else {
          const harvardDefault = path.join(process.cwd(), "public", "samples-audio", "harvard.wav");
          if (existsSync(harvardDefault)) {
            diskFilePath = harvardDefault;
            audioUrl = `/samples-audio/harvard.wav`;
          }
        }
      }
    } else {
      const body = await req.json();
      if (body.fileName) fileName = body.fileName;
      if (body.fileSize) fileSize = body.fileSize;
      if (body.audioUrl) audioUrl = body.audioUrl;
      if (body.model) model = body.model;
      if (body.stages && Array.isArray(body.stages)) stages = body.stages;

      if (fileName) {
        const samplePath = path.join(process.cwd(), "public", "samples-audio", fileName);
        if (existsSync(samplePath)) {
          diskFilePath = samplePath;
        }
      }
    }

    // 1. Save job row in PostgreSQL Database (initial status QUEUED)
    const job = await prisma.job.create({
      data: {
        fileName,
        fileSize: fileSize || undefined,
        audioUrl,
        status: "QUEUED",
        model,
        stages,
        currentStage: "queued",
        duration: 0,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // 2. Enqueue job to Redis for background worker processing
    if (diskFilePath && existsSync(diskFilePath)) {
      try {
        if (!redis.isOpen) {
          await redis.connect();
        }

        const queuePayload = {
          job_id: job.id,
          audio_path: diskFilePath,
          model: model,
          stages: stages,
          enqueued_at: new Date().toISOString(),
        };

        await redis.lPush(QUEUE_NAME, JSON.stringify(queuePayload));
        console.log(`[Queue] Successfully pushed job ${job.id} to ${QUEUE_NAME}`);
      } catch (queueError: any) {
        console.error(`[Queue] Failed to enqueue job ${job.id} to Redis:`, queueError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Job submitted and queued successfully",
        job,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error submitting job:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to submit job" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const status = searchParams.get("status");

    const whereClause: any = {};
    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    const jobs = await prisma.job.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      jobs,
    });
  } catch (error: any) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
