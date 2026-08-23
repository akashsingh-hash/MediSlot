# 🏥 MediSlot — Smart Healthcare Appointment & Patient Care Platform

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Google Gemini](https://img.shields.io/badge/Gemini_AI-1.5-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

**MediSlot is a modern, full-stack healthcare platform connecting patients, doctors, and administrators through intelligent appointment scheduling, patient management, AI-assisted pre-visit insights, medication reminders, and secure clinical communication.**

[✨ Features](#-key-features) • [🏛️ Architecture](#%EF%B8%8F-system-architecture) • [🛠️ Tech Stack](#%EF%B8%8F-tech-stack) • [🚀 Quick Start](#-local-development-setup) • [🔐 Security](#-security--reliability)

</div>

---

## 📸 Platform Showcase

### Modern Clinical Experience
- **Responsive Landing Page**: Sleek presentation with clear value propositions, interactive role showcases, and intuitive navigation.
- **Patient Workspace**: Real-time next appointment alerts, dynamic health pulse, medication adherence tracking, and quick booking triggers.
- **Clinician Workspace**: Daily agenda queues, patient consultation records, digital prescription generation, and leave management.
- **Administrator Hub**: Platform KPI statistics, verified practitioner management, leave approvals, and system service health metrics.
- **AI Pre-Visit Summarizer**: Automatic structuring of patient symptoms into urgency indicators, chief complaints, and suggested clinician questions.
- **Two-Way Google Calendar Sync**: Real-time appointment integration directly to patient and doctor calendars via OAuth 2.0.

---

## 🎯 Key Features

### 👤 Patient Experience
- **Intelligent Doctor Discovery**: Search clinicians by specialty (Cardiology, Neurology, Dermatology, General Medicine, Pediatrics, etc.), availability, and experience.
- **Real-Time Booking**: Interactive slot picker with concurrency locking to prevent double bookings.
- **AI Pre-Visit Intake**: Structured symptom descriptions to assist doctor consultation preparation.
- **Prescriptions & Medication Tracker**: Full visibility into active dosages, frequencies, duration countdowns, and refill schedules.
- **Direct Care Messaging**: In-app messaging with attending physicians.
- **Two-Way Calendar Sync**: Automatic sync of scheduled consultations and reminders to Google Calendar.

### 🩺 Doctor Workspace
- **Daily Clinical Schedule**: Live patient queue showing appointment statuses (Held, Confirmed, Completed, Cancelled).
- **Patient Medical History**: Longitudinal view of past visits, notes, and previous medications.
- **Digital Prescription Drawer**: Fast prescription authoring directly attached to completed consultations.
- **Availability & Leave Management**: Configurable working hours, slot durations, and conflict-free leave scheduling.
- **AI Clinical Support**: Pre-generated symptom briefs and structured discussion guides for upcoming visits.

### 🛡️ Administrator Operations
- **System KPIs**: Live analytics on total patients, verified practitioners, appointment completion rates, and cancellation ratios.
- **Practitioner Directory**: Onboard, edit, and manage doctor credentials and schedules.
- **Leave Resolution**: Manage doctor leave requests with automatic rescheduling alerts for affected patients.
- **Service Health Monitoring**: Real-time operational status for API services, database connectivity, and background queues.

---

## 🏛️ System Architecture

```mermaid
graph TD
    User([Client / Browser]) <--> |Next.js 16 App Router| WebApp[MediSlot Web UI]
    WebApp <--> |REST API / JWT| FastifyAPI[NestJS + Fastify API]
    
    subgraph Core Services
        FastifyAPI <--> |Prisma ORM| Postgres[(PostgreSQL Database)]
        FastifyAPI <--> |BullMQ / ioredis| RedisQueue[(Redis Queue)]
    end
    
    subgraph Third-Party Integrations
        FastifyAPI <--> |REST API| Gemini[Google Gemini AI]
        FastifyAPI <--> |OAuth 2.0 API| GCalendar[Google Calendar API]
        FastifyAPI <--> |SDK| ResendEmail[Resend Transactional Email]
    end
```

### Key Architectural Patterns
1. **Concurrency Protection (P2002 Lock)**: Uses PostgreSQL unique composite constraints (`[doctorId, startTime]`) within atomic database transactions to eliminate race conditions and double-bookings.
2. **Transactional Outbox Pattern**: Asynchronous background jobs (emails, calendar updates, AI briefs) are queued in the database within the booking transaction, guaranteeing zero data loss or partial failures.
3. **Graceful AI Fallbacks**: Gemini AI summaries execute asynchronously via BullMQ; if the AI service experiences latency, consultations proceed uninterrupted with raw patient notes.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | [Next.js 16](https://nextjs.org/) (React 19) | Modern React framework with App Router & Server Components |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Clinical SaaS design system with light/dark theme support |
| **UI Components** | [Radix UI](https://www.radix-ui.com/) & [Lucide Icons](https://lucide.dev/) | Accessible primitives and modern icon set |
| **State & Data** | [TanStack React Query](https://tanstack.com/query) | Client-side async cache and mutation handling |
| **Backend API** | [NestJS 11](https://nestjs.com/) + [Fastify](https://www.fastify.io/) | High-performance modular backend framework |
| **Database ORM** | [Prisma 5](https://www.prisma.io/) + [PostgreSQL](https://www.postgresql.org/) | Type-safe database queries and migrations |
| **Queue / Cache** | [BullMQ](https://bullmq.io/) + [Redis](https://redis.io/) | Resilient background processing and transactional outbox |
| **Artificial Intelligence** | [Google Gemini 1.5](https://ai.google.dev/) | Pre-visit symptom structuring & doctor intake briefing |
| **Calendar Sync** | [Google Calendar API](https://developers.google.com/calendar) | 2-way OAuth 2.0 appointment and reminder sync |
| **Email Service** | [Resend](https://resend.com/) | Transactional appointment notifications and reschedule alerts |
| **Monorepo Tooling** | [pnpm Workspaces](https://pnpm.io/) | Fast, isolated package dependency management |

---

## 📁 Repository Structure

```
medislot/
├── apps/
│   ├── api/                     # NestJS Backend API
│   │   ├── src/
│   │   │   ├── admin/           # Admin metrics and doctor management
│   │   │   ├── appointments/    # Slot booking, hold locks, state machine
│   │   │   ├── auth/            # JWT authentication & password hashing
│   │   │   ├── calendar/        # Google Calendar OAuth2 integration
│   │   │   ├── doctors/         # Clinician discovery, profiles & slots
│   │   │   ├── email/           # Resend email notification provider
│   │   │   ├── llm/             # Google Gemini AI symptom analyzer
│   │   │   ├── medications/     # Prescription and reminder tracking
│   │   │   ├── messages/        # Direct patient-doctor messaging
│   │   │   ├── prisma/          # Database client service
│   │   │   └── queue/           # BullMQ outbox event worker
│   │   └── package.json
│   └── web/                     # Next.js 16 Frontend App
│       ├── app/                 # App Router pages and layout
│       ├── components/          # Dashboards, modals, and landing views
│       ├── hooks/               # Custom React hooks
│       ├── lib/                 # API client and utility helpers
│       └── package.json
├── packages/
│   ├── database/                # Prisma schema, client, and seeders
│   └── shared/                  # Shared Zod validation schemas
├── docs/                        # Architecture and integration guides
├── .env.example                 # Root environment template
├── package.json                 # Monorepo root configuration
└── pnpm-workspace.yaml          # pnpm workspace definition
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
Ensure the following tools are installed on your machine:
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **pnpm**: `v9.x` or `v10.x` (`npm install -g pnpm`)
- **PostgreSQL**: Local database instance or cloud provider ([Neon](https://neon.tech), Supabase)
- **Redis**: Local instance or cloud provider ([Upstash](https://upstash.com))

---

### 2. Installation
Clone the repository and install all workspace dependencies:

```bash
# Install all workspace dependencies
pnpm install
```

---

### 3. Environment Configuration
Create the `.env` file from the provided template:

```bash
# Copy example configuration to root
cp .env.example .env
```

Configure your `.env` variables:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/medislot?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# Authentication
AUTH_SECRET="your-super-secret-jwt-key-replace-in-production"
PORT=3001

# AI (Google Gemini)
GEMINI_API_KEY="your-gemini-api-key"

# Email (Resend)
RESEND_API_KEY="re_your_api_key"
EMAIL_FROM="MediSlot <notifications@medislot.demo>"

# Google Calendar OAuth 2.0
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/calendar/callback"

# Frontend API URL
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

---

### 4. Database Setup & Seeding

```bash
# Generate the Prisma client
pnpm --filter @medislot/database db:generate

# Push schema changes to your database
pnpm --filter @medislot/database db:push

# (Optional) Seed sample doctors, patients, and slots
pnpm --filter @medislot/database db:seed
```

---

### 5. Running the Application

Start both the backend API and frontend web application concurrently:

```bash
# Start all workspace applications in development mode
pnpm dev
```

| Application | URL | Description |
| :--- | :--- | :--- |
| **Frontend Web** | `http://localhost:3000` | Landing page and application dashboard |
| **Backend API** | `http://localhost:3001` | Fastify REST API |
| **Swagger API Docs** | `http://localhost:3001/api/docs` | Interactive OpenAPI documentation |

---

## 🧪 Demo Test Accounts

When running in development mode, the login screen includes quick demo buttons:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Patient** | `patient@demo.local` | `demo123` |
| **Doctor** | `doctor@demo.local` | `demo123` |
| **Admin** | `admin@demo.local` | `demo123` |

---

## 🔐 Security & Reliability

- **JWT Authentication**: Signed JSON Web Tokens with configurable expiration and secure HTTP header transport.
- **Password Security**: Strong hashing via bcrypt / argon2.
- **Role-Based Access Control (RBAC)**: Strict endpoint guards for `PATIENT`, `DOCTOR`, and `ADMIN` roles.
- **Race Condition Prevention**: Database-level unique constraints preventing overlapping reservations.
- **Safe AI Design**: AI features are explicitly marked as assistive clinical support tools and do not produce autonomous medical diagnoses.

---

## 🔮 Future Roadmap

- [ ] Telehealth video consultations with WebRTC / Daily.co
- [ ] Multi-clinic and multi-tenant department routing
- [ ] Patient EHR / Medical record PDF uploads
- [ ] Digital prescription electronic signature verification
- [ ] Automated SMS / WhatsApp consultation reminders
- [ ] Multi-language internationalization (i18n)

---

## 👨‍💻 Developer & License

Developed as an independent software project by **Akash Singh**.

Distributed under the **MIT License**.
#   M e d i S l o t  
 