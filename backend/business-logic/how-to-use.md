# How to Run and Test the Backend
## Prerequisites
- Node.js 24.x (use NVM)
- Docker + Docker Compose
- WSL2 (if on Windows)
## Step 1: Start the Database
```bash
cd backend
docker compose up -d db
```
This starts PostgreSQL on port 5432.
## Step 2: Install Dependencies
```bash
npm install
npx prisma generate
```
## Step 3: Apply Migrations
```bash
npx prisma migrate deploy
```
Or for development:
```bash
npx prisma migrate dev
```
## Step 4: Start the Server
```bash
npm run dev
```
Server runs at `http://localhost:3000`
## Step 5: Test the API
You can use the `.http` files in `http-requests/`:
### 5.1 Register a User
```bash
# POST /api/auth/register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "nickname": "johnd",
    "password": "password123"
  }'
```
### 5.2 Login
```bash
# POST /api/auth/login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```
This returns an access token. Copy it.
### 5.3 Create a Group
```bash
# Replace ACCESS_TOKEN with the token from login
curl -X POST http://localhost:3000/api/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{
    "name": "My Test Group",
    "description": "A group for testing"
  }'
```
Copy the `id` from the response - that's your `GROUP_ID`.
### 5.4 Create a Test (Proctor)
```bash
curl -X POST http://localhost:3000/api/groups/GROUP_ID/tests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{
    "type": "PROCTOR",
    "location": "Site A - Zone 1",
    "notes": "Test performed at 2pm",
    "performedAt": "2026-05-05T14:00:00Z",
    "data": {
      "type": "PROCTOR",
      "cylinderMass": 150,
      "soilCylinderMass": 4500,
      "cylinderVolume": 2000,
      "wetSoil": 150,
      "drySoil": 120,
      "tare": 30
    }
  }'
```
### 5.5 List Tests
```bash
curl http://localhost:3000/api/groups/GROUP_ID/tests \
  -H "Authorization: Bearer ACCESS_TOKEN"
```
### 5.6 Update Test Status (Approve)
```bash
curl -X PATCH http://localhost:3000/api/groups/GROUP_ID/tests/TEST_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{ "status": "APPROVED" }'
```
## Step 6: View Database with Prisma Studio
```bash
npx prisma studio
```
This opens a web interface at `http://localhost:5555` where you can browse all tables and data.
## Step 7: Run Tests
```bash
# Unit tests (calculations)
npm test -- --run src/services/calculations/
# All tests
npm test -- --run
```
## Quick Reference
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create user |
| `/api/auth/login` | POST | Get token |
| `/api/groups` | POST | Create group |
| `/api/groups` | GET | List my groups |
| `/api/groups/:id` | GET | Group details |
| `/api/groups/:groupId/tests` | POST | Create test |
| `/api/groups/:groupId/tests` | GET | List tests |
| `/api/groups/:groupId/tests/:testId` | GET | Get test |
| `/api/groups/:groupId/tests/:testId/status` | PATCH | Update status |
| `/api/groups/:groupId/tests/:testId` | DELETE | Delete test |
## Environment Variables
Create a `.env` file in `backend/`:
```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DB_NAME"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
```