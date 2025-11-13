import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

let redis: Redis | null = null;

/**
 * Initialize Redis connection for rate limiting
 */
export function initializeRateLimiter(): void {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    });

    redis.on('connect', () => {
      console.log('✅ Rate limiter connected to DragonflyDB');
    });

    redis.on('error', (err: Error) => {
      console.error('❌ Rate limiter DragonflyDB error:', err);
      redis = null;
    });
  } catch (error) {
    console.error('Failed to initialize rate limiter:', error);
    redis = null;
  }
}

/**
 * Rate limiting middleware using sliding window log algorithm (industry standard)
 * Implements proper sliding window with per-endpoint limits
 * @param maxRequests Maximum number of requests allowed
 * @param windowSeconds Time window in seconds
 * @param endpoint Optional endpoint identifier for per-endpoint limiting
 */
export function rateLimiter(
  maxRequests: number = 100, 
  windowSeconds: number = 60,
  endpoint?: string
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting if Redis is not available (graceful degradation)
    if (!redis) {
      return next();
    }

    // Skip rate limiting for health checks
    if (req.path === '/health') {
      return next();
    }

    // Get client IP address
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    
    // Create key with endpoint if provided (for per-endpoint limiting)
    const endpointKey = endpoint || req.path.replace(/\/api\//, '').replace(/\//g, ':') || 'default';
    const key = `ratelimit:${endpointKey}:${clientIp}`;
    const now = Date.now();
    const windowStart = now - (windowSeconds * 1000);

    try {
      // Sliding window log algorithm: store timestamps of requests
      // Remove old entries outside the window
      const pipeline = redis.pipeline();
      
      // Add current request timestamp
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      
      // Remove entries outside the window
      pipeline.zremrangebyscore(key, 0, windowStart);
      
      // Count requests in current window
      pipeline.zcard(key);
      
      // Set expiration on the key
      pipeline.expire(key, windowSeconds);
      
      const results = await pipeline.exec();
      
      if (!results) {
        throw new Error('Redis pipeline execution failed');
      }

      // Get count from zcard result (index 2 in pipeline)
      const count = results[2]?.[1] as number || 0;

      // Calculate reset time
      const resetTime = now + (windowSeconds * 1000);
      const remaining = Math.max(0, maxRequests - count);
      const retryAfter = count >= maxRequests ? Math.ceil((resetTime - now) / 1000) : 0;

      // Set standard rate limit headers (RFC 6585)
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());
      res.setHeader('X-RateLimit-Reset', Math.floor(resetTime / 1000).toString());
      
      if (count >= maxRequests) {
        // Rate limit exceeded - add Retry-After header (RFC 7231)
        res.setHeader('Retry-After', retryAfter.toString());
        return res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded for ${endpointKey}. Maximum ${maxRequests} requests per ${windowSeconds} seconds.`,
          limit: maxRequests,
          window: windowSeconds,
          retryAfter: retryAfter,
        });
      }
      
      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Graceful degradation: continue without rate limiting on error
      next();
    }
  };
}

/**
 * Clear rate limit for a specific IP or all IPs
 */
export async function clearRateLimit(ip?: string): Promise<void> {
  if (!redis) return;

  try {
    if (ip) {
      const key = `ratelimit:${ip}`;
      await redis.del(key);
    } else {
      // Clear all rate limit keys
      const keys = await redis.keys('ratelimit:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  } catch (error) {
    console.error('Error clearing rate limit:', error);
  }
}

/**
 * Get rate limiter Redis instance (for testing or direct access)
 */
export function getRateLimiterRedis(): Redis | null {
  return redis;
}

