# SOP: Bingo Game Logic

## Overview

Deterministic management of the 5x5 Bingo board, randomized item distribution,
and win validation.

## Board Generation

1. **Input**: A `sheet` containing at least 25 items (words or numbers).
2. **Logic**:
   - Shuffle the array of items using the Fisher-Yates algorithm.
   - Select the first 25 items.
   - Map them to a 5x5 grid (2D array or flat 25-item array with index mapping).
3. **Output**: A 5x5 JSON representation.

## Selection & Scoring

1. **Input**: `player_id`, `cell_index`.
2. **Logic**:
   - Verify game is `active`.
   - Update `player.board_state` for the specific index to `marked: true`.
   - Increment `player.score`.
3. **Edge Case**: If `anti_cheating` is enabled, only mark as confirmed if 2
   players select the same index (requires additional logic for item
   verification).

## Win Validation (Bingo Check)

1. **Trigger**: After every cell selection.
2. **Logic Check**:
   - **Horizontal**: Check all 5 rows for 5 marked cells.
   - **Vertical**: Check all 5 columns for 5 marked cells.
   - **Diagonal**: Check both diagonals (0,6,12,18,24 and 4,8,12,16,20) for 5
     marked cells.
3. **Result**: If Bingo found, set `player.is_winner = true` and
   `game.status = finished`.
