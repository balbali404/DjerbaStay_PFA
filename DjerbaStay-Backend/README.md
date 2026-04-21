# DjerbaStay Backend

Express + Prisma backend for authentication, subscription plans, AI request limits, and planner orchestration.

## What this backend does

- Uses `JWT access + refresh tokens`.
- Hashes passwords with `bcryptjs`.
- Manages `FREE`, `PLUS`, and `PREMIUM` subscription plans.
- Enforces monthly ML usage limits for non-premium users.
- Calls Flask AI service from Express (frontend no longer calls Flask directly).
- Saves planner generation results in database.
- Imports all AI CSV datasets into Prisma tables.
- Stores image file names for accommodations, places, and restaurants (for backend `public/` assets).

## Setup

1. Copy `.env.example` to `.env` and set values.
2. Install dependencies:

```bash
npm install
```

3. Create DB schema and Prisma client:

```bash
npm run prisma:generate
npm run prisma:push
```

4. Seed plans + CSV data:

```bash
npm run prisma:seed
```

5. Run backend:

```bash
npm run dev
```

## Main routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/subscription/plans`
- `POST /api/subscription/plan`
- `POST /api/billing/create-checkout-session`
- `POST /api/billing/confirm-checkout`
- `GET /api/ml/usage`
- `GET /api/accommodations`
- `GET /api/places`
- `GET /api/restaurants`
- `GET /api/datasets/traveler-profiles`
- `GET /api/datasets/synonyms`
- `GET /api/datasets/trip-budgets`
- `GET /api/datasets/summary`
- `POST /api/planner/generate`
- `GET /api/planner/history`
- `GET /api/planner/:id`

## Seed source files

Seed script reads:

- `DjerbaStay-Ai/data/accommodations_djerba.csv`
- `DjerbaStay-Ai/data/places_djerba.csv`
- `DjerbaStay-Ai/data/restaurants_djerba.csv`
- `DjerbaStay-Ai/data/traveler_profiles.csv`
- `DjerbaStay-Ai/data/synonyms.csv`
- `DjerbaStay-Ai/data/trip_budgets.csv`
