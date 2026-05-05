# GeoTec — Project Context for Claude Code

This file contains the full context of the project: what was built, every decision made, the current state, and exactly what to do next. Read everything before touching any code.

---

## What This App Is

An **offline-first mobile application** for geotechnical field tests. A user creates an account, creates a group, invites colleagues, assigns roles, and records field tests (starting with Proctor and Sand Cone / Frasco de Areia). Data syncs to a Node.js backend when connectivity is available. There is also a web dashboard to visualize data.

---

## Tech Stack — Final Decisions

| Layer | Technology | Why |
|---|---|---|
| Backend | Node.js 24 + Express + TypeScript | LTS, simple to learn, industry standard |
| ORM | Prisma 7 + adapter-pg | Type-safe, auto-generates TS types |
| Database | PostgreSQL 16 Alpine | Robust, runs in Docker |
| Validation | Zod | Runtime validation + TS type inference |
| Auth | JWT (access 15min + refresh 7d) + bcrypt | Stateless, secure, works well with mobile |
| Testing | Vitest + Supertest | Fast, modern, compatible with ESM |
| Mobile | React Native + Expo + WatermelonDB | Offline-first SQLite sync |
| Web | React + Vite + TanStack Query | (not started yet) |
| Infrastructure | Docker + Docker Compose | Dev: only db in Docker. Prod: everything |

---

## Critical Environment Notes

- **OS**: Windows with WSL2 (Ubuntu). All commands run inside WSL2.
- **Node**: v24.x installed via NVM inside WSL2.
- **Prisma version**: 7.8.0 — this is a MAJOR breaking change from v6.
- **Prisma v7 breaking changes**:
  - `url` is no longer set in `schema.prisma` datasource
  - Connection is configured via `prisma.config.ts` (for migrations) and `PrismaPg` adapter (for PrismaClient)
  - `previewFeatures = ["driverAdapters"]` must be in the generator block
- **Module system**: TypeScript with `moduleResolution: NodeNext`. Imports use `.js` extension even for `.ts` files. This is correct and intentional.
- **Package runner**: `tsx` (not `ts-node`, not `nodemon`). Dev command: `tsx watch src/server.ts`

---

## Project Structure

```
geotec/
└── backend/
    ├── prisma/
    │   ├── schema.prisma          ← database models
    │   ├── migrations/            ← versioned SQL history
    │   └── config.ts             ← prisma v7 datasource config (NOT schema)
    ├── prisma.config.ts           ← Prisma v7 config file at root
    ├── src/
    │   ├── server.ts              ← entry point, starts HTTP server
    │   ├── app.ts                 ← Express app, middleware, routes, error handler
    │   ├── config/
    │   │   ├── prisma.ts          ← PrismaClient singleton with PrismaPg adapter
    │   │   ├── jwt.ts             ← generate/verify access and refresh tokens
    │   │   └── validate.ts        ← Zod middleware factory
    │   ├── schemas/
    │   │   ├── auth.schema.ts     ← Zod schemas for register/login
    │   │   └── group.schema.ts    ← Zod schemas for groups/invites
    │   ├── services/
    │   │   ├── auth.service.ts    ← register, login business logic
    │   │   └── group.service.ts   ← group CRUD, invites, RBAC checks
    │   ├── controllers/
    │   │   ├── auth.controller.ts ← HTTP layer for auth
    │   │   └── group.controller.ts← HTTP layer for groups
    │   ├── middlewares/
    │   │   └── auth.middleware.ts ← authenticate + requireRole
    │   └── routes/
    │       ├── auth.routes.ts     ← /api/auth/*
    │       └── group.routes.ts    ← /api/groups/*
    ├── requests/                  ← REST Client .http test files
    │   ├── auth.http
    │   └── groups.http
    ├── docker-compose.yml
    ├── prisma.config.ts
    ├── tsconfig.json
    ├── vitest.config.ts
    └── package.json
```

---

## Database Schema (Current)

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  // NO url here — Prisma v7 uses prisma.config.ts for this
}

model User {
  id           String        @id @default(uuid())
  email        String        @unique
  nickname     String        @unique
  name         String
  password     String        // bcrypt hash, cost 12
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  memberships  GroupMember[]
  invitesSent  Invite[]
  tests        Test[]
}

model Group {
  id          String        @id @default(uuid())
  name        String
  description String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  members     GroupMember[]
  invites     Invite[]
  tests       Test[]
}

enum GroupRole {
  MANAGER        // full control of group
  FIELD_ENGINEER // create and edit own tests
  REVIEWER       // edit any test, approve results
  VIEWER         // read only
}

