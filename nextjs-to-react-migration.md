# Next.js → React (Vite) Migration

## Status: ✅ COMPLETE

All tasks completed on 2026-02-25. The application is now fully running on
React + Vite and deployed to Cloudflare Pages.

## Goal

Replace Next.js 15 with Vite + React + `react-router-dom`, keeping all pages and
logic intact.

## Tasks

- [x] Task 1: Scaffold Vite project in `/src`, update `package.json`,
      `tsconfig.json`, `vite.config.ts`
- [x] Task 2: Create `index.html`, `src/main.tsx`, `src/App.tsx` (root router)
- [x] Task 3: Convert `lib/`, `types/`, and shared utilities (env prefix
      `NEXT_PUBLIC_` → `VITE_`)
- [x] Task 4: Convert all 6 page files (remove `'use client'`,
      `export const runtime`, `next/` imports)
- [x] Task 5: Convert `app/components/` (ErrorDialog, PopularSheets)
- [x] Task 6: Convert `globals.css`, `tailwind.config.ts` content paths
- [x] Task 7: Update `.env.local` and `.env.production` variable prefixes
- [x] Task 8: Remove Next.js artifacts (`.next/`, `next.config.ts`,
      `next-env.d.ts`, devDeps)
- [x] Task 9: Verify → Run `npm run dev`, test all routes

## Done When

- [x] `npm run dev` starts with no errors
- [x] All 6 routes work: `/`, `/create`, `/join`, `/lobby/:id`, `/game/:id`,
      `/sheets`
- [x] `npm run build` produces a clean production bundle in `dist/`
