# Navigator: Game Session Flow

## Overview

This navigator manages the state transition from Landing → Create/Join → Lobby →
Active Game.

## 1. Landing Navigation

- **Action**: Host Game
  - **Logic**: Redirect to `/create` (Requires Auth).
- **Action**: Join Game
  - **Logic**: Redirect to `/join` (Public).

## 2. Creation Navigation

- **Action**: Create Room
  - **Input**: `sheet_id`, `config`.
  - **Logic**:
    1. Insert into `game` table.
    2. Generate 6-char `room_code`.
    3. Insert Host into `player` table.
    4. Redirect to `/lobby/[id]`.

## 3. Lobby Navigation

- **Action**: Join Room
  - **Input**: `room_code`, `nickname`.
  - **Logic**:
    1. Query `game` by `room_code`.
    2. Insert into `player` table.
    3. Subscribe to Realtime Channel `game:[id]`.
- **Action**: Start Game
  - **Trigger**: Host clicks "Start".
  - **Logic**:
    1. Update `game.status = active`.
    2. Broadcast `GAME_START` triggering all clients to redirect to
       `/game/[id]`.

## 4. Active Game Navigation

- **Action**: Bingo
  - **Logic**:
    1. Broadcast `WINNER`.
    2. Show Win/Loss overlay.
    3. Options: Back to Lobby or Exit.