model GroupMember {
  id       String    @id @default(uuid())
  role     GroupRole @default(VIEWER)
  joinedAt DateTime  @default(now())
  userId   String
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  groupId  String
  group    Group     @relation(fields: [groupId], references: [id], onDelete: Cascade)
  @@unique([userId, groupId])
}

enum InviteStatus {
  PENDING
  ACCEPTED
  DECLINED
  EXPIRED
}

model Invite {
  id          String       @id @default(uuid())
  email       String
  role        GroupRole    @default(VIEWER)
  status      InviteStatus @default(PENDING)
  expiresAt   DateTime     // 7 days from creation
  createdAt   DateTime     @default(now())
  groupId     String
  group       Group        @relation(fields: [groupId], references: [id], onDelete: Cascade)
  invitedById String
  invitedBy   User         @relation(fields: [invitedById], references: [id])
}

enum TestType {
  PROCTOR
  SAND_CONE
}

enum TestStatus {
  DRAFT
  COMPLETED
  APPROVED
}

model Test {
  id          String       @id @default(uuid())
  type        TestType
  status      TestStatus   @default(DRAFT)
  location    String?      // GPS or description
  notes       String?
  performedAt DateTime
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  groupId     String
  group       Group        @relation(fields: [groupId], references: [id], onDelete: Cascade)
  createdById String
  createdBy   User         @relation(fields: [createdById], references: [id])
  proctorData  ProctorData?
  sandConeData SandConeData?
}

model ProctorData {
  id                 String  @id @default(uuid())
  cylinderMass       Float
  soilCylinderMass   Float
  cylinderVolume     Float
  wetSoil            Float
  drySoil            Float
  tare               Float
  moisturePercentage Float   // calculated, stored for history
  dryDensity         Float   // calculated, stored for history
  optimalMoisture    Float?
  testId             String  @unique
  test               Test    @relation(fields: [testId], references: [id], onDelete: Cascade)
}

model SandConeData {
  id                 String  @id @default(uuid())
  jarInitialMass     Float
  jarFinalMass       Float
  sandDensity        Float
  sandConeMass       Float
  extractedSoil      Float
  wetSoil            Float
  drySoil            Float
  tare               Float
  moisturePercentage Float   // calculated
  holeDensity        Float   // calculated
  dryDensity         Float   // calculated
  testId             String  @unique
  test               Test    @relation(fields: [testId], references: [id], onDelete: Cascade)
}
```

---

## Key Architecture Decisions

### Authentication
- **Two tokens**: access token (15min, sent in Authorization header) + refresh token (7d, httpOnly cookie)
- **Two secrets**: `JWT_SECRET` for access, `JWT_REFRESH_SECRET` for refresh — separate attack surfaces
- **Generic error messages on login**: always "Credenciais inválidas" — never reveals if email exists
- **Password**: bcrypt with cost factor 12 (~250ms, brute-force resistant)
- **Never return password field** from any query — use `select` to exclude it

### RBAC
- Role is **per group**, not global on the user
- Role is NOT embedded in JWT — it's checked against the database on every action
- `requireGroupRole(userId, groupId, ...roles)` is the central authorization function in group.service.ts
- Managers cannot change their own role (prevents accidental lockout)

### Error Handling
- Custom error classes: `AuthError` and `GroupError` — both extend Error with a `statusCode`
- All errors flow through `next(err)` to the global error handler in `app.ts`
- HTTP 422 for Zod validation failures (not 400 — 422 = valid JSON but invalid data)
- HTTP 409 for conflicts (duplicate email, already a member, pending invite)
- HTTP 403 for authorization failures, 401 for authentication failures

### Prisma v7 Client Setup
```ts
// src/config/prisma.ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter, log: ['query', 'error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### prisma.config.ts (root level, required for Prisma v7 migrations)
```ts
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
})
```

---

## Environment Variables

```bash
# .env (never commit this)
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DB_NAME"
JWT_SECRET="long_random_string_for_access_token"
JWT_REFRESH_SECRET="different_long_random_string_for_refresh"
NODE_ENV="development"
PORT=3000
```

---

