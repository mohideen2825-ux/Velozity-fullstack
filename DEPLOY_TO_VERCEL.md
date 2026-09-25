# Deploy to Vercel

This project is ready to deploy to Vercel with both backend (Express) and frontend (React).

## Prerequisites

1. **Vercel Account** — Sign up at [vercel.com](https://vercel.com)
2. **Git Repository** — Push this project to GitHub/GitLab/Bitbucket
3. **Node.js** — Already installed (v24+)

## Quick Deploy

### Option A: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from project root:**
   ```bash
   vercel --prod
   ```

4. **Follow prompts:**
   - Choose "Create a new project"
   - Enter project name: `project-dashboard`
   - Framework: Select "Other"
   - Deploy root: `.`

5. **Add Environment Variables** (in Vercel Dashboard → Project Settings → Environment Variables):
   - `DATABASE_URL` = `file:./dev.db`
   - `JWT_ACCESS_SECRET` = (generate a secure random string)
   - `JWT_REFRESH_SECRET` = (generate a secure random string)
   - `CLIENT_URL` = (will be your Vercel URL)

### Option B: Deploy via GitHub (Recommended for Updates)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/project-dashboard.git
   git push -u origin main
   ```

2. **In Vercel Dashboard:**
   - Click "New Project"
   - Import from Git (select your GitHub repo)
   - Framework: "Other"
   - Root Directory: `.`
   - Add the environment variables (see above)
   - Deploy

## After Deployment

You'll get two URLs:
- **Backend API:** `https://project-dashboard.vercel.app/api/...`
- **Frontend:** `https://project-dashboard.vercel.app`

The frontend will automatically use the backend API at the same domain.

## Important Notes

⚠️ **Database Limitations:**
- Vercel uses **ephemeral storage** — the SQLite database file will be reset on every deployment
- For production, migrate to a persistent database (PostgreSQL on Railway, Neon, etc.)
- Current setup works for demo/testing purposes

✅ **What Works:**
- All API endpoints
- Authentication (JWT)
- Real-time updates (Socket.IO)
- Role-based access control
- All CRUD operations

## For Production

To make the database persistent, update `DATABASE_URL` to use a cloud PostgreSQL:

```env
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

Then run migrations:
```bash
npx prisma migrate deploy --schema ./prisma/schema.prisma
npx prisma db seed --schema ./prisma/schema.prisma
```

## Test Accounts

After deployment, log in with:
- **Admin:** `admin@dashboard.com` / `password123`
- **PM:** `pm1@dashboard.com` / `password123`
- **Dev:** `dev1@dashboard.com` / `password123`

---

**Need help?** Check Vercel docs: https://vercel.com/docs
