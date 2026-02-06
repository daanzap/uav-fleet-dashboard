# Database setup — run migrations against Supabase

Your project URL: `https://citoiconzejdfjjefnbi.supabase.co`  
Project ref: **citoiconzejdfjjefnbi**

---

## Where to find the database password

1. Open **[Supabase Dashboard](https://supabase.com/dashboard)** and select your project.
2. Go to **Project Settings** (gear icon in the left sidebar).
3. Click **Database** in the left menu.
4. Under **Database password**:
   - If you set a password when you created the project, that is the password. Supabase does **not** show it again for security.
   - If you don’t remember it, click **Reset database password**, set a new one, and use that new password in the connection string.

**Do not share your password or put it in git.** Use it only in your local `.env` file.

---

## Run migrations from your machine

### 1. Get the connection string

In the same **Project Settings → Database** page:

1. Find **Connection string**.
2. Choose **URI**.
3. Copy the URI. It will look like:
   ```text
   postgresql://postgres.[REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   or (direct):
   ```text
   postgresql://postgres:[YOUR-PASSWORD]@db.citoiconzejdfjjefnbi.supabase.co:5432/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with the database password from the step above.

### 2. Put it in `.env`

In the project root, create or edit `.env` and add:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.citoiconzejdfjjefnbi.supabase.co:5432/postgres
```

Use the exact URI you copied from the Dashboard (with your real password).  
If the Dashboard shows a **pooler** URI (port 6543), use that instead:

```env
DATABASE_URL=postgres://postgres.citoiconzejdfjjefnbi:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### 3. Run the migration

**Option A — One script in Supabase SQL Editor**

1. Open **SQL Editor** in the Supabase Dashboard.
2. Copy the entire contents of `db/run_all_in_supabase.sql`.
3. Paste and click **Run**. All migrations (01 → 06) run in order.

**Option B — From your machine (requires `DATABASE_URL` in `.env`)**

From the project root:

```bash
npm install
npm run db:migrate:all
```

Or run each file:

```bash
npm run db:migrate -- db/01_schema_fixes.sql
npm run db:migrate -- db/03_bookings_columns.sql
npm run db:migrate -- db/04_bookings_prd_snapshot.sql
npm run db:migrate -- db/05_department_and_jsonb.sql
npm run db:migrate -- db/06_department_rls.sql
```

**Migration order:**
1. `01_schema_fixes.sql` — core schema fixes
2. `03_bookings_columns.sql` — booking form columns
3. `04_bookings_prd_snapshot.sql` — hardware snapshot trigger
4. `05_department_and_jsonb.sql` — department columns + JSONB
5. `06_department_rls.sql` — department-based RLS policies

If you see `Migration ran successfully` for each file, the PRD requirements are applied.

---

## If you prefer the Supabase SQL Editor

1. In the Dashboard, open **SQL Editor**.
2. Copy the contents of `db/01_schema_fixes.sql`, paste, and run.
3. Then copy the contents of `db/03_bookings_columns.sql`, paste, and run.

No password is needed in the browser; you’re already logged in.
