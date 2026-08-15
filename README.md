# Nourish — Personal Calorie Tracker

Nourish helps you log meals, set daily calorie and macro goals, and see nutrition trends over time. The frontend and API are separate Next.js apps that talk only over HTTP.

## Live links

| | URL |
|---|---|
| **Frontend** | [https://nourish-calorie.netlify.app](https://nourish-calorie.netlify.app) |
| **Backend API** | [https://calorie-tracker-czhw.onrender.com](https://calorie-tracker-czhw.onrender.com) |

## Demo walkthrough

Muted screen recording (~90s) covering login, dashboard, meals, goals, AI scan, chat, and import.

https://github.com/Sanjanabonagiri16/calorie-tracker/blob/main/docs/demo/nourish-walkthrough.mp4

<video src="docs/demo/nourish-walkthrough.mp4" controls width="100%"></video>

[`docs/demo/nourish-walkthrough.mp4`](docs/demo/nourish-walkthrough.mp4)

## What the app does

1. **Sign up / log in** — private accounts with JWT auth  
2. **Set goals** — daily calories, protein, carbs, fat, optional weight  
3. **Log meals** — Breakfast, Lunch, Dinner, or Snacks with macros and micros  
4. **Dashboard** — today’s calorie ring, macro tiles, recent meals, and charts  
5. **AI Scan** — upload a plate or label photo; AI pre-fills nutrition fields  
6. **Chat** — log meals, manage goals, and ask nutrition questions in plain language  
7. **Bulk import** — upload PDF/CSV/TXT food diaries

## Architecture

```
calorie-tracker/
├── frontend/   # Next.js UI
├── backend/    # Next.js API + Prisma + SQLite
└── docs/demo/  # Walkthrough video
```

The frontend communicates with the backend **only through APIs**. No shared server code.

## Features

**Core**
- Goal setting (calories, macros, weight)
- Meal entry by meal type with nutrition fields
- Time-range listing with filters and pagination
- Reports: calorie trend, macros, micronutrients, goal vs actual
- AI photo → nutrition extraction

**Bonus**
- Multi-user auth with private data
- LLM chat for app actions and nutrition Q&A
- Bulk import from PDF / CSV / TXT

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js, Tailwind CSS, Framer Motion, Recharts |
| Backend | Next.js API routes, Prisma, SQLite |
| Auth | bcrypt + JWT |
| AI | OpenRouter |

## Local setup

```bash
# Backend
cd backend
cp .env.example .env
pnpm install && pnpm db:push && pnpm dev   # :4000

# Frontend (new terminal)
cd frontend
pnpm install && pnpm dev                   # :3000
```

Copy `backend/.env.example` → `backend/.env` and set your secrets locally.  
Set `frontend/.env.local` to `NEXT_PUBLIC_API_URL=http://localhost:4000`.

## Sample import file

```text
date,mealType,name,calories,protein,carbs,fat
2026-08-14,BREAKFAST,Oatmeal,320,12,54,6
2026-08-14,LUNCH,Chicken salad,450,38,22,20
```

## Assumptions

- SQLite is used for the demo; swap the database URL for production if needed.
- AI features run on the backend only — never commit real API keys.
- Image-only scanned PDFs without text still need OCR; text/tabular diaries are supported.
