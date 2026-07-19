import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let redis: Redis | null = null;
let isRedisConnected = false;

try {
  console.log(`[Redis] Connecting to ${redisUrl}...`);
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      // Retry once after 2 seconds, then stop retrying to prevent blocking/spamming logs
      if (times > 1) {
        return null; // Stop retrying
      }
      return 2000;
    },
  });

  redis.on("connect", () => {
    isRedisConnected = true;
    console.log("[Redis] Connected successfully.");
  });

  redis.on("error", (err) => {
    isRedisConnected = false;
    console.warn("[Redis] Warning: Connection error. Falling back to database direct query mode.", err.message);
  });
} catch (e: any) {
  console.error("[Redis] Initialization failed:", e.message);
}

export const getCache = async (key: string): Promise<string | null> => {
  if (!isRedisConnected || !redis) return null;
  try {
    return await redis.get(key);
  } catch (err) {
    console.error(`[Redis] Failed to get cache key ${key}:`, err);
    return null;
  }
};

export const setCache = async (key: string, value: string, ttlSeconds?: number): Promise<void> => {
  if (!isRedisConnected || !redis) return;
  try {
    if (ttlSeconds) {
      await redis.set(key, value, "EX", ttlSeconds);
    } else {
      await redis.set(key, value);
    }
  } catch (err) {
    console.error(`[Redis] Failed to set cache key ${key}:`, err);
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  if (!isRedisConnected || !redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    console.error(`[Redis] Failed to delete cache key ${key}:`, err);
  }
};

export const deleteCachePattern = async (pattern: string): Promise<void> => {
  if (!isRedisConnected || !redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error(`[Redis] Failed to delete cache pattern ${pattern}:`, err);
  }
};

export { redis, isRedisConnected };
