# MyMuayThai Backend - Code Manual

Welcome to the MyMuayThai backend codebase! This document is a comprehensive guide to help you understand how the backend works, whether you're a developer or just curious about the system architecture.

## 1. Overview

The backend is the core engine behind the MyMuayThai application, responsible for:

- **Data Management**: Storing and managing information about Muay Thai gyms, trainers, classes, provinces, and users in a PostgreSQL database
- **API Services**: Providing RESTful API endpoints for mobile and web applications
- **Business Logic**: Handling complex operations using modern functional patterns
- **Data Integrity**: Ensuring consistent and reliable data through validation and constraints
- **Scalability**: Built with modern tools (Bun, Fastify, Drizzle ORM)

## 2. Technology Stack

- **Runtime**: Bun v1.2+
- **Language**: TypeScript
- **Web Framework**: Fastify
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Documentation**: Swagger/OpenAPI 3.0
- **Security**: Helmet, CORS
- **Testing**: Bun built-in test runner

## 3. Project Structure

```
mymuaythai-be/
├── src/                    # Core application code
│   ├── db/                 # Database configuration and operations
│   ├── routes/             # API endpoint definitions
│   ├── services/           # Functional Service Layer
│   ├── types/              # TypeScript type definitions
│   └── server.ts           # Main application entry point
├── __tests__/              # Functional service layer tests
├── drizzle.config.ts       # Drizzle ORM configuration
├── package.json            # Dependencies and automated scripts
├── tsconfig.json           # TypeScript configuration
├── env.example             # Environment variables template
└── documents/              # Documentation files
```

## 4. Core Logic

### `server.ts` - The Application Entry Point

- **Server Setup**: Configures the Fastify server instance
- **Middleware Registration**: Security headers, CORS, API documentation
- **Route Registration**: Mounts all API routes
- **Database Connection**: Validates connectivity on startup
- **Error Handling**: Global error handling

### `src/db/` - Database Layer

- **Configuration**: PostgreSQL connection pool
- **Schema Definition**: Database tables and relations
- **Migration Runner**: Executes database migrations
- **Seeding**: Sample data seeding scripts

### `src/services/` - Functional Service Layer

- **Architecture**: Functional Service Layer Pattern
- **Benefits**: Better testability, reduced complexity, tree-shaking

## 5. Development Workflow

### Available Scripts

```bash
# Development
bun run dev          # Start development server
bun run build        # Build for production
bun run start        # Start production server
bun run lint         # Run ESLint
bun run format       # Format code with Prettier
bun test            # Run all tests

# Database Management
bun run db:generate  # Generate migrations
bun run db:migrate   # Apply migrations
bun run db:seed      # Seed data
```

### Automated Seeding Workflows

- **For New Developers**: `bun run setup:dev`
- **For Demo/Testing**: `bun run db:fresh:full`
- **For Clean Development Restart**: `bun run db:fresh`

## 6. Testing Infrastructure

- **Test Framework**: Bun built-in test runner
- **Test Location**: `__tests__/services/`
- **Coverage Areas**: GymService, TrainerService, TagService

## 7. Key Concepts

- **Functional Service Layer**: Standalone functions for business logic
- **ORM**: Drizzle ORM for type-safe database operations
- **RESTful API**: Standard HTTP methods
- **Type Safety**: Ensures data consistency
- **Migrations**: Version-controlled database changes

## 8. API Documentation

- **Live Documentation**: Available at `http://localhost:4000/docs`
- **Interactive Testing**: Test API endpoints directly

## 9. Security & Best Practices

- **Input Validation**: Type-safe validation
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Proper setup
- **Security Headers**: Helmet middleware

## 10. Future Extensibility

- **Authentication**: JWT-based auth
- **File Uploads**: Infrastructure ready
- **Caching**: Redis support
- **Real-time Features**: WebSocket support

This manual provides a complete overview of the MyMuayThai backend architecture with its modern **Functional Service Layer Pattern**. The system is built with contemporary best practices, comprehensive automation, type safety, and scalability in mind, making it maintainable and extensible for future growth. 