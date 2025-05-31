import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { checkDatabaseConnection } from '../db/config';

interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
  database?: {
    status: 'connected' | 'disconnected';
    responseTime?: number;
  };
  memory?: {
    used: number;
    total: number;
    percentage: number;
  };
}

export async function healthRoutes(fastify: FastifyInstance) {
  // Basic liveness check - should always return 200 if service is running
  fastify.get('/health/liveness', async (request: FastifyRequest, reply: FastifyReply) => {
    const response: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'MyMuayThai Backend API',
      version: process.env.API_VERSION || '1.0.0',
      uptime: process.uptime(),
    };

    return reply.code(200).send(response);
  });

  // Readiness check - checks if service is ready to handle traffic
  fastify.get('/health/readiness', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    let dbStatus: 'connected' | 'disconnected' = 'disconnected';
    let dbResponseTime: number | undefined;

    try {
      await checkDatabaseConnection();
      dbStatus = 'connected';
      dbResponseTime = Date.now() - startTime;
    } catch (error) {
      fastify.log.error('Database health check failed:', error);
    }

    const memUsage = process.memoryUsage();
    const memory = {
      used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    };

    const response: HealthResponse = {
      status: dbStatus === 'connected' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      service: 'MyMuayThai Backend API',
      version: process.env.API_VERSION || '1.0.0',
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        ...(dbResponseTime !== undefined && { responseTime: dbResponseTime }),
      },
      memory,
    };

    const statusCode = dbStatus === 'connected' ? 200 : 503;
    return reply.code(statusCode).send(response);
  });

  // Basic metrics endpoint
  fastify.get('/health/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    const memUsage = process.memoryUsage();
    
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
      },
      cpu: process.cpuUsage(),
      pid: process.pid,
      version: process.version,
      platform: process.platform,
      arch: process.arch,
    };

    return reply.code(200).send(metrics);
  });
} 