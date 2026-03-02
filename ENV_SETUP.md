# 🌍 Environment Setup, Local Testing & Deployment Guide

This document provides a comprehensive, step-by-step guide for developers to set
up, run, and deploy the Pingo application across **Local**, **Development**, and
**Production** environments.

---

## 🏗️ Architecture Overview

| Layer        | Technology       | Environment      | Roles                            |
| :----------- | :--------------- | :--------------- | :------------------------------- |
| **Frontend** | React (Vite)     | Cloudflare Pages | Client-side logic, UI, Routing   |
| **Backend**  | Convex           | Convex Cloud     | Data, Real-time sync, Auth logic |
| **Auth**     | @convex-dev/auth | Managed          | Google OAuth, Anonymous sessions |

### Environment Targets

| Target    | Purpose              | Frontend URL                      | Backend URL                      |
| :-------- | :------------------- | :-------------------------------- | :------------------------------- |
| **Local** | Feature development  | `http://localhost:5173`           | `http://127.0.0.1:3210`          |
| **Dev**   | Staging / QA testing | `https://staging-pingo.pages.dev` | `https://dev-slug.convex.cloud`  |
| **Prod**  | Live application     | `https://pingo.bouncybison.click` | `https://prod-slug.convex.cloud` |

---

## 💻 1. Local Development Setup

Follow these steps after cloning the repository.

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Initialize Convex

Run the Convex dev loop. This will prompt you to log in and create a new project
if it's your first time.

```bash
npx convex dev
```

_Note: This generates `convex/.env.local` automatically with your deployment's
secret keys._

### Step 3: Configure Frontend Environment

Create or update `.env.local` in the **project root**:

```env
# Point to your local Convex dev server
VITE_CONVEX_URL=http://127.0.0.1:3210
VITE_CONVEX_SITE_URL=http://127.0.0.1:3211
```

### Step 4: Configure Backend Auth (Critical)

For local authentication to work, Convex needs to know where your frontend
lives.

1. Run the official auth setup tool:
   ```bash
   npx @convex-dev/auth
   ```
2. When asked for `SITE_URL`, enter: `http://localhost:5173`
3. This tool will automatically set `SITE_URL`, `JWKS`, and `JWT_PRIVATE_KEY` on
   your Convex deployment.

### Step 5: Start Vite

```bash
npm run dev
```

---

## 🔑 2. Google OAuth Configuration

Pingo uses Google OAuth for secure sign-in. You must configure a client in the
[Google Cloud Console](https://console.cloud.google.com/).

### Step 1: Create Credentials

1. Navigate to **APIs & Services > Credentials**.
2. Click **Create Credentials > OAuth client ID**.
3. Select **Web application**.

### Step 2: Configure Redirects per Environment

| Env       | Authorized JavaScript Origins                    | Authorized Redirect URIs                                 |
| :-------- | :----------------------------------------------- | :------------------------------------------------------- |
| **Local** | `http://localhost:5173`, `http://127.0.0.1:5173` | `http://127.0.0.1:3211/api/auth/callback/google`         |
| **Dev**   | `https://staging-pingo.pages.dev`                | `https://dev-slug.convex.site/api/auth/callback/google`  |
| **Prod**  | `https://pingo.bouncybison.click`                | `https://prod-slug.convex.site/api/auth/callback/google` |

> **IMPORTANT**: Replace `dev-slug` with your actual Convex deployment name
> (e.g., `fine-salamander-480`). You can find this in the Convex Dashboard.

### Step 3: Add Secrets to Convex

In your Convex Dashboard (**Settings > Environment Variables**), add:

- `AUTH_GOOGLE_ID`: Your Client ID
- `AUTH_GOOGLE_SECRET`: Your Client Secret

---

## 🚀 3. Deploying to Cloud (Dev & Prod)

### A. Backend Deployment (Convex)

Use these commands to push your code to the cloud tracking environments:

**For Dev Deployment:**

```bash
# Push to the dev deployment linked to your project
npx convex deploy
```

**For Production:**

```bash
# Push directly to production
npx convex deploy --prod
```

### B. Frontend Deployment (Cloudflare Pages)

Connect your GitHub repository to Cloudflare Pages.

**Settings > Build & Deploy:**

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/`

**Settings > Environment Variables:** Set these variables for **Production** and
**Preview** (Dev/Staging):

| Variable               | Environment    | Example Value                    |
| :--------------------- | :------------- | :------------------------------- |
| `VITE_CONVEX_URL`      | **Production** | `https://prod-slug.convex.cloud` |
| `VITE_CONVEX_SITE_URL` | **Production** | `https://prod-slug.convex.site`  |
| `VITE_CONVEX_URL`      | **Preview**    | `https://dev-slug.convex.cloud`  |
| `VITE_CONVEX_SITE_URL` | **Preview**    | `https://dev-slug.convex.site`   |

---

## 🛠️ 4. Advanced: Configuration Mapping

| Variable               | Purpose                                   | Where to check                    |
| :--------------------- | :---------------------------------------- | :-------------------------------- |
| `SITE_URL`             | (Backend) Where to redirect after login   | Convex Dash > Settings > Env Vars |
| `CONVEX_SITE_URL`      | (Backend) Internal URL for auth callbacks | Generated automatically by Convex |
| `VITE_CONVEX_URL`      | (Frontend) Main API endpoint              | `.env.*` files or Cloudflare UI   |
| `VITE_CONVEX_SITE_URL` | (Frontend) Auth redirect endpoint         | `.env.*` files or Cloudflare UI   |

---

## ⚠️ 5. Troubleshooting & Common Pitfalls

### 1. "User not shown as signed in after redirect"

This usually means the `SITE_URL` in Convex does not exactly match your frontend
URL (including `http://` or `https://`).

- Use `npx convex env set SITE_URL http://localhost:5173` to fix it locally.
- In production, ensure it is `https://pingo.bouncybison.click`.

### 2. "Connection lost while action was in flight"

This error often occurs if `JWKS` or `JWT_PRIVATE_KEY` are corrupted or missing.

- Re-run `npx @convex-dev/auth` to regenerate them.

### 3. Google OAuth "Unauthorized Redirect URI"

Double-check that the URL in Google Console exactly matches
`https://<slug>.convex.site/api/auth/callback/google`.

- Note: Local development uses `http://127.0.0.1:3211/...`.

### 4. Tailwind or CSS not loading in Prod

Cloudflare Pages requires a `_redirects` file for SPA routing. This is located
in `public/_redirects` and should contain:

```text
/* /index.html 200
```

---

## 🚦 Verification Checklist

- [ ] `VITE_CONVEX_URL` matches the intended deployment.
- [ ] `SITE_URL` on backend correctly points to the frontend URL.
- [ ] Google OAuth credentials are added to the correct Convex deployment.
- [ ] `.env.local` files are NOT committed to Git.
- [ ] Cloudflare environment variables are set for both production and preview.
