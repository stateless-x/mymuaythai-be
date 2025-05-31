# MyMuayThai Backend - Code Manual

Welcome to the MyMuayThai backend codebase! This document is a comprehensive guide to help you understand how the backend works, whether you're a developer or just curious about the system architecture.

## 1. What is this Backend For?

This backend is the core engine behind the MyMuayThai application, responsible for:

*   **Data Management**: Storing and managing information about Muay Thai gyms, trainers, classes, provinces, and users in a PostgreSQL database
*   **API Services**: Providing RESTful API endpoints for mobile and web applications to consume data
*   **Business Logic**: Handling complex operations like search, filtering, relationships between entities
*   **Data Integrity**: Ensuring consistent and reliable data through proper validation and constraints
*   **Scalability**: Built with modern tools (Bun, Fastify, Drizzle ORM) for high performance
*   **Pagination**: Advanced pagination support for efficient data loading (default 20 items per page)

Think of it as the foundation that powers everything - when you search for gyms in Bangkok or view a trainer's profile, this backend processes those requests and delivers the data.

## 2. Technology Stack

*   **Runtime**: Bun v1.2+ (fast JavaScript runtime and package manager with built-in test runner)
*   **Language**: TypeScript (for type safety and better development experience)
*   **Web Framework**: Fastify (high-performance web framework)
*   **Database**: PostgreSQL (robust relational database)
*   **ORM**: Drizzle ORM (modern, type-safe database toolkit)
*   **Documentation**: Swagger/OpenAPI 3.0 (auto-generated API docs)
*   **Security**: Helmet, CORS (security middleware)
*   **Testing**: Bun built-in test runner with comprehensive service layer tests

## 3. Project Structure Overview

```
mymuaythai-be/
├── src/                    # Core application code
│   ├── db/                 # Database configuration and operations
│   ├── routes/             # API endpoint definitions
│   ├── services/           # Business logic layer
│   ├── types/              # TypeScript type definitions
│   └── server.ts           # Main application entry point
├── __tests__/              # Test files
│   └── services/           # Service layer tests
├── drizzle.config.ts       # Drizzle ORM configuration
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── env.example             # Environment variables template
└── documents/              # Documentation files
```

## 4. Deep Dive into `src/` (The Core Logic)

### 4.1. `server.ts` - The Application Entry Point

The main server file that bootstraps the entire application:

**Key Responsibilities:**
*   **Server Setup**: Creates and configures the Fastify server instance
*   **Middleware Registration**: 
    *   `@fastify/helmet`: Security headers and protections
    *   `@fastify/cors`: Cross-origin resource sharing configuration
    *   `@fastify/swagger` & `@fastify/swagger-ui`: Auto-generated API documentation
*   **Route Registration**: Mounts all API routes under `/api` prefix
*   **Database Connection**: Validates database connectivity on startup
*   **Error Handling**: Global error handling and 404 responses
*   **Graceful Shutdown**: Proper cleanup when the server stops

**Important Features:**
*   Health check endpoint at `/health`
*   API documentation available at `/docs`
*   Structured logging with pino-pretty
*   Environment-based configuration (PORT defaults to 3000, HOST defaults to 0.0.0.0)

### 4.2. `src/db/` - Database Layer

This directory contains all database-related code using Drizzle ORM:

#### **`config.ts`** - Database Configuration
*   Creates PostgreSQL connection pool using environment variables
*   Exports the Drizzle ORM client (`db`) configured with the schema
*   Provides `checkDatabaseConnection()` function for health checks
*   Handles connection management and error handling

#### **`schema.ts`** - Database Schema Definition
*   Defines all database tables using Drizzle's schema syntax
*   **Core Tables**:
    *   `users` - User accounts with roles
    *   `provinces` - Thai provinces (bilingual: Thai/English)
    *   `gyms` - Muay Thai training facilities
    *   `trainers` - Individual trainers (can be gym-affiliated or freelance)
    *   `classes` - Training class types
    *   `tags` - Flexible categorization system
*   **Junction Tables**:
    *   `gymImages` - Gym photo galleries
    *   `trainerClasses` - Many-to-many: trainers ↔ classes
    *   `gymTags` - Many-to-many: gyms ↔ tags  
    *   `trainerTags` - Many-to-many: trainers ↔ tags
*   **Relations**: Defines how tables relate to each other using Drizzle's relations API

