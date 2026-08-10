# Student Attendance Management System

A web-based attendance system with role-based logins (Admin, Lecturer, Student)
and an analytics dashboard. Built with React + TypeScript (frontend), PHP
(backend), and MySQL (database).

## Setup

**Tool needed to launch app:** XAMPP installed (for MySQL only), Node.js installed, and PHP
available from the command line.

### step 1. Start MySQL

Open XAMPP Control Panel, click **Start** next to **MySQL** only (Apache isn't needed).

### step 2. Create the database

Open phpMyAdmin (click **Admin** next to MySQL), go to the **SQL** tab, paste in
everything from `backend/schema.sql`, click **Go**.

### step 3. Launch the backend

In that same terminal (`backend` folder), run:

```
php -S 127.0.0.1:8000

or

C:\xampp\php\php.exe -S 127.0.0.1:8000 if you are running the app for the first time on your machine
```

Leave this running.

### step 4. Launch the frontend

Open a **second terminal** in the `frontend` folder and run:

```
npm install
npm run dev
```

### step 5. Open it

Go to `http://localhost:5173` in your browser.

Both terminals need to stay open while you use the app.

## Login details

| Role     | Email                     | Password     |
| -------- | ------------------------- | ------------ |
| Admin    | zara@northumbria.ac.uk    | Password123! |
| Lecturer | shirazi@northumbria.ac.uk | Password123! |
| Student  | lansoyin@gmail.com        | Kayode@99    |

## If something goes wrong

**"Request failed (502)" or blank data:** The backend terminal (Step 4) isn't
running, or was closed. Restart it.

**"Database connection failed":** MySQL isn't started, or Step 2 wasn't completed.

**Wrong folder:** Both terminal commands must be run from inside the correct
folder (`backend` for Step 4, `frontend` for Step 5), if the a command fails,
check if you are in the right folder first with `cd`.

## What's not included

- Password reset doesn't send a real email (no mail server configured), it
  shows the reset link directly instead.
- No automated tests — everything was tested manually.
