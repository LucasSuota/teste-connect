# GeoTec

> Offline-first mobile application for geotechnical field testing

##Still in development!

By now only Proctor and Sand Cone test are available in the backend. In the mobile the user will create tests directly on their phone. Data syncs automatically to the backend when connectivity is restored. Managers review results, approve tests, and export reports from the web dashboard.

---

## Features

- **Offline-first mobile** — record tests in the field with no internet required. Syncs when back online.
- **Group-based collaboration** — create a group, invite your team by email or nickname, assign roles.
- **Role-based access control** — Managers, Field Engineers, Reviewers and Viewers each have different permissions.
- **Automated calculations** — moisture percentage, wet density, dry density computed automatically from raw measurements.
- **Secure authentication** — JWT access tokens (15min) + httpOnly refresh tokens (7 days).
- **Audit trail** — every test records who created it, when, and its approval status.

---

## Application life-cycle development

| Test | Status |
|---|---|
| Backend |  🔁 In development |
| Mobile |  🔁 In development |
| Web |  🔁 In development |


## Implemented tests (NBR standards)

| Test | Standard | Status |
|---|---|---|
| Proctor Compaction | NBR 7182 | 🔁 Almost implemented |
| Sand Cone — in situ density | NBR 7185 | ✅ Implemented |

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Node.js 24 + Express + TypeScript |
| Database | PostgreSQL 16 + Prisma 7 |
| Validation | Zod |
| Auth | JWT + bcrypt |
| Tests | Vitest + Supertest |
| Mobile | React Native + Expo + WatermelonDB *(in development)* |
| Web dashboard | React + Vite + TanStack Query *(in development)* |
| Infrastructure | Docker + Docker Compose |

---

## Prerequisites

- [Node.js 24+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- WSL2 if on Windows — all commands run inside Ubuntu

---

## Getting started

**1. Clone the repository**

```bash
git clone git@github.com:YOUR_USER/geotec.git
cd geotec/backend
```

**2. Install dependencies**

```bash
npm install
npx prisma generate
```

**3. Configure environment**

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/geotec_db"
JWT_SECRET="your_long_random_secret"
JWT_REFRESH_SECRET="another_different_long_secret"
NODE_ENV="development"
PORT=3000
```

**4. Start the database**

```bash
docker compose up -d db
```

**5. Run migrations**

```bash
npx prisma migrate deploy
```

**6. Start the server**

```bash
npm run dev
```

Server is running at `http://localhost:3000/health`

---

## API overview

### Auth — `/api/auth`

| Method | Endpoint | Auth required | Description |
|---|---|---|---|
| POST | `/register` | No | Create account |
| POST | `/login` | No | Login, returns access token + sets refresh cookie |
| POST | `/refresh` | No (cookie) | Get a new access token |
| POST | `/logout` | No | Clear refresh token cookie |

### Groups — `/api/groups`

| Method | Endpoint | Min role | Description |
|---|---|---|---|
| POST | `/` | Authenticated | Create group (requester becomes MANAGER) |
| GET | `/` | Authenticated | List my groups |
| GET | `/:id` | Member | Get group details and members |
| POST | `/:id/invite` | MANAGER / REVIEWER | Invite user by email or nickname |
| POST | `/invites/:inviteId/accept` | Invited user | Accept a pending invite |
| PATCH | `/:id/members/:userId/role` | MANAGER | Change a member's role |

### Tests — `/api/groups/:groupId/tests`

| Method | Endpoint | Min role | Description |
|---|---|---|---|
| POST | `/` | FIELD_ENGINEER | Create a test with raw measurements |
| GET | `/` | VIEWER | List tests with optional filters |
| GET | `/:testId` | VIEWER | Get test detail with calculated results |
| PATCH | `/:testId/status` | REVIEWER | Approve or reject a test |
| DELETE | `/:testId` | MANAGER | Delete a test |

---

## Roles

| Role | Create tests | Edit any test | Approve tests | Invite members | Manage roles |
|---|---|---|---|---|---|
| **MANAGER** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **REVIEWER** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **FIELD_ENGINEER** | ✅ | Own only | ❌ | ❌ | ❌ |
| **VIEWER** | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Useful commands

```bash
npm run dev              # start dev server (tsx watch)
npm run build            # compile TypeScript
npm run test             # run tests (watch mode)
npm run test:coverage    # run tests with coverage report
npm run db:migrate       # create a new migration
npm run db:studio        # open Prisma Studio (visual DB browser)
docker compose up -d db  # start PostgreSQL only
docker compose down      # stop all containers
```

---

## Team workflow

```bash
# Start every session
git checkout develop
git pull origin develop

# Create a branch for your task
git checkout -b feat/your-feature-name

# Commit often with clear messages
git commit -m "feat(tests): add filter by status and date range"

# Push and open a Pull Request into develop
git push origin feat/your-feature-name
```

> ⚠️ After pulling changes that include new migrations, always run:
> ```bash
> npx prisma migrate deploy
> ```

Commit format: `feat(scope):`, `fix(scope):`, `chore(scope):`, `docs:`

Protected branches: `main` and `develop` require a Pull Request with at least 1 approval. No direct commits.

---

## Project structure

```
backend/
├── prisma/
│   ├── schema.prisma        # database models
│   └── migrations/          # versioned SQL history
├── src/
│   ├── server.ts            # entry point
│   ├── app.ts               # Express setup, routes, error handler
│   ├── config/
│   │   ├── prisma.ts        # PrismaClient singleton
│   │   ├── jwt.ts           # token generation and verification
│   │   └── validate.ts      # Zod middleware factory
│   ├── schemas/             # Zod input schemas
│   ├── services/
│   │   ├── calculations/    # pure calculation functions (unit tested)
│   │   ├── auth.service.ts
│   │   ├── group.service.ts
│   │   └── test.service.ts
│   ├── controllers/         # HTTP layer, calls services
│   ├── middlewares/         # authenticate, requireRole
│   └── routes/              # URL definitions
├── requests/                # REST Client .http test files
├── docker-compose.yml
├── prisma.config.ts         # Prisma v7 datasource config
└── .env.example
```

---

## What's in development

The backend API is almost complete. The following layers are actively being built:

### 📱 Mobile app — React Native + Expo
- Offline-first SQLite via WatermelonDB
- Forms for Proctor and Sand Cone tests
- Sync engine — queues local changes, pushes when online
- Camera integration for field photos
- GPS location tagging

### 🌐 Web dashboard — React + Vite
- Group management and member administration
- Test list with filters by type, status and date
- Proctor compaction curve chart
- Export to CSV and PDF

### ☁️ Production deployment
- Multi-stage Dockerfile for the API
- Docker Compose production configuration
- HTTPS via reverse proxy
- CI/CD with GitHub Actions

---

