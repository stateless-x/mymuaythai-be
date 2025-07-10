import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Server configuration
  HOST: z.string().default('0.0.0.0'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('4000'),
  
  // Database configuration
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  
  // API configuration
  API_TITLE: z.string().default('MyMuayThai API'),
  API_DESCRIPTION: z.string().default('API for managing Muay Thai gyms and trainers'),
  API_VERSION: z.string().default('1.0.0'),
  
  // Security configuration
  ALLOWED_ORIGINS: z.string().optional(),
  
  // Rate limiting
  RATE_LIMIT_MAX: z.string().regex(/^\d+$/).transform(Number).default('100'),
  RATE_LIMIT_WINDOW: z.string().default('5 minutes'),
  
  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  
  // Optional configurations
  REDIS_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
});

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

// Export validated environment configuration
export const env = validateEnv();

// Helper functions
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Database configuration
export const dbConfig = {
  url: env.DATABASE_URL,
  maxConnections: isProduction ? 20 : 5,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
};

// Server configuration
export const serverConfig = {
  host: env.HOST,
  port: env.PORT,
  trustProxy: isProduction,
};

// CORS configuration
export const corsConfig = {
  origin: isProduction 
    ? env.ALLOWED_ORIGINS?.split(',') || [
        'https://mymuaythai.com',
        'http://localhost:3000',
        'http://localhost:3333'
      ]
    : [
        'http://localhost:3000',
        'http://localhost:3333',
        true
      ],
  credentials: true,
};

// Rate limiting configuration
export const rateLimitConfig = {
  max: isProduction ? env.RATE_LIMIT_MAX : 1000,
  timeWindow: env.RATE_LIMIT_WINDOW,
  allowList: ['/health/liveness', '/health/readiness'],
};

// Logging configuration
export const logConfig = {
  level: isDevelopment ? 'debug' : env.LOG_LEVEL,
  transport: isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  } : undefined,
};

// API documentation configuration
export const swaggerConfig = {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: env.API_TITLE,
      description: env.API_DESCRIPTION,
      version: env.API_VERSION,
      contact: {
        name: 'MyMuayThai Team',
        email: 'api@mymuaythai.com',
      },
    },
    servers: [
      {
        url: `http://${env.HOST}:${env.PORT}`,
        description: isDevelopment ? 'Development server' : 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
        },
      },
    },
  },
}; 