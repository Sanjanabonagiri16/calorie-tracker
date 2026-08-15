# Nourish — Personal Calorie Tracker

Full-stack calorie tracker with a **separate Next.js API backend** and **Next.js frontend**. Includes core nutrition features plus bonus multi-user auth, LLM chat, and PDF/CSV bulk import.

## Architecture

```
Typeface/
├── backend/     # Next.js API on :4000  (Prisma + SQLite)
├── frontend/    # Next.js UI on :3000   (Tailwind + Framer Motion)
└── development.mdc
```

The frontend talks to the backend **only over HTTP APIs** (`NEXT_PUBLIC_API_URL`). No shared server code.

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

## Setup

### 1. Backend

```bash
cd backend
cp .env .env   # already present with DATABASE_URL + JWT_SECRET
pnpm install
pnpm db:push
pnpm dev       # http://localhost:4000
```

Optional in `backend/.env`:

```env
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=openai/gpt-4o-mini
APP_URL=http://localhost:3000
FRONTEND_ORIGIN=http://localhost:3000
JWT_SECRET=change-me
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
4. Frontend CORS origin defaults to `http://localhost:3000`.
5. Never commit real API keys — keep them in `backend/.env` (gitignored). Use `.env.example` as a template.

## Code quality notes

- Modular libs: `auth`, `prisma`, `validators`, `api` helpers
- Zod validation on write endpoints
- Consistent JSON error shape `{ error, details? }`
- README documents setup and assumptions
