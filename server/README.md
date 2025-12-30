## Ciarleglio Truck-Equip Backend

Stack: Node.js + Express + TypeScript + Prisma (Supabase Postgres) + Supabase Storage

### Prerequisites
- Node 18+
- Supabase project (Postgres database + Storage)
- NPM/Yarn

### Quick Start

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Set up environment variables:**
   Create `server/.env` with:
   ```
   PORT=4000
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?schema=public"
   SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
   SUPABASE_BUCKET="inventory-images"
   ADMIN_TOKEN="set-a-strong-random-token-here"
   ```

   **Where to find these values:**
   - `DATABASE_URL`: Supabase Dashboard → Project Settings → Database → Connection string (URI)
   - `SUPABASE_URL`: Supabase Dashboard → Project Settings → API → Project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase Dashboard → Project Settings → API → service_role key (keep secret!)
   - `SUPABASE_BUCKET`: Name of the storage bucket (create it in Storage section, see below)
   - `ADMIN_TOKEN`: Set any strong random string (e.g., use `openssl rand -hex 32`)

3. **Generate Prisma client:**
   ```bash
   npm run prisma:generate
   ```

4. **Create database tables (choose one method):**

   **Option A: Using Prisma Migrate (recommended):**
   ```bash
   npm run prisma:migrate -- --name init
   ```

   **Option B: Using raw SQL (if you prefer manual setup):**
   - Go to Supabase Dashboard → SQL Editor
   - Run the SQL files in order:
     1. `sql/00_extensions.sql` (enables UUID generation)
     2. `sql/01_schema.sql` (creates tables and triggers)
     3. `sql/02_indexes.sql` (creates indexes)
     4. `sql/03_seed.sql` (optional: inserts sample data)

5. **Create Supabase Storage bucket:**
   - Go to Supabase Dashboard → Storage
   - Click "New bucket"
   - Name: `inventory-images` (or match your `SUPABASE_BUCKET` env var)
   - **Important:** Set bucket to **PUBLIC** (so images can be accessed via publicUrl)
   - Click "Create bucket"

6. **Start the development server:**
   ```bash
   npm run dev
   ```

   Server runs on `http://localhost:4000`

### Production Deployment

To deploy existing migrations (e.g., in production):
```bash
npm run prisma:deploy
```

### API Endpoints

#### Public Endpoints

- `GET /health` → Health check: `{ status: "ok" }`
- `GET /api/inventory` → List all items (returns raw JSON array)
  - Query params: `category`, `make`, `minYear`, `maxYear`
  - Response: Array of items with `images` included, sorted by `orderIndex`
- `GET /api/inventory/:id` → Get single item (returns raw JSON object)
  - Response: Item object with `images` included, or `404 { error: "Not found" }`

#### Admin Endpoints (require `Authorization: Bearer <ADMIN_TOKEN>`)

- `POST /api/admin/inventory` → Create item
  - Body: `{ category, subcategory?, make, model, mileage?, hours?, year, condition }`
  - `condition`: `NEW | LIKE_NEW | EXCELLENT | GOOD | FAIR | NEEDS_WORK`
  - Requires at least one of `mileage` or `hours`
  - Response: Created item object

- `PUT /api/admin/inventory/:id` → Update item (partial updates allowed)
  - Body: Same as POST, but all fields optional
  - Response: Updated item object, or `404 { error: "Not found" }`

- `DELETE /api/admin/inventory/:id` → Delete item (cascades to images)
  - Response: `204 No Content`, or `404 { error: "Not found" }`

- `POST /api/admin/inventory/:id/images` → Upload images
  - Content-Type: `multipart/form-data`
  - Field name: `images` (multiple files allowed)
  - Response: Array of created image objects with `publicUrl`

- `DELETE /api/admin/inventory/:itemId/images/:imageId` → Delete image
  - Removes from storage and database
  - Response: `204 No Content`, or `404 { error: "Image not found" }`

- `POST /api/admin/inventory/:itemId/images/reorder` → Reorder images
  - Body: `{ order: [imageId1, imageId2, ...] }`
  - Updates `orderIndex` to match array order (first image becomes cover)
  - Response: `{ ok: true }`

### Error Responses

All errors return JSON:
- `400 { error: "message" }` - Validation/request errors
- `401 { error: "Unauthorized" }` - Missing/invalid admin token
- `404 { error: "Not found" }` - Resource not found
- `500 { error: "message" }` - Server errors

### Admin UI Usage

1. Open `public_html/admin.html` in your browser
2. Click "Set Admin Token" button
3. Paste the `ADMIN_TOKEN` value from your `.env` file
4. You can now:
   - Create/update/delete inventory items
   - Upload images (select item, choose files, click "Upload Images")
   - Reorder images by dragging thumbnails (first image is the cover)
   - Delete images by clicking the delete button

### Database Schema

See `prisma/schema.prisma` for the complete schema:

- **InventoryItem**: `id` (UUID), `category`, `subcategory?`, `make`, `model`, `mileage?`, `hours?`, `year`, `condition`, `createdAt`, `updatedAt`
- **Image**: `id` (UUID), `itemId` (FK with cascade delete), `storagePath`, `publicUrl`, `orderIndex`, `createdAt`, `updatedAt`

Images are automatically deleted when their parent item is deleted (cascade).

### Development Notes

- The server uses `ts-node-dev` for hot reloading
- Prisma client is generated from `prisma/schema.prisma`
- Images are stored in Supabase Storage at path: `inventory/<itemId>/<timestamp>-<random>.ext`
- Public URLs are generated using Supabase's `getPublicUrl()` method