## Package.json Scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  }
}
```

---

## Installed Dependencies

```json
{
  "dependencies": {
    "@prisma/adapter-pg": "^7.8.0",
    "@prisma/client": "^7.8.0",
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.x",
    "express": "^4.x",
    "helmet": "^7.x",
    "jsonwebtoken": "^9.x",
    "morgan": "^1.x",
    "pg": "^8.x",
    "prisma": "^7.8.0",
    "zod": "^3.x"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.x",
    "@types/cookie-parser": "^1.x",
    "@types/cors": "^2.x",
    "@types/express": "^4.x",
    "@types/jsonwebtoken": "^9.x",
    "@types/morgan": "^1.x",
    "@types/node": "^24.x",
    "@types/pg": "^8.x",
    "@types/supertest": "^6.x",
    "@vitest/coverage-v8": "^2.x",
    "supertest": "^7.x",
    "tsx": "^4.x",
    "typescript": "^6.x",
    "vitest": "^2.x"
  }
}
```

---

## API Endpoints (Implemented)

### Auth — `/api/auth`
| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/register` | ❌ | `{ name, email, nickname, password }` | Register new user |
| POST | `/login` | ❌ | `{ email, password }` | Login, returns accessToken + sets httpOnly cookie |
| POST | `/refresh` | ❌ (cookie) | — | Get new accessToken using refresh cookie |
| POST | `/logout` | ❌ | — | Clears refresh token cookie |

### Groups — `/api/groups` (all require Bearer token)
| Method | Path | Required Role | Body | Description |
|---|---|---|---|---|
| POST | `/` | any authenticated | `{ name, description? }` | Create group, requester becomes MANAGER |
| GET | `/` | any authenticated | — | List all groups the user belongs to |
| GET | `/:id` | member of group | — | Get group details + members |
| POST | `/:id/invite` | MANAGER or REVIEWER | `{ email? or nickname, role }` | Invite user to group |
| POST | `/invites/:inviteId/accept` | invited user | — | Accept a pending invite |
| PATCH | `/:id/members/:userId/role` | MANAGER only | `{ role }` | Change a member's role |

---

## Git Workflow

- **`main`** — production only, receives merges from develop via PR with 1 approval
- **`develop`** — integration branch, always up to date
- **`feat/*`**, **`fix/*`**, **`chore/*`** — short-lived feature branches, PR into develop
- Commit convention: `feat(scope): description`, `fix(scope): description`, `chore(scope): description`
- Never commit directly to `main` or `develop`

---

## What Was NOT Done Yet (Next Steps in Order)

### IMMEDIATE — Week 7: Field Tests (Proctor + Sand Cone)

This is the core domain of the application. Build in this order:

#### 1. Test calculation logic (write unit tests FIRST for this part)

Create `src/services/calculations/proctor.ts`:
- **Inputs**: `cylinderMass`, `soilCylinderMass`, `cylinderVolume`, `wetSoil`, `drySoil`, `tare`
- **Formulas**:
  - `moisturePercentage = ((wetSoil - drySoil) / (drySoil - tare)) * 100`
  - `wetDensity = (soilCylinderMass - cylinderMass) / cylinderVolume`
  - `dryDensity = wetDensity / (1 + moisturePercentage / 100)`
- Returns calculated fields — pure function, no DB access
- **Write Vitest unit tests before implementing** — this is where TDD makes sense

Create `src/services/calculations/sandCone.ts`:
- **Inputs**: `jarInitialMass`, `jarFinalMass`, `sandDensity`, `sandConeMass`, `extractedSoil`, `wetSoil`, `drySoil`, `tare`
- **Formulas**:
  - `sandUsed = jarInitialMass - jarFinalMass - sandConeMass`
  - `holeVolume = sandUsed / sandDensity`
  - `moisturePercentage = ((wetSoil - drySoil) / (drySoil - tare)) * 100`
  - `holeDensity = extractedSoil / holeVolume`
  - `dryDensity = holeDensity / (1 + moisturePercentage / 100)`
- **Write Vitest unit tests before implementing**

#### 2. Zod schemas for test input

Create `src/schemas/test.schema.ts`:
```ts
import { z } from 'zod'
import { TestType } from '@prisma/client'

export const createTestSchema = z.object({
  type: z.nativeEnum(TestType),
  location: z.string().optional(),
  notes: z.string().optional(),
  performedAt: z.string().datetime(),
  data: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('PROCTOR'),
      cylinderMass: z.number().positive(),
      soilCylinderMass: z.number().positive(),
      cylinderVolume: z.number().positive(),
      wetSoil: z.number().positive(),
      drySoil: z.number().positive(),
      tare: z.number().positive(),
    }),
    z.object({
      type: z.literal('SAND_CONE'),
      jarInitialMass: z.number().positive(),
      jarFinalMass: z.number().positive(),
      sandDensity: z.number().positive(),
      sandConeMass: z.number().positive(),
      extractedSoil: z.number().positive(),
      wetSoil: z.number().positive(),
      drySoil: z.number().positive(),
      tare: z.number().positive(),
    }),
  ]),
})
```

