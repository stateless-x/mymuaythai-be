# MyMuayThai Backend - Code Manual

Welcome to the MyMuayThai backend codebase! This document is a comprehensive guide to help you understand how the backend works, whether you're a developer or just curious about the system architecture.

## 1. What is this Backend For?

This backend is the core engine behind the MyMuayThai application, responsible for:

*   **Data Management**: Storing and managing information about Muay Thai gyms, trainers, classes, provinces, and users in a PostgreSQL database
*   **API Services**: Providing RESTful API endpoints for mobile and web applications to consume data
*   **Business Logic**: Handling complex operations like search, filtering, relationships between entities using modern functional patterns
*   **Data Integrity**: Ensuring consistent and reliable data through proper validation and constraints
*   **Scalability**: Built with modern tools (Bun, Fastify, Drizzle ORM) and functional architecture for high performance
*   **Pagination**: Advanced pagination support for efficient data loading (default 20 items per page)
*   **Automated Database Seeding**: Comprehensive automation for setting up development, testing, and production environments
*   **Functional Service Layer**: Modern functional programming approach for better maintainability and testability

Think of it as the foundation that powers everything - when you search for gyms in Bangkok or view a trainer's profile, this backend processes those requests through clean functional service layers and delivers the data.

## 2. Technology Stack

*   **Runtime**: Bun v1.2+ (fast JavaScript runtime and package manager with built-in test runner)
*   **Language**: TypeScript (for type safety and better development experience)
*   **Web Framework**: Fastify (high-performance web framework)
*   **Database**: PostgreSQL (robust relational database)
*   **ORM**: Drizzle ORM (modern, type-safe database toolkit)
*   **Documentation**: Swagger/OpenAPI 3.0 (auto-generated API docs)
*   **Security**: Helmet, CORS (security middleware)
*   **Testing**: Bun built-in test runner with comprehensive functional service layer tests
*   **Database Management**: Automated seeding with conflict resolution and idempotent operations
*   **Architecture**: Functional Service Layer Pattern (standalone exported functions instead of classes)

## 3. Project Structure Overview

