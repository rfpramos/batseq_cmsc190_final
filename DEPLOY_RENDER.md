Deploying the backend to Render (Docker)

This guide shows how to deploy the `backend` as a Docker service on Render so BLAST (`blastn`) is available.

Prerequisites
- Render account (https://render.com)
- GitHub repository with this project pushed
- Optional: managed MySQL database reachable from Render, or you can use Render's PostgreSQL/MySQL managed DB offering and provide connection info

Files added
- `render.yaml` — template manifest that tells Render how to deploy the `backend` Docker service.

Steps (quick)
1. Push your repository to GitHub (if not already).
   - Ensure the `backend/Dockerfile` is in the repo root path used in `render.yaml`.

2. On Render dashboard:
   - Click "New" → "Web Service" → "Connect a repository" → select your repo and the `main` branch.
   - Render will detect the `render.yaml` and propose creating the `batseq-backend` service.

3. Configure service environment variables (do NOT commit secrets):
   - `DB_HOST` - MySQL host
   - `DB_USER` - DB user
   - `DB_PASSWORD` - DB password
   - `DB_NAME` - DB name
   - Optional: `DB_CONNECTION_LIMIT`, `DB_CONNECT_TIMEOUT_MS`, `DB_ACQUIRE_TIMEOUT_MS`

4. Deploy
   - Render will build the Docker image using `backend/Dockerfile` (this Dockerfile installs `ncbi-blast+`).
   - Wait for the service to start and check the health endpoint: `https://<your-render-service>.onrender.com/api/health`

5. Rebuild and redeploy frontend to point to backend
   - Locally (recommended):
     ```powershell
     cd frontend
     $env:REACT_APP_API_BASE = "https://<your-render-service>.onrender.com"
     npm run build
     vercel --prod "frontend/build" --yes
     ```
   - Or set `REACT_APP_API_BASE` as a Vercel environment variable and trigger a new Vercel build (may fail if remote build hits ESLint warnings).

Notes & troubleshooting
- If the Docker image fails to build on Render, check the build logs in the Render UI — common issues are missing apt packages or internet access during build.
- BLAST requires the `mybatdb` files to exist in `backend/controllers/dataController.js` expects `./data/mybatdb.{nhr,nin,nsq}`; ensure these are included in the repo or accessible by the container.
- Ensure file permissions allow the container to read the BLAST DB files.
- Do not store DB credentials in the repository. Use Render secrets / environment variables.

Optional: Custom domain
- Render supports custom domains via the dashboard. If you later want `cinterlabs.batseq` mapped, you can add a custom domain (requires you to own the domain and configure DNS). For now we will keep the frontend on Vercel and backend on Render.

If you want, I can create this `render.yaml` (done) and walk you step-by-step in your Render console, or prepare a script to create the service using the Render API (requires an API key).
