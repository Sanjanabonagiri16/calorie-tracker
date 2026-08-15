# Nourish — Personal Calorie Tracker

Nourish is a full-stack personal nutrition app that helps you log meals, set daily calorie/macro goals, and understand trends over time. The UI and API are separate Next.js apps that talk only over HTTP.

**Live demo**
- Frontend: [https://nourish-calorie.netlify.app](https://nourish-calorie.netlify.app)
- Backend API: [https://calorie-tracker-czhw.onrender.com](https://calorie-tracker-czhw.onrender.com)

## Demo walkthrough

Muted screen recording (~90s) covering login, dashboard, meals, goals, AI scan, chat, and import.

https://github.com/Sanjanabonagiri16/calorie-tracker/blob/main/docs/demo/nourish-walkthrough.mp4

<video src="docs/demo/nourish-walkthrough.mp4" controls width="100%"></video>

Direct file: [`docs/demo/nourish-walkthrough.mp4`](docs/demo/nourish-walkthrough.mp4)

## What the app does

Nourish is built for day-to-day nutrition tracking with AI helpers where they save time:

1. **Sign up / log in** — each user gets a private account (JWT auth).
2. **Set goals** — daily calories plus protein, carbs, fat, and optional weight target.
3. **Log meals** — Breakfast, Lunch, Dinner, or Snacks with macros and micros.
4. **Dashboard** — today’s calorie ring, macro tiles, recent meals, and multi-day charts.
5. **AI Scan** — upload a plate or nutrition-label photo; AI pre-fills nutrition fields.
6. **Chat** — manage meals and goals (and ask nutrition questions) in natural language.
7. **Bulk import** — upload PDF/CSV/TXT food diaries; tabular parse with AI fallback.

## Architecture

```
calorie-tracker/
├── frontend/   # Next.js UI (Netlify)
├── backend/    # Next.js API + Prisma + SQLite (Render)
├── docs/demo/  # Walkthrough video
└── README.md
```

The frontend talks to the backend **only through APIs** (`NEXT_PUBLIC_API_URL`). No shared server code between the two apps.

## Features

### Core
- Goal setting (calories, macros, optional weight)
- Meal entry by Breakfast / Lunch / Dinner / Snacks
- Time-range listing with meal-type filters + pagination
- Reports: calorie trend, macros, micronutrients, goal vs actual
- AI photo → nutrition extraction (OpenRouter multimodal model, with mock fallback)

### Bonus
- Multi-user signup / login (JWT)
- Conversational chat to create/update/delete/list meals, set/check goals,
  request weekly summaries, and ask nutrition questions
- Bulk import from PDF / CSV / TXT tabular diaries

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, Tailwind CSS 4, Framer Motion, Recharts |
| Backend | Next.js 16 (API routes only), Prisma 5, SQLite |
| Auth | bcrypt + JWT |
| AI | OpenRouter (`openai/gpt-4o-mini` by default) |

Web3 was not used — a calorie tracker does not need a blockchain. Auth is email/password JWT instead.

## Local setup

### 1. Backend

```bash
cd backend
cp .env.example .env
pnpm install
pnpm db:push
pnpm dev       # http://localhost:4000
```

`backend/.env`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET=change-me-in-production
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=openai/gpt-4o-mini
APP_URL=http://localhost:3000
FRONTEND_ORIGIN=http://localhost:3000
```

### 2. Frontend

```bash
cd frontend
pnpm install
pnpm dev       # http://localhost:3000
```

`frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Deployed environment variables

### Frontend (Netlify)
| Key | Example |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://calorie-tracker-czhw.onrender.com` |

### Backend (Render)
| Key | Example |
|---|---|
| `DATABASE_URL` | `file:./prod.db` |
| `JWT_SECRET` | long random string |
| `OPENROUTER_API_KEY` | OpenRouter key |
| `OPENROUTER_MODEL` | `openai/gpt-4o-mini` |
| `FRONTEND_ORIGIN` | `https://nourish-calorie.netlify.app` |
| `APP_URL` | `https://nourish-calorie.netlify.app` |

## API map

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Sign up |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Current user |
| GET/PUT | `/api/goals` | List / upsert active goal (paginated list) |
| GET/POST | `/api/meals` | List (filters + pagination) / create |
| GET/PATCH/DELETE | `/api/meals/:id` | Single meal |
| GET | `/api/reports?days=7` | Charts payload |
| POST | `/api/ai/extract` | multipart `image` |
| GET/POST | `/api/chat` | Chat history / send message |
| POST | `/api/import/pdf` | multipart `file` (pdf/csv/txt) |

All list endpoints support `page` & `limit`.

## Sample import file

```text
date,mealType,name,calories,protein,carbs,fat
2026-08-14,BREAKFAST,Oatmeal,320,12,54,6
2026-08-14,LUNCH,Chicken salad,450,38,22,20
```

## Assumptions

1. SQLite is used for the take-home demo; swap `DATABASE_URL` for Postgres in production.
2. AI features (scan, chat, messy PDF parsing) use OpenRouter via `OPENROUTER_API_KEY` on the **backend only**.
3. Image-only scanned PDFs with zero extractable text still need an OCR/text export; text-based and messy tabular PDFs are supported (rule parser first, AI fallback second).
4. Frontend CORS origin must match the deployed frontend URL in production.
5. Never commit real API keys — keep them in `backend/.env` (gitignored). Use `.env.example` as a template.

## Code quality notes

- Modular libs: `auth`, `prisma`, `validators`, `api` helpers
- Zod validation on write endpoints
- Consistent JSON error shape `{ error, details? }`
- README documents setup, deployment, and assumptions