```
mymuaythai-be/
├── src/                    # Core application code
│   ├── db/                 # Database configuration and operations
│   │   ├── config.ts       # Database connection setup
│   │   ├── schema.ts       # Database schema definitions
│   │   ├── migrate.ts      # Migration runner
│   │   ├── seed.ts         # Comprehensive sample data seeding
│   │   ├── dev-seed.ts     # Essential development data seeding
│   │   ├── province-seed.ts # All 76 Thai provinces seeding
│   │   └── migrations/     # Version-controlled schema changes
│   ├── routes/             # API endpoint definitions
│   ├── services/           # Functional Service Layer (Business logic functions)
│   ├── types/              # TypeScript type definitions
│   └── server.ts           # Main application entry point
├── __tests__/              # Functional service layer tests
│   └── services/           # Comprehensive functional testing suite
├── drizzle.config.ts       # Drizzle ORM configuration
├── package.json            # Dependencies and automated scripts
├── tsconfig.json           # TypeScript configuration
├── env.example             # Environment variables template
└── documents/              # Documentation files
    └── code-manual.md      # This comprehensive guide
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

#### **`seed.ts`** - Comprehensive Sample Data Seeding
*   **Enhanced with Conflict Resolution**: Uses `onConflictDoNothing()` for idempotent operations
*   **Comprehensive Sample Data**:
    *   5 complete Muay Thai gyms across different provinces with realistic details
    *   5 professional trainers with varied specializations (gym-affiliated and freelance)
    *   5 training classes with Thai and English descriptions
    *   5 useful categorization tags
    *   Complete relationship mappings (gym-tag, trainer-class associations)
*   **Safe Execution**: Can be run multiple times without causing duplicate key errors
*   **Realistic Data**: All content includes proper Thai language support
*   **Foreign Key Compliance**: All relationships use correct province IDs from the database

#### **`dev-seed.ts`** - Essential Development Data Seeding (NEW)
*   **Lightweight Development Setup**: Optimized for quick development environment setup
*   **Essential Data Only**:
    *   5 key provinces (Bangkok, Chiang Mai, Phuket, Chon Buri, Surat Thani)
    *   3 development users (admin, dev, test accounts)
    *   4 essential Muay Thai classes
    *   5 useful categorization tags
    *   2 sample gyms (Dev Muay Thai Gym, Test Fight Club)
    *   2 sample trainers (one gym-based, one freelance)
    *   Sample relationships between entities
*   **Idempotent Operations**: Safe to run multiple times with conflict resolution
*   **Development Focused**: Includes test accounts and development-friendly data
*   **Relationship Management**: Properly handles many-to-many relationships with safety checks

#### **`province-seed.ts`** - Production Province Data
*   Dedicated seeding script for all 76 Thai provinces
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

### 4.4. `src/services/` - Functional Service Layer (Business Logic)

**🎯 Architecture**: The service layer follows a **Functional Service Layer Pattern** using standalone exported functions instead of traditional class-based approaches.

**Benefits of Functional Approach:**
*   **Better Testability**: Standalone functions are easier to mock and test
*   **Reduced Complexity**: No class instantiation or state management 
*   **Tree-shaking**: Better bundle optimization with unused function elimination
*   **Functional Programming**: Encourages immutable data flow and pure functions
*   **TypeScript Integration**: Enhanced type inference and intellisense support

#### **`gymService.ts`** - Gym Management Functional Logic
*   **Functional Architecture**: All operations are standalone exported functions
*   **Core Operations**:
    *   `export async function getAllGyms()` - Paginated gym listing with search and filtering (default 10 items per page, configurable)
    *   `export async function getGymById()` - Single gym with full details (province, images, tags, trainers)
    *   `export async function createGym()`, `updateGym()`, `deleteGym()` - CRUD operations
    *   `export async function searchGyms()` - Full-text search across multiple fields with pagination
*   **Image Management**:
    *   `export async function addGymImage()`, `removeGymImage()` - Image CRUD
    *   `export async function getGymImages()` - Retrieve all images for a gym
*   **Filtering**:
    *   `export async function getGymsByProvince()` - Location-based filtering
*   **Helper Functions**:
    *   `function mapRawGymToGymWithDetails()` - Standalone helper for data transformation
*   **Advanced Features**:
    *   Pagination support with total count calculation
    *   Multi-field search (Thai/English names, descriptions, province data)
    *   Soft deletes (marks as inactive rather than deleting)
    *   Complex joins for related data using Drizzle ORM

#### **`trainerService.ts`** - Trainer Management Functional Logic
*   **Fully Functional Implementation**: Completely converted from class-based to standalone function approach
*   **Core Operations**:
    *   `export async function getAllTrainers()` - Advanced paginated listing with multiple filter options (default 20 items per page)
    *   `export async function getTrainerById()` - Single trainer with full details and relationships
    *   `export async function createTrainer()`, `updateTrainer()`, `deleteTrainer()` - Complete CRUD operations
    *   `export async function searchTrainers()` - Full-text search across names, bio, province, and gym data
*   **Relationship Management**:
    *   `export async function addTrainerClass()`, `removeTrainerClass()` - Trainer-class associations
    *   `export async function getTrainerClasses()` - Retrieve trainer's assigned classes
*   **Advanced Filtering**:
    *   `export async function getTrainersByGym()` - Filter by gym with pagination
    *   `export async function getTrainersByProvince()` - Filter by province with pagination
    *   `export async function getFreelanceTrainers()` - Filter freelance trainers with pagination
*   **Helper Functions**:
    *   `function mapRawTrainerToTrainerWithDetails()` - Standalone helper for data transformation
*   **Query Features**:
    *   Complex multi-table searches including province and gym data
    *   Support for multiple simultaneous filters (search + province + gym + freelance status)
    *   Proper handling of nullable relationships (freelance trainers)
    *   Type-safe operations with `TrainerWithDetails` response mapping

#### **`tagService.ts`** - Tag Management Functional Logic
*   **Complete Functional Implementation**: All operations as standalone exported functions
*   **Core Operations**:
    *   `export async function getAllTags()` - Paginated tag listing with optional statistics
    *   `export async function getTagById()` - Single tag lookup
    *   `export async function createTag()`, `updateTag()`, `deleteTag()` - Complete CRUD operations
    *   `export async function searchTags()` - Full-text search across Thai and English names
*   **Advanced Features**:
    *   `export async function getTagUsageStats()` - Get usage statistics for tags
    *   `export async function getAllTagsWithStats()` - All tags with usage counts
*   **Conflict Resolution**:
    *   Smart delete validation (prevents deletion of tags in use)
    *   Usage count validation before deletion operations
*   **Search Capabilities**:
    *   Bilingual search support (Thai/English)
    *   Pagination with total count calculation

#### **`provinceService.ts`** - Province Management Logic (Legacy Class-based)
*   **Legacy Architecture**: Maintained as class-based for compatibility (read-only service)
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

Defines the HTTP API interface using Fastify with **functional service integration**:

#### **`gyms.ts`** - Gym API Endpoints
*   **Functional Service Integration**: 
    ```typescript
    import * as gymService from '../services/gymService';
    // Direct function calls - no class instantiation
    const gyms = await gymService.getAllGyms(page, pageSize, searchTerm, provinceId);
    ```
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
*   **Functional Service Integration**:
    ```typescript
    import * as trainerService from '../services/trainerService';
    // All operations use direct function calls
    const trainers = await trainerService.getAllTrainers(page, pageSize, searchTerm, provinceId, gymId, isFreelance);
    ```
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

#### **`tags.ts`** - Tag API Endpoints
*   **Functional Service Integration**:
    ```typescript
    import * as tagService from '../services/tagService';
    // Clean functional calls throughout
    const tags = await tagService.getAllTags(page, pageSize);
    const stats = await tagService.getTagUsageStats(id);
    ```
*   **GET Routes**:
    *   `/api/tags` - List all tags with pagination and optional usage statistics
    *   `/api/tags/:id` - Get specific tag by ID
    *   `/api/tags/search/:query` - Search tags by name (Thai/English)
    *   `/api/tags/:id/stats` - Get tag usage statistics
*   **POST Routes**:
    *   `/api/tags` - Create new tag
*   **PUT Routes**:
    *   `/api/tags/:id` - Update tag details
*   **DELETE Routes**:
    *   `/api/tags/:id` - Delete tag (with usage validation)

#### **`provinces.ts`** - Province API Endpoints (Class-based Legacy)
*   **Legacy Integration**: Still uses class-based service for compatibility
*   **GET Routes**: Read-only endpoints for provinces
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

### Available Scripts (package.json) - ENHANCED AUTOMATION

```bash
# Development
bun run dev          # Start development server with hot reload
bun run build        # Build for production
bun run start        # Start production server
bun run lint         # Run ESLint
bun run format       # Format code with Prettier
bun test            # Run all tests
bun test --watch    # Run tests in watch mode