#### **`migrate.ts`** - Migration Runner
*   Executes database migrations using Drizzle's migration system
*   Applies pending schema changes from the `migrations/` folder
*   Handles connection management and error reporting

#### **`migrations/`** - Version-Controlled Schema Changes
*   Contains auto-generated SQL migration files created by `drizzle-kit generate`
*   Each file represents incremental changes to the database schema
*   Ensures consistent database state across environments

#### **`seed.ts`** - Sample Data Population
*   Populates the database with realistic sample data for development
*   **Includes**:
    *   5 Thai provinces (Bangkok, Chiang Mai, Phuket, Chon Buri, Surat Thani) for testing
    *   2 sample users (admin and regular user)
    *   4 class types (Basic Muay Thai, Advanced, Kids, Cardio)
    *   5 categorization tags
    *   2 gyms with complete details and images
    *   2 trainers (Kru Yod - gym-affiliated, Kru Kaew - freelance) with their class and tag associations
*   Handles proper deletion order for foreign key constraints
*   Includes relationship mappings (gym-tag, trainer-class connections)

#### **`province-seed.ts`** - Production Province Data
*   Dedicated seeding script for all 77 Thai provinces
*   **Complete Coverage**: All official provinces with accurate Thai and English names
*   **Regional Organization**: Provinces organized by 6 geographical regions
*   **Production Ready**: Designed for production environment use
*   **Region Breakdown**:
    *   Central Region: 23 provinces (IDs 1-23)
    *   Eastern Region: 7 provinces (IDs 24-30)
    *   Northern Region: 9 provinces (IDs 31-39)
    *   Northeastern Region: 20 provinces (IDs 40-59)
    *   Southern Region: 15 provinces (IDs 60-74)
    *   Western Region: 2 provinces (IDs 75-76)
*   **Foreign Key Compatibility**: Ensures gym creation works with valid province references

### 4.3. `src/types/` - Type Definitions

#### **`index.ts`** - Comprehensive Type System
*   **Database Entity Types**: Auto-inferred from Drizzle schema
    *   `User`, `NewUser`, `Gym`, `NewGym`, `Trainer`, `NewTrainer`, etc.
    *   Leverages Drizzle's `$inferSelect` and `$inferInsert` for type safety
*   **API Request/Response Types**:
    *   `ApiResponse<T>` - Standardized response wrapper
    *   `CreateGymRequest`, `UpdateGymRequest` - Request DTOs
    *   `GymWithDetails`, `TrainerWithDetails` - Enhanced response types with relations
*   **Utility Types**:
    *   `PaginatedResponse<T>` - For paginated results with items, total, page, pageSize, totalPages
    *   Various specialized interfaces for complex operations

### 4.4. `src/services/` - Business Logic Layer

Contains the core business logic separated from API routing:

#### **`gymService.ts`** - Gym Management Logic
*   **Core Operations**:
    *   `getAllGyms()` - Paginated gym listing with search and filtering (default 10 items per page, configurable)
    *   `getGymById()` - Single gym with full details (province, images, tags, trainers)
    *   `createGym()`, `updateGym()`, `deleteGym()` - CRUD operations
    *   `searchGyms()` - Full-text search across multiple fields with pagination
*   **Image Management**:
    *   `addGymImage()`, `removeGymImage()` - Image CRUD
    *   `getGymImages()` - Retrieve all images for a gym
*   **Filtering**:
    *   `getGymsByProvince()` - Location-based filtering
*   **Advanced Features**:
    *   Pagination support with total count calculation
    *   Multi-field search (Thai/English names, descriptions, province data)
    *   Soft deletes (marks as inactive rather than deleting)
    *   Complex joins for related data using Drizzle ORM

#### **`trainerService.ts`** - Trainer Management Logic (Fully Converted to Drizzle ORM)
*   **Comprehensive Drizzle Implementation**: Completely converted from raw SQL to Drizzle ORM
*   **Core Operations**:
    *   `getAllTrainers()` - Advanced paginated listing with multiple filter options (default 20 items per page)
    *   `getTrainerById()` - Single trainer with full details and relationships
    *   `createTrainer()`, `updateTrainer()`, `deleteTrainer()` - Complete CRUD operations
    *   `searchTrainers()` - Full-text search across names, bio, province, and gym data
*   **Relationship Management**:
    *   `addTrainerClass()`, `removeTrainerClass()` - Trainer-class associations
    *   `getTrainerClasses()` - Retrieve trainer's assigned classes
