# Pingo Deployment Guide & Troubleshooting

This document records the steps taken to deploy Pingo to production and the
resolutions for issues encountered during the process.

## 🚀 Deployment Overview

| Service            | Provider                                                    | Details             |
| ------------------ | ----------------------------------------------------------- | ------------------- |
| **Frontend**       | Cloudflare Pages                                            | React SPA (Vite)    |
| **Backend/DB**     | Supabase Cloud                                              | Postgres + Realtime |
| **Region**         | ap-southeast-1                                              | Singapore           |
| **Production URL** | [pingo.bouncybison.click](https://pingo.bouncybison.click/) | Custom domain       |

---

## 🛠 Setup Steps

### 1. Supabase Cloud Configuration

- **Project ID**: `uzcumjicbmnlehrdjirl`
- **Database**: Pushed all 11 migrations using Supabase CLI:
  ```bash
  npx supabase db push
  ```
- **Seeding**: Default bingo sheets (Corporate Townhall, Zoo Animals, Disneyland
  Characters) are synced to the production database.
- **Realtime**: Replication enabled for `game` and `player` tables in the
  production project dashboard.

### 2. React (Vite) Configuration

- **Architecture**: Pure React SPA — no server-side rendering.
- **Routing**: `react-router-dom` v6 for client-side navigation.
- **SPA Fallback**: `public/_redirects` contains:
  ```
  /* /index.html 200
  ```
  This is required for Cloudflare Pages to handle deep-linking.
- **Environment**: All secrets use `VITE_` prefix for Vite client exposure.

### 3. Cloudflare Pages Build Settings

| Setting                    | Value                     |
| -------------------------- | ------------------------- |
| **Framework Preset**       | Vite                      |
| **Build Command**          | `npm run build`           |
| **Build Output Directory** | `dist`                    |
| **NODE_VERSION**           | `20`                      |
| **VITE_SUPABASE_URL**      | (Production Supabase URL) |
| **VITE_SUPABASE_ANON_KEY** | (Production Anon Key)     |

---

## ⚠️ Migration Notes & Issues

### 1. Framework Transition (Next.js ➔ Vite)

- **Problem**: Next.js 15 routing and image optimization were tailored for
  SSR/Edge environments, adding unnecessary complexity for a client-only
  real-time app.
- **Resolution**: Converted the codebase to a standard React entry point
  (`main.tsx`) with a client-side router (`App.tsx`).

### 2. Environment Variables

- **Problem**: Vite requires variables to be prefixed with `VITE_` for
  client-side exposure. Variables without this prefix are silently ignored at
  runtime.
- **Resolution**: Updated all `.env` files and `src/lib/supabase.ts` to use
  `import.meta.env.VITE_*`.

### 3. TypeScript & Linting

- **Problem**: Next.js-specific ESLint rules (like `next/core-web-vitals`)
  failed after removing Next.js.
- **Resolution**: Established a standard React/TypeScript ESLint config and
  added `vite-env.d.ts` for proper `ImportMeta` typing.

### 4. Blank Page After Deployment

If your app is blank after deployment, check these settings in your Cloudflare
Pages dashboard:

1. **Build Settings**:
   - Ensure **Build Command** is set to `npm run build`.
   - Ensure **Build Output Directory** is set to `dist`.
   - _If these are still pointing to Next.js paths, the page will be blank
     or 404._

2. **Environment Variables**:
   - Ensure your secrets are prefixed with `VITE_` (e.g., `VITE_SUPABASE_URL`).
   - _Vite ignores variables without the prefix, which will cause Supabase to
     fail on load._

3. **Routing**:
   - Verify `public/_redirects` is present in your repository and was pushed.
   - Without this file, navigating directly to `/lobby/...` or `/game/...`
     returns a Cloudflare 404.

---

## ✅ Final Pre-Flight Checklist

- [x] Push all 11 migrations to Supabase Cloud.
- [x] Enable Realtime for `game` and `player` tables.
- [x] Enable `REPLICA IDENTITY FULL` on `player` table for DELETE event
      propagation.
- [x] Seed default bingo sheets (Corporate Townhall, Zoo, Disneyland).
- [x] `public/_redirects` committed and pushed.
- [x] Set environment variables in Cloudflare with `VITE_` prefix.
- [x] Set Build Command to `npm run build` and Output Directory to `dist`.
- [x] Verify local build (`npm run build`) passes without errors.
- [ ] Connect GitHub repo to Cloudflare Pages (Manual step — requires GitHub
      OAuth in CF dashboard).
- [ ] Set up custom domain DNS in Cloudflare.