# Database Schema Management
bun run db:generate  # Generate new migrations from schema changes
bun run db:migrate   # Apply pending migrations
bun run db:studio    # Open Drizzle Studio (database GUI)

# Database Seeding (NEW AUTOMATION)
bun run db:seed:provinces    # Seed all 76 Thai provinces (production ready)
bun run db:seed:dev         # Seed essential development data (recommended for dev)
bun run db:seed             # Seed comprehensive sample data (full demo/testing)

# Database Management (NEW AUTOMATED WORKFLOWS)
bun run db:cleanup          # Clean all data from database
bun run db:reset            # Cleanup + migrate (fresh database)
bun run db:fresh            # Reset + provinces + essential dev data
bun run db:fresh:full       # Reset + provinces + comprehensive sample data
bun run setup:dev           # Migrate + provinces + dev data (first-time setup)
```

### Automated Seeding Workflows (NEW)

**For New Developers (Recommended):**
```bash
bun run setup:dev
```
*   Runs database migrations
*   Seeds all Thai provinces
*   Adds essential development data (users, gyms, trainers, classes, tags)
*   Sets up sample relationships
*   Perfect for first-time development environment setup

**For Demo/Testing:**
```bash
bun run db:fresh:full
```
*   Resets the entire database
*   Runs migrations
*   Seeds all provinces and comprehensive sample data
*   Ideal for demonstrations or testing with realistic data

**For Clean Development Restart:**
```bash
bun run db:fresh
```
*   Resets the database
*   Sets up essential development data only
*   Quick way to start with a clean slate

### Seeding Features (NEW)

*   **✅ Idempotent**: All seeding scripts can be run multiple times safely
*   **✅ Conflict Resolution**: Uses `ON CONFLICT DO NOTHING` strategy
*   **✅ Realistic Data**: Thai language support with proper province associations
*   **✅ Relationship Mapping**: Proper foreign key relationships
*   **✅ Development Ready**: Includes test accounts and sample entities
*   **✅ Error Handling**: Comprehensive error handling and logging

### Development Process
1. **Environment Setup**: Copy `env.example` to `.env` and configure database
2. **First-Time Setup**: Run `bun run setup:dev` for complete development environment
3. **Development**: Use `bun run dev` for hot-reload development (server starts on port 3000)
4. **Schema Changes**: Modify `src/db/schema.ts`, then generate and apply migrations
5. **Testing**: Access API docs at `http://localhost:3000/docs` or run `bun test`
6. **Data Reset**: Use `bun run db:fresh` when you need a clean development environment

## 7. Testing Infrastructure

### Comprehensive Functional Test Coverage
*   **Test Framework**: Bun built-in test runner with functional testing approach
*   **Test Location**: `__tests__/services/` directory
*   **Architecture**: All tests follow functional testing patterns instead of class-based testing
*   **Coverage Areas**:
    *   **GymService Functions**: Complete CRUD operations, pagination, search, filtering, image management
    *   **TrainerService Functions**: Full trainer lifecycle, class assignments, freelance filtering, advanced search with pagination
    *   **TagService Functions**: Tag management, usage statistics, search functionality with conflict resolution

### Functional Testing Features
*   **Direct Function Testing**: Tests import and call standalone functions directly
    ```typescript
    import * as gymService from '../../src/services/gymService';
    const result = await gymService.getAllGyms(1, 10);
    ```
*   **Database Mocking**: Sophisticated Drizzle ORM mocking with fluent query builder simulation
*   **Type Safety Testing**: Comprehensive TypeScript type compatibility validation
*   **Relationship Testing**: Tests many-to-many relationships (trainer-classes, gym-tags)
*   **Pagination Testing**: Validates pagination logic and total counts
*   **Error Handling**: Tests edge cases and error conditions
*   **Foreign Key Testing**: Validates referential integrity

### Test Architecture Benefits
*   **No Class Instantiation**: Tests run directly against functions, simplifying setup
*   **Better Isolation**: Each function can be tested independently
*   **Improved Mocking**: Easier to mock individual functions rather than entire class instances
*   **Enhanced Type Checking**: Better TypeScript integration with functional testing

### Running Tests
```bash
bun test                              # Run all functional tests
bun test __tests__/services/          # Run service function tests
bun test --watch                      # Watch mode for development
```

## 8. Database Seeding System (COMPREHENSIVE NEW SECTION)

The MyMuayThai backend includes a sophisticated database seeding system designed for different environments and use cases:

### 8.1. Seeding Scripts Overview

| Script | Purpose | Data Included | Use Case |
|--------|---------|---------------|----------|
| `bun run db:seed:provinces` | Foundation data | All 76 Thai provinces | Production setup |
| `bun run db:seed:dev` | Development essentials | 5 provinces, 2 gyms, 2 trainers, classes, tags | Quick dev setup |
| `bun run db:seed` | Comprehensive demo | 5 gyms, 5 trainers, complete relationships | Full testing/demo |

### 8.2. Automated Workflow Scripts

| Script | Process | Best For |
|--------|---------|----------|
| `bun run setup:dev` | Migrate → Provinces → Dev data | New developers |
| `bun run db:fresh` | Reset → Migrate → Provinces → Dev data | Clean dev restart |
| `bun run db:fresh:full` | Reset → Migrate → Provinces → Full data | Demo preparation |
| `bun run db:reset` | Cleanup → Migrate | Database schema updates |

### 8.3. Sample Data Details

#### Development Data (`db:seed:dev`)
*   **Provinces**: Bangkok, Chiang Mai, Phuket, Chon Buri, Surat Thani
*   **Users**: admin@mymuaythai.dev, dev@mymuaythai.dev, test@mymuaythai.dev
*   **Gyms**: 
    *   Dev Muay Thai Gym (Bangkok) - Development testing facility
    *   Test Fight Club (Chiang Mai) - System testing facility
*   **Trainers**:
    *   Dev Trainer - Gym-based trainer for development
    *   Test Instructor - Freelance instructor for testing
*   **Classes**: Basic, Advanced, Kids, Cardio Muay Thai
*   **Tags**: Beginner Friendly, Professional, Good Atmosphere, Fully Equipped, English Speaking

#### Comprehensive Data (`db:seed`)
*   **All development data above, plus:**
*   **Additional Gyms**: Siam Thai Fitness, Champion Muay Thai Gym, Ratchadamnoen Muay Thai
*   **Additional Trainers**: Somchai Phetdam, Wichai Seehamat, Arun Changphueak, etc.
*   **Complete Relationships**: Full gym-tag and trainer-class associations

### 8.4. Conflict Resolution Features

*   **Idempotent Operations**: All scripts use `onConflictDoNothing()` for safe re-execution
*   **Foreign Key Validation**: Proper province ID references to prevent constraint violations
*   **Relationship Safety**: Conditional relationship creation with existence checks
*   **Error Handling**: Comprehensive error logging and graceful failure handling

### 8.5. Production Considerations

*   **Province Data**: Production-ready with all 76 official Thai provinces
*   **Regional Organization**: Proper geographical grouping (Central, Eastern, Northern, etc.)
*   **Bilingual Support**: Accurate Thai and English province names
*   **Scalable Design**: Database structure supports thousands of gyms and trainers

