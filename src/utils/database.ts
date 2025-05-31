import { db } from '../db/config';

export type TransactionCallback<T> = (tx: any) => Promise<T>;

/**
 * Execute operations within a database transaction
 * Automatically handles rollback on errors
 */
export async function withTransaction<T>(callback: TransactionCallback<T>): Promise<T> {
  return await db.transaction(async (tx) => {
    return await callback(tx);
  });
}

/**
 * Custom error classes for better error handling
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with ID ${id} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
} 