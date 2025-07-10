# Database Seeding

This document explains how to use the database seeding scripts to populate the database with data for different environments.

## Overview

We use a two-file system for seeding to ensure a clean separation between development and production data.

1.  **`seed-dev.ts`**: This script is for **development only**. It populates the database with a rich set of mock data, including gyms, trainers, and their relationships, to create a realistic development environment. It can be run in two modes:
    *   **Default**: Creates a small, predictable set of data for everyday development.
    *   **Massive**: Creates a large, randomized dataset (50+ gyms/trainers) for UI and performance testing.

2.  **`seed-prod.ts`**: This script is for **production and staging environments**. It seeds only the absolute essential data required for the application to function, such as provinces, the default admin user, and core lookup tables (tags, classes). It **does not** contain any mock gyms or trainers.

**Safety Note**: The development seeder (`seed-dev.ts`) includes a safety check and will **refuse to run** if `NODE_ENV` is set to `production`. The production seeder requires `ADMIN_EMAIL` and `ADMIN_PASSWORD` to be set in your environment variables.

## Prerequisites

Before running any seed script, ensure you have:

1.  **Environment Variables**: A valid `.env` file with your database connection string and any other required variables.
2.  **Database Migrations**: Applied all the latest database migrations by running:
    ```bash
    bun run db:migrate
    ```

## Usage

The following scripts in `package.json` provide an easy way to manage database seeding.

### Development Seeding

*   **To seed the default development dataset:**
    ```bash
    bun run db:seed:dev
    ```

*   **To seed the massive development dataset:**
    ```bash
    bun run db:seed:dev:massive
    ```

*   **To reset the development database** (cleans mock data, then re-seeds the default set):
    ```bash
    bun run db:reset
    ```

### Production Seeding

*   **To seed a production or staging database with essential data:**
    ```bash
    bun run db:seed:prod
    ```
    **Warning**: Only run this in a clean, production-like environment. Ensure your `.env` file is configured correctly for the target database.

### Cleaning the Database

*   **To clean only the mock data** (ideal for development):
    ```bash
    bun run db:cleanup
    ```

*   **To perform a full, destructive cleanup** (use with caution):
    ```bash
    bun run db:cleanup:full
    ```
