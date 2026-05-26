# 🚀 Mentoro — Backend API

> A robust, modular, and scalable RESTful API powering the Mentoro Learning Management System (LMS). Built with **Express 5**, **Prisma 7**, **PostgreSQL**, and **Advanced AI Orchestration**.

---

## 📖 About The Project

The Mentoro Backend serves as the foundational engine for a full‑featured online education platform. It provides a secure, efficient, and flexible architecture to handle everything from user authentication and role management to complex **Mentoro** structures, progress tracking, and secure financial transactions.

By integrating modern technologies like LangChain for AI features and Cloudinary for media management, the backend ensures an optimized and intelligent experience for both students seeking knowledge and instructors building their audiences.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 📚 **Complete Mentoro CRUD** | Manage Categories, **Mentoro**, Modules, and Lessons with rich metadata, search, and pagination capabilities. |
| 🔐 **Advanced Authentication** | Secure JWT‑based authentication (access/refresh tokens) combined with Firebase integration for social logins. |
| 👥 **Role‑Based Access Control** | Strictly enforced guards for `student`, `instructor`, and `admin` roles, along with comprehensive User Management (block/unblock, role updates). |
| ☁️ **Media Management** | Integrated with **Cloudinary** and **Multer** for reliable image and video uploads directly from the client or server. |
| 🤖 **AI Orchestration (RAG)** | Context‑aware AI Mentor, smart semantic search, and automated MCQ generation using **LangChain** and **OpenRouter**. |
| 💼 **Jobs & Careers Management** | Complete CRUD operations for job postings, along with applicant tracking and resume submissions. |
| 📹 **Live Sessions** | Specialized endpoints for instructors to schedule, manage, and register students for live classes. |
| 📊 **Platform Analytics** | Aggregated analytics endpoints providing key metrics on user growth, revenue generation, and **Mentoro** enrollments. |
| 💳 **Secure Payments** | **Stripe** integration for handling checkout sessions and webhooks for success, failure, and refund scenarios. |
| 📊 **Progress Tracking** | Sophisticated enrollment tracking allowing students to follow linear progressions and complete lessons. |
| 🛡️ **Data Validation** | Strict runtime validation of incoming requests and payloads using **Zod**. |
| 🚀 **Performance Optimized** | Rate limiting, Redis caching (optional), and optimized Prisma queries for fast response times.

---

## 📁 Project Architecture

```plaintext
mentoro-backend/
├── prisma/
│   └── schema.prisma            # Database schema mapping (15+ core models)
├── src/
│   ├── index.ts                 # Express app initialization & middleware stack
│   ├── server.ts                # Entry point & server bootstrap
│   ├── lib/
│   │   ├── prisma.ts            # Prisma client singleton instance
│   │   └── stripe.ts            # Stripe SDK integration
│   └── app/
│       ├── controllers/         # Request handling for Auth, Mentoro, AI, Users
│       ├── services/            # Core business logic, DB queries, LangChain flows
│       ├── routes/              # Modular API route definitions
│       ├── middlewares/         # Auth verification, Role guards, Error handling
│       ├── validations/         # Zod schemas for rigorous input validation
│       └── utils/               # Utilities (Response formatting, async wrappers)
```

---

## 🔌 Core API Endpoints

### 📚 Mentoro Management
- `GET /api/v1/mentoro` - Fetch catalog with search, filters, and pagination
- `POST /api/v1/mentoro` - Create a new **Mentoro** (Instructor/Admin)
- `GET /api/v1/mentoro/:id` - Get comprehensive **Mentoro** details
- `PUT /api/v1/mentoro/:id` - Update **Mentoro** information
- `DELETE /api/v1/mentoro/:id` - Remove a **Mentoro`

### 🤖 AI Integration
- `POST /api/v1/ai/chat` - Interact with the context‑aware AI Mentor
- `GET /api/v1/ai/generate-quiz/:lessonId` - Dynamically generate a quiz
- `GET /api/v1/ai/search` - Perform semantic search across the platform

### 🔐 Authentication & Users
- `POST /api/v1/auth/signup` - Register an account
- `POST /api/v1/auth/login` - Authenticate and retrieve JWTs
- `GET /api/v1/users/me` - Retrieve current user profile
- `PATCH /api/v1/users/:id/role` - Update user role (Admin only)
- `PATCH /api/v1/users/:id/status` - Block/unblock users (Admin only)

### 💼 Jobs & Careers
- `GET /api/v1/jobs` - List open job positions
- `POST /api/v1/jobs` - Create a new job listing
- `POST /api/v1/jobs/apply` - Submit a job application

### 📹 Live Sessions
- `POST /api/v1/live-sessions` - Schedule a new live session
- `POST /api/v1/live-sessions/register` - Register for a session

### 📊 Platform Analytics
- `GET /api/v1/analytics/stats` - Fetch core platform metrics
- `GET /api/v1/analytics/users` - Fetch user growth trends

### 💳 Payments & Enrollments
- `POST /api/v1/enrollments` - Enroll in free or paid **Mentoro**s (triggers Stripe)
- `POST /api/webhook` - Stripe webhook listener

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
DATABASE_URL=postgres://user:password@host:port/database?sslmode=verify-full

# Auth Configuration
JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_ACCESS_SECRET_EXPIRES_IN=1d
REFRESH_TOKEN_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# AI & LLM (OpenRouter)
OPENROUTER_API_KEY=your_openrouter_api_key

# Payments (Stripe)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Third-party Integrations
GOOGLE_API_KEY=your_google_api_key
REDIS_URL=rediss://...
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

## 🧪 Tech Stack Overview

| Technology | Purpose |
|-----------|---------|
| **Express 5** | Robust, fast, and minimal HTTP web framework |
| **Prisma 7** | Next‑generation Node.js and TypeScript ORM |
| **PostgreSQL** | Powerful, open source object‑relational database system |
| **LangChain & OpenRouter** | Framework for developing applications powered by language models |
| **Cloudinary** | Cloud‑based image and video management |
| **Stripe** | Payment processing infrastructure |
| **Zod** | TypeScript‑first schema declaration and validation |
| **TypeScript 5.9** | Static typing for enhanced developer experience and code quality |

---

<p align="center">
  <b>Built with ❤️ for modern education.</b>
</p>
