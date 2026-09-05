# AI Chess Coach — Database Specification & Design

## 1. Database Infrastructure

* **Engine**: PostgreSQL
* **Hosting**: Neon Serverless PostgreSQL
* **ORM**: Prisma 7.10.0
* **Driver Adapter**: `@prisma/adapter-pg` with `pg.Pool`

---

## 2. Phase 1 — Minimal Schema

For Phase 1, the database schema strictly contains only the entities required for user account management and Auth.js authentication:

```prisma
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  passwordHash  String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  accounts      Account[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}
```

---

## 3. Database Safety Decisions Log

* **JWT Session Strategy**: The `Session` model is omitted because sessions are handled via stateless JWTs.
* **Email Verification**: Deferred to future phases; `VerificationToken` model is excluded.
* **Schema Protection**: Existing Neon tables are inspected prior to schema synchronization. Destructive commands (`prisma migrate reset` / `DROP TABLE`) are strictly prohibited.
