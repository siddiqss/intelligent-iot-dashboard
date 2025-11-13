import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

let redis: Redis | null = null;

/**
 * Initialize Redis connection to DragonflyDB
 */
export function initializeCache(): void {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          return null; // Stop retrying after 3 attempts
        }
        return Math.min(times * 200, 2000);
      },
    });

    redis.on('connect', () => {
      console.log('✅ Connected to DragonflyDB cache');
    });

    redis.on('error', (err: Error) => {
      console.error('❌ DragonflyDB connection error:', err);
      redis = null; // Disable caching on error
    });
  } catch (error) {
    console.error('Failed to initialize cache:', error);
    redis = null;
  }
}

/**
 * Cache middleware for GET requests
 * Caches responses with configurable TTL
 */
export function cacheMiddleware(ttlSeconds: number = 30) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET' || !redis) {
      return next();
    }

    const cacheKey = `cache:${req.originalUrl}`;

    try {
      // Try to get from cache
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        const data = JSON.parse(cached);
        res.setHeader('X-Cache', 'HIT');
        return res.json(data);
      }

      // Cache miss - intercept response
      const originalJson = res.json.bind(res);
      res.json = function (body: any) {
        // Store in cache
        if (redis && body) {
          redis.setex(cacheKey, ttlSeconds, JSON.stringify(body)).catch((err: Error) => {
            console.error('Cache set error:', err);
          });
        }
        res.setHeader('X-Cache', 'MISS');
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Continue without caching on error
    }
  };
}

/**
 * Invalidate cache for a specific key pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
  if (!redis) return;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

/**
 * Get cache instance (for testing or direct access)
 */
export function getCache(): Redis | null {
  return redis;
}

