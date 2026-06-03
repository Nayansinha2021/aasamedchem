import { prisma } from './prisma';

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}

/**
 * Checks if a request exceeds a rate limit threshold.
 * Uses the database so that limits are consistent across serverless instances.
 * 
 * @param key Unique key to identify the rate-limit bucket (e.g., "login:ip:1.1.1.1" or "login:email:foo@bar.com")
 * @param limit Maximum allowed points within the window
 * @param windowMs Time window in milliseconds (e.g., 60000 for 1 minute)
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = new Date();

  // Async background clean up of expired keys to keep the database size minimal
  prisma.rateLimit.deleteMany({
    where: { expireAt: { lt: now } },
  }).catch((err) => console.error('Pruning rate limits failed:', err));

  try {
    // Find or create rate limit record
    const record = await prisma.rateLimit.findUnique({
      where: { key },
    });

    if (!record) {
      // Create new record
      const expireAt = new Date(now.getTime() + windowMs);
      await prisma.rateLimit.create({
        data: {
          key,
          points: 1,
          expireAt,
        },
      });

      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: expireAt,
      };
    }

    const hasExpired = record.expireAt.getTime() < now.getTime();

    if (hasExpired) {
      // Reset window
      const expireAt = new Date(now.getTime() + windowMs);
      await prisma.rateLimit.update({
        where: { key },
        data: {
          points: 1,
          expireAt,
        },
      });

      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: expireAt,
      };
    }

    if (record.points >= limit) {
      // Limit exceeded
      return {
        success: false,
        limit,
        remaining: 0,
        reset: record.expireAt,
      };
    }

    // Increment points
    const newPoints = record.points + 1;
    await prisma.rateLimit.update({
      where: { key },
      data: {
        points: newPoints,
      },
    });

    return {
      success: true,
      limit,
      remaining: limit - newPoints,
      reset: record.expireAt,
    };
  } catch (error) {
    console.error('Rate limiting error, failing open for safety:', error);
    // Fail open if database rate limit check fails to prevent system locks
    return {
      success: true,
      limit,
      remaining: 1,
      reset: now,
    };
  }
}
