import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const globalForRedis = globalThis as unknown as {
  redisClient: ReturnType<typeof createClient> | undefined;
};

export const redis =
  globalForRedis.redisClient ??
  createClient({
    url: redisUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redisClient = redis;
}

// Connect automatically if not connected
if (!redis.isOpen) {
  redis.connect().catch((err) => {
    console.error("[Redis] Failed to connect to Redis server:", err);
  });
}

export const QUEUE_NAME = "wavepipe:jobs:transcribe";
