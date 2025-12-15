# Setup Guide for Ciarleglio Truck-Equip

This guide will help you set up the database and run the application in your browser.

## Prerequisites

1. **Node.js 18+** - Download and install from [nodejs.org](https://nodejs.org/)
   - After installation, restart your terminal/PowerShell
   - Verify installation: `node --version` and `npm --version`

2. **PostgreSQL Database** - Choose one option:
   - **Option A: Supabase (Recommended for cloud)**
     - Sign up at [supabase.com](https://supabase.com)
     - Create a new project
     - Get your connection string from: Project Settings → Database → Connection string (URI)
     - Get API keys from: Project Settings → API
   
   - **Option B: Local PostgreSQL**
     - Install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
     - Create a database: `createdb ciarleglio_db`
     - Note: Supabase storage is still needed for image uploads

## Setup Steps

### 1. Create Environment File

Navigate to the `server` directory and create a `.env` file with the following content:

```env
PORT=4000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public"
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
SUPABASE_BUCKET="inventory-images"
ADMIN_TOKEN="dev-admin-token-change-in-production"
```

**Important:** Replace the placeholder values with your actual credentials:
- `DATABASE_URL`: Your PostgreSQL connection string
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `ADMIN_TOKEN`: Set a strong random token for admin authentication

### 2. Install Dependencies

Open PowerShell/Terminal in the project root and run:

```powershell
cd server
npm install
```

### 3. Generate Prisma Client

```powershell
npm run prisma:generate
```

### 4. Set Up Database Schema

Run Prisma migrations to create the database tables:

```powershell
npm run prisma:migrate -- --name init
```

This will create the `InventoryItem` and `Image` tables in your database.

### 5. Start the Backend Server

```powershell
npm run dev
```

The server will start on `http://localhost:4000`

### 6. Open Frontend in Browser

Open the HTML files directly in your browser:
- `index.html` - Main page
- `listings.html` - Inventory listings page
- `admin.html` - Admin panel (requires admin token)

Or use a simple HTTP server:

```powershell
# From project root (not server directory)
# Using Python (if installed)
python -m http.server 8000

# Or using Node.js http-server (install globally: npm install -g http-server)
http-server -p 8000
```

Then open `http://localhost:8000` in your browser.

## Testing the API

Once the server is running, you can test it:

1. **Health Check:**
   ```
   GET http://localhost:4000/health
   ```

2. **Get Inventory Items:**
   ```
   GET http://localhost:4000/api/inventory
   ```

3. **Create Item (Admin):**
   ```
   POST http://localhost:4000/api/admin/inventory
   Headers: Authorization: Bearer YOUR_ADMIN_TOKEN
   Body: {
     "category": "Trucks",
     "subcategory": "Tractors",
     "make": "Peterbilt",
     "model": "579",
     "mileage": 50000,
     "year": 2020,
     "condition": "EXCELLENT"
   }
   ```

## Troubleshooting

- **"npm is not recognized"**: Install Node.js and restart your terminal
- **Database connection errors**: Verify your `DATABASE_URL` in `.env` is correct
- **Prisma errors**: Make sure the database exists and the connection string is valid
- **CORS errors**: The server has CORS enabled, but make sure frontend requests go to `http://localhost:4000`

## Next Steps

- Add inventory items via the admin panel (`admin.html`)
- Configure the admin token in the admin panel
- Upload images for inventory items
- Test filtering and search functionality

