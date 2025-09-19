# El-Node Inventory Management (Full-Stack)

El-Node is a modern, full-stack inventory management system. The frontend is built with **Next.js** and **TypeScript**, and the backend is powered by **Express.js**, **Prisma**, and **SQLite**.

## Features

- **Full-Stack Architecture:** Decoupled frontend and backend for scalability and maintainability.
- **RESTful API:** A complete Express.js API for managing all inventory resources.
- **Persistent Storage:** Data is stored in a SQLite database, managed by the Prisma ORM.
- **Role-Based Access Control:** Secure endpoints with admin-only privileges for sensitive actions.
- **Comprehensive Inventory Management:** All the features from the original frontend, now backed by a real database.

## Project Structure

This project is a monorepo containing two main packages:

```
module_1/
├── api/                  # Backend (Express.js, Prisma)
│   ├── prisma/
│   │   ├── schema.prisma # Database schema
│   │   └── dev.db        # SQLite database file
│   ├── src/
│   │   ├── routes/       # API routes
│   │   └── index.ts      # Express server setup
│   ├── package.json
│   └── ...
├── app/                  # Frontend (Next.js)
│   └── ...               # All existing frontend files
├── package.json          # Root package.json
└── README.md
```

## Backend Setup (Express & Prisma)

This guide explains how to set up and run the backend server.

### 1. Prerequisites

- Node.js (v18 or higher)
- npm or pnpm

### 2. Installation

Navigate to the backend directory and install the dependencies:

```sh
cd api
npm install
```

### 3. Database Setup

This project uses Prisma with a SQLite database. The database file is located at `api/prisma/dev.db`.

To initialize and seed the database, run the following Prisma commands from the `api` directory:

**a. Generate Prisma Client:**
This command reads your `schema.prisma` file and generates the TypeScript types for your database models.

```sh
npx prisma generate
```

**b. Push the Schema to the Database:**
This command creates the database file and the tables defined in your schema.

```sh
npx prisma db push
```

*(Note: For production, you would use `prisma migrate dev` to create migration files, but `db push` is simpler for development.)*

### 4. Environment Variables

Create a `.env` file in the `api` directory. Prisma automatically loads this file. It should contain the URL for your database:

```env
# api/.env

DATABASE_URL="file:./prisma/dev.db"
```

### 5. Running the Backend Server

Once the database is set up, you can start the Express server:

```sh
npm run dev
```

The server will start on `http://localhost:4000` by default.

## Frontend Setup (Next.js)

To run the frontend, navigate back to the root directory and run the development server:

```sh
# From the root directory (module_1/)
pnpm dev
```

The frontend will start on `http://localhost:3000` and will make API calls to the backend server running on port 4000.

## API Endpoints

The backend provides the following RESTful endpoints:

- **Products:** `GET, POST, DELETE /api/products`
- **Categories:** `GET, POST, DELETE /api/categories`
- **Inventory:** `GET, POST, PUT, DELETE /api/inventory`
- **Destinations:** `GET, POST, DELETE /api/destinations`

All endpoints are documented and can be tested using tools like Postman or Insomnia.
