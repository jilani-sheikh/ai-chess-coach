# AI Chess Coach — Technical Architecture Document

## 1. System Overview

AI Chess Coach is a modern AI-powered web application designed to help chess players improve by combining objective Stockfish engine evaluations with natural language LLM explanations and RAG-driven strategic knowledge.

The application follows a modular Next.js App Router architecture styled with a luxury dark gold design system.

---

## 2. Technology Stack

* **Frontend Framework**: Next.js 16 (App Router) + React 19 + TypeScript
* **Styling**: Tailwind CSS v4 + `tw-animate-css` + `shadcn/ui` custom tokens + CSS Keyframe Animations
* **Design System**: Luxury Dark Gold (`#0b0b0e` obsidian background, warm gold `#dfb46c` accents, glassmorphic panels)
* **Authentication**: Auth.js (NextAuth) with JWT Session Strategy & Credentials / Google OAuth
* **Database & ORM**: PostgreSQL (hosted on Neon) + Prisma 7.10.0 (`@prisma/adapter-pg` driver adapter)
* **Validation**: Zod (client & server schemas)
* **Password Hashing**: `bcryptjs` (12 salt rounds)

---

## 3. Directory Layout

```text
src/
  app/
    page.tsx                   # Luxury Dark Gold Landing Page
    layout.tsx                 # Root Layout & Theme Configuration
    globals.css                # Custom CSS variables, Glassmorphism & Animations
    auth/
      page.tsx                 # Tabbed Login / Signup Authentication Page
    api/
      auth/
        [...nextauth]/route.ts  # Auth.js API route handler
        register/route.ts      # User Registration API endpoint

  components/
    landing/                   # Landing Page Components
      Navbar.tsx               # Header with logo, nav links & CTAs
      HeroSection.tsx          # Hero banner with floating Brilliant Move & Accuracy cards
      HowItWorksSection.tsx    # 4-step continuous improvement loop
      GameAnalysisPreview.tsx  # Engine eval graph & mistake explanation preview
      AICoachPreview.tsx       # Interactive AI Coach chat interface preview
      PersonalImprovementSection.tsx # Value prop cards & social proof bar
      TrainingPreviewSection.tsx # Adaptive puzzle preview cards
      Footer.tsx               # Product footer
    auth/
      auth-form.tsx            # Zod-validated Auth Form

  lib/
    auth/
      auth.ts                  # NextAuth options & provider configuration
    db/
      index.ts                 # Singleton Prisma 7 client with @prisma/adapter-pg
    validations/
      auth.ts                  # Zod validation schemas

prisma/
  schema.prisma                # Minimal Phase 1 schema (User & Account)
prisma.config.ts               # Prisma 7.10.0 CLI & database configuration
```

---

## 4. Authentication Flow

1. **Sign Up**:
   - User inputs Name, Email, and Password on `/auth`.
   - Zod validates input on client and server.
   - `/api/auth/register` verifies email uniqueness and hashes password with `bcryptjs` (12 salt rounds).
   - User record created in Neon PostgreSQL `User` table.
2. **Sign In**:
   - NextAuth Credentials provider compares submitted password with `passwordHash` using `bcrypt.compare`.
   - On success, NextAuth issues a signed JWT token containing user `id`, `name`, and `email`.
3. **Google OAuth**:
   - Initiated via `signIn("google")`, creating linked record in `Account` table upon verification.

---

## 5. Database Architecture & Safety Rules

* Connection managed via Neon PostgreSQL pooling URL.
* Managed using Prisma 7.10.0 schema and `prisma.config.ts`.
* Non-destructive schema updates enforced: `prisma db push` / inspected migrations.