*   **Advanced Filtering**:
    *   `getTrainersByGym()` - Filter by gym with pagination
    *   `getTrainersByProvince()` - Filter by province with pagination
    *   `getFreelanceTrainers()` - Filter freelance trainers with pagination
*   **Query Features**:
    *   Complex multi-table searches including province and gym data
    *   Support for multiple simultaneous filters (search + province + gym + freelance status)
    *   Proper handling of nullable relationships (freelance trainers)
    *   Type-safe operations with `TrainerWithDetails` response mapping

#### **`provinceService.ts`** - Province Management Logic (Read-Only)
*   **Core Operations**:
    *   `getAllProvinces()` - All provinces sorted by English name
    *   `getAllProvincesThaiSort()` - All provinces sorted by Thai name
    *   `getProvinceById()` - Single province lookup
    *   `searchProvinces()` - Search by Thai or English name
*   **Regional Filtering**:
    *   `getProvincesByRegion()` - Get provinces by geographical region
    *   Supports 6 regions: central, eastern, northern, northeastern, southern, western
*   **Statistics**:
    *   `getProvinceCount()` - Total province count
    *   `getProvincesWithGymCounts()` - Province data with gym statistics
*   **Read-Only Design**: No create, update, or delete operations for data integrity

### 4.5. `src/routes/` - API Endpoint Definitions

Defines the HTTP API interface using Fastify:

#### **`gyms.ts`** - Gym API Endpoints
*   **GET Routes**:
    *   `/api/gyms` - List all gyms (with pagination, search, filtering)
    *   `/api/gyms/:id` - Get specific gym with full details
    *   `/api/gyms/:id/images` - Get gym images
    *   `/api/gyms/province/:provinceId` - Get gyms by province
    *   `/api/gyms/search/:query` - Search gyms with pagination
*   **POST Routes**:
    *   `/api/gyms` - Create new gym
    *   `/api/gyms/:id/images` - Add gym image
*   **PUT Routes**:
    *   `/api/gyms/:id` - Update gym details
*   **DELETE Routes**:
    *   `/api/gyms/:id` - Soft delete gym
    *   `/api/gyms/images/:imageId` - Remove gym image

#### **`trainers.ts`** - Trainer API Endpoints
*   **GET Routes**:
    *   `/api/trainers` - List all trainers with advanced filtering and pagination
    *   `/api/trainers/:id` - Get specific trainer with full details
    *   `/api/trainers/gym/:gymId` - Get trainers by gym with pagination
    *   `/api/trainers/province/:provinceId` - Get trainers by province with pagination
    *   `/api/trainers/freelance` - Get freelance trainers with pagination
    *   `/api/trainers/:id/classes` - Get trainer's classes
    *   `/api/trainers/search/:query` - Search trainers with pagination
*   **POST Routes**:
    *   `/api/trainers` - Create new trainer
    *   `/api/trainers/:id/classes` - Add class to trainer
*   **PUT Routes**:
    *   `/api/trainers/:id` - Update trainer details
*   **DELETE Routes**:
    *   `/api/trainers/:id` - Soft delete trainer
    *   `/api/trainers/:id/classes/:classId` - Remove class from trainer

#### **`provinces.ts`** - Province API Endpoints (Read-Only)
*   **GET Routes**:
    *   `/api/provinces` - List all provinces with sorting and filtering options
    *   `/api/provinces/:id` - Get specific province by ID
    *   `/api/provinces/search/:query` - Search provinces by name (Thai/English)
    *   `/api/provinces/region/:region` - Get provinces by geographical region
    *   `/api/provinces/stats` - Get province statistics and gym counts
*   **Query Parameters**:
    *   `?sort=en|th` - Sort by English (default) or Thai name
    *   `?region=central|eastern|northern|northeastern|southern|western` - Filter by region
    *   `?stats=true` - Include gym count statistics
*   **No CRUD Operations**: Read-only endpoints for data integrity

**Response Format**: All endpoints return standardized `ApiResponse<T>` objects with:
```typescript
{
  success: boolean,
  data?: T,
  message?: string,
  error?: string,
  statusCode?: number
}
```

## 5. Database Design

The system uses a well-structured relational database with:

