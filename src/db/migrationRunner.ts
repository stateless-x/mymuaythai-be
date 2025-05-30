import { pool } from './config';
import * as migration001 from './migrations/001_initial_schema';

interface Migration {
  name: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

// Registry of all migrations
const migrations: Migration[] = [
  {
    name: '001_initial_schema',
    up: migration001.up,
    down: migration001.down
  }
];

export class MigrationRunner {
  async ensureMigrationsTable(): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          migration_name TEXT NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } finally {
      client.release();
    }
  }

  async getExecutedMigrations(): Promise<string[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT migration_name FROM migrations ORDER BY executed_at ASC'
      );
      return result.rows.map(row => row.migration_name);
    } finally {
      client.release();
    }
  }

  async runMigrations(): Promise<void> {
    console.log('🚀 Starting production-safe migrations...\n');

    await this.ensureMigrationsTable();
    const executedMigrations = await this.getExecutedMigrations();

    console.log(`📊 Already executed: ${executedMigrations.length} migrations`);
    
    const pendingMigrations = migrations.filter(
      migration => !executedMigrations.includes(migration.name)
    );

    if (pendingMigrations.length === 0) {
      console.log('✅ All migrations are up to date!');
      return;
    }

    console.log(`🔄 Running ${pendingMigrations.length} pending migrations:\n`);

    for (const migration of pendingMigrations) {
      try {
        console.log(`📝 Executing migration: ${migration.name}`);
        await migration.up();
        console.log(`✅ Migration ${migration.name} completed\n`);
      } catch (error) {
        console.error(`❌ Migration ${migration.name} failed:`, error);
        throw error;
      }
    }

    console.log('🎉 All migrations completed successfully!');
  }

  async rollbackLastMigration(): Promise<void> {
    console.log('🔄 Rolling back last migration...\n');

    await this.ensureMigrationsTable();
    const executedMigrations = await this.getExecutedMigrations();

    if (executedMigrations.length === 0) {
      console.log('ℹ️  No migrations to rollback');
      return;
    }

    const lastMigration = executedMigrations[executedMigrations.length - 1];
    const migrationToRollback = migrations.find(m => m.name === lastMigration);

    if (!migrationToRollback) {
      throw new Error(`Migration ${lastMigration} not found in registry`);
    }

    try {
      console.log(`📝 Rolling back migration: ${migrationToRollback.name}`);
      await migrationToRollback.down();
      console.log(`✅ Migration ${migrationToRollback.name} rolled back successfully`);
    } catch (error) {
      console.error(`❌ Rollback of ${migrationToRollback.name} failed:`, error);
      throw error;
    }
  }

  async getMigrationStatus(): Promise<void> {
    console.log('📊 Migration Status:\n');

    await this.ensureMigrationsTable();
    const executedMigrations = await this.getExecutedMigrations();

    console.log('Available migrations:');
    migrations.forEach(migration => {
      const isExecuted = executedMigrations.includes(migration.name);
      const status = isExecuted ? '✅ EXECUTED' : '⏳ PENDING';
      console.log(`  ${migration.name}: ${status}`);
    });

    console.log(`\nTotal: ${migrations.length} migrations, ${executedMigrations.length} executed`);
  }
} 