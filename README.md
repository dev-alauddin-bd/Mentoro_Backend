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
| 🤖 **AI Orchestration (RAG)** | Context‑aware AI Mentor, smart semantic search and generate title based on keyword using all features of  input text as context-aware with **OpenRouter**. |
| 💼 **Jobs & Careers Management** | Complete CRUD operations for job postings, along with applicant tracking and resume submissions. |
| 📹 **Live Sessions** | Specialized endpoints for instructors to schedule, manage, and register students for live classes. |
| 📊 **Platform Analytics** | Aggregated analytics endpoints providing key metrics on user growth, revenue generation, and **Mentoro** enrollments. |
| 💳 **Secure Payments** | **Stripe** integration for handling checkout sessions and webhooks for success, failure, and refund scenarios. |
| 📊 **Progress Tracking** | Sophisticated enrollment tracking allowing students to follow linear progressions and complete lessons. |
| 🛡️ **Data Validation** | Strict runtime validation of incoming requests and payloads using **Zod**. |
| 🚀 **Performance Optimized** | Rate limiting, Redis caching (optional), and optimized Prisma queries for fast response times.


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

## Made by [Alauddin-dev](https://github.com/dev-alauddin-bd)