*   **Core Entities**: Users, Provinces, Gyms, Trainers, Classes, Tags
*   **Relationship Tables**: Junction tables for many-to-many relationships
*   **Data Integrity**: Foreign key constraints and proper normalization
*   **Bilingual Support**: Thai and English fields throughout
*   **Soft Deletes**: `is_active` flags instead of hard deletion
*   **Timestamps**: Creation tracking for auditing

## 6. Development Workflow

### Available Scripts (package.json)
```bash
bun run dev          # Start development server with hot reload
bun run build        # Build for production
bun run start        # Start production server
bun run lint         # Run ESLint
bun run format       # Format code with Prettier
bun run db:generate  # Generate new migrations from schema changes
bun run db:migrate   # Apply pending migrations
bun run db:seed      # Populate database with sample data
bun run db:seed:provinces  # Seed all 77 Thai provinces for production
bun run db:studio    # Open Drizzle Studio (database GUI)
bun test            # Run all tests
bun test --watch    # Run tests in watch mode
```

### Development Process
1. **Environment Setup**: Copy `env.example` to `.env` and configure database
2. **Database Setup**: Run migrations and seeding
3. **Development**: Use `bun run dev` for hot-reload development (server starts on port 3000)
4. **Schema Changes**: Modify `src/db/schema.ts`, then generate and apply migrations
5. **Testing**: Access API docs at `http://localhost:3000/docs` or run `bun test`

## 7. Testing Infrastructure

### Comprehensive Test Coverage
*   **Test Framework**: Bun built-in test runner
*   **Test Location**: `__tests__/services/` directory
*   **Coverage Areas**:
    *   **GymService Tests**: Complete CRUD operations, pagination, search, filtering, image management
    *   **TrainerService Tests**: Full trainer lifecycle, class assignments, freelance filtering, advanced search with pagination

### Test Features
*   **Database Setup**: Each test suite creates and cleans up test data
*   **Relationship Testing**: Tests many-to-many relationships (trainer-classes, gym-tags)
*   **Pagination Testing**: Validates pagination logic and total counts
*   **Error Handling**: Tests edge cases and error conditions
*   **Foreign Key Testing**: Validates referential integrity

### Running Tests
```bash
bun test                              # Run all tests
bun test __tests__/services/          # Run service tests
bun test --watch                      # Watch mode for development
```

## 8. Key Concepts for Non-Backend Developers

*   **ORM (Object-Relational Mapping)**: Drizzle ORM translates TypeScript code to SQL, providing type safety and easier database operations
*   **RESTful API**: Standard HTTP methods (GET, POST, PUT, DELETE) for different operations
*   **Type Safety**: TypeScript ensures data consistency between database, API, and client applications
*   **Migrations**: Version-controlled database changes that can be applied/rolled back systematically
*   **Soft Deletes**: Marking records as inactive instead of deleting them, preserving data integrity
*   **Junction Tables**: Handle many-to-many relationships (e.g., one gym can have many tags, one tag can apply to many gyms)
*   **Pagination**: Breaking large result sets into smaller, manageable chunks (20 items per page for trainers, 10-20 for gyms)
*   **Foreign Keys**: Database constraints that maintain referential integrity between related tables

## 9. API Documentation

The system automatically generates comprehensive API documentation using Swagger/OpenAPI 3.0:

*   **Live Documentation**: Available at `http://localhost:3000/docs` when server is running
*   **Interactive Testing**: Test API endpoints directly from the documentation
*   **Schema Definitions**: View all request/response models
*   **Example Requests**: See sample data for each endpoint

## 10. Security & Best Practices

*   **Input Validation**: Type-safe validation using TypeScript interfaces
*   **SQL Injection Protection**: Parameterized queries via Drizzle ORM
*   **CORS Configuration**: Proper cross-origin resource sharing setup
*   **Security Headers**: Helmet middleware for common security protections
*   **Environment Variables**: Sensitive configuration stored outside code
*   **Error Handling**: Consistent error responses without exposing internal details

## 11. Future Extensibility

The architecture is designed for easy extension:

*   **Authentication**: Can easily add JWT-based auth with role-based permissions
*   **File Uploads**: Infrastructure ready for image upload services
*   **Caching**: Can add Redis for performance optimization
*   **Real-time Features**: WebSocket support for live updates
*   **Multi-tenancy**: Database design supports multiple organizations
*   **Mobile API**: RESTful design compatible with mobile app development

This manual provides a complete overview of the MyMuayThai backend architecture. The system is built with modern best practices, type safety, comprehensive testing, and scalability in mind, making it maintainable and extensible for future growth. 