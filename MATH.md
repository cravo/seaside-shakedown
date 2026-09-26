# Seaside Shakedown v2.2 — whole credits and Double or Drench

Generated from the production engine with `node scripts/analyze-math.js --write`.

## Fixed rules

All awards settle in whole credits. A single left cherry pays half the stake rounded up: 1, 1 or 3 credits at stakes 1, 2 or 5. Existing half-credit balances and last returns round up on migration to save schema v3. Rounding is an actual wallet award, not display formatting. Other payouts and feature probabilities are unchanged.

Each 20-stop reel contains eight unnumbered stops, five 1s, four 2s and three 3s. Numbers are fixed to stops. The average fresh total is 3.3. Independent fresh spins total nine with probability 27/8000 = 0.3375%; carried signs and reel features make actual bonus entry much more common.

A nonzero incomplete sign is held with probability 25%. Subsequent spins carry those lit letters only when held; the hold chance can recur. Nudges replace the current spin total, never add it again. Changing stake and refilling clear the sign. A complete sign awards one bonus, including when it is queued behind the gull bonus.

Double or Drench starts at 2× the committed stake. Four of eight uniformly selected wheel segments double the pot; four lose the uncollected pot. Collect is always available before gambling. The ladder is 2× → 4× → 8× → 16× → 32×, with automatic banking at 32×. Every gamble has expected return equal to the current pot (0.5 × 2P + 0.5 × 0 = P). Thus any collect/gamble policy has expected bonus return 2× at entry. Going for the top wins 32× with probability 1/16 and loses the bonus with probability 15/16. Ordinary credited wins are never at risk.

## Empirical full-game sessions

Ten independent seeded batches of 20,000 paid spins per strategy; 600,000 spins overall, stake 1, 100-credit start and free refills. Intervals are approximate 95% intervals from between-batch standard errors, not guarantees about an individual session. Free nudges and bonus gambles are excluded from the stake denominator.

| Policy | Returned / staked ± interval | Shakedowns | Held signs | Wheel gambles / wins | Refills |
|---|---:|---:|---:|---:|---:|
| no-reel-features | 81.755% ± 1.646% | 14127 | 44162 | 0 / 0 | 361 |
| casual-collect | 102.811% ± 1.391% | 14834 | 44220 | 0 / 0 | 28 |
| numbers-gamble | 98.398% ± 1.742% | 16244 | 43752 | 30380 / 15152 | 71 |

No-reel-features skips conventional holds/nudges and collects the Shakedown pot immediately. Casual-collect holds a matching pair, prefers an immediately paying nudge (including a complete sign), and collects. Numbers-gamble holds up to two numbered stops worth at least 2, nudges towards pay/letters, and gambles to washout or 32×. All policies collect after the first safe gull pick. None is proven optimal; do not label these figures optimal RTP.

The v1 92.72% optimal-return figure excluded this new feature and no longer describes the whole game. Historical calculations are retained in MATH-V1.md and scripts/analyze-math-v1.js. This free-credit simulator now deliberately offers an additional frequent bonus; there is no advertised RTP or claim that every possible strategy stays below 100%. There is no purchase, cash-out, or shared credit economy.
