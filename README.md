## Ciarleglio Truck-Equip Backend

Stack: Node.js + Express + TypeScript + Prisma (Supabase Postgres)

### Prerequisites
- Node 18+
- Supabase project (Postgres database)
- PNPM/NPM/Yarn

### Environment
Create `server/.env` with:

```
PORT=4000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public&pgbouncer=true&connection_limit=1"
SUPABASE_URL="https://YOUR-PROJECT-ref.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
SUPABASE_BUCKET="inventory-images"
ADMIN_TOKEN="set-a-strong-random-token"
```

In Supabase, copy the connection string from Project Settings → Database → Connection string (URI).

### Install

```
cd server
npm install
npm run prisma:generate
```

### Migrate (creates tables)

```
npm run prisma:migrate -- --name init
```

To deploy existing migrations (e.g., in prod):

```
npm run prisma:deploy
```

### Develop

```
npm run dev
```

Server runs on `http://localhost:4000`.

### API

- `GET /health` → health check
- `GET /api/inventory` → list items (query: `category`, `make`, `minYear`, `maxYear`)
- `GET /api/inventory/:id` → get item
- `POST /api/inventory` → create item
  - For admin-protected route, use `/api/admin/inventory` with header `Authorization: Bearer ADMIN_TOKEN`
  - body: `{ category, subcategory?, make, model, mileage?, hours?, year, condition }`
  - `condition`: one of `NEW | LIKE_NEW | EXCELLENT | GOOD | FAIR | NEEDS_WORK`
  - require at least one of `mileage` or `hours`
- `PUT /api/inventory/:id` → update item (partial body allowed)
- Admin-protected write endpoints are exposed under `/api/admin/...` and require `Authorization: Bearer ADMIN_TOKEN`.
- `DELETE /api/inventory/:id` → delete item

### Prisma Model

### Admin Notes

- Set `ADMIN_TOKEN` in `.env`.
- Use `admin.html` in the project root to manage items and images:
  - Click "Set Admin Token" and paste the token to enable create/update/delete and image uploads
  - Drag and drop thumbnails to reorder; the first image is the cover

See `prisma/schema.prisma` for the `InventoryItem` model and `Condition` enum.


