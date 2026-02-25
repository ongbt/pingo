# Pingo Deployment Guide & Troubleshooting

This document records the steps taken to deploy Pingo to production and the
resolutions for issues encountered during the process.

## 🚀 Deployment Overview

- **Frontend**: Cloudflare Pages (Next.js with `@cloudflare/next-on-pages`)
- **Backend/DB**: Supabase Cloud
- **Region**: ap-southeast-1 (Singapore)
- **Domain**: [Pingo on Cloudflare](https://pingo.pages.dev) (Pending final
  build)

---

## 🛠 Setup Steps

### 1. Supabase Cloud Configuration

- **Project Created**: `uzcumjicbmnlehrdjirl`
- **Database**: Pushed all 11 local migrations using Supabase CLI.
- **Seeding**: Initial default bingo sheets (Corporate Townhall, Zoo,
  Disneyland) are synced to the production database.
- **Realtime**: Enabled replication for `game` and `player` tables in the
  production project dashboard to support multiplayer sync.

### 2. Next.js Optimizations

- **Edge Runtime**: Added `export const runtime = 'edge';` to all main routes
  (`/`, `/create`, `/lobby/[id]`, `/game/[id]`, `/sheets`) to ensure high
  performance on Cloudflare's global network.
- **Image Optimization**: Configured `next.config.ts` with `remotePatterns` for
  Dicebear, Unsplash, and Google avatars.

### 3. Cloudflare Pages Build Settings

- **Framework Preset**: `Next.js`
- **Build Command**: `npx @cloudflare/next-on-pages`
- **Build Output Directory**: `.vercel/output/static`
- **Environment Variables**:
  - `NODE_VERSION`: `20`
  - `NEXT_PUBLIC_SUPABASE_URL`: (Production URL)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (Production Anon Key)

---

## ⚠️ Issues & Resolutions

### 1. Dependency Conflict (npm ERESOLVE)

- **Problem**: The build failed during `npm clean-install` because the `vercel`
  package (`^50.23.2`) was too new for the `@cloudflare/next-on-pages` adapter.
- **Resolution**: Downgraded `vercel` to `47.0.4` in `package.json` to satisfy
  peer dependency requirements.

### 2. React 19 RC Peer Dependency Conflict

- **Problem**: Strict `npm install` in the CI environment blocked packages like
  `framer-motion` due to React version mismatches (Next.js 15 uses React 19 RC).
- **Resolution**: Created a `.npmrc` file with `legacy-peer-deps=true` to allow
  the build to proceed with compatible (though not strictly matched) peer
  dependencies.

### 3. Lint Errors Blocking Build

- **Problem**: Next.js production builds are strict. The build failed due to:
  - Unescaped double quotes in JSX (`react/no-unescaped-entities`).
  - Unused `Image` import in `app/page.tsx`.
  - `any` type casting and missing types for joined Supabase queries.
- **Resolution**:
  - Escaped quotes with `&quot;`.
  - Cleaned up unused imports.
  - Enhanced `types/index.ts` with optional relations and updated queries to use
    the joined `sheet` data properly.

### 4. Node.js Compatibility Flag

- **Problem**: The app showed a "Node.JS Compatibility Error" after the first
  successful build.
- **Resolution**: Required enabling the `nodejs_compat` flag in **Settings ➔
  Functions ➔ Compatibility Flags** in the Cloudflare Dashboard for both
  Production and Preview environments.

---

## ✅ Final Pre-Flight Checklist

- [x] Push all migrations to Supabase Cloud.
- [x] Enable Realtime for `game` and `player` tables.
- [x] Set Environment Variables in Cloudflare.
- [x] Add `nodejs_compat` flag in Cloudflare.
- [x] Fix all TypeScript/ESLint errors.
