# SOP: Realtime Synchronization

## Overview

Hybrid synchronization using Postgres for persistence and Channels for transient
events.

## Presence (Lobby)

1. **Join**: When a user enters a lobby, join the `game:[id]` channel.
2. **State**: Use `Presence` to track `nickname` and `is_ready` status.
3. **Behavior**:
   - Display player count based on presence list.
   - Host only triggers `START_GAME` broadcast via channel when minimum players
     (1 for MVP) are ready.

## Broadcast (Game Events)

1. **Selection**: When a player marks a cell, broadcast the `mark` event to the
   channel.
   - Payload: `{ player_id, cell_index, item_value }`
2. **Leaderboard**: All clients listen for `mark` events to update their local
   "Top 5" UI instantly.
3. **Winner**: Broadcast `BINGO` event when a player wins.
   - Payload: `{ player_id, nick_name, pattern }`

## Postgres Sync (Persistence)

1. **Game Start**: Update `game.status = active` in DB.
2. **Session Persistence**: Periodically sync board state to
   `player.board_state` in Postgres for recovery on refresh.
3. **Final Results**: `game.status = finished` must be persisted in DB.
