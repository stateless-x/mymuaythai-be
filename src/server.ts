import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { gymRoutes } from './routes/gyms';
import { trainerRoutes } from './routes/trainers';
import { provinceRoutes } from './routes/provinces';
import { tagRoutes } from './routes/tags';
import { checkDatabaseConnection } from './db/config';

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
});

// Register plugins
fastify.register(helmet, {
  contentSecurityPolicy: false
});

fastify.register(cors, {
  origin: true,
  credentials: true
});

// Swagger documentation
fastify.register(swagger, {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'MyMuayThai API',
      description: 'API for managing Muay Thai gyms and trainers',
      version: '1.0.0'
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server'
      }
    ],
  }
});

fastify.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  }
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'MyMuayThai Backend API'
  };
});

// API routes
fastify.register(async (fastify) => {
  await fastify.register(gymRoutes, { prefix: '/api' });
  await fastify.register(trainerRoutes, { prefix: '/api' });
  await fastify.register(provinceRoutes, { prefix: '/api' });
  await fastify.register(tagRoutes, { prefix: '/api' });
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  const statusCode = error.statusCode || 500;
  fastify.log.error(error);
  
  reply.status(statusCode).send({
    success: false,
    error: error.message || 'Internal Server Error',
    statusCode
  });
});

// Not found handler
fastify.setNotFoundHandler((request, reply) => {
  reply.status(404).send({
    success: false,
    error: 'Route not found',
    statusCode: 404
  });
});

// Start server
const start = async (): Promise<void> => {
  try {
    // Connect to database
    await checkDatabaseConnection();

    // Start the server
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    console.log(`🚀 Server is running on http://${host}:${port}`);
    console.log(`📚 API documentation available at http://${host}:${port}/docs`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Handle process termination
['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, async () => {
    try {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      await fastify.close();
      console.log('✅ Server closed successfully');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during shutdown:', err);
      process.exit(1);
    }
  });
});

// Start the server
start(); 