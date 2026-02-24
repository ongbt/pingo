# Findings & Discoveries

## Current Project State

- Project initialized with Next.js 15 (App Router).
- Design sources (HTML/CSS) backed up in `design_sources/`.
- Requirement defined in `REQUIREMENT.md`.
- Basic landing page implemented in `app/page.tsx`.

## Constraints

- Mobile-first approach.
- Guest play must be supported (Anonymous auth).
- Hosts must be logged in to create games.
- Real-time multiplayer synchronization required.

## Research Notes

- [Supabase Realtime](https://supabase.com/docs/guides/realtime) is ideal for
  board sync and leaderboard.
- [Framer Motion](https://www.framer.com/motion/) will be used for premium
  animations.
