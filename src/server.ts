import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import compress from '@fastify/compress';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import { gymRoutes } from './routes/gyms';
import { trainerRoutes } from './routes/trainers';
import { trainerSelectionRoutes } from './routes/trainerSelection';
import { provinceRoutes } from './routes/provinces';
import { tagRoutes } from './routes/tags';
import { healthRoutes } from './routes/health';
import { dashboardRoutes } from './routes/dashboard';
import adminUsersRoutes from './routes/adminUsers';
import { checkDatabaseConnection } from './db/config';
import { 
  env, 
  serverConfig, 
  corsConfig, 
  rateLimitConfig, 
  logConfig, 
  swaggerConfig 
} from './config/environment';

// Create Fastify instance with better logging
const fastify = Fastify({
  logger: env.NODE_ENV === 'production' 
    ? { level: 'info' }
    : {
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      },
  trustProxy: serverConfig.trustProxy,
});

// Register security plugins
fastify.register(helmet, {
  contentSecurityPolicy: false,
});

// Global rate limiting (for general API endpoints)
fastify.register(rateLimit, {
  max: rateLimitConfig.max,
  timeWindow: rateLimitConfig.timeWindow,
  allowList: rateLimitConfig.allowList,
  errorResponseBuilder: function (request, context) {
    return {
      success: false,
      error: 'Rate limit exceeded',
      statusCode: 429,
      retryAfter: context.ttl,
    };
  },
});

// Compression
fastify.register(compress, { 
  global: true,
  encodings: ['gzip', 'deflate'],
});

// Register multipart plugin with 5 MB per file limit and max 5 files
fastify.register(multipart, {
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
});

// Increase global bodyLimit so 5×5 MB requests are accepted
fastify.addContentTypeParser('*', { bodyLimit: 30 * 1024 * 1024 }, (req, payload, done) => {
  done(null, payload);
});

fastify.register(cors, corsConfig);

// Swagger documentation
fastify.register(swagger, {
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
        description: env.NODE_ENV === 'development' ? 'Development server' : 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        apiKey: {
          type: 'apiKey' as const,
          name: 'X-API-Key',
          in: 'header' as const,
        },
      },
    },
  },
});

fastify.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false,
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
});

// Health check endpoints (no rate limiting)
fastify.register(healthRoutes);

// Basic health endpoint for load balancers
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: env.API_TITLE,
    version: env.API_VERSION,
  };
});

// API routes with rate limiting
fastify.register(async (fastify) => {
  await fastify.register(gymRoutes, { prefix: '/api' });
  await fastify.register(trainerRoutes, { prefix: '/api' });
  await fastify.register(trainerSelectionRoutes, { prefix: '/api' });
  await fastify.register(provinceRoutes, { prefix: '/api' });
  await fastify.register(tagRoutes, { prefix: '/api' });
  await fastify.register(dashboardRoutes, { prefix: '/api' });
  
  // Admin routes with stricter rate limiting for login
  await fastify.register(async (adminFastify) => {
    await adminFastify.register(rateLimit, {
      max: 5,
      timeWindow: rateLimitConfig.timeWindow,
      keyGenerator: (request) => `login:${request.ip}`,
      errorResponseBuilder: function (request, context) {
        return {
          success: false,
          error: 'Too many login attempts',
          message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
          statusCode: 429,
          retryAfter: context.ttl,
        };
      },
      // Only apply to login endpoints
      allowList: (request) => !request.url.includes('/login'),
    });
    
    await adminFastify.register(adminUsersRoutes);
  }, { prefix: '/api' });
});

// Register error handler
fastify.setErrorHandler(async (error, request, reply) => {
  const timestamp = new Date().toISOString();
  const path = request.url;

  // Log error for monitoring
  request.log.error({
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    request: {
      method: request.method,
      url: request.url,
      ip: request.ip,
    },
  }, 'Request error occurred');

  let statusCode = error.statusCode || 500;
  let errorMessage = error.message || 'Internal Server Error';

  // Handle specific error cases
  if (error.code === 'FST_ERR_VALIDATION') {
    statusCode = 400;
    errorMessage = 'Request validation failed';
  } else if (error.code === 'FST_ERR_NOT_FOUND') {
    statusCode = 404;
    errorMessage = 'Route not found';
  }

  const errorResponse = {
    success: false,
    error: errorMessage,
    statusCode,
    timestamp,
    path,
  };

  // Don't expose internal errors in production
  if (env.NODE_ENV === 'production' && statusCode === 500) {
    errorResponse.error = 'Internal Server Error';
  }

  await reply.status(statusCode).send(errorResponse);
});

// Not found handler
fastify.setNotFoundHandler(async (request, reply) => {
  const response = {
    success: false,
    error: 'Route not found',
    statusCode: 404,
    timestamp: new Date().toISOString(),
    path: request.url,
  };
  
  return reply.status(404).send(response);
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  fastify.log.info(`Received ${signal}, shutting down gracefully...`);
  
  try {
    await fastify.close();
    fastify.log.info('✅ Server closed successfully');
    process.exit(0);
  } catch (err) {
    fastify.log.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
};

/**
 * Connects to the database with a retry mechanism.
 * @param retries The number of times to retry the connection.
 * @param delay The initial delay between retries in milliseconds.
 */
const connectToDatabaseWithRetries = async (
  retries = parseInt(process.env.DB_CONNECT_RETRIES ?? '5', 10),
  delay = parseInt(process.env.DB_CONNECT_DELAY_MS ?? '2000', 10),
  backoffFactor = parseFloat(process.env.DB_CONNECT_BACKOFF ?? '2')
) => {
  for (let i = 1; i <= retries; i++) {
    try {
      await checkDatabaseConnection();
      fastify.log.info('✅ Database connection successful.');
      return;
    } catch (error) {
      if (i === retries) {
        fastify.log.error('❌ Final attempt to connect to database failed. Exiting.');
        throw error;
      }
      fastify.log.warn(`⚠️ Database connection failed. Attempt ${i} of ${retries}. Retrying in ${delay / 1000}s...`);
      await new Promise((res) => setTimeout(res, delay));
      delay = Math.floor(delay * backoffFactor);
    }
  }
};

// Start server
const start = async (): Promise<void> => {
  try {
    // Connect to database with retries
    await connectToDatabaseWithRetries();

    // Start the server (pass only allowed options)
    await fastify.listen({ port: serverConfig.port, host: serverConfig.host });
    fastify.log.info(`🚀 Server is running on http://${serverConfig.host}:${serverConfig.port}`);
    fastify.log.info(`📚 API documentation available at http://${serverConfig.host}:${serverConfig.port}/docs`);
    fastify.log.info(`🏥 Health checks available at http://${serverConfig.host}:${serverConfig.port}/health`);
    fastify.log.info(`🌍 Environment: ${env.NODE_ENV}`);
  } catch (err) {
    // Properly log the error object so we can see details
    fastify.log.error({ err }, '❌ Failed to start server');
    // Fallback console for situations where logger is mis-configured
    // @ts-ignore
    if (err && err.stack) console.error(err);
    process.exit(1);
  }
};

// Handle process termination
['SIGINT', 'SIGTERM', 'SIGUSR2'].forEach((signal) => {
  process.on(signal, () => gracefulShutdown(signal));
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  fastify.log.fatal('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  fastify.log.fatal('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start the server
start(); 