## 9. Key Concepts for Non-Backend Developers

*   **Functional Service Layer**: Instead of classes, we use standalone functions that can be imported and called directly, making code more modular and testable
*   **Standalone Functions**: Business logic operations that don't require class instantiation or state management
*   **Import Pattern**: Services are imported as `import * as serviceName` and functions called as `serviceName.functionName()`
*   **Tree-shaking**: Build optimization that removes unused functions from the final bundle
*   **Pure Functions**: Functions that don't have side effects and return predictable outputs for given inputs
*   **ORM (Object-Relational Mapping)**: Drizzle ORM translates TypeScript code to SQL, providing type safety and easier database operations
*   **RESTful API**: Standard HTTP methods (GET, POST, PUT, DELETE) for different operations
*   **Type Safety**: TypeScript ensures data consistency between database, API, and client applications
*   **Migrations**: Version-controlled database changes that can be applied/rolled back systematically
*   **Soft Deletes**: Marking records as inactive instead of deleting them, preserving data integrity
*   **Junction Tables**: Handle many-to-many relationships (e.g., one gym can have many tags, one tag can apply to many gyms)
*   **Pagination**: Breaking large result sets into smaller, manageable chunks (20 items per page for trainers, 10-20 for gyms)
*   **Foreign Keys**: Database constraints that maintain referential integrity between related tables
*   **Idempotent Operations**: Database operations that can be safely repeated without causing errors or inconsistencies
*   **Conflict Resolution**: Handling situations where data already exists during seeding operations

## 10. API Documentation

The system automatically generates comprehensive API documentation using Swagger/OpenAPI 3.0:

*   **Live Documentation**: Available at `http://localhost:3000/docs` when server is running
*   **Interactive Testing**: Test API endpoints directly from the documentation
*   **Schema Definitions**: View all request/response models
*   **Example Requests**: See sample data for each endpoint

## 11. Security & Best Practices

*   **Input Validation**: Type-safe validation using TypeScript interfaces
*   **SQL Injection Protection**: Parameterized queries via Drizzle ORM
*   **CORS Configuration**: Proper cross-origin resource sharing setup
*   **Security Headers**: Helmet middleware for common security protections
*   **Environment Variables**: Sensitive configuration stored outside code
*   **Error Handling**: Consistent error responses without exposing internal details
*   **Database Integrity**: Foreign key constraints and proper normalization
*   **Conflict Resolution**: Safe data seeding with duplicate handling

## 12. Future Extensibility

The functional architecture is designed for easy extension:

*   **Authentication**: Can easily add JWT-based auth with functional middleware patterns
*   **File Uploads**: Infrastructure ready for functional image upload services
*   **Caching**: Can add Redis with functional caching patterns
*   **Real-time Features**: WebSocket support using functional event handlers
*   **Multi-tenancy**: Database design supports multiple organizations with functional tenant isolation
*   **Mobile API**: RESTful functional design compatible with mobile app development
*   **Advanced Analytics**: Functional reporting and analytics capabilities
*   **Automated Deployment**: Functional seeding scripts ready for CI/CD integration
*   **Service Expansion**: Easy to add new functional services following the established pattern
*   **Microservices**: Functional approach makes it easier to extract services into microservices if needed

### Migration from Class-based to Functional Pattern

**For Future Development:**
*   **New Services**: Always use functional service layer pattern with standalone exported functions
*   **Legacy Services**: Gradually migrate remaining class-based services (like provinceService) to functional pattern
*   **Testing**: Adopt functional testing approach for all new test suites
*   **Documentation**: Update API documentation to reflect functional patterns

**Functional Pattern Template:**
```typescript
// ✅ Recommended functional service structure
export async function getAllItems(page: number, pageSize: number): Promise<{items: Item[], total: number}> {
  // Implementation
}

export async function getItemById(id: string): Promise<Item | null> {
  // Implementation
}

export async function createItem(data: CreateItemRequest): Promise<Item> {
  // Implementation
}

// Helper functions (not exported)
function mapRawItemToItemWithDetails(rawItem: any): ItemWithDetails {
  // Implementation
}
```

This manual provides a complete overview of the MyMuayThai backend architecture with its modern **Functional Service Layer Pattern**. The system is built with contemporary best practices, comprehensive automation, type safety, and scalability in mind, making it maintainable and extensible for future growth. The enhanced functional architecture ensures that developers can work with clean, testable, and modular code while maintaining high performance and reliability. 