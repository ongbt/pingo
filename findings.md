# Findings & Discoveries

## Current Project State (2026-02-25)

- **Framework**: React 18 + Vite (migrated from Next.js 15).
- **Routing**: `react-router-dom` v6 — all 6 routes verified functional.
- **Deployment**: Frontend on Cloudflare Pages, Backend on Supabase Cloud
  (Singapore).
- All source code lives in `src/` following standard Vite conventions.
- Design sources (original HTML/CSS mockups) backed up in `design_sources/`.
- Requirement defined in `REQUIREMENT.md`.

## Constraints

- Mobile-first approach (320px – 428px primary target).
- Guest play must be supported (no auth required to join or create).
- Real-time multiplayer synchronization required.
- Client-side only — no SSR after migration from Next.js.

## Research Notes

- [Supabase Realtime](https://supabase.com/docs/guides/realtime) is ideal for
  board sync and leaderboard. Requires `REPLICA IDENTITY FULL` on tables
  filtered by non-PK columns to correctly broadcast DELETE events.
- [Framer Motion](https://www.framer.com/motion/) used for premium animations
  (page transitions, winner modal, confetti overlay).
- [DiceBear Avatars](https://www.dicebear.com/) used for guest player avatars —
  SVG-based, no optimization needed.
- [Canvas Confetti](https://github.com/catdad/canvas-confetti) used for Bingo
  victory celebration.

## Key Gotchas

- **RLS on `sheet` table**: `auth.uid() = NULL` evaluates to `NULL` (not `TRUE`
  or `FALSE`) in Postgres SQL. The original SELECT policy silently blocked guest
  hosts from reading back their own newly inserted custom sheets. Fixed by
  adding `OR creator_id IS NULL` branch.
- **Realtime DELETE events**: Supabase Realtime drops DELETE events on channels
  filtered by non-PK columns (like `game_id`) unless the table has
  `REPLICA IDENTITY FULL`. This was the root cause of quitted players persisting
  in other players' leaderboards.
- **Vite Environment Variables**: Variables must use `VITE_` prefix to be
  exposed to client-side code via `import.meta.env.VITE_*`. Variables without
  this prefix are silently ignored at runtime.
- **Cloudflare SPA Routing**: Without a `_redirects` file containing
  `/* /index.html 200`, deep-linking to any route other than `/` returns a
  Cloudflare 404 error.
