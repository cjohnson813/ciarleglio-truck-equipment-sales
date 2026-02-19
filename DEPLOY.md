# Deploy: Netlify (frontend) + Render (backend) + Supabase (DB)

This checklist is tied to this repo and uses the actual paths and env vars in the codebase.

---

## 1) Backend DB/auth setup (summary)

### `server/prisma/schema.prisma`
- **Datasource:** `provider = "postgresql"`, `url = env("DATABASE_URL")`.
- **Required env:** `DATABASE_URL` (Postgres connection string).
- **Models:** `User` (login/auth: username, email, phone, passwordHash, role, emailVerifiedAt, emailVerifyToken, passwordResetToken), `InventoryItem`, `Image`.

### `server/src/server.ts`
- **dotenv:** `dotenv.config()` (also in `app.ts`).
- **PORT:** `Number(process.env.PORT) || 4000`.
- **Route prefix:** API routes are under `/api` (e.g. `/api/auth`, `/api/account`, `/api/inventory`, `/api/health`).
- **Cookie/session:** Implemented in `server/src/lib/session.ts`: uses `SESSION_SECRET`, production cookies use `secure: true`, `sameSite: 'none'` for cross-origin.
- **CORS:** Uses `ALLOWED_ORIGINS` (comma-separated). Credentials `true`. Dev fallback allows localhost when `NODE_ENV !== 'production'`.

### Env vars referenced under `server/src`
| Variable | Where | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | Prisma schema (via env) | Postgres connection |
| `PORT` | server.ts | Server port |
| `NODE_ENV` | session.ts, prisma.ts | production → secure cookies, no query log |
| `SESSION_SECRET` | lib/session.ts | Sign session cookie |
| `ADMIN_TOKEN` | middleware/adminAuth.ts | Optional Bearer token for admin API |
| `SUPABASE_URL` | lib/supabase.ts | Supabase API URL (image upload) |
| `SUPABASE_SERVICE_ROLE_KEY` | lib/supabase.ts | Supabase service key |
| `SUPABASE_BUCKET` | lib/supabase.ts | Storage bucket name (default inventory-images) |
| `ALLOWED_ORIGINS` | app.ts | CORS origins (comma-separated) |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` | lib/email.ts | SMTP for verification/reset emails |
| `APP_NAME`, `FRONTEND_BASE_URL` | lib/email.ts | Used in email content |

---

## 2) Backend production-ready for Render

- **TypeScript:** `server/tsconfig.json` already has `"outDir": "dist"`, `"rootDir": "src"`. Build: `npm run build` → `node dist/server.js` runs correctly from `server/`.
- **Health:**  
  - `GET /health` → `{ "ok": true }`.  
  - `GET /api/health` → DB check: `{ "status": "ok", "database": "connected" }` or 503.
- **CORS:** Set `ALLOWED_ORIGINS` in Render to your Netlify origin(s), e.g.  
  `https://your-site.netlify.app,https://www.yourdomain.com`  
  No spaces; add both custom domain and *.netlify.app if you use both. Credentials are enabled for cookies.
- **Cookies:** In production (`NODE_ENV=production`), cookies use `SameSite=None`, `Secure=true` so they work cross-domain (Netlify → Render).

No further code changes required for “production-ready” beyond what’s already in the repo.

---

## 3) Prisma migrations (Supabase)

- **Migrations exist:** `server/prisma/migrations/` contains `20260211211057_init` and `migration_lock.toml`.
- **Production:** Use `prisma migrate deploy` (no shadow DB needed for deploy).

**Run migrations against Supabase (from your machine or CI):**

1. Set Supabase Postgres URL (from Supabase Dashboard → Project Settings → Database → Connection string, “URI”; use the password you set for the project):

```powershell
cd C:\Users\camjo\code-assignment\ciarleglio-truck-equipment-sales\server
$env:DATABASE_URL="postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
npx prisma migrate deploy
```

Or with direct (non-pooled) URL for migrations (recommended by Supabase for migrations):

```powershell
$env:DATABASE_URL="postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres"
npx prisma migrate deploy
```

- **Runtime vs migrations:**  
  - **Migrations:** Prefer **direct** connection on port **5432** (Supabase: “Session mode” or “Direct connection”) so Prisma can create shadow DB if needed in the future; for `migrate deploy` no shadow DB is used.  
  - **Runtime (Render):** Use **pooled** connection on port **6543** (Transaction mode) for the app to avoid exhausting connections. So in Render set `DATABASE_URL` to the **pooled** URI (port 6543, `?pgbouncer=true`).

**Summary:** Use direct URL (port 5432) when running `prisma migrate deploy`; use pooled URL (port 6543) for `DATABASE_URL` in Render.

---

## 4) Render deployment (backend)

- **Repository:** Connect the same repo: `ciarleglio-truck-equipment-sales`.
- **Root directory:** `server`
- **Build command:** `npm install && npm run build`
- **Start command:** `npm start`
- **Environment:** Add these in Render Dashboard → Environment:

