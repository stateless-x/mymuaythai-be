import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import compress from '@fastify/compress';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
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

// Rate limiting
fastify.register(rateLimit, {
  max: rateLimitConfig.max,
  timeWindow: rateLimitConfig.timeWindow,
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
  await fastify.register(adminUsersRoutes, { prefix: '/api' });
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

// Start server
const start = async (): Promise<void> => {
  try {
    // Connect to database
    await checkDatabaseConnection();

    // Start the server
    await fastify.listen(serverConfig);
    fastify.log.info(`🚀 Server is running on http://${serverConfig.host}:${serverConfig.port}`);
    fastify.log.info(`📚 API documentation available at http://${serverConfig.host}:${serverConfig.port}/docs`);
    fastify.log.info(`🏥 Health checks available at http://${serverConfig.host}:${serverConfig.port}/health`);
    fastify.log.info(`🌍 Environment: ${env.NODE_ENV}`);
  } catch (err) {
    fastify.log.error('❌ Failed to start server:', err);
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