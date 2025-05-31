import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { ZodError } from 'zod';
import { ValidationError, NotFoundError, ConflictError } from '../utils/database';

export interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
  statusCode: number;
  timestamp: string;
  path: string;
}

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
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
      headers: request.headers,
      ip: request.ip,
    },
  }, 'Request error occurred');

  let statusCode = 500;
  let errorMessage = 'Internal Server Error';
  let details: string | undefined;

  // Handle specific error types
  if (error instanceof ZodError) {
    statusCode = 400;
    errorMessage = 'Validation Error';
    details = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
  } else if (error instanceof ValidationError) {
    statusCode = 400;
    errorMessage = error.message;
    details = (error as ValidationError).field;
  } else if (error instanceof NotFoundError) {
    statusCode = 404;
    errorMessage = error.message;
  } else if (error instanceof ConflictError) {
    statusCode = 409;
    errorMessage = error.message;
  } else if (error.statusCode) {
    // Fastify errors
    statusCode = error.statusCode;
    errorMessage = error.message;
  } else if (error.code === 'FST_ERR_VALIDATION') {
    statusCode = 400;
    errorMessage = 'Request validation failed';
    details = error.message;
  } else if (error.code === 'FST_ERR_NOT_FOUND') {
    statusCode = 404;
    errorMessage = 'Route not found';
  } else if (error.message.includes('duplicate key')) {
    statusCode = 409;
    errorMessage = 'Resource already exists';
  } else if (error.message.includes('foreign key')) {
    statusCode = 400;
    errorMessage = 'Invalid reference to related resource';
  }

  const errorResponse: ErrorResponse = {
    success: false,
    error: errorMessage,
    statusCode,
    timestamp,
    path,
    ...(details && { details }),
  };

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    errorResponse.error = 'Internal Server Error';
    delete errorResponse.details;
  }

  await reply.status(statusCode).send(errorResponse);
} 