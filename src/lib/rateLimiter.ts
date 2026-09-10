// In-memory sliding window rate limiter
interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((time) => now - time < 600000); // 10 minutes
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 300000);
}

/**
 * Checks if a key has exceeded the rate limit.
 * @param key Identifier (e.g. IP address)
 * @param limit Maximum allowed requests within the window
 * @param windowMs Window duration in milliseconds (default 10 minutes = 600,000 ms)
 */
export function checkRateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 600000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter timestamps within the current window
  record.timestamps = record.timestamps.filter((time) => now - time < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetTime = oldest + windowMs;
    return {
      allowed: false,
      remaining: 0,
      resetTime,
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: limit - record.timestamps.length,
    resetTime: now + windowMs,
  };
}

/**
 * Extracts client IP from Request headers.
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  return "127.0.0.1";
}
