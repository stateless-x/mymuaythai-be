# MyMuayThai Backend Platform

A comprehensive backend platform for managing Muay Thai gyms and trainers in Thailand, built with Bun, TypeScript, Fastify, Drizzle ORM, and PostgreSQL.

## 🥊 Features

- **Gym Management**: Complete CRUD operations for Muay Thai gyms with images, tags, and location data
- **Trainer Management**: Manage trainers (both gym-affiliated and freelance) with class assignments and specializations
- **Province-based Location**: Thai province support with bilingual content (Thai/English)
- **Multi-language Support**: Full bilingual content throughout the platform
- **Advanced Search**: Full-text search across gyms and trainers with filtering capabilities
- **Class & Tag System**: Flexible categorization with many-to-many relationships
- **RESTful API**: Clean, well-documented API endpoints with OpenAPI 3.0 specification
- **Type Safety**: Full TypeScript implementation with Drizzle ORM type inference
- **Database Migrations**: Automated schema management with Drizzle Kit
- **Sample Data**: Comprehensive seeding system for development and testing
- **Pagination**: Advanced pagination support for all major endpoints (20 items per page default)

## 🛠️ Tech Stack

- **Runtime**: [Bun](https://bun.sh/) (v1.2+) - Fast JavaScript runtime and package manager
- **Language**: TypeScript - Type-safe development
- **Framework**: [Fastify](https://www.fastify.io/) - High-performance web framework
- **Database**: PostgreSQL (v13+) - Robust relational database
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) - Modern, type-safe database toolkit
- **Documentation**: Swagger/OpenAPI 3.0 - Auto-generated interactive API docs
- **Security**: Helmet, CORS - Security middleware and protection
- **Testing**: Bun built-in test runner with comprehensive service layer tests

## 📋 Prerequisites

- [Bun](https://bun.sh/) v1.2 or higher
- [PostgreSQL](https://postgresql.org/) v13 or higher
- [Git](https://git-scm.com/)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mymuaythai-be
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE mymuaythai;
CREATE USER admin WITH PASSWORD 'admin';
GRANT ALL PRIVILEGES ON DATABASE mymuaythai TO admin;
```

### 4. Environment Configuration

Create environment file from example:

```bash
cp env.example .env
```

Update `.env` with your database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mymuaythai
DB_USER=admin
DB_PASSWORD=admin

# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# API Configuration
API_VERSION=1.0.0
API_TITLE="MyMuayThai API"
API_DESCRIPTION="API for managing Muay Thai gyms and trainers"
```

### 5. Database Migration & Seeding

Run migrations and populate with sample data:

```bash
# Generate migration files (if schema changed)
bun run db:generate

# Apply migrations to database
bun run db:migrate

# Populate with sample data (5 provinces, 2 gyms, 2 trainers, classes, tags)
bun run db:seed

# Or seed all 77 Thai provinces for production
bun run db:seed:provinces
```

### 6. Start Development Server

```bash
bun run dev
```

The server will start at: **http://localhost:3000**

## 📚 API Documentation

Once the server is running, access:

- **Swagger UI**: http://localhost:3000/docs - Interactive API documentation
- **Health Check**: http://localhost:3000/health - Server status endpoint

## 🗄️ Database Schema

The platform uses a well-structured relational database with:

### Core Tables

- **users**: User accounts with role-based access
- **provinces**: Thai provinces with bilingual names
- **gyms**: Muay Thai training facilities with complete details
- **trainers**: Individual trainers (gym-affiliated or freelance)
- **classes**: Training class types and descriptions
- **tags**: Flexible categorization labels

### Junction Tables

- **gym_images**: Gym photo galleries
- **trainer_classes**: Trainer-class assignments (many-to-many)
- **gym_tags**: Gym categorization (many-to-many)
- **trainer_tags**: Trainer specializations (many-to-many)

### Key Features

- **UUID Primary Keys**: All entities use UUID for better distribution
- **Bilingual Support**: Thai and English fields throughout
- **Soft Deletes**: `is_active` flags preserve data integrity
- **Foreign Key Constraints**: Proper referential integrity
- **Timestamps**: Creation tracking for auditing

## 📄 API Endpoints

### Provinces

- `GET /api/provinces` - List all provinces (with sorting and region filtering)
- `GET /api/provinces/:id` - Get specific province by ID
- `GET /api/provinces/search/:query` - Search provinces by name (Thai/English)
- `GET /api/provinces/region/:region` - Get provinces by region (central, eastern, northern, northeastern, southern, western)
- `GET /api/provinces/stats` - Get province statistics and counts
- Query parameters for `/api/provinces`:
  - `?sort=en` - Sort by English name (default)
  - `?sort=th` - Sort by Thai name
  - `?region=central` - Filter by region
  - `?stats=true` - Include gym counts per province

### Gyms

- `GET /api/gyms` - List all gyms with pagination, search, and filtering
- `GET /api/gyms/:id` - Get specific gym with full details
- `GET /api/gyms/:id/images` - Get gym images
- `GET /api/gyms/province/:provinceId` - Get gyms by province
- `GET /api/gyms/search/:query` - Search gyms by name/description with pagination
- `POST /api/gyms` - Create new gym
- `PUT /api/gyms/:id` - Update gym details
- `DELETE /api/gyms/:id` - Soft delete gym
- `POST /api/gyms/:id/images` - Add gym image
- `DELETE /api/gyms/images/:imageId` - Remove gym image

**Gym Query Parameters:**
- `?page=1` - Page number (default: 1)
- `?pageSize=20` - Items per page (default: 20)
- `?search=term` - Search by name or description
- `?provinceId=16` - Filter by province

### Trainers

- `GET /api/trainers` - List all trainers with pagination and advanced filtering
- `GET /api/trainers/:id` - Get specific trainer with full details (includes province, gym, classes, tags)
- `GET /api/trainers/gym/:gymId` - Get trainers by gym with pagination
- `GET /api/trainers/province/:provinceId` - Get trainers by province with pagination
- `GET /api/trainers/freelance` - Get freelance trainers with pagination
- `GET /api/trainers/:id/classes` - Get trainer's classes
- `GET /api/trainers/search/:query` - Search trainers with pagination
- `POST /api/trainers` - Create new trainer
- `PUT /api/trainers/:id` - Update trainer details
- `DELETE /api/trainers/:id` - Soft delete trainer
- `POST /api/trainers/:id/classes` - Add class to trainer
- `DELETE /api/trainers/:id/classes/:classId` - Remove class from trainer

**Trainer Query Parameters:**
- `?page=1` - Page number (default: 1)
- `?pageSize=20` - Items per page (default: 20)
- `?search=term` - Search by name, bio, province, or gym
- `?provinceId=16` - Filter by province
- `?gymId=uuid` - Filter by gym
- `?isFreelance=true` - Filter freelance trainers

### Pagination Response Format

All paginated endpoints return data in this format:

```json
{
  "success": true,
  "data": {
    "items": [...],        // Array of results
    "total": 42,          // Total number of items
    "page": 1,            // Current page
    "pageSize": 20,       // Items per page
    "totalPages": 3       // Total number of pages
  },
  "message": "Items retrieved successfully"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

## 🧪 Testing

The project includes comprehensive test coverage using Bun's built-in test runner:

```bash
# Run all tests
bun test

# Run specific test files
bun test __tests__/services/gymService.test.ts
bun test __tests__/services/trainerService.test.ts

# Run tests with watch mode
bun test --watch
```

### Test Coverage
- **GymService**: Complete CRUD operations, pagination, search, filtering, image management
- **TrainerService**: Full trainer lifecycle, class assignments, freelance filtering, advanced search

## 📦 Available Scripts

```bash
# Development
bun run dev          # Start development server with hot reload
bun run build        # Build for production
bun run start        # Start production server

# Code Quality
bun run lint         # Run ESLint
bun run format       # Format code with Prettier

# Database Operations
bun run db:generate  # Generate new migrations from schema changes
bun run db:migrate   # Apply pending migrations to database
bun run db:seed      # Populate database with sample data
bun run db:seed:provinces  # Seed all 77 Thai provinces
bun run db:studio    # Open Drizzle Studio (visual database browser)

# Testing
bun test            # Run all tests
bun test --watch    # Run tests in watch mode
```

## 🏗️ Project Structure

```
src/
├── db/
│   ├── config.ts              # Database connection and Drizzle setup
│   ├── schema.ts              # Database schema definitions
│   ├── migrate.ts             # Migration runner script
│   ├── seed.ts                # Sample data population
│   ├── province-seed.ts       # All 77 Thai provinces seeding
│   └── migrations/            # Auto-generated migration files
├── routes/
│   ├── gyms.ts               # Gym API endpoints
│   ├── trainers.ts           # Trainer API endpoints
│   └── provinces.ts          # Province API endpoints (read-only)
├── services/
│   ├── gymService.ts         # Gym business logic
│   ├── trainerService.ts     # Trainer business logic (Drizzle ORM)
│   └── provinceService.ts    # Province business logic
├── types/
│   └── index.ts              # TypeScript type definitions
└── server.ts                 # Main application entry point

__tests__/
└── services/                 # Service layer tests
    ├── gymService.test.ts    # Comprehensive gym service tests
    └── trainerService.test.ts # Complete trainer service tests

drizzle.config.ts             # Drizzle ORM configuration
package.json                  # Dependencies and scripts
tsconfig.json                 # TypeScript configuration
env.example                   # Environment variables template
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | Database host | `localhost` | ✅ |
| `DB_PORT` | Database port | `5432` | ✅ |
| `DB_NAME` | Database name | `mymuaythai` | ✅ |
| `DB_USER` | Database user | `admin` | ✅ |
| `DB_PASSWORD` | Database password | `admin` | ✅ |
| `PORT` | Server port | `3000` | ❌ |
| `HOST` | Server host | `0.0.0.0` | ❌ |
| `NODE_ENV` | Environment | `development` | ❌ |

## 🗺️ Sample Data

The seeding script includes comprehensive sample data:

- **5 Sample Provinces**: Bangkok, Chiang Mai, Phuket, Chon Buri, Surat Thani for testing
- **77 Thai Provinces**: All provinces of Thailand with accurate Thai and English names (via province-seed)
- **2 Users**: Admin and regular user accounts  
- **4 Class Types**: Basic Muay Thai, Advanced, Kids classes, Cardio Muay Thai
- **5 Tags**: Beginner Friendly, For Professionals, Good Atmosphere, Fully Equipped, English Speaking
- **2 Gyms**: Yodmuay Gym Bangkok & Lanna Muay Thai Chiang Mai (with images and complete details)
- **2 Trainers**: Kru Yod (gym-affiliated) & Kru Kaew (freelance) with class assignments and specializations
- **Relationships**: All many-to-many relationships properly connected

### Province Data Organization

The 77 provinces are organized into 6 geographical regions:
- **Central Region**: 23 provinces (including Bangkok)
- **Eastern Region**: 7 provinces 
- **Northern Region**: 9 provinces
- **Northeastern Region**: 20 provinces
- **Southern Region**: 15 provinces  
- **Western Region**: 2 provinces

## 🔒 Security Features

- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers middleware (CSP, XSS protection, etc.)
- **Input Validation**: Type-safe request validation with TypeScript
- **SQL Injection Protection**: Parameterized queries via Drizzle ORM
- **Soft Deletes**: Data preservation with active flags
- **Environment Variables**: Sensitive configuration kept outside codebase

## 🎯 Development Features

- **Hot Reload**: Development server with automatic restart on file changes
- **Type Safety**: Full TypeScript coverage with Drizzle ORM type inference
- **Auto-generated Types**: Database schema types automatically inferred
- **API Documentation**: Interactive Swagger UI with live testing
- **Database GUI**: Drizzle Studio for visual database management
- **Structured Logging**: Beautiful console output with pino-pretty
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Comprehensive Testing**: Bun test runner with full service layer coverage

## 🚀 Future Enhancements

Planned features and improvements:

- [ ] **Authentication & Authorization**: JWT-based auth with role-based permissions
- [ ] **File Upload Service**: Image upload with cloud storage integration
- [ ] **Booking System**: Training session reservation functionality
- [ ] **Rating & Reviews**: User feedback system for gyms and trainers
- [ ] **Real-time Features**: WebSocket support for live updates
- [ ] **Caching Layer**: Redis integration for improved performance
- [ ] **Admin Dashboard**: Web-based administration interface
- [ ] **Mobile API Extensions**: Additional endpoints for mobile app features
- [ ] **Multi-tenant Support**: Support for multiple gym chains
- [ ] **Advanced Analytics**: Reporting and analytics dashboard

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices and maintain type safety
- Use Drizzle ORM for all database operations
- Write comprehensive tests for new features
- Update API documentation for new endpoints
- Follow the existing code structure and naming conventions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Bun](https://bun.sh/) - The fast all-in-one JavaScript runtime
- [Fastify](https://www.fastify.io/) - Fast and low overhead web framework
- [Drizzle ORM](https://orm.drizzle.team/) - Modern TypeScript ORM
- [PostgreSQL](https://postgresql.org/) - The world's most advanced open source database
- Thai Muay Thai community for inspiration and cultural authenticity

---

**Made with ❤️ for the Muay Thai community in Thailand** 🇹🇭

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [API documentation](http://localhost:3000/docs) when server is running
2. Review the [Code Manual](documents/code-manual.md) for detailed architecture information
3. Create an issue in the repository with detailed information about the problem
4. For development questions, refer to the comprehensive type definitions and inline comments 