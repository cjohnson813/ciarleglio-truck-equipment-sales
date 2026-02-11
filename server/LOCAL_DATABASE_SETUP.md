# Local database setup (PostgreSQL)

Use this to run login + inventory APIs against a **local** PostgreSQL database.

---

## A) Repo summary

| Item | Value |
|------|--------|
| **Provider** | `postgresql` (see `server/prisma/schema.prisma`: `datasource db { provider = "postgresql", url = env("DATABASE_URL") }`) |
| **Env** | `dotenv.config()` in `server/src/app.ts` and `server/src/server.ts` (loaded before PrismaClient) |
| **Port** | `process.env.PORT` or `4000` (`server/src/server.ts`) |
| **Models for login** | `User` (users table): id, username, email, phone, passwordHash, role, emailVerifiedAt, etc. |
| **Models for inventory** | `InventoryItem` (inventory_items), `Image` (images); Condition enum |
| **Migrations** | None in repo yet → run `prisma migrate dev --name init` to create |

**Env vars referenced in `server/src`:**
- **Required for DB:** `DATABASE_URL`
- **Required for login/session:** `SESSION_SECRET` (defaults to dev string if unset)
- **Optional:** `PORT`, `NODE_ENV`, `ADMIN_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET`, `MAIL_*`, `FRONTEND_BASE_URL`

---

## B) Local PostgreSQL with Docker

1. **Start Postgres (from project root or `/server`):**
   ```powershell
   cd server
   docker compose up -d
   ```
2. **Confirm it’s running:**
   ```powershell
   docker compose ps
   ```
   You should see `cte-postgres` with state `running`.

3. **DATABASE_URL for this container:**
   ```
   postgresql://cte:cte_local_dev@localhost:5432/ciarleglio?schema=public
   ```
   (User `cte`, password `cte_local_dev`, database `ciarleglio` — see `server/docker-compose.yml`.)

---

## C) Environment setup

1. **Use local DB in `.env`:**
   - Open `server/.env`.
   - Set `DATABASE_URL` to the string above (and comment or remove the Supabase URL while testing locally):
     ```
     DATABASE_URL="postgresql://cte:cte_local_dev@localhost:5432/ciarleglio?schema=public"
     ```

2. **SESSION_SECRET** (required for login cookies):
   - Generate (PowerShell):
     ```powershell
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - Put the output in `server/.env`:
     ```
     SESSION_SECRET=<paste-the-64-char-hex-here>
     ```

3. **Optional but recommended for local:**
   ```
   PORT=4000
   ADMIN_TOKEN=dev-admin-token-change-in-production
   ```
   Supabase/Mail vars are optional for login + inventory CRUD.

4. **Important:** For `npm run dev` to use the local DB, `server/.env` must have `DATABASE_URL` set to the local value above. If you keep the Supabase URL in `.env`, override when running:
   ```powershell
   $env:DATABASE_URL="postgresql://cte:cte_local_dev@localhost:5432/ciarleglio?schema=public"; npm run dev
   ```

4. **Dotenv:** Already loaded in `server/src/app.ts` and `server/src/server.ts` before any Prisma usage.

---

## D) Prisma generate + migrations

Run from **`server`**:

```powershell
cd server
npm install
npx prisma generate
npx prisma migrate dev --name init
```

- First time: creates `server/prisma/migrations/` and applies the initial migration.
- If it fails (e.g. "can't connect"), ensure Docker Postgres is up and `DATABASE_URL` in `.env` matches section B.

---

## E) Seed (admin user + 2 inventory items)

1. **Seed script:** `server/prisma/seed.ts` (uses argon2 for password; creates admin + 2 items if inventory is empty).
2. **Run seed:**
   ```powershell
   cd server
   npm run seed
   ```
   Or: `npx prisma db seed`

3. **Seeded admin (for login):**
   - Email: `admin@local.dev`
   - Password: `admin1234`
   - Role: ADMIN, email already marked verified.

---

## F) Verify end-to-end

1. **Start server:**
   ```powershell
   cd server
   npm run dev
   ```

2. **DB health (Prisma query):**
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:4000/api/health" -Method Get
   ```
   Success: `{ "status": "ok", "database": "connected" }`.  
   Failure: `database: "disconnected"` and 503 → check DATABASE_URL and Postgres.

3. **Login (seeded admin):**
   ```powershell
   $body = @{ login = "admin@local.dev"; password = "admin1234" } | ConvertTo-Json
   Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" -Method Post -Body $body -ContentType "application/json" -SessionVariable session
   ```
   Success: JSON with `user` (username, email, role, etc.).  
   Failure: 401 or error message → wrong credentials or DB not seeded.

4. **GET inventory:**
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:4000/api/inventory" -Method Get
   ```
   Success: JSON array (e.g. 2 items after seed).  
   Failure: 500 or empty → DB/Prisma issue.

5. **POST inventory (admin):** Requires session cookie or `Authorization: Bearer <ADMIN_TOKEN>`. Example with token:
   ```powershell
   $headers = @{ "Authorization" = "Bearer dev-admin-token-change-in-production" }
   $body = @{ category = "Trucks"; subcategory = "Box"; make = "Ford"; model = "F-550"; year = 2022; mileage = 10000; condition = "GOOD" } | ConvertTo-Json
   Invoke-RestMethod -Uri "http://localhost:4000/api/admin/inventory" -Method Post -Body $body -ContentType "application/json" -Headers $headers
   ```
   Success: 201 and created item JSON.

---

## Quick checklist

- [ ] Docker Compose: `cd server` → `docker compose up -d` → `docker compose ps`
- [ ] `server/.env`: `DATABASE_URL` = `postgresql://cte:cte_local_dev@localhost:5432/ciarleglio?schema=public`
- [ ] `server/.env`: `SESSION_SECRET` = 32+ byte hex (from `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] `cd server` → `npx prisma generate` → `npx prisma migrate dev --name init`
- [ ] `npm run seed`
- [ ] `npm run dev` → test `GET http://localhost:4000/api/health`, `POST /api/auth/login`, `GET /api/inventory`
