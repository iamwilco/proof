type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

const RATE_LIMITS = new Map<string, RateLimitEntry>();

export const rateLimit = ({ key, limit, windowMs }: RateLimitOptions) => {
  const now = Date.now();
  const entry = RATE_LIMITS.get(key);

  if (!entry || entry.resetAt <= now) {
    RATE_LIMITS.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count += 1;
  RATE_LIMITS.set(key, entry);

  return entry.count > limit;
};
