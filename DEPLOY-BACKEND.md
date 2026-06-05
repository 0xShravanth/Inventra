# Deploy dockerized backend (Neon + Render or Railway)

Your **root `.env`** holds `DATABASE_URL` (Neon). That file is **not** pushed to GitHub. On Render/Railway you paste the same value into their dashboard.

---

## 1. Build the Docker image locally (optional test)

From repo root (reads `DATABASE_URL` from `.env`):

```powershell
cd "C:\Drive D\vibe projects\inventory-system"
docker compose -f docker-compose.backend.yml up --build
```

Check: http://localhost:8000/health and http://localhost:8000/docs

Stop: `Ctrl+C` then `docker compose -f docker-compose.backend.yml down`

---

## 2. Push code to GitHub

Commit and push (never commit `.env`):

```powershell
git add backend/Dockerfile backend/railway.toml render.yaml docker-compose.backend.yml
git commit -m "Add Render/Railway Docker deploy config for backend"
git push
```

---

## 3A. Deploy on **Railway** (Docker)

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub** → **Inventra**.
2. Open the service → **Settings**:
   - **Root Directory**: `backend`
   - **Builder**: **Dockerfile**
3. **Variables** → **New Variable**:
   - Name: `DATABASE_URL`
   - Value: copy `DATABASE_URL` from your local `.env` (Neon string)
4. **Networking** → **Generate Domain**.
5. Deploy. Test: `https://YOUR-DOMAIN.up.railway.app/health`

`backend/railway.toml` already points at the Dockerfile and `/health`.

---

## 3B. Deploy on **Render** (Docker)

1. [dashboard.render.com](https://dashboard.render.com) → **New +** → **Blueprint** (if repo has `render.yaml`)  
   **or** **Web Service** → connect **Inventra** repo.
2. If creating manually:
   - **Language**: Docker
   - **Root Directory**: leave empty (repo root) OR set **Dockerfile Path**: `backend/Dockerfile`, **Docker Context**: `backend`
3. **Environment** → add:
   - `DATABASE_URL` = same Neon URL as in your `.env`
4. **Health Check Path**: `/health`
5. Create Web Service → wait for deploy.
6. Test: `https://YOUR-SERVICE.onrender.com/health`

Free tier may sleep after inactivity; first request can be slow.

---

## 4. After deploy

| Check | URL |
|--------|-----|
| Health | `https://YOUR-HOST/health` |
| API docs | `https://YOUR-HOST/docs` |

Use this URL as `VITE_API_URL` on Vercel for the frontend.

---

## Security

- Do **not** commit `.env` or paste secrets in public repos.
- If `DATABASE_URL` was ever shared, rotate the Neon password in [Neon Console](https://console.neon.tech).

---

## Quick comparison

| | Railway | Render |
|---|---------|--------|
| Config in repo | `backend/railway.toml` | `render.yaml` |
| Service root | `backend` | Docker context `backend` |
| Required env | `DATABASE_URL` | `DATABASE_URL` |
| Health check | `/health` | `/health` |

---

## Docker Hub (pre-built image)

To build once, push to Docker Hub, and deploy **that image** on Render/Railway (no Git build):

See **[DOCKERHUB.md](./DOCKERHUB.md)** for full steps.

Quick version:

```powershell
docker login
cd backend
docker build -t YOUR_DOCKERHUB_USERNAME/inventra-backend:latest .
docker push YOUR_DOCKERHUB_USERNAME/inventra-backend:latest
```

Then on **Render** → Web Service → **Existing Image** → `docker.io/YOUR_DOCKERHUB_USERNAME/inventra-backend:latest` + set `DATABASE_URL`.