#### 3. Test service

Create `src/services/test.service.ts`:
- `createTest(userId, groupId, input)` — checks `FIELD_ENGINEER` or `MANAGER` role, runs calculations, stores test + data in a Prisma transaction
- `getTestsByGroup(userId, groupId, filters?)` — checks membership, supports filter by type/status/date
- `getTestById(userId, testId)` — checks membership
- `updateTestStatus(userId, testId, status)` — `REVIEWER` or `MANAGER` can approve
- `deleteTest(userId, testId)` — only `MANAGER` or test creator (if still DRAFT)

#### 4. Routes

```
POST   /api/groups/:groupId/tests          → create test (FIELD_ENGINEER+)
GET    /api/groups/:groupId/tests          → list tests (any member)
GET    /api/groups/:groupId/tests/:testId  → get single test (any member)
PATCH  /api/groups/:groupId/tests/:testId/status → update status (REVIEWER+)
DELETE /api/groups/:groupId/tests/:testId  → delete test (MANAGER or creator)
```

#### 5. Integration tests

After implementing the routes, write integration tests using Supertest:
- Create test user + group in `beforeEach`
- Test: FIELD_ENGINEER can create test → verify calculations are correct
- Test: VIEWER cannot create test → expect 403
- Test: REVIEWER can approve → FIELD_ENGINEER cannot
- Test: calculations produce correct numeric results

---

### WEEK 8: Export + Filtering

- `GET /api/groups/:groupId/tests?type=PROCTOR&status=APPROVED&from=2026-01-01&to=2026-12-31`
- `GET /api/groups/:groupId/tests/export?format=csv` — CSV export of test results
- Consider adding pagination: `?page=1&limit=20`

---

### WEEK 9: File uploads (photos from field)

- Install `multer` for file handling
- Store photos locally in `uploads/` (dev) or S3-compatible storage (prod)
- Add `TestPhoto` model to schema: `{ id, testId, url, caption?, createdAt }`
- `POST /api/groups/:groupId/tests/:testId/photos`
- `GET /api/groups/:groupId/tests/:testId/photos`

---

### WEEK 10–13: React Native Mobile

- Expo + React Navigation (tab + stack)
- WatermelonDB for local SQLite (offline-first)
- Auth screens: Login, Register
- Group screens: My Groups, Group Detail, Invite Member
- Test screens: Test List, Create Proctor Test, Create Sand Cone Test
- Sync engine: queue local changes, sync when online

---

### WEEK 14–15: React Web Dashboard

- Vite + React + TanStack Query
- Auth: Login page, token stored in memory + refresh via cookie
- Dashboard: Group overview, test list with filters
- Charts: Proctor curve (density vs moisture), test history
- Admin: manage members, view invites

---

### WEEK 16: Production

- Dockerfile for the Node API (multi-stage build)
- docker-compose.prod.yml — all services containerized
- Environment-specific configs
- HTTPS via reverse proxy (Nginx or Caddy)
- Deploy to VPS (Hetzner or DigitalOcean recommended)
- Basic CI with GitHub Actions: lint → test → build on PR

---

## Commands to Run After Cloning

```bash
# Inside WSL2
cd backend
npm install
npx prisma generate       # required after npm install
cp .env.example .env      # fill in your values
docker compose up -d db   # start PostgreSQL
npx prisma migrate deploy # apply all migrations
npm run dev               # start dev server
```

After any teammate runs a new migration:
```bash
git pull origin develop
npx prisma migrate deploy
```

---

## Testing Philosophy

- **Unit tests**: calculation functions (proctor.ts, sandCone.ts) — pure functions, perfect for TDD
- **Integration tests**: full HTTP request → middleware → controller → DB → response
- **No mocking of Prisma** — use a real test database (set `DATABASE_URL` to a separate test DB in CI)
- Test files live next to the code: `src/services/calculations/proctor.test.ts`
- Run: `npm test` (watch mode) or `npm run test:coverage`

---

## Conventions to Follow

- All imports use `.js` extension even for `.ts` files (NodeNext resolution)
- Error classes extend `Error` with `statusCode: number`
- Services never import from controllers or routes — dependency flows one way
- Every route that touches group data must verify membership via `requireGroupRole`
- Passwords are never returned — always use `select` to exclude the `password` field
- Transactions (`prisma.$transaction`) for any operation that writes to multiple tables
- Conventional commits: `feat(scope):`, `fix(scope):`, `chore(scope):`, `docs:`
