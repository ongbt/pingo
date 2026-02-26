# Feature: Advanced Bingo Scoring

## Goal

Implement a tiered scoring system where players earn 1 point per marked cell,
PLUS a bonus for achieving a Bingo (1st = 10pts, 2nd = 5pts, 3rd = 3pts, 4th+ =
1pt).

## Tasks

- [ ] Task 1: Create DB migration to add `bingo_rank` to the `player` table and
      a `claim_bingo` RPC that safely assigns the rank and updates the score. →
      Verify: Migration applied successfully.
- [ ] Task 2: Update `types/index.ts` to include `bingo_rank` on the `Player`
      object. → Verify: Types compile.
- [ ] Task 3: Update `GamePage.tsx` cell marking logic: `score` must be
      `マークされたセル数 + bingo_bonus` (calculated from `bingo_rank` locally
      so subsequent marks don't overwrite the bonus). → Verify: Clicking a cell
      correctly calculates the sum.
- [ ] Task 4: Update `GamePage.tsx` bingo claim logic: Call `claim_bingo` RPC
      instead of manual UPDATEs. Only set `status = 'finished'` if
      `firstBingoWins` is true. → Verify: BINGO button assigns correct
      rank/points.
- [ ] Task 5: Change `firstBingoWins` default to `false` in `CreatePage.tsx` so
      multiple bingos are actually possible. Update UI to reflect the new
      scoring on the leaderboard and winner screen. → Verify: Multiple players
      can claim bingo in one session.

## Done When

- [ ] First player to get bingo receives 10 bonus points.
- [ ] Second player receives 5 bonus points.
- [ ] Third player receives 3 bonus points.
- [ ] Subsequent players receive 1 bonus point.
- [ ] Marked cells always grant 1 point each, adding safely alongside the bingo
      bonus.
