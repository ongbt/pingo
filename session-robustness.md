# Session Robustness

## Goal

Auto-cancel stale lobbies (no start within N minutes) and auto-terminate
inactive games (no cell marks within N minutes) using a Postgres function +
`pg_cron` + client-side countdown UI.

## Architecture Decision

- **Backend**: Postgres function `expire_stale_sessions()` sets
  `status='finished'` on stale lobbies/games, called by `pg_cron` every minute.
- **Configurable thresholds**: stored in `game.config` JSONB as
  `lobby_timeout_min` (default 15) and `game_timeout_min` (default 30).
- **Activity tracking**: add `last_activity_at TIMESTAMPTZ` column to `game`;
  updated on: game created, player joined, game started (cell marks update
  player table, not game — so game-level idle = lobby only; active game timeout
  uses `updated_at` on the game row as a proxy).
- **Frontend**: countdown timer in LobbyPage and GamePage; graceful "Game Ended"
  redirect when Realtime fires a status=finished update.

## Tasks

- [ ] Task 1: Migration — add `last_activity_at` to `game`, create
      `expire_stale_sessions()` RPC, schedule with `pg_cron` → Verify:
      `SELECT last_activity_at FROM game LIMIT 1` returns a value
- [ ] Task 2: Migration — update existing RLS/triggers to bump
      `last_activity_at` on player INSERT → Verify: join a game, check
      `last_activity_at` updated
- [ ] Task 3: Frontend — `LobbyPage.tsx`: display countdown timer (lobby
      timeout), auto-redirect on `status=finished` → Verify: countdown shows,
      3-sec redirect on timeout
- [ ] Task 4: Frontend — `GamePage.tsx`: display countdown timer (game timeout),
      reset on cell mark → Verify: timer shows, resets on mark
- [ ] Task 5: Push migrations to local and production Supabase → Verify:
      `supabase db push`
- [ ] Task 6: Update `task_plan.md`, `progress.md`, `README.md`

## Done When

- [ ] Stale lobbies auto-cancel after 15 minutes with no game start
- [ ] Active games auto-terminate after 30 minutes with no activity
- [ ] Both pages display a live countdown and redirect gracefully on timeout
