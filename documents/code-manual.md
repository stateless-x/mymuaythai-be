# MyMuayThai Backend - Code Manual

Welcome to the MyMuayThai backend codebase! This document is a guide to help you understand how the backend works, even if you're not a backend developer.

## 1. What is this Backend For?

This backend is the engine behind the MyMuayThai application. It's responsible for:

*   **Storing and Managing Data:** Information about Muay Thai gyms, trainers, classes, locations (provinces), and users.
*   **Providing Data to the App:** When the MyMuayThai app (mobile or web) needs to display a list of gyms, show trainer profiles, or find classes, it asks this backend for that information.
*   **Handling User Actions:** If a user books a class or a gym owner updates their gym's information, the backend processes these requests.
*   **Ensuring Security and Consistency:** It makes sure data is handled safely and stays accurate.

Think of it like the kitchen in a restaurant. The app is the waiter taking orders and serving food, but the backend is the kitchen preparing the dishes (data) according to the recipes (logic).

## 2. Project Structure Overview

When you look at the project files, you'll see several main folders:

*   `src/`: This is the heart of the backend code. All the core logic lives here.
*   `scripts/`: Contains helper programs (scripts) for tasks like setting up the database or managing database changes.
*   `CODE_MANUAL.md`: (This file!) Your guide to the codebase.
*   `package.json`: Lists all the tools and libraries the project uses.
*   `tsconfig.json`: Configuration for TypeScript (the programming language used).
*   `env.example` & `env.test.example`: Template files for setting up environment-specific configurations (like database passwords). These are usually copied to `.env` which is not committed to git.

## 3. Deep Dive into `src/` (The Core Logic)

The `src/` directory is where the magic happens. It's further divided:

### 3.1. `server.ts` - The Main Entrance

*   **What it does:** This file is the main starting point for the backend application. When you run the backend, `server.ts` is the first thing that gets executed.
*   **Key Functions:**
    *   **Sets up the Server:** It uses a tool called "Fastify" (a fast and efficient web framework) to create the web server that will listen for requests from the app.
    *   `@fastify/cors`: Allows the app (running on a different web address) to talk to the backend.
    *   `@fastify/helmet`: Adds basic security protections.
    *   `@fastify/swagger` & `@fastify/swagger-ui`: Automatically creates API documentation (a live "menu" of what the backend offers) available at the `/docs` web address (e.g., `http://localhost:3000/docs`).
    *   **Connects to Database:** It makes sure the backend can talk to its database before it starts accepting requests.
    *   **Defines Basic Routes:** It sets up a `/health` check route (so we can see if the server is running) and registers all the main application routes (see `src/routes/`).
    *   **Error Handling:** It defines what happens if something goes wrong (e.g., the app asks for something that doesn't exist or an internal error occurs).
    *   **Starts Listening:** It tells the server to start listening for incoming requests from the app on a specific address (e.g., `http://localhost:3000`).
    *   **Graceful Shutdown:** Ensures that if the server is stopped, it does so cleanly, closing database connections properly.

### 3.2. `src/db/` - Database Central

This folder handles everything related to the database (where all the data is stored, likely a PostgreSQL database).

*   **`config.ts`:**
    *   **What it does:** Contains the settings needed to connect to the database, like the address of the database server, username, password, and database name. It reads these from environment variables (for security and flexibility).
    *   **`pool`:** It creates a "connection pool," which is an efficient way to manage multiple connections to the database.
    *   **`connectDatabase()` & `disconnectDatabase()`:** Functions to explicitly connect to and disconnect from the database. These are used by the server and scripts.
*   **`migrate.ts` & `migrationRunner.ts` & `migrations/` folder:**
    *   **What it is (Migrations):** As the application evolves, the structure of the database (e.g., tables, columns) might need to change. "Migrations" are a way to manage these changes in a controlled, versioned manner. Each change is a new migration script.
        *   Imagine your app initially only stored gym names. Later, you want to add addresses. A migration would be a script that adds an "address" column to the "gyms" table in the database.
    *   **`migrations/` folder:** This folder contains the actual migration files (e.g., `001_initial_schema.ts`). Each file has an `up()` function (to apply the change) and a `down()` function (to undo the change, if needed).
    *   **`migrationRunner.ts`:** This is the brain behind managing migrations. It:
        *   Keeps track of which migrations have already been applied to the database (using a special `migrations` table it creates).
        *   Can run new (pending) migrations (`runMigrations()`).
        *   Can roll back (undo) the last applied migration (`rollbackLastMigration()`).
        *   Can show the status of all migrations (`getMigrationStatus()`).
    *   **`migrate.ts` (in `src/db/`):** Provides a simple function `runMigration()` that uses the `MigrationRunner` to apply migrations. This is likely used by the script in `scripts/migrate.ts`.
*   **`seed.ts`:**
    *   **What it does (Seeding):** This script (`seedData()`) populates the database with initial data. This is very useful for:
        *   Setting up a new development environment with some sample gyms, trainers, etc., so developers can start working immediately.
        *   Providing data for automated tests.
    *   **Example:** It inserts sample provinces (Bangkok, Chiang Mai), users, class types (Basic Muay Thai), tags (Beginner Friendly), gyms (Lumpinee Gym), trainers, and connects them (e.g., this trainer teaches that class, this gym has these tags).
*   **`reset.ts`:** (Likely used for testing or development)
    *   **What it does:** This script seems designed to wipe out existing data from database tables. This is useful to get a clean slate before running tests or reseeding the database. **Caution:** This would delete data, so it's typically not for production.

### 3.3. `src/routes/` - The API Endpoints (The Menu)

This folder defines the actual "API endpoints" or "routes" that the app can call. Each file usually groups related endpoints. For example, `gyms.ts` handles all requests related to gyms.

*   **Example: `gyms.ts`**
    *   **What it does:** Defines all the web addresses (URLs) the app can use to get or manipulate gym data.
    *   **Key Functions (Endpoints):**
        *   `GET /api/gyms`: Get a list of all active gyms.
        *   `GET /api/gyms/:id`: Get details for a specific gym by its ID.
        *   `GET /api/gyms/:id/images`: Get images for a specific gym.
        *   `GET /api/gyms/province/:provinceId`: Get gyms located in a specific province.
        *   `GET /api/gyms/search/:query`: Search for gyms based on a keyword.
        *   `POST /api/gyms`: Create a new gym (the app sends gym details, the backend saves it).
        *   `PUT /api/gyms/:id`: Update an existing gym.
        *   `DELETE /api/gyms/:id`: "Soft delete" a gym (marks it as inactive, doesn't actually remove it from the database immediately).
        *   `POST /api/gyms/:id/images`: Add an image to a gym.
        *   `DELETE /api/gyms/images/:imageId`: Remove a gym image.
    *   **How it works:**
        1.  It receives a request from the app (e.g., for a list of gyms).
        2.  It calls a corresponding function in a "service" (see `src/services/`) to do the actual work (like fetching data from the database).
        3.  It then formats the result from the service into a standardized `ApiResponse` (see `src/types/`) and sends it back to the app.
        4.  It includes error handling: if the service reports an error, the route sends an error response.
*   **`trainers.ts`:** Works similarly to `gyms.ts` but for trainer-related data (getting trainer profiles, creating trainers, etc.).

### 3.4. `src/services/` - The Business Logic (The Chefs)

This folder contains the "business logic" of the application. If routes are the waiters taking orders, services are the chefs who know how to prepare the dishes.

*   **Example: `gymService.ts`**
    *   **What it does:** Contains all the core functions for managing gym data. These functions interact directly with the database (using the `pool` from `src/db/config.ts`).
    *   **Key Functions:**
        *   `getAllGyms()`: Fetches all active gyms from the database, joining with the `provinces` table to include province names.
        *   `getGymById(id)`: Fetches a single active gym by its ID.
        *   `getGymImages(gymId)`: Fetches images for a specific gym.
        *   `getGymsByProvince(provinceId)`: Fetches active gyms for a given province.
        *   `createGym(gymData)`: Inserts a new gym record into the database. It generates a unique ID (`uuidv4`) for the new gym.
        *   `updateGym(id, gymData)`: Updates an existing gym record. It dynamically builds the SQL `UPDATE` statement based on the fields provided.
        *   `deleteGym(id)`: Performs a "soft delete" by setting `is_active = false` for a gym.
        *   `addGymImage(gymId, imageUrl)`: Adds a new image record linked to a gym.
        *   `removeGymImage(imageId)`: Deletes an image record.
        *   `searchGyms(query)`: Searches for gyms where the query matches (case-insensitively) names, descriptions, or province names.
    *   **How it works:**
        1.  A function in `gymService.ts` (e.g., `getAllGyms()`) is called by a route handler in `gyms.ts`.
        2.  It acquires a connection from the database `pool`.
        3.  It executes SQL queries against the database to fetch or modify data.
        4.  It processes the results from the database (if any).
        5.  It returns the data (or a success/failure status) to the route handler.
        6.  It releases the database connection back to the pool.
*   **`trainerService.ts`:** Works similarly for trainer-related logic.

### 3.5. `src/types/` - Defining Data Shapes (The Recipe Ingredients List)

This folder (specifically `index.ts`) defines the "shape" or structure of the data objects used throughout the application. TypeScript uses these definitions to help catch errors and make the code easier to understand.

*   **`index.ts`:**
    *   **What it does:** Contains "interfaces." An interface is like a blueprint for an object, specifying what properties it should have and what type of data each property holds.
    *   **Examples:**
        *   `interface Gym { id: string; name_th: string; ... }`: Defines that a `Gym` object must have an `id` (which is text), a `name_th` (Thai name, text), etc.
        *   `interface CreateGymRequest { ... }`: Defines the data expected when the app wants to create a new gym.
        *   `interface ApiResponse<T> { ... }`: Defines a standard structure for all responses sent back to the app. It includes a `success` flag, optional `data` (of type `T`, meaning it can be any type of data like a `Gym` or `Trainer[]`), an optional `error` message, and an optional `message`. This consistency is good for the app developers.
    *   **Why it's important:** These type definitions help ensure that different parts of the backend (and potentially the frontend app developers) agree on what the data looks like.

### 3.6. `src/__tests__/` - Automated Checks

This folder is where automated tests for the backend code would go. Tests are small programs that check if specific parts of the code are working correctly. (Currently, the content of this folder is not visible, but this is its standard purpose).

## 4. `scripts/` - Helper Tools

These are standalone programs used for development and management tasks.

*   **`migrate.ts`:**
    *   **What it does:** A simple script that runs the database migrations. When you run this (e.g., `bun run scripts/migrate.ts`), it tells the system to apply any pending database schema changes defined in `src/db/migrations/`.
    *   **Why:** Used to update the database structure when new features are added or existing ones change.
*   **`migration-rollback.ts`:**
    *   **What it does:** Rolls back (undoes) the very last migration that was applied to the database.
    *   **Why:** Useful if a recent migration caused an unexpected problem.
*   **`migration-status.ts`:**
    *   **What it does:** Shows which migrations have been applied to the database and which ones are still pending.
    *   **Why:** Helps developers see the current state of the database schema.
*   **`seed.ts`:**
    *   **What it does:** Runs the database seeding process, populating the database with the initial data defined in `src/db/seed.ts`.
    *   **Why:** To quickly set up a new database with sample data for development or testing.

## 5. How to Run the Project (Generally)

While specifics might vary slightly based on setup:

1.  **Install Dependencies:** Usually `bun install` (since there's a `bun.lock` file, Bun is the package manager). This downloads all the tools and libraries listed in `package.json`.
2.  **Set up Environment Variables:**
    *   Copy `env.example` to a new file named `.env`.
    *   Edit `.env` and fill in your actual database connection details (host, port, username, password, database name).
3.  **Ensure Database is Running:** The PostgreSQL database server needs to be running and accessible.
4.  **Run Migrations:**
    *   `bun run scripts/migrate.ts` (or similar command defined in `package.json`)
    *   This creates the necessary tables in your database if they don't exist.
5.  **(Optional) Seed Data:**
    *   `bun run scripts/seed.ts` (or similar)
    *   This fills the database with initial sample data.
6.  **Start the Server:**
    *   Usually a command like `bun run dev` or `bun run start` (check the `scripts` section in `package.json`).
    *   This will typically start the server, and you'll see messages like "🚀 Server is running on http://localhost:3000".
7.  **Access API Docs:** Open `http://localhost:3000/docs` in your browser to see the API documentation.

## 6. Key Concepts for Non-Backend Developers

*   **API (Application Programming Interface):** A set of rules and definitions that allows different software applications to communicate with each other. In this case, the backend provides an API that the MyMuayThai app uses. The routes in `src/routes/` define this API.
*   **HTTP Methods:**
    *   `GET`: Used to retrieve data (e.g., get a list of gyms).
    *   `POST`: Used to create new data (e.g., add a new gym).
    *   `PUT`: Used to update existing data (e.g., change a gym's phone number).
    *   `DELETE`: Used to delete data.
*   **JSON (JavaScript Object Notation):** A lightweight format for exchanging data. The backend and the app mostly communicate by sending JSON data back and forth.
*   **Database:** A structured system for storing and retrieving data. This project uses a relational database (likely PostgreSQL) where data is organized into tables (like spreadsheets), rows, and columns.
*   **SQL (Structured Query Language):** The language used to interact with relational databases (to create tables, insert data, query data, etc.). The service files use SQL.
*   **Environment Variables:** Variables (like database passwords or API keys) that are set outside the code, making the application more flexible and secure.
*   **Asynchronous Operations (`async`/`await`):** Many operations, especially those involving databases or network requests, take time. `async` and `await` are keywords in TypeScript/JavaScript that help manage these operations without freezing the entire application while waiting. You'll see them used extensively.

This manual should give you a solid foundation for understanding what the MyMuayThai backend does and how it's put together. If you have more specific questions as you explore, feel free to ask! 