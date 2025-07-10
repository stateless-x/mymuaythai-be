# MyMuayThai Backend Platform

A comprehensive backend platform for managing Muay Thai gyms and trainers in Thailand, built with Bun, TypeScript, Fastify, Drizzle ORM, and PostgreSQL.

## 🥊 Features

- **Gym & Trainer Management**: Complete CRUD operations with images, tags, and location data.
- **Admin User Management**: Full authentication and authorization system using JWT.
- **Image Uploads**: Handles image processing and uploading to a CDN for gyms and trainers.
- **Province-based Location**: Thai province support with bilingual content.
- **Advanced Search & Categorization**: Full-text search and flexible categorization.
- **Dashboard Analytics**: Endpoints for gathering application statistics.
- **RESTful API**: Clean, well-documented API endpoints.
- **Type Safety & Migrations**: Full TypeScript implementation and automated schema management.
- **Functional Service Layer**: Modern functional programming approach for business logic.

## 🛠️ Tech Stack

- **Runtime**: [Bun](https://bun.sh/) (v1.2+)
- **Language**: TypeScript
- **Framework**: [Fastify](https://www.fastify.io/)
- **Database**: PostgreSQL (v13+)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Documentation**: Swagger/OpenAPI 3.0
- **Security**: Helmet, CORS
- **Testing**: Bun built-in test runner

## 📋 Prerequisites

- [Bun](https://bun.sh/) v1.2 or higher
- [PostgreSQL](https://postgresql.org/) v13 or higher
- [Git](https://git-scm.com/)

## 🚀 Quick Start

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd mymuaythai-be
   ```

2. **Install Dependencies**
   ```bash
   bun install
   ```

3. **Database Setup**
   ```sql
   CREATE DATABASE mymuaythai;
   CREATE USER admin WITH PASSWORD 'admin';
   GRANT ALL PRIVILEGES ON DATABASE mymuaythai TO admin;
   ```

4. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   Update `.env` with your database credentials.

5. **Database Migration & Seeding**
   ```bash
   bun run db:migrate
   bun run db:seed
   ```

6. **Start Development Server**
   ```bash
   bun run dev
   ```
   The server will start at: **http://localhost:4000**

## 📚 API Documentation

- **Swagger UI**: http://localhost:4000/docs
- **Health Check**: http://localhost:4000/health

## 🧪 Testing

Run all tests:
```bash
bun test
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `mymuaythai` |
| `DB_USER` | Database user | `admin` |
| `DB_PASSWORD` | Database password | `admin` |
| `PORT` | Server port | `4000` |
| `HOST` | Server host | `0.0.0.0` |
| `NODE_ENV` | Environment | `development` |

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
│   ├── tags.ts               # Tag API endpoints  
│   └── provinces.ts          # Province API endpoints (read-only)
├── services/                 # Functional Service Layer (Business Logic)
│   ├── gymService.ts         # Gym business logic - standalone functions
│   ├── trainerService.ts     # Trainer business logic - standalone functions
│   ├── tagService.ts         # Tag business logic - standalone functions
│   └── provinceService.ts    # Province business logic (class-based for legacy compatibility)
├── types/
│   └── index.ts              # TypeScript type definitions
└── server.ts                 # Main application entry point

__tests__/
└── services/                 # Functional Service Layer Tests
    ├── gymService.test.ts    # Comprehensive functional gym service tests
    ├── trainerService.test.ts # Complete functional trainer service tests
    └── tagService.test.ts    # Functional tag service tests with conflict resolution

drizzle.config.ts             # Drizzle ORM configuration
package.json                  # Dependencies and scripts
tsconfig.json                 # TypeScript configuration
env.example                   # Environment variables template
```

## 🔒 Security Features

- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers middleware
- **Input Validation**: Type-safe request validation
- **SQL Injection Protection**: Parameterized queries
- **Soft Deletes**: Data preservation with active flags
- **Environment Variables**: Sensitive configuration kept outside codebase

## 🎯 Development Features

- **Hot Reload**: Development server with automatic restart
- **Type Safety**: Full TypeScript coverage
- **API Documentation**: Interactive Swagger UI
- **Database GUI**: Drizzle Studio for visual database management
- **Structured Logging**: Beautiful console output
- **Error Handling**: Comprehensive error handling
- **Comprehensive Testing**: Bun test runner with functional service layer coverage
- **Functional Architecture**: Modern service layer pattern

## 🚀 Future Enhancements

Planned features and improvements:

- [ ] **Rating & Reviews**: User feedback system
- [ ] **Real-time Features**: WebSocket support
- [ ] **Caching Layer**: Redis integration
- [ ] **Multi-tenant Support**: Support for multiple gym chains
- [ ] **Advanced Analytics**: Expanded reporting and analytics dashboard
- [ ] **Service Layer Expansion**: Continue functional pattern adoption

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use Drizzle ORM for all database operations
- **Adopt Functional Service Layer Pattern**
- Write comprehensive tests for new features
- Update API documentation for new endpoints
- Follow the existing code structure
- Prefer functional programming patterns

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Bun](https://bun.sh/)
- [Fastify](https://www.fastify.io/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [PostgreSQL](https://postgresql.org/)
- Thai Muay Thai community for inspiration

---

**Made with ❤️ for the Muay Thai community in Thailand** 🇹🇭

## 🆘 Support

If you encounter any issues:

1. Check the [API documentation](http://localhost:4000/docs)
2. Review the [Code Manual](documents/code-manual.md)
3. Create an issue in the repository
4. Refer to the comprehensive type definitions and inline comments

## Database Seeding 🌱

The project includes comprehensive database seeding automation.

### Available Seeding Scripts

| Script | Description |
|--------|-------------|
| `bun run db:seed:dev` | Seeds essential development data |
| `bun run db:seed:dev:massive` | Seeds a massive amount of development data |
| `bun run db:seed:prod` | Seeds production-ready data |
| `bun run db:cleanup` | Cleans all data except for provinces |
| `bun run db:cleanup:full` | Cleans all data, including provinces |
| `bun run db:reset` | Resets the database and seeds development data |

### What Gets Seeded

#### Essential Data (`db:seed:dev`)
- **Provinces**: 5 key provinces
- **Users**: 3 development users
- **Classes**: 4 essential Muay Thai classes
- **Tags**: 5 useful gym/trainer tags
- **Gyms**: 2 sample gyms
- **Trainers**: 2 sample trainers
- **Relationships**: Sample gym-tag and trainer-class associations

#### Comprehensive Data (`db:seed`)
- **All essential data above, plus:**
- **Gyms**: 5 detailed Muay Thai gyms
- **Trainers**: 5 professional trainers
- **Extended relationships**: Complete associations

### Seed Data Features

✅ **Idempotent**: Safe to run multiple times  
✅ **Conflict Resolution**: Uses `ON CONFLICT DO NOTHING` strategy  
✅ **Realistic Data**: Thai language support  
✅ **Relationship Mapping**: Proper foreign key relationships  
✅ **Development Ready**: Includes test accounts and sample entities  

### Sample Data Overview

**Development Gyms:**
- **Dev Muay Thai Gym** (Bangkok)
- **Test Fight Club** (Chiang Mai)

**Sample Trainers:**
- **Dev Trainer**
- **Test Instructor**

**Classes Available:**
- Basic Muay Thai, Advanced Muay Thai, Kids Classes, Cardio Muay Thai

**Useful Tags:**
- Beginner Friendly, Professional, Good Atmosphere, Fully Equipped, English Speaking

### Database Management

```bash
# Database operations
bun run db:generate           # Generate migrations
bun run db:migrate            # Run migrations
bun run db:cleanup            # Clean all data (except provinces)
bun run db:cleanup:full       # Clean all data (including provinces)
bun run db:reset              # Reset DB and seed with dev data
bun run db:studio             # Open Drizzle Studio
```

### Environment Requirements

Make sure your `.env` file includes:
```