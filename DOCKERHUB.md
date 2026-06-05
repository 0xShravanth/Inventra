# Docker Hub: build, push, and deploy the backend image

Use this when you want a **pre-built image** on Docker Hub, then run it on Render, Railway, or any server—without building from GitHub each time.

Replace `YOUR_DOCKERHUB_USERNAME` with your real Docker Hub username everywhere below.

---

## Step 1 — Docker Hub account

1. Sign up at [hub.docker.com](https://hub.docker.com).
2. Create a repository (optional but tidy):
   - **Repositories** → **Create Repository**
   - Name: `inventra-backend`
   - Visibility: **Public** (free) or **Private** (paid plans for private deploys on some hosts)

---

## Step 2 — Log in on your PC

```powershell
docker login
```

Enter your Docker Hub username and password (or access token).

---

## Step 3 — Build and tag the image

From the repo root:

```powershell
cd "C:\Drive D\vibe projects\inventory-system\backend"

docker build -t YOUR_DOCKERHUB_USERNAME/inventra-backend:latest .
```

Optional version tag:

```powershell
docker tag YOUR_DOCKERHUB_USERNAME/inventra-backend:latest YOUR_DOCKERHUB_USERNAME/inventra-backend:1.0.0
```

### Test locally before pushing

```powershell
docker run --rm -p 8000:8000 --env-file "..\..\.env" YOUR_DOCKERHUB_USERNAME/inventra-backend:latest
```

Or from repo root (loads root `.env`):

```powershell
cd "C:\Drive D\vibe projects\inventory-system"
docker run --rm -p 8000:8000 --env-file .env YOUR_DOCKERHUB_USERNAME/inventra-backend:latest
```

Open http://localhost:8000/health

---

## Step 4 — Push to Docker Hub

```powershell
docker push YOUR_DOCKERHUB_USERNAME/inventra-backend:latest
docker push YOUR_DOCKERHUB_USERNAME/inventra-backend:1.0.0
```

Your image URL:

```text
docker.io/YOUR_DOCKERHUB_USERNAME/inventra-backend:latest
```

---

## Step 5 — Deploy the image

`DATABASE_URL` (Neon) is **never** inside the image. Set it on the host platform.

### Option A — Render (pull from Docker Hub)

1. [dashboard.render.com](https://dashboard.render.com) → **New +** → **Web Service**.
2. Choose **Existing Image** (not Git repo).
3. **Image URL**: `docker.io/YOUR_DOCKERHUB_USERNAME/inventra-backend:latest`
4. If the repo is **private**: add **Registry Credentials** (Docker Hub username + access token).
5. **Environment** → add `DATABASE_URL` = your Neon URL from local `.env`.
6. **Health Check Path**: `/health`
7. **Port**: `8000` (Render sets `PORT`; the image respects it).
8. Deploy → test `https://YOUR-SERVICE.onrender.com/health`

### Option B — Railway (Docker image)

1. [railway.app](https://railway.app) → **New Project** → **Empty Project**.
2. **+ New** → **Docker Image** (or **Deploy** → paste image URL).
3. Image: `YOUR_DOCKERHUB_USERNAME/inventra-backend:latest`
4. **Variables** → `DATABASE_URL` = Neon connection string.
5. **Networking** → **Generate Domain**.
6. Test `/health`.

If you only see GitHub deploy: use **New** → **Docker Image** and paste `docker.io/...`.

### Option C — Run on any VPS / VM

```powershell
docker pull YOUR_DOCKERHUB_USERNAME/inventra-backend:latest
docker run -d --name inventra-api -p 8000:8000 -e DATABASE_URL="postgresql://..." --restart unless-stopped YOUR_DOCKERHUB_USERNAME/inventra-backend:latest
```

---

## Step 6 — Update the image after code changes

```powershell
cd "C:\Drive D\vibe projects\inventory-system\backend"
docker build -t YOUR_DOCKERHUB_USERNAME/inventra-backend:latest .
docker push YOUR_DOCKERHUB_USERNAME/inventra-backend:latest
```

On Render/Railway: **Manual Deploy** / **Redeploy** to pull `:latest` again (or use a new tag like `:1.0.1` for safer rollouts).

---

## Helper script (Windows)

```powershell
.\scripts\push-dockerhub.ps1 -DockerUser YOUR_DOCKERHUB_USERNAME -Tag latest
```

---

## Checklist

- [ ] Docker Hub account + repository
- [ ] `docker login`
- [ ] `docker build` + `docker push`
- [ ] Platform has `DATABASE_URL` (Neon)
- [ ] `/health` returns OK
- [ ] Frontend `VITE_API_URL` points to deployed API URL

---

## Security

- Never put `DATABASE_URL` in the Dockerfile or push it to Docker Hub.
- Use Docker Hub **access tokens** instead of your account password for `docker login`.
- Do not commit `.env` to GitHub.
