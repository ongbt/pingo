# Pingo Deployment Guide & Troubleshooting

This document records the steps taken to deploy Pingo to production and the
resolutions for issues encountered during the process.

## 🚀 Deployment Overview

- **Frontend**: Cloudflare Pages (React SPA with Vite)
- **Backend/DB**: Supabase Cloud
- **Region**: ap-southeast-1 (Singapore)
- **Domain**: [Pingo on Cloudflare](https://pingo.pages.dev)

---

## 🛠 Setup Steps

### 1. Supabase Cloud Configuration

- **Project Created**: `uzcumjicbmnlehrdjirl`
- **Database**: Pushed all migrations using Supabase CLI.
- **Seeding**: Initial default bingo sheets (Corporate Townhall, Zoo,
  Disneyland) are synced to the production database.
- **Realtime**: Enabled replication for `game` and `player` tables in the
  production project dashboard to support multiplayer sync.

### 2. React (Vite) Migration

- **Architecture**: Simplified the app from a Next.js Full-Stack framework to a
  pure React SPA.
- **Routing**: Implemented `react-router-dom` for client-side navigation.
- **Environment**: Transitioned to `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY` prefixes.

### 3. Cloudflare Pages Build Settings

- **Framework Preset**: `Vite`
- **Build Command**: `npm run build` (runs `tsc && vite build`)
- **Build Output Directory**: `dist`
- **Environment Variables**:
  - `NODE_VERSION`: `20`
  - `VITE_SUPABASE_URL`: (Production URL)
  - `VITE_SUPABASE_ANON_KEY`: (Production Anon Key)

---

## ⚠️ Migration Notes & Issues

### 1. Framework Transition (Next.js ➔ Vite)

- **Problem**: Next.js 15 routing and image optimization were tailored for
  SSR/Edge environments, adding complexity for a client-only real-time app.
- **Resolution**: Converted the codebase to a standard React entry point
  (`main.tsx`) with a client-side router (`App.tsx`).

### 2. Environment Variables

- **Problem**: Vite requires variables to be prefixed with `VITE_` for
  client-side exposure.
- **Resolution**: Updated all `.env` files and `src/lib/supabase.ts` to use
  `import.meta.env.VITE_*`.

### 3. TypeScript & Linting

- **Problem**: Next.js-specific ESLint rules (like `next/core-web-vitals`)
  failed after removing Next.js.
- **Resolution**: Established a standard React/TypeScript ESLint config and
  added `vite-env.d.ts` for proper `ImportMeta` typing.

---

## ✅ Final Pre-Flight Checklist

- [x] Push all migrations to Supabase Cloud.
- [x] Enable Realtime for `game` and `player` tables.
- [x] Set environment variables in Cloudflare with `VITE_` prefix.
- [x] Set Build Command to `npm run build` and Directory to `dist`.
- [x] Verify local build (`npm run build`) passes without errors.
