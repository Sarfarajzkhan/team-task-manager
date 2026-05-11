# 🚀 Team Task Manager

A full-stack collaborative **project & task management** web application built with **NestJS**, **TypeORM**, **PostgreSQL**, and **EJS** server-side rendering. It supports role-based access for **Admins** and **Members**, with a clean, responsive UI.

---

## 📸 Features Overview

| Feature | Admin | Member |
|---|:---:|:---:|
| Register & Login | ✅ | ✅ |
| View Dashboard (stats, charts) | ✅ | ✅ |
| Create Projects | ✅ | ❌ |
| View Projects (own/assigned) | ✅ | ✅ |
| Add Members to Projects | ✅ | ❌ |
| Create Tasks (project members only) | ✅ | ❌ |
| View Assigned Tasks | ✅ | ✅ |
| Update Task Status | ✅ | ✅ (own tasks) |
| View Overdue Tasks | ✅ | ✅ (own tasks) |
| REST API (Swagger Docs) | ✅ | ✅ |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [NestJS](https://nestjs.com/) v11 |
| **Language** | TypeScript |
| **Database** | PostgreSQL (via [Neon](https://neon.tech) serverless) |
| **ORM** | TypeORM v0.3 |
| **Templating** | EJS + express-ejs-layouts |
| **Authentication** | JWT (via cookie) + Passport |
| **Validation** | class-validator + class-transformer |
| **API Docs** | Swagger / OpenAPI |
| **Security** | Helmet (CSP), bcrypt, cookie-parser |
| **Frontend** | Bootstrap 5.3, Bootstrap Icons, Chart.js, Toastify |

---

## 📁 Project Structure

```
src/
├── auth/               # JWT auth, login, signup, guards
├── common/
│   ├── enums/          # Role, TaskStatus, Priority enums
│   ├── filters/        # Global HTTP exception filter
│   ├── guards/         # JWT & Roles guards
│   ├── interceptors/   # Response wrapper interceptor
│   └── middleware/     # Auth cookie middleware (SSR)
├── config/             # TypeORM database configuration
├── dashboard/          # Dashboard stats & analytics service
├── projects/           # Projects CRUD, member management
├── tasks/              # Task creation, status updates
├── users/              # User management
├── web/                # SSR web controller (EJS pages)
└── views/
    ├── auth/           # Login & Signup pages
    ├── dashboard/      # Dashboard page
    ├── layouts/        # main.ejs & auth-layout.ejs
    ├── partials/       # head, navbar, sidebar, footer, scripts
    ├── projects/       # Projects list & details pages
    └── tasks/          # Tasks page

public/
├── css/style.css       # Custom stylesheet
└── js/main.js          # Frontend JS (sidebar, toast, members loader)
```

---

## ⚙️ Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [npm](https://www.npmjs.com/) v9+
- A PostgreSQL database (local or [Neon](https://neon.tech))

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd team-task-manager-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Database (PostgreSQL / Neon)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# App
PORT=5000
NODE_ENV=development
```

### 4. Run the Application

```bash
# Development (with hot reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

The app will be available at **http://localhost:5000**

---

## 🌐 Application Pages

| Route | Description | Auth Required |
|---|---|---|
| `GET /login` | Login page | No |
| `GET /signup` | Register page | No |
| `GET /` | Dashboard | Yes |
| `GET /projects` | All projects | Yes |
| `GET /projects/:id` | Project details + members | Yes |
| `GET /tasks` | Task list | Yes |
| `GET /logout` | Logout | Yes |

---

## 📡 REST API Endpoints

Full Swagger documentation is available at:

```
http://localhost:5000/api/docs
```

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register a new user |
| `POST` | `/api/auth/login` | Login & get JWT token |
| `GET` | `/api/auth/me` | Get current user profile |

### Projects

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `POST` | `/api/projects` | Create a project | Admin |
| `GET` | `/api/projects` | List all/member projects | Both |
| `POST` | `/api/projects/:id/members` | Add member to project | Admin |
| `DELETE` | `/api/projects/:id/members/:userId` | Remove member | Admin |

### Tasks

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `POST` | `/api/tasks` | Create a task | Admin |
| `GET` | `/api/tasks` | List tasks | Both |
| `PATCH` | `/api/tasks/:id/status` | Update task status | Both* |
| `GET` | `/api/tasks/overdue/list` | Get overdue tasks | Both |

> *Members can only update tasks assigned to them.

### Users

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/api/users` | List all users | Admin |
| `GET` | `/api/users/:id` | Get user by ID | Admin |
| `DELETE` | `/api/users/:id` | Delete a user | Admin |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Get dashboard stats |

---

## 🔐 Authentication Flow

1. User registers via `/signup` (selects role: **Admin** or **Member**)
2. On login, server issues a **JWT stored as an HTTP-only cookie**
3. The `AuthMiddleware` reads the cookie on every request and attaches the decoded user to `res.locals.user`
4. Protected routes check `res.locals.user` — unauthenticated users are redirected to `/login`
5. Role-based actions are enforced both in the **UI** (buttons hidden) and **server-side** (redirects with error messages)

---

## 🗄️ Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | VARCHAR | |
| email | VARCHAR | Unique, indexed |
| password | VARCHAR | bcrypt hashed |
| role | ENUM | `ADMIN` / `MEMBER` |
| createdAt | TIMESTAMP | Auto |
| deletedAt | TIMESTAMP | Soft delete |

### `projects`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | VARCHAR | |
| description | TEXT | Nullable |
| createdBy | FK → users | |
| createdAt | TIMESTAMP | Auto |

### `project_members`
| Column | Type | Notes |
|---|---|---|
| projectId | FK → projects | Composite PK |
| userId | FK → users | Composite PK |

### `tasks`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| title | VARCHAR | |
| description | TEXT | Nullable |
| status | ENUM | `TODO` / `IN_PROGRESS` / `DONE` |
| priority | ENUM | `LOW` / `MEDIUM` / `HIGH` |
| dueDate | TIMESTAMP | |
| assignedTo | FK → users | Must be a project member |
| createdBy | FK → users | |
| project | FK → projects | Cascade delete |

---

## 🎨 UI Highlights

- **Role-based UI** — Admins see "Create Project", "Create Task", and "Add Member" buttons; Members see only their relevant data
- **Dynamic Task Assignment** — Selecting a project in "Create Task" dynamically loads only that project's members via a fetch API call
- **Overdue Detection** — Tasks past their due date are highlighted in red with an "OVERDUE" badge
- **Flash Messages** — Success and error messages are displayed via URL query params after every form action
- **Chart.js Dashboard** — A doughnut chart visualizes task completion breakdown
- **Responsive Design** — Mobile-friendly sidebar with hamburger menu toggle

---

## 🧪 Development Commands

```bash
# Start with hot reload
npm run start:dev

# Lint & auto-fix
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Run tests
npm test
```

---

## 📝 Notes

- **TypeORM `synchronize: true`** is enabled — the database schema auto-syncs on startup. Disable this in production and use migrations instead.
- The app uses **Neon PostgreSQL** (serverless) by default. Any standard PostgreSQL connection string works.
- JWT is stored as an **HTTP-only cookie** — it is not accessible via JavaScript, providing XSS protection.
- The global `ValidationPipe` with `whitelist: true` strips unknown properties from API request bodies.

---

## 📄 License

This project is **UNLICENSED** — created as a college/assignment project.

---

*Built with ❤️ using NestJS, TypeORM, and Bootstrap.*