| Key | Value | Notes |
|-----|--------|--------|
| `NODE_ENV` | `production` | Required for secure cookies and CORS |
| `PORT` | `4000` | Or leave unset; Render sets PORT automatically |
| `DATABASE_URL` | `postgresql://postgres.[ref]:[PWD]@...pooler.supabase.com:6543/postgres?pgbouncer=true` | Supabase **pooled** (transaction) URL |
| `SESSION_SECRET` | (see below) | Strong random string |
| `ALLOWED_ORIGINS` | `https://your-site.netlify.app,https://www.yourdomain.com` | Your Netlify URL(s), comma-separated |
| `ADMIN_TOKEN` | (optional) | If you use Bearer token for admin API |
| `SUPABASE_URL` | `https://[project-ref].supabase.co` | Only if using Supabase Storage for images |
| `SUPABASE_SERVICE_ROLE_KEY` | (secret) | Only if using Supabase Storage |
| `SUPABASE_BUCKET` | `inventory-images` | Optional, default is inventory-images |
| `MAIL_*`, `FRONTEND_BASE_URL` | (optional) | If you want verification/reset emails in production |

**Generate SESSION_SECRET (run once, paste into Render):**

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Verification (Windows):**

1. After deploy, open: `https://[your-render-service].onrender.com/health`  
   - Expected: `{ "ok": true }`.
2. Open: `https://[your-render-service].onrender.com/api/health`  
   - Expected: `{ "status": "ok", "database": "connected" }`.
3. If you see 503 on `/api/health`, check `DATABASE_URL` and that migrations were run against the same DB.

---

## 5) Netlify deployment (frontend)

- **Stack:** Plain HTML/CSS/JS in `public_html/` (no Vite/React). No separate frontend build tool.
- **Netlify settings (Site configuration / Build & deploy):**
  - **Base directory:** (leave empty — repo root)
  - **Build command:** `npm run build:netlify`
  - **Publish directory:** `public_html`
- **Env var for API URL:** In Netlify → Site settings → Environment variables, add:
  - **Key:** `API_URL`  
  - **Value:** `https://[your-render-service].onrender.com` (no trailing slash)

The build script `scripts/set-api-url.js` runs during build and writes `public_html/js/config.js` with `window.API_BASE = '<API_URL>'`. All pages that call the API load `js/config.js` first; if `API_BASE` is empty (e.g. local), scripts fall back to `http://localhost:4000`.

- **SPA routing:** Not used; links are to `.html` files. No `netlify.toml` redirects needed for routing.  
- **netlify.toml** (already in repo):

```toml
[build]
  command = "npm run build:netlify"
  publish = "public_html"
```

---

## 6) End-to-end verification (Windows)

Replace `BACKEND` with your Render URL (e.g. `https://ciarleglio-api.onrender.com`).

**1) Health (no auth)**  
```powershell
Invoke-RestMethod -Uri "https://BACKEND/health" -Method Get
# Expected: { ok: true }
Invoke-RestMethod -Uri "https://BACKEND/api/health" -Method Get
# Expected: { status: "ok", database: "connected" }
```

**2) Auth login**  
```powershell
$body = @{ email = "admin@example.com"; password = "yourpassword" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://BACKEND/api/auth/login" -Method Post -Body $body -ContentType "application/json" -SessionVariable session
# Expected: JSON with user object; cookie set in $session
```

**3) Inventory (public)**  
```powershell
Invoke-RestMethod -Uri "https://BACKEND/api/inventory" -Method Get
# Expected: array of inventory items (or []).
```

**4) Inventory (admin POST)**  
```powershell
$token = "your-ADMIN_TOKEN-or-session-cookie"
$headers = @{ "Authorization" = "Bearer $token" }
$body = '{"category":"Truck","make":"Ford","model":"F-150","year":2020,"condition":"GOOD"}' 
Invoke-RestMethod -Uri "https://BACKEND/api/admin/inventory" -Method Post -Headers $headers -Body $body -ContentType "application/json"
# Expected: 201 with created item, or 401 if not admin.
```

**Typical errors:**  
- **401 on /api/admin/*:** Not logged in as admin or wrong ADMIN_TOKEN.  
- **503 on /api/health:** DATABASE_URL wrong or DB unreachable; run migrations.  
- **CORS errors in browser:** Add your Netlify URL to `ALLOWED_ORIGINS` on Render and ensure no trailing slash.  
- **Cookies not sent:** Ensure `ALLOWED_ORIGINS` includes the exact Netlify origin (e.g. `https://your-site.netlify.app`) and that you’re on HTTPS.

---

## Checklist (short)

1. **Supabase:** Create project; get direct URL (5432) for migrations and pooled URL (6543) for Render.
2. **Migrations:** From `server/`, set `DATABASE_URL` to Supabase direct, run `npx prisma migrate deploy`.
3. **Render:** New Web Service; root `server`, build `npm install && npm run build`, start `npm start`; set `NODE_ENV`, `DATABASE_URL` (pooled), `SESSION_SECRET`, `ALLOWED_ORIGINS` (Netlify URL(s)); optional: `ADMIN_TOKEN`, `SUPABASE_*`, `MAIL_*`.
4. **Netlify:** Connect repo; build command `npm run build:netlify`, publish `public_html`; set `API_URL` to Render URL.
5. **Verify:** Hit `/health` and `/api/health` on Render; then open Netlify site, log in, and check inventory.
