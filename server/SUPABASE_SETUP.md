# Supabase setup and “database not running” fixes

If your app says the database is not running but the Supabase dashboard shows the project as **Active**, use this checklist.

---

## 1. In the Supabase dashboard

You don’t need to “start” the database — it runs when the project is active. Do this:

1. Open your project at [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. If you see **Project paused** (free tier after inactivity), click **Restore project** and wait **1–2 minutes** before connecting again.
3. Get the right connection string:
   - Go to **Project Settings** (gear) → **Database**.
   - Under **Connection string**, choose **URI**.
   - Prefer the **Session pooler** (port **5432**) for this app.  
     It looks like:  
     `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`  
   - Alternatively use the **Direct** connection (port **5432** to `db.[ref].supabase.co`) if the pooler gives you “database not running” or timeouts.

---

## 2. Fix your `DATABASE_URL` in `server/.env`

### Use the correct URL

- For **Session pooler**: use the URI that ends with **`:5432/postgres`** (not 6543).
- For **Direct**: use the “Direct connection” URI from the same Database settings page.

### Add SSL

Supabase requires SSL. Append this to the URI if it’s not already there:

```text
?sslmode=require
```

Example (Session pooler):

```env
DATABASE_URL="postgresql://postgres.PROJECTREF:PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

If your URI already has a query (e.g. `?schema=public`), add:

```text
&sslmode=require
```

### Encode special characters in the password

If the database password contains `@`, `#`, `&`, `%`, `/`, `:`, etc., it must be **URL-encoded** inside the connection string.

| Character | Encoded |
|-----------|---------|
| `@`       | `%40`   |
| `#`       | `%23`   |
| `&`       | `%26`   |
| `%`       | `%25`   |
| `/`       | `%2F`   |
| `:`       | `%3A`   |

Example: password `pass&word#1` → use `pass%26word%231` in the URL.

---

## 3. Don’t use Transaction pooler for this app

- Use the **Session** pooler (port **5432**) or **Direct** (port **5432** to `db....supabase.co`).
- Avoid using only the **Transaction** pooler (port **6543**) as `DATABASE_URL` for this Prisma app; it can lead to “database not running” or connection errors.

---

## 4. Optional: dedicated database user for Prisma

In Supabase: **SQL Editor** → New query. Run (replace the password):

```sql
-- Create a user for Prisma (replace 'YourSecurePassword' with a strong password)
CREATE USER "prisma" WITH PASSWORD 'YourSecurePassword' BYPASSRLS CREATEDB;

GRANT "prisma" TO "postgres";

GRANT USAGE ON SCHEMA public TO prisma;
GRANT CREATE ON SCHEMA public TO prisma;
GRANT ALL ON ALL TABLES IN SCHEMA public TO prisma;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO prisma;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO prisma;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO prisma;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON ROUTINES TO prisma;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO prisma;
```

Then in `.env`, use the **Session pooler** URI but with user `prisma.[PROJECT-REF]` and the password you set (URL-encoded if it has special characters).

---

## 5. Verify from your machine

From the `server` folder:

```powershell
cd server
npx prisma db pull
```

If that succeeds, the database is reachable. Then:

```powershell
npx prisma generate
npx prisma migrate dev --name init
```

---

## Summary checklist

| Check | Action |
|-------|--------|
| Project paused? | Restore project, wait 1–2 minutes. |
| Wrong port? | Use Session pooler **5432** or Direct **5432**, not Transaction 6543. |
| SSL missing? | Add `?sslmode=require` (or `&sslmode=require`) to `DATABASE_URL`. |
| Special chars in password? | URL-encode the password in the URI. |
| Copy-paste error? | Re-copy **URI** from Project Settings → Database, then add `?sslmode=require` and fix the password. |

After updating `.env`, restart the server and try again.
