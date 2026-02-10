# Quick Start Guide

## Current Status ✅

- ✅ `.env` file created in `server/` directory
- ✅ Frontend files are ready (configured to use `http://localhost:4000`)
- ⚠️ Node.js needs to be installed
- ⚠️ Database needs to be configured

## Next Steps

### Step 1: Install Node.js

1. Download Node.js 18+ from [https://nodejs.org/](https://nodejs.org/)
2. Install it (restart your terminal/PowerShell after installation)
3. Verify installation:
   ```powershell
   node --version
   npm --version
   ```

### Step 2: Configure Database

You have two options:

#### Option A: Use Supabase (Recommended - Cloud Database)

1. Sign up at [https://supabase.com](https://supabase.com)
2. Create a new project (if it was paused, click **Restore project** and wait 1–2 minutes)
3. Get your connection string:
   - Go to: **Project Settings → Database → Connection string (URI)**
   - Use the **Session pooler** (port **5432**) or **Direct** connection — not the Transaction pooler (6543)
   - Add `?sslmode=require` to the end of the URI (Supabase requires SSL)
   - If your database password has special characters (`@`, `#`, `&`, etc.), [URL-encode](https://en.wikipedia.org/wiki/Percent-encoding) them in the URI
4. Get your API keys:
   - Go to: Project Settings → API
   - Copy the `URL` and `service_role` key
5. Update `server/.env`:
   ```env
   DATABASE_URL="your-supabase-connection-string-here"
   SUPABASE_URL="https://your-project-ref.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
   ```

#### Option B: Use Local PostgreSQL

1. Install PostgreSQL from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Create a database:
   ```powershell
   createdb ciarleglio_db
   ```
3. Update `server/.env` with your local PostgreSQL credentials:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/ciarleglio_db?schema=public"
   ```
   **Note:** You'll still need Supabase for image storage, or modify the code to use local storage.

### Step 3: Install Dependencies & Setup Database

Open PowerShell in the project root and run:

```powershell
# Navigate to server directory
cd server

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Create database tables
npm run prisma:migrate -- --name init
```

### Step 4: Start the Backend Server

```powershell
npm run dev
```

The server will start on `http://localhost:4000`

### Step 5: Open Frontend in Browser

You can open the HTML files directly:
- Double-click `index.html` to open the main page
- Double-click `listings.html` to see inventory listings
- Double-click `admin.html` to access the admin panel

**Or** use a simple HTTP server (recommended for better CORS handling):

```powershell
# From project root (not server directory)
# Option 1: Using Python (if installed)
python -m http.server 8000

# Option 2: Using Node.js http-server
# First install: npm install -g http-server
http-server -p 8000
```

Then open `http://localhost:8000` in your browser.

## Testing

### 1. Test Backend Health
Open browser and go to: `http://localhost:4000/health`
Should return: `{"status":"ok"}`

### 2. Test Inventory API
Open: `http://localhost:4000/api/inventory`
Should return: `[]` (empty array initially)

### 3. Add an Item (Admin Panel)
1. Open `admin.html` in browser
2. Click "Set Admin Token" and enter the token from your `.env` file (`ADMIN_TOKEN`)
3. Fill out the form to create an inventory item
4. Upload images for the item

### 4. View Items
- Open `listings.html` to see all inventory items
- Items should appear automatically from the API

## Troubleshooting

- **"npm is not recognized"**: Install Node.js and restart PowerShell
- **"Database is not running" / connection errors with Supabase**: See **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** for connection string, SSL, password encoding, and pooler vs direct connection.
- **Other database connection errors**: 
  - Verify `DATABASE_URL` in `server/.env` is correct
  - Make sure PostgreSQL/Supabase is running
  - Check that the database exists
- **Prisma errors**: 
  - Run `npm run prisma:generate` again
  - Check your database connection string format
- **CORS errors**: 
  - Make sure backend is running on `http://localhost:4000`
  - Frontend should be served from `http://localhost:8000` (not file://)
- **"Cannot find module"**: Run `npm install` in the `server` directory

## Auth & Login

The site uses cookie-based sessions and two roles: **User** and **Admin**. The **first account** you create becomes an Admin; all later accounts are Users. Admins can use the Inventory (admin) panel when logged in without setting a separate admin token.

1. Add to `server/.env` (use a long random string in production):
   ```env
   SESSION_SECRET="your-secret-at-least-32-chars"
   ```
2. Run migrations so the `users` table exists:
   ```powershell
   cd server
   npm run prisma:migrate -- --name add_users
   ```
3. On the homepage (`index.html`), use **Login/Sign Up** (top right) to create an account or log in. When logged in, your username appears there and links to **Account** (`account.html`), where you can edit your info or change your password. Admins see an **Inventory** button on the account page that links to the admin panel.

## Admin Token

The admin token is set in `server/.env` as `ADMIN_TOKEN`. 
- Default value: `dev-admin-token-change-in-production`
- **Change this to a strong random value for production!**

To use admin features:
1. Open `admin.html`
2. Click "Set Admin Token"
3. Paste your admin token from `.env`

## File Structure

```
Ciarleglio Truck-Equip/
├── index.html          # Main page
├── listings.html       # Inventory listings
├── admin.html         # Admin panel
├── script.js          # Frontend JavaScript
├── admin.js           # Admin panel JavaScript
├── styles.css         # Styles
├── server/            # Backend
│   ├── .env           # Environment variables (configure this!)
│   ├── src/
│   │   ├── server.ts  # Server entry point
│   │   └── routes/    # API routes
│   └── prisma/
│       └── schema.prisma  # Database schema
└── SETUP.md           # Detailed setup guide
```

## Need Help?

See `SETUP.md` for more detailed instructions.

