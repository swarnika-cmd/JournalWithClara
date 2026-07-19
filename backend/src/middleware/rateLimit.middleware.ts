import { Request, Response, NextFunction } from "express";
import { redis, isRedisConnected } from "../lib/redis";

interface InMemoryLimit {
  count: number;
  expiresAt: number;
}

const memoryStore = new Map<string, InMemoryLimit>();

// Clean up memory store every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (value.expiresAt < now) {
      memoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message: string;
  keyPrefix: string;
}

/**
 * Custom offline-resilient rate limiting middleware.
 * Uses Redis if connected, otherwise falls back to local in-memory Map.
 */
export function createRateLimiter(options: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Generate key based on IP and prefix
    const ip = req.ip || req.socket.remoteAddress || "unknown_ip";
    const key = `rate_limit:${options.keyPrefix}:${ip}`;
    const now = Date.now();

    if (isRedisConnected && redis) {
      try {
        // Multi block: increment count and set expiry if key is new
        const replies = await redis
          .multi()
          .incr(key)
          .ttl(key)
          .exec();

        if (replies && replies[0] && replies[1]) {
          const count = replies[0][1] as number;
          const ttl = replies[1][1] as number;

          // If it's a new key, set TTL
          if (ttl === -1) {
            await redis.expire(key, Math.ceil(options.windowMs / 1000));
          }

          if (count > options.max) {
            console.warn(`[Rate Limiter] Blocked IP ${ip} on key ${key} (Redis). Count: ${count}/${options.max}`);
            return res.status(429).json({ error: options.message });
          }
        }
      } catch (err) {
        console.error("[Rate Limiter] Redis error, falling back to Memory Limit:", err);
        // Fall back to memory limit if Redis query fails
        if (checkMemoryLimit(key, options)) {
          return res.status(429).json({ error: options.message });
        }
      }
    } else {
      // Offline fallback: use memory store
      if (checkMemoryLimit(key, options)) {
        return res.status(429).json({ error: options.message });
      }
    }

    return next();
  };
}

function checkMemoryLimit(key: string, options: RateLimitOptions): boolean {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || record.expiresAt < now) {
    // Reset/initialize window
    memoryStore.set(key, {
      count: 1,
      expiresAt: now + options.windowMs,
    });
    return false;
  }

  record.count += 1;
  memoryStore.set(key, record);

  if (record.count > options.max) {
    console.warn(`[Rate Limiter] Blocked key ${key} (Memory). Count: ${record.count}/${options.max}`);
    return true;
  }

  return false;
}

// Pre-defined limiters
export const authLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5,              // max 5 requests per minute
  message: "Too many authentication requests. Please wait a minute and try again.",
  keyPrefix: "auth",
});

export const voiceUploadLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20,             // max 20 recordings per minute
  message: "Too many voice entry records. Please take a small breath and try again.",
  keyPrefix: "voice",
});

export const askQueryLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,             // max 10 past questions per minute
  message: "Too many questions. Please give Clara a moment to reflect and ask again.",
  keyPrefix: "ask",
});
