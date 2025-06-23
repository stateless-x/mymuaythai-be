import { FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../config/environment';

// In-memory rate limiter (use Redis in production)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configurations
const RATE_LIMITS = {
  login: { max: 5, windowMs: 5 * 60 * 1000 }, // 5 attempts per 5 minutes
  api: { max: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  adminActions: { max: 50, windowMs: 60 * 1000 }, // 50 admin actions per minute
};

export function createRateLimiter(type: keyof typeof RATE_LIMITS) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const config = RATE_LIMITS[type];
    const key = `${type}:${request.ip}`;
    const now = Date.now();
    
    // Clean up expired entries
    if (rateLimitStore.size > 10000) {
      cleanupExpiredEntries();
    }
    
    let entry = rateLimitStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      // New window or expired entry
      entry = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      rateLimitStore.set(key, entry);
    } else {
      // Increment count in current window
      entry.count++;
      
      if (entry.count > config.max) {
        const resetTimeSeconds = Math.ceil((entry.resetTime - now) / 1000);
        
        return reply.status(429).send({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${resetTimeSeconds} seconds.`,
          retryAfter: resetTimeSeconds,
        });
      }
    }
    
    // Add rate limit headers
    reply.header('X-RateLimit-Limit', config.max);
    reply.header('X-RateLimit-Remaining', Math.max(0, config.max - entry.count));
    reply.header('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));
  };
}

function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Specific rate limiters
export const loginRateLimit = createRateLimiter('login');
export const apiRateLimit = createRateLimiter('api');
export const adminRateLimit = createRateLimiter('adminActions'); 