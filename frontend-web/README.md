# GymApp frontend (Next.js rewrite)

React/Next.js rewrite of the Angular frontend-web, styled after the uploaded
FitForge-style dark glassmorphism design system (shadcn/ui + Tailwind v4).

## Pages
- /login
- /register — role select → details → OTP sent
- /verify-email?email=... — 6-digit code entry
- /admin — coach approval queue, all coaches, athletes (admin + super_admin)
- /super-admin — stats + admin account management (super_admin only)

## Wiring
Talks directly to the existing FastAPI backend (routes/auth.py, admin.py,
super_admin.py) — same endpoints, same JWT-in-localStorage pattern as the
Angular AuthService.

Set the backend URL in `.env.local`:
NEXT_PUBLIC_API_URL=http://localhost:8000

## Run
npm install
npm run dev
