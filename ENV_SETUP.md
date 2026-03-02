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

| Target    | Purpose              | Frontend URL                          | Backend URL                                   |
| :-------- | :------------------- | :------------------------------------ | :-------------------------------------------- |
| **Local** | Feature development  | `http://localhost:5173`               | `http://127.0.0.1:3210`                       |
| **Dev**   | Staging / QA testing | `https://staging.pingo-31m.pages.dev` | `https://fabulous-bandicoot-305.convex.cloud` |
| **Prod**  | Live application     | `https://pingo.bouncybison.click`     | `https://fearless-axolotl-554.convex.cloud`   |

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

| Env       | Authorized JavaScript Origins                    | Authorized Redirect URIs                                              |
| :-------- | :----------------------------------------------- | :-------------------------------------------------------------------- |
| **Local** | `http://localhost:5173`, `http://127.0.0.1:5173` | `http://127.0.0.1:3211/api/auth/callback/google`                      |
| **Dev**   | `https://staging.pingo-31m.pages.dev`            | `https://fabulous-bandicoot-305.convex.site/api/auth/callback/google` |
| **Prod**  | `https://pingo.bouncybison.click`                | `https://fearless-axolotl-554.convex.site/api/auth/callback/google`   |

### Step 3: Add Secrets to Convex

In your Convex Dashboard (**Settings > Environment Variables**), add the Google
OAuth credentials.

> **💡 Best Practice**: Create **separate** OAuth Client IDs in the Google Cloud
> Console for each environment (Local, Staging, Production). This ensures that a
> compromise in one environment does not affect the others and allows for clean
> redirect URI management.

- `AUTH_GOOGLE_ID`: Your environment-specific Client ID
- `AUTH_GOOGLE_SECRET`: Your environment-specific Client Secret

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
# Push directly to production$env:CONVEX_DEPLOY_KEY="prod:fearless-axolotl-554|eyJ2MiI..." ; npx convex deploy; npx convex run seed:run
```

### B. Frontend Deployment (Cloudflare Pages)

Connect your GitHub repository to Cloudflare Pages.

**Settings > Build & Deploy:**

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/`

**Settings > Environment Variables:** Set these variables for **Production** and
**Preview** (Dev/Staging):

| Variable               | Environment    | Example Value                                |
| :--------------------- | :------------- | :------------------------------------------- |
| `VITE_CONVEX_URL`      | **Production** | `https://fearless-axolotl-554.convex.cloud`  |
| `VITE_CONVEX_SITE_URL` | **Production** | `https://fearless-axolotl-554.convex.site`   |
| `VITE_CONVEX_URL`      | **Preview**    | (Auto-injected by build command)             |
| `VITE_CONVEX_SITE_URL` | **Preview**    | `https://fabulous-bandicoot-305.convex.site` |

### C. Automated Previews (Cloudflare + Convex)

For branch-based previews (e.g., `staging`), you can automate the backend
creation during the frontend build.

#### 1. Generate a Preview Deploy Key

1. Log in to your [Convex Dashboard](https://dashboard.convex.dev).
2. Go to **Settings > Deploy Keys** and generate a **Preview Deploy Key**.

#### 2. Configure Cloudflare

1. In Cloudflare Pages **Settings > Environment variables**, add
   `CONVEX_DEPLOY_KEY` to the **Preview** environment.
2. Under **Settings > Build & Deploy**, set the **Build command** for
   **Previews** to:
   ```bash
   npx convex deploy --cmd "npm run build" --cmd-url-env-var-name VITE_CONVEX_URL
   ```

#### 3. Stable Staging Backend (Configured)

To avoid updating Google OAuth redirects for every branch, use our stable
backend:

```bash
npx convex deploy --preview-create fabulous-bandicoot-305 --cmd "npm run build" --cmd-url-env-var-name VITE_CONVEX_URL
```

Redirect URI:
`https://fabulous-bandicoot-305.convex.site/api/auth/callback/google`

---

## 🛠️ 4. Master Environment Matrix

The following table summarizes all configuration required for the Pingo
ecosystem.

| Component      | Setting / Variable            | **Local** Environment             | **Staging** (Staging)                        | **Production** (Live)                       |
| :------------- | :---------------------------- | :-------------------------------- | :------------------------------------------- | :------------------------------------------ |
| **Vite App**   | `VITE_CONVEX_URL`             | `http://localhost:3210`           | _(Auto-injected)_                            | `https://fearless-axolotl-554.convex.cloud` |
| **Vite App**   | `VITE_CONVEX_SITE_URL`        | `http://localhost:3211`           | `https://fabulous-bandicoot-305.convex.site` | `https://fearless-axolotl-554.convex.site`  |
| **Cloudflare** | `CONVEX_DEPLOY_KEY`           | N/A                               | `preview:ongbt:pingo\|...`                   | `preview:ongbt:pingo\|...`                  |
| **Convex**     | `AUTH_GOOGLE_ID`              | `610855938258-8ukr...`            | `610855938258-00if...`                       | `610855938258-00ifu...`                     |
| **Convex**     | `AUTH_GOOGLE_SECRET`          | `****J8HM`                        | `****GpfN`                                   | `****QoQq`                                  |
| **Convex**     | `SITE_URL`                    | `http://localhost:5173`           | `https://staging.pingo-31m.pages.dev`        | `https://pingo.bouncybison.click`           |
| **Google**     | Authorized JavaScript origins | `http://localhost:5173`           | `https://staging.pingo-31m.pages.dev`        | `https://pingo.bouncybison.click`           |
| **Google**     | Authorized redirect URIs      | `http://127.0.0.1:3211/callback`* | `https://...305.convex.site/callback`*       | `https://...554.convex.site/callback`*      |

_\* Full Redirect URI path: `/api/auth/callback/google`_

---

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
