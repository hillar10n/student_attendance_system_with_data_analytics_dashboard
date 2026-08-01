# SAMS — Student Attendance Management System

Full implementation matching Chapters 4–6 of the dissertation: React 18 +
TypeScript frontend, PHP 8 REST API backend, MySQL/MariaDB database.

## Project structure

```
backend/
  schema.sql          - run this first to create the database
  seed.php             - populates demo data (run once, then delete)
  config/db.php        - DB connection (defaults are XAMPP-friendly: root, no password)
  lib/                  - shared auth, response, and analytics logic
  api/                  - one file per endpoint, organised by feature
frontend/
  src/                  - React + TypeScript source
  public/.htaccess      - SPA routing fix, gets copied into dist/ automatically
  (run `npm run build` to produce a `dist/` folder of static files)
```

---

## Setup Guide (XAMPP) — recommended for submission/demo

### Prerequisites (install once)
1. **XAMPP** — https://www.apachefriends.org/ — install with default settings.
2. **Node.js (LTS)** — https://nodejs.org/ — only needed to build the frontend
   once, not to run the app afterward.

### Step 1 — Extract the project
Unzip this project anywhere convenient. You'll see `backend/` and `frontend/`.

### Step 2 — Start XAMPP
Open the XAMPP Control Panel → click **Start** next to both **Apache** and **MySQL**.

### Step 3 — Create the database
1. Click **Admin** next to MySQL (opens phpMyAdmin).
2. Click the **SQL** tab.
3. Open `backend/schema.sql` in a text editor, copy everything, paste it into
   the SQL box, click **Go**.
4. Confirm: a `sams` database now appears in the sidebar with 8 tables.

### Step 4 — Install the backend
1. Copy the entire `backend` folder into:
   - Windows: `C:\xampp\htdocs\sams-api\`
   - Mac: `/Applications/XAMPP/htdocs/sams-api/`
2. Open a terminal in that folder and run the seed script once:
   `C:\xampp\php\php.exe seed.php` (Mac: `php seed.php`)
3. **Copy the printed login credentials somewhere safe.**
4. **Delete `seed.php`** afterward so it can't be run again by accident.

### Step 5 — Build and install the frontend
1. Open a terminal in the `frontend` folder and run:
   ```
   npm install
   npm run build
   ```
2. This creates `frontend/dist/` containing `index.html`, an `assets/` folder,
   and a hidden `.htaccess` file — that's the complete, correct output. Make
   sure "show hidden files" is enabled in your file manager so you don't miss
   the `.htaccess`.
3. Copy **everything inside** `dist/` (not the `dist` folder itself) into:
   - Windows: `C:\xampp\htdocs\sams\`
   - Mac: `/Applications/XAMPP/htdocs/sams/`
4. If you use a folder name other than `sams`, edit the copied `.htaccess`
   file's `RewriteBase /sams/` line to match.

### Step 6 — Open it
Visit `http://localhost/sams/`.

## Default login credentials (from seed.php)

| Role      | Email                          | Password       |
|-----------|---------------------------------|----------------|
| Admin     | admin@sams.test                 | Password123!   |
| Lecturer  | j.whitfield@sams.test            | Password123!   |
| Student   | a.bello@student.sams.test        | Password123!   |
| Student (deliberately at-risk, ~33% attendance) | c.okoye@student.sams.test | Password123! |

## Troubleshooting

**Refreshing a page, or visiting a link like `/admin` directly, shows a 404:**
Apache isn't honoring the `.htaccess` file. Open `xampp/apache/conf/httpd.conf`,
find `<Directory "C:/xampp/htdocs">`, change `AllowOverride None` to
`AllowOverride All`, save, and restart Apache. Also double-check the
`.htaccess` file actually made it into your `htdocs/sams/` folder (it's hidden).

**"Database connection failed":**
MySQL isn't started, or Step 3 wasn't completed.

**Login fails / no accounts exist:**
Step 4.2 (seeding) was skipped or failed — re-run `php seed.php`, then delete
it again afterward.

**You used a different folder name than `sams`:**
Edit `.htaccess`'s `RewriteBase /sams/` line to match your actual folder name.

---

## Option B: Local development (hot-reload)

Requires PHP 8+, MySQL/MariaDB, and Node.js 18+.

```bash
# 1. Database
mysql -u root < backend/schema.sql
cd backend && php seed.php

# 2. Backend (from backend/)
php -S 127.0.0.1:8000

# 3. Frontend (from frontend/, in a separate terminal)
npm install
npm run dev
# open http://localhost:5173 - Vite proxies /api/* to the PHP server automatically
```

## Environment variables (optional — sensible defaults are built in)

- `SAMS_DB_HOST` (default `127.0.0.1`)
- `SAMS_DB_NAME` (default `sams`)
- `SAMS_DB_USER` (default `root`)
- `SAMS_DB_PASS` (default empty)
- `SAMS_FRONTEND_ORIGIN` (default `http://localhost:5173`, dev-only CORS setting)

## What's implemented (maps to Chapter 4 requirements)

- FR01 Authentication (email/password, hashed with bcrypt)
- FR02 Role-based access control (enforced server-side on every endpoint)
- FR03 Attendance recording (present/absent/late, per session, editable after submission)
- FR04 Analytics dashboard (attendance rate, weekly trend, at-risk list)
- FR05 Low-attendance notifications (auto-generated at ≤75% threshold)
- FR06 PDF/CSV report export
- FR07 Password reset (reset token returned directly in the API response —
  no mail server is configured, see `request-reset.php`)
- FR08 Responsive interface (Tailwind responsive utilities throughout)
- FR09 Predictive indicators — **not implemented** (Could Have, Section 1.6)
- FR10/FR11 Biometric auth / native mobile app — **not implemented** (Won't Have, Section 1.6)
- Student and course roster management (add/remove students, add/remove course
  enrolments) via Admin → Users / Roster pages

## Known limitations (see also Chapter 8 of the dissertation)

- PDF export uses a small hand-written PDF generator (no external library
  was available in the build environment) — functional but plain-text only.
- No automated test suite; testing was done manually via curl and Playwright
  browser automation during development (see Chapter 7).
- Email delivery for password reset is not configured.
- `npm audit` flags a high-severity advisory in `react-router` scoped to
  "RSC Mode" (React Server Components) — a feature this app does not use
  anywhere (plain client-side `BrowserRouter`). The only available fix is a
  breaking downgrade, which was not applied since the vulnerable code path
  isn't reachable in this codebase.
