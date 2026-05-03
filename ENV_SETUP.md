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

| Target    | Purpose              | Frontend URL                          | Backend URL                                 |
| :-------- | :------------------- | :------------------------------------ | :------------------------------------------ |
| **Local** | Feature development  | `http://localhost:5173`               | `http://127.0.0.1:3210`                     |
| **Dev**   | Staging / QA testing | `https://staging.pingo-31m.pages.dev` | `https://combative-mouse-848.convex.cloud`  |
| **Prod**  | Live application     | `https://pingo.bouncybison.click`     | `https://fearless-axolotl-554.convex.cloud` |

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
4. **Manual Step**: Ensure `CONVEX_SITE_URL` is set to `http://127.0.0.1:3211`
   in your Convex settings (usually handled by `npx convex dev`).

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

### Step 2: Configure Redirects (Single Client)

Pingo uses a **single Google OAuth client** across all environments. Add **all**
origins and redirect URIs to the same client:

**Authorized JavaScript Origins:**

- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `https://staging.pingo-31m.pages.dev`
- `https://pingo.bouncybison.click`

**Authorized Redirect URIs:**

- `http://127.0.0.1:3211/api/auth/callback/google`
- `https://combative-mouse-848.convex.site/api/auth/callback/google`
- `https://fearless-axolotl-554.convex.site/api/auth/callback/google`

### Step 3: Add Secrets to Convex

Set the **same** `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` on every Convex
deployment (local, dev, prod) — they all share the single client.

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

| Variable          | Environment    | Example Value                               |
| :---------------- | :------------- | :------------------------------------------ |
| `VITE_CONVEX_URL` | **Production** | `https://fearless-axolotl-554.convex.cloud` |
| `VITE_CONVEX_URL` | **Preview**    | (Auto-injected by build command)            |

> **Note**: `VITE_CONVEX_SITE_URL` is NOT required in the frontend; it is a
> backend variable.

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
npx convex deploy --preview-create combative-mouse-848 --cmd "npm run build" --cmd-url-env-var-name VITE_CONVEX_URL
```

Redirect URI: `https://combative-mouse-848.convex.site/api/auth/callback/google`

---

## 🛠️ 4. Master Environment Matrix

The following table summarizes all configuration required for the Pingo
ecosystem.

| Component       | Setting / Variable            | **Local** Environment              | **Staging** (Staging)                   | **Production** (Live)                       |
| :-------------- | :---------------------------- | :--------------------------------- | :-------------------------------------- | :------------------------------------------ |
| **Vite App**    | `VITE_CONVEX_URL`             | `http://localhost:3210`            | _(Auto-injected)_                       | `https://fearless-axolotl-554.convex.cloud` |
| **Convex (BE)** | `CONVEX_SITE_URL`             | `http://127.0.0.1:3211`            | _(Built-in)_                            | _(Built-in)_                                |
| **Cloudflare**  | `CONVEX_DEPLOY_KEY`           | N/A                                | `preview:ongbt:pingo\|...`              | `preview:ongbt:pingo\|...`                  |
| **Convex (BE)** | `AUTH_GOOGLE_ID`              | _(shared across all envs)_         | _(shared across all envs)_              | _(shared across all envs)_                  |
| **Convex (BE)** | `AUTH_GOOGLE_SECRET`          | _(shared across all envs)_         | _(shared across all envs)_              | _(shared across all envs)_                  |
| **Convex (BE)** | `SITE_URL`                    | `http://localhost:5173`            | `https://staging.pingo-31m.pages.dev`   | `https://pingo.bouncybison.click`           |
| **Google**      | Authorized JavaScript origins | `http://localhost:5173`            | `https://staging.pingo-31m.pages.dev`   | `https://pingo.bouncybison.click`           |
| **Google**      | Authorized redirect URIs      | `http://127.0.0.1:3211/callback`\* | `https://...848.convex.site/callback`\* | `https://...554.convex.site/callback`\*     |

_\* Full Redirect URI path: `/api/auth/callback/google`_

---

---

## ⚠️ 5. Troubleshooting & Common Pitfalls

### 1. "User not shown as signed in after redirect"

This usually means the **`SITE_URL`** in Convex does not exactly match your
frontend URL.

- **Check Convex Dashboard**: Go to **Settings > Environment Variables**.
- **`CONVEX_SITE_URL`**: This is **built-in** by Convex and cannot be modified.
  It automatically points to your `.site` URL.
- **Fix Production `SITE_URL`**: Ensure `SITE_URL` is set manually to
  `https://pingo.bouncybison.click`.
- **Fix Local `SITE_URL`**: Use
  `npx convex env set SITE_URL http://localhost:5173`.

### 2. "Connection lost while action was in flight" (JWKS Issue)

This error often occurs if `JWKS` or `JWT_PRIVATE_KEY` are corrupted or missing.
The backend cannot verify the JWT it just issued.

- **Fix**: Re-run `npx @convex-dev/auth` for that deployment.
- **Manual verification**: Check that `JWKS` exists in the Convex Dashboard
  variables.

### 2b. Manual Key Generation (If CLI crashes)

If `npx @convex-dev/auth` crashes (common on Windows with Node v24), you can
manually generate the keys using this Node command:

```powershell
node -e "const crypto = require('crypto'); const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } }); const jwk = crypto.createPublicKey(publicKey).export({ format: 'jwk' }); const jwks = JSON.stringify({ keys: [{ ...jwk, use: 'sig', alg: 'RS256', kid: 'default' }] }); console.log('\n--- JWT_PRIVATE_KEY ---\n' + privateKey + '\n--- JWKS ---\n' + jwks + '\n')"
```

Copy the generated `JWKS` string and `JWT_PRIVATE_KEY` block into your Convex
Dashboard environment variables manually.

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
