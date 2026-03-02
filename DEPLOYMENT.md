# Pingo Deployment Guide & Troubleshooting

This document records the steps taken to deploy Pingo to production and the
resolutions for issues encountered during the process.

## 🚀 Deployment Overview

| Service            | Provider                                                    | Details                  |
| ------------------ | ----------------------------------------------------------- | ------------------------ |
| **Frontend**       | Cloudflare Pages                                            | React SPA (Vite)         |
| **Backend/DB**     | Convex Cloud                                                | Reactive Database + Auth |
| **Production URL** | [pingo.bouncybison.click](https://pingo.bouncybison.click/) | Custom domain            |

---

## 🛠 Setup Steps

### 1. Convex Cloud Configuration

- **Initialization**: Run `npx convex dev` to link the project to a new Convex
  deployment.
- **Schema & Functions**: Convex automatically deploys the `schema.ts` and all
  functions in the `convex/` directory upon pushing or running the dev server.
- **Authentication**: Configure Google OAuth and other providers in the Convex
  Dashboard settings for the production deployment.
- **Environment Variables**: Configure all necessary production secrets (e.g.,
  `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`) in the Convex Dashboard.

### 2. React (Vite) Configuration

- **Architecture**: Pure React SPA — no server-side rendering.
- **Routing**: `react-router-dom` v6 for client-side navigation.
- **SPA Fallback**: `public/_redirects` contains:
  ```
  /* /index.html 200
  ```
  This is required for Cloudflare Pages to handle deep-linking.
- **Environment**: All secrets use `VITE_` prefix for Vite client exposure.

| Setting                    | Value                                       |
| -------------------------- | ------------------------------------------- |
| **Framework Preset**       | Vite                                        |
| **Build Command**          | `npm run build`                             |
| **Build Output Directory** | `dist`                                      |
| **NODE_VERSION**           | `20`                                        |
| **VITE_CONVEX_URL**        | `https://fearless-axolotl-554.convex.cloud` |
| **VITE_CONVEX_SITE_URL**   | `https://fearless-axolotl-554.convex.site`  |
| **Production Slug**        | `fearless-axolotl-554`                      |

---

## ⚠️ Migration Notes & Issues

### 1. Backend Transition (Supabase ➔ Convex)

- **Problem**: Supabase Realtime and RLS required complex setup (triggers, RPCs,
  REPLICA IDENTITY) to ensure race-condition-free state updates and accurate
  DELETE events.
- **Resolution**: Migrated to Convex for its native reactivity and built-in
  ACID-compliant mutations. This simplified the code by removing the need for
  manual subscriptions and complex SQL triggers.

### 2. Authentication

- **Problem**: Managing guest sessions and profiles in Supabase required custom
  logic to bridge anonymous and registered users.
- **Resolution**: Implemented Convex Auth with Anonymous sign-in support,
  providing a unified identity system that automatically handles profile
  management and secure backend access.

### 3. Environment Variables

- **Problem**: Vite requires variables to be prefixed with `VITE_` for
  client-side exposure.
- **Resolution**: Consolidated backend configuration into a single
  `VITE_CONVEX_URL` variable.

### 4. Blank Page After Deployment

If your app is blank after deployment, check these settings in your Cloudflare
Pages dashboard:

1. **Build Settings**:
   - Ensure **Build Command** is set to `npm run build`.
   - Ensure **Build Output Directory** is set to `dist`.
   - _If these are still pointing to Next.js paths, the page will be blank
     or 404._

2. **Environment Variables**:
   - Ensure your secrets are prefixed with `VITE_` (e.g., `VITE_CONVEX_URL`).

3. **Routing**:
   - Verify `public/_redirects` is present in your repository and was pushed.
   - Without this file, navigating directly to `/lobby/...` or `/game/...`
     returns a Cloudflare 404.

---

## ✅ Final Pre-Flight Checklist

- [x] Link project to Convex Production deployment.
- [x] Configure Convex Auth (Google, Password, Anonymous) in the dashboard.
- [x] Set environment variables in the Convex Dashboard (OAuth secrets).
- [x] `public/_redirects` committed and pushed.
- [x] Set `VITE_CONVEX_URL` in Cloudflare with the production URL.
- [x] Set Build Command to `npm run build` and Output Directory to `dist`.
- [x] Verify local build (`npm run build`) passes without errors.
- [ ] Connect GitHub repo to Cloudflare Pages (Manual step — requires GitHub
      OAuth in CF dashboard).
- [ ] Set up custom domain DNS in Cloudflare.
