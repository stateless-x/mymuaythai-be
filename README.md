# MyMuayThai Backend Platform

A comprehensive backend platform for managing Muay Thai gyms and trainers in Thailand, built with Bun, TypeScript, Fastify, and PostgreSQL.

## 🥊 Features

- **Gym Management**: Complete CRUD operations for Muay Thai gyms
- **Trainer Management**: Manage trainers, both gym-affiliated and freelance
- **Province-based Location**: Thai province support with bilingual content
- **Multi-language Support**: Thai and English content
- **Image Management**: Upload and manage gym images
- **Class Management**: Define and assign training classes to trainers
- **Tag System**: Categorize gyms and trainers with flexible tagging
- **Search Functionality**: Full-text search across gyms and trainers
- **RESTful API**: Clean, documented API endpoints
- **Type Safety**: Full TypeScript implementation
- **Database Migrations**: Automated database setup and seeding

## 🛠️ Tech Stack

- **Runtime**: Bun (latest)
- **Language**: TypeScript
- **Framework**: Fastify
- **Database**: PostgreSQL
- **Documentation**: Swagger/OpenAPI 3.0
- **Security**: Helmet, CORS

## 📋 Prerequisites

- [Bun](https://bun.sh/) (v1.0+)
- [PostgreSQL](https://postgresql.org/) (v13+)
- [Git](https://git-scm.com/)

## 🚀 Quick Start

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd mymuaythai-be
\`\`\`

### 2. Install Dependencies

\`\`\`bash
bun install
\`\`\`

### 3. Database Setup

Create a PostgreSQL database:

\`\`\`sql
CREATE DATABASE mymuaythai;
CREATE USER postgres WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE mymuaythai TO postgres;
\`\`\`

### 4. Environment Configuration

Create environment file from example:

\`\`\`bash
cp env.example .env
\`\`\`

Update `.env` with your database credentials:

\`\`\`env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mymuaythai
DB_USER=postgres
DB_PASSWORD=your_password
\`\`\`

### 5. Database Migration & Seeding

Reset database (this will create tables and insert sample data):

\`\`\`bash
bun run db:reset
\`\`\`

Or run individually:

\`\`\`bash
# Create tables
bun run db:migrate

# Insert sample data
bun run db:seed
\`\`\`

### 6. Start Development Server

\`\`\`bash
bun run dev
\`\`\`

The server will start at: http://localhost:3000

## 📚 API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/health

## 🗄️ Database Schema

The platform uses the following main entities:

### Core Tables

- **users**: User accounts with roles
- **provinces**: Thai provinces (bilingual)
- **gyms**: Muay Thai training facilities
- **trainers**: Individual trainers
- **classes**: Training class types
- **tags**: Categorization labels

### Junction Tables

- **gym_images**: Gym photo galleries
- **trainer_classes**: Trainer-class assignments
- **gym_tags**: Gym categorization
- **trainer_tags**: Trainer categorization

## 🔌 API Endpoints

### Gyms

- `GET /api/gyms` - Get all gyms
- `GET /api/gyms/:id` - Get gym by ID
- `GET /api/gyms/:id/images` - Get gym images
- `GET /api/gyms/province/:provinceId` - Get gyms by province
- `GET /api/gyms/search/:query` - Search gyms
- `POST /api/gyms` - Create new gym
- `PUT /api/gyms/:id` - Update gym
- `DELETE /api/gyms/:id` - Soft delete gym
- `POST /api/gyms/:id/images` - Add gym image
- `DELETE /api/gyms/images/:imageId` - Remove gym image

### Trainers

- `GET /api/trainers` - Get all trainers
- `GET /api/trainers/:id` - Get trainer by ID
- `GET /api/trainers/gym/:gymId` - Get trainers by gym
- `GET /api/trainers/province/:provinceId` - Get trainers by province
- `GET /api/trainers/freelance` - Get freelance trainers
- `GET /api/trainers/:id/classes` - Get trainer classes
- `GET /api/trainers/search/:query` - Search trainers
- `POST /api/trainers` - Create new trainer
- `PUT /api/trainers/:id` - Update trainer
- `DELETE /api/trainers/:id` - Soft delete trainer
- `POST /api/trainers/:id/classes` - Add class to trainer
- `DELETE /api/trainers/:id/classes/:classId` - Remove class from trainer

## 🧪 Testing

Run the test suite:

\`\`\`bash
bun run test
\`\`\`

Or run the custom test runner:

\`\`\`bash
bun run src/__tests__/runTests.ts
\`\`\`

## 📦 Available Scripts

- `bun run dev` - Start development server with hot reload
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run test` - Run test suite
- `bun run db:migrate` - Run database migrations
- `bun run db:seed` - Seed database with sample data
- `bun run db:reset` - Reset database (migrate + seed)

## 🏗️ Project Structure

\`\`\`
src/
├── db/
│   ├── config.ts          # Database configuration
│   ├── migrate.ts         # Database migrations
│   ├── seed.ts           # Sample data seeding
│   └── reset.ts          # Database reset utility
├── routes/
│   ├── gyms.ts           # Gym API routes
│   └── trainers.ts       # Trainer API routes
├── services/
│   ├── gymService.ts     # Gym business logic
│   └── trainerService.ts # Trainer business logic
├── types/
│   └── index.ts          # TypeScript interfaces
├── __tests__/
│   ├── gym.test.ts       # Gym service tests
│   └── runTests.ts       # Test runner
└── server.ts             # Main application entry
\`\`\`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `mymuaythai` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `password` |
| `PORT` | Server port | `3000` |
| `HOST` | Server host | `0.0.0.0` |
| `NODE_ENV` | Environment | `development` |

## 🗺️ Sample Data

The seeding script includes:

- **10 Thai provinces** (Bangkok, Chiang Mai, Phuket, etc.)
- **5 Famous Muay Thai gyms** (Lumpinee, Fairtex, Tiger Muay Thai, etc.)
- **5 Professional trainers** with different specializations
- **Training classes** (Basic Muay Thai, Advanced, Boxing, etc.)
- **Tags** for categorization (Beginner Friendly, Professional, etc.)

## 🚦 API Response Format

All API responses follow a consistent format:

\`\`\`json
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully"
}
\`\`\`

Error responses:

\`\`\`json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
\`\`\`

## 🔒 Security Features

- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers middleware
- **Input Validation**: Type-safe request validation
- **SQL Injection Protection**: Parameterized queries
- **Soft Deletes**: Data preservation with active flags

## 🎯 Future Enhancements

- [ ] Authentication & Authorization (JWT)
- [ ] File upload for gym images
- [ ] Booking system for training sessions
- [ ] Rating and review system
- [ ] Real-time notifications
- [ ] Mobile app API extensions
- [ ] Admin dashboard integration
- [ ] Multi-tenant support

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Bun](https://bun.sh/) - The fast all-in-one JavaScript runtime
- [Fastify](https://www.fastify.io/) - Fast and low overhead web framework
- [PostgreSQL](https://postgresql.org/) - The world's most advanced open source database
- Thai Muay Thai community for inspiration

---

**Made with ❤️ for the Muay Thai community in Thailand** 🇹🇭 