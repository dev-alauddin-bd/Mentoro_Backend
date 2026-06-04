![License](https://img.shields.io/github/license/dev-alauddin-bd/Mentoro_Backend)
![Stars](https://img.shields.io/github/stars/dev-alauddin-bd/Mentoro_Backend?style=social)
![Last Commit](https://img.shields.io/github/last-commit/dev-alauddin-bd/Mentoro_Backend)

# 🚀 Mentoro — Backend API

## Table of Contents
- [About The Project](#-about-the-project)
- [Key Features](#-key-features)
- [Quick Start](#-quick-start)
- [Tech Stack Overview](#-tech-stack-overview)
- [Performance Benchmark](#-performance-benchmark)
- [Unit Testing](#-unit-testing)
- [Made by](#-made-by)
---

## 📖 About The Project

The Mentoro Backend serves as the foundational engine for a full‑featured online education platform. It provides a secure, efficient, and flexible architecture to handle everything from user authentication and role management to complex **Mentoro** structures, progress tracking, and secure financial transactions.

By integrating modern technologies like LangChain for AI features and Cloudinary for media management, the backend ensures an optimized and intelligent experience for both students seeking knowledge and instructors building their audiences.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 📚 **Complete Mentoro CRUD** | Manage Categories, Mentoro, Modules, and Lessons with rich metadata, search, filtering, and pagination support. |
| 🔐 **Advanced Authentication** | Secure JWT-based authentication (access + refresh tokens) with optional Firebase social login integration. |
| 👥 **Role-Based Access Control** | Strict authorization system for `student`, `instructor`, and `admin` roles with full user management (block/unblock, role update). |
| ☁️ **Media Management** | Cloudinary + Multer integration for optimized image and video upload handling. |
| 🤖 **AI Assistant (Chatbot + Content Engine)** | Context-aware AI chatbot powered by OpenRouter and Prisma. It handles user conversations, generates course content, and creates live session content using intelligent prompt-based AI workflows. |
| 💼 **Jobs & Careers Management** | Full CRUD system for job postings with applicant tracking and resume submission support. |
| 📹 **Live Sessions** | Instructor-based live class scheduling, registration, and management system. |
| 📊 **Platform Analytics** | Aggregated insights for users, enrollments, and platform performance metrics. |
| 💳 **Secure Payments** | Stripe integration with checkout sessions, webhook handling, and refund support. |
| 📈 **Progress Tracking** | Student learning progress tracking with structured course completion flow. |
| 🛡️ **Data Validation** | Strong runtime validation using Zod schemas for all incoming requests. |
| 🚀 **Performance Optimized** | Rate limiting, Redis caching (optional), and optimized Prisma queries for scalability and speed. |
---

## 🧪 Tech Stack Overview

| Technology | Purpose |
|-----------|---------|
| **Node.js** | JavaScript runtime environment for server-side execution |
| **Express 5** | Fast, minimal, and flexible Node.js web framework |
| **TypeScript 5.9** | Strongly typed JavaScript for better scalability and maintainability |
| **Prisma 7** | Next-generation ORM for PostgreSQL with type-safe queries |
| **PostgreSQL** | Reliable, high-performance relational database |
| **LangChain** | Framework for building LLM-powered applications |
| **OpenRouter / Google GenAI / OpenAI** | AI model integration for intelligent features |
| **Cloudinary** | Cloud-based image and video storage & optimization |
| **Stripe** | Secure payment processing and subscription handling |
| **Zod** | Schema validation and request payload validation |
| **JWT (jsonwebtoken)** | Secure authentication using access & refresh tokens |
| **bcryptjs** | Password hashing for secure authentication |
| **Multer** | File upload handling middleware |
| **Redis (ioredis)** | Caching and performance optimization |
| **Winston** | Logging system for debugging and monitoring |
| **Helmet** | Security middleware for HTTP headers |
| **CORS** | Cross-origin resource sharing control |
| **express-rate-limit** | API rate limiting for security |
| **cookie-parser** | Cookie handling middleware |
| **Jest** | Unit testing framework for backend testing |
| **ts-jest** | TypeScript support for Jest |
| **ESLint** | Code linting and quality enforcement |
| **k6** | Load testing and performance benchmarking tool |

---

## ⚡ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/dev-alauddin-bd/Mentoro_Backend.git
cd Mentoro_Backend
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory and configure the following variables:

```env
# Database (Prisma)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mentoro"
JWT_ACCESS_SECRET=""
JWT_REFRESH_SECRET=""
JWT_ACCESS_SECRET_EXPIRES_IN=""
REFRESH_TOKEN_EXPIRES_IN=""
FRONTEND_URL="
BCRYPTBCRYPT_SALT_ROUNDS=""
PORT=""
NODE_ENV=""

GOOGLE_API_KEY=""
OPENROUTER_API_KEY=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
BACKEND_URL="

REDIS_URL="


CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

```

### 3. Database Setup
```bash
npx prisma db push      # Sync schema with PostgreSQL database
npx prisma generate     # Generate Prisma Client types
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 📊 Performance Benchmark

The API was stress‑tested with **k6**. The load test simulated 100 virtual users for 3 minutes, covering all major endpoints.

![k6 Benchmark Report](./benchmark_report.png)

The full HTML report can be viewed at https://dev-alauddin-bd.github.io/Mentoro_Backend/benchmark_report.html

```bash
npm run k6
```

---

## 🧪 Unit Testing

All tests are written with **Jest** and achieve > 99% coverage. Run them with:

![Unit Test Report](./unit_testing_report.png)

```bash
npm run test
npm run test:watch
npm run test:coverage
```

---

## Made by [Md Alauddin](https://github.com/dev-alauddin-bd)

