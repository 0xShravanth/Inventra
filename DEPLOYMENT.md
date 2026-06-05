# Deployment Guide

Deploy **PostgreSQL on [Neon](https://neon.tech)**, the **backend API** on [Railway](https://railway.app), and the **React frontend** on [Vercel](https://vercel.com). Your repo: `https://github.com/0xShravanth/Inventra.git`.

---

## Before you start

1. Push your latest code to GitHub (`main` branch).
2. Create free accounts on [Neon](https://neon.tech), [Railway](https://railway.app), and [Vercel](https://vercel.com).
3. Do **not** commit real passwords from `.env` — set secrets only in each platform’s dashboard.

---

## Part 1 — Neon PostgreSQL (database)

### 1. Create a Neon project

1. Go to [console.neon.tech](https://console.neon.tech) → **New Project**.
2. Pick a region close to your Railway region (e.g. `us-east-1`).
3. Note the default database name (often `neondb`) — you can rename it to `inventory_db` if you like.

### 2. Enable UUID support (required once)

This app uses `gen_random_uuid()` for primary keys. In Neon:

1. Open your project → **SQL Editor**.
2. Run:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 3. Copy the connection string

1. Neon dashboard → **Connect** (on your database).
2. Copy the connection string. Prefer:
   - **Direct connection** (host like `ep-xxx.region.aws.neon.tech`) — best for Railway + uvicorn.
   - Or **Pooled** (`-pooler` in the host) — also works.
3. Ensure the URL includes **`sslmode=require`** (Neon usually adds this).

Example:

```text
postgresql://neondb_owner:YOUR_PASSWORD@ep-cool-name-12345678.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 4. Local backend against Neon (optional)

Create `backend/.env` (not committed):

```env
DATABASE_URL=postgresql://...@ep-xxx.neon.tech/neondb?sslmode=require
```

Run locally:

```powershell
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Docker Compose still uses the local `db` container in root `.env` — use Neon only when `DATABASE_URL` points to Neon.

---

## Part 2 — Railway (backend API only)

### 1. Create a Railway project

1. Open [Railway Dashboard](https://railway.app/dashboard) → **New Project**.
2. Choose **Deploy from GitHub repo** → authorize GitHub → select **Inventra** (`0xShravanth/Inventra`).

You do **not** need Railway’s PostgreSQL plugin if you use Neon.

### 2. Deploy the backend service

1. Click **+ New** → **GitHub Repo** → same **Inventra** repo (or use the service Railway created from the repo).
2. Open the backend service → **Settings**:
   - **Root Directory**: `backend`
   - **Watch Paths** (optional): `backend/**`
3. **Variables** → add:
   | Variable        | Value |
   |-----------------|-------|
   | `DATABASE_URL`  | Full Neon connection string from Part 1 (with `sslmode=require`) |
4. **Networking** → **Generate Domain** (e.g. `https://inventra-production-xxxx.up.railway.app`).
5. **Deploy** — Railway builds from `backend/Dockerfile` and runs the API.

### 3. Confirm Docker build settings (Railway)

Railway should detect `backend/railway.toml` and build with Docker:

| Setting | Value |
|---------|--------|
| Root Directory | `backend` |
| Builder | Dockerfile (`backend/Dockerfile`) |
| Health check | `/health` |

If Railway uses Nixpacks instead of Docker: **Settings** → **Builder** → **Dockerfile**.

### 4. Verify the backend

Open in a browser:

- `https://YOUR-RAILWAY-DOMAIN/health` → `{"status":"healthy"}`
- `https://YOUR-RAILWAY-DOMAIN/docs` → Swagger UI

Tables are created automatically on first startup (`create_all` in `main.py`).

In Neon **SQL Editor**, confirm tables exist after deploy: `customers`, `products`, `orders`, `order_items`.

---

## Deploy dockerized backend locally (test before Railway)

Use this to run the same container image locally, connected to **Neon**.

### 1. Create `backend/.env`

```env
DATABASE_URL=postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
```

### 2. Build and run with Compose

From the repo root:

```powershell
docker compose -f docker-compose.backend.yml up --build
```

Or build/run manually:

```powershell
cd "C:\Drive D\vibe projects\inventory-system\backend"
docker build -t inventra-backend .
docker run --rm -p 8000:8000 --env-file .env inventra-backend
```

### 3. Test

- http://localhost:8000/health  
- http://localhost:8000/docs  

Stop: `Ctrl+C`, then `docker compose -f docker-compose.backend.yml down`

---

## Part 3 — Vercel (frontend)

### 1. Import the project

1. [Vercel Dashboard](https://vercel.com/dashboard) → **Add New** → **Project**.
2. Import **Inventra** from GitHub.
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` (Edit → set to `frontend`)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)

### 2. Environment variable (required)

Under **Environment Variables**, add:

| Name            | Value                                      | Environments      |
|-----------------|--------------------------------------------|-------------------|
| `VITE_API_URL`  | `https://YOUR-RAILWAY-DOMAIN` (no trailing slash) | Production, Preview |

Use the **public Railway URL** from Part 1 — not `localhost`.

Example:

```text
VITE_API_URL=https://inventra-production-xxxx.up.railway.app
```

### 3. Deploy

Click **Deploy**. When finished, open your Vercel URL (e.g. `https://inventra.vercel.app`).

The app calls `${VITE_API_URL}/api/...` (see `frontend/src/lib/api.ts`).

---

## Part 4 — Connect frontend ↔ backend

1. **Backend CORS** — already allows all origins in `backend/app/main.py` (`allow_origins=["*"]`), so the Vercel domain works without extra config.
2. **Redeploy frontend** after changing `VITE_API_URL` (Vite bakes env vars at build time).
3. **Redeploy backend** after changing `DATABASE_URL`.

Quick test from the Vercel site:

- Dashboard loads summary data.
- Create a product / customer / order.

---

## Optional — run everything locally with Docker

From the repo root (with `.env` configured):

```powershell
docker compose up --build
```

- Frontend: http://localhost:3000  
- Backend: http://localhost:8000  
- API docs: http://localhost:8000/docs  

Set `REACT_APP_API_URL=http://localhost:8000` in root `.env` for local builds.

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| Frontend shows network errors | Confirm `VITE_API_URL` in Vercel matches the Railway domain; redeploy Vercel. |
| Backend crash on startup | Check Railway logs; ensure `DATABASE_URL` is the full Neon URL. |
| `postgres://` connection errors | Backend normalizes this to `postgresql://` automatically. |
| Neon SSL errors | URL must include `?sslmode=require` (added automatically for `neon.tech` hosts). |
| UUID / `gen_random_uuid` errors | Run `CREATE EXTENSION IF NOT EXISTS "pgcrypto";` in Neon SQL Editor. |
| Empty data after deploy | New database — add products/customers via the UI or `/docs`. |

---

## Checklist

- [ ] Neon project created, `pgcrypto` extension enabled  
- [ ] Backend on Railway: root = `backend`, `DATABASE_URL` = Neon connection string  
- [ ] Railway public URL works (`/health`, `/docs`)  
- [ ] Vercel root = `frontend`, `VITE_API_URL` = Railway URL  
- [ ] Vercel deploy succeeded and app loads data  

---

## Summary

| Component  | Platform | URL |
|-----------|----------|-----|
| PostgreSQL | Neon     | `ep-….neon.tech` (via `DATABASE_URL`) |
| Backend API | Railway | `https://….up.railway.app` |
| Frontend SPA | Vercel | `https://….vercel.app` |
