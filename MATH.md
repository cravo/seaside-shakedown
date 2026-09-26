# Seaside Shakedown v3 — High Tide timing bonus

Generated from the production engine with `node scripts/analyze-math.js --write`.

## Fixed rules

All awards settle in whole credits. A single left cherry pays half the stake rounded up: 1, 1 or 3 credits at stakes 1, 2 or 5. Existing half-credit balances and last returns round up on migration to save schema v4. Rounding is an actual wallet award, not display formatting. Other payouts and feature probabilities are unchanged.

Each 20-stop reel contains eight unnumbered stops, five 1s, four 2s and three 3s. Numbers are fixed to stops. The average fresh total is 3.3. Independent fresh spins total nine with probability 27/8000 = 0.3375%; carried signs and reel features make actual bonus entry much more common.

A nonzero incomplete sign is held with probability 25%. Subsequent spins carry those lit letters only when held; the hold chance can recur. Nudges replace the current spin total, never add it again. Changing stake and refilling clear the sign. A complete sign awards one bonus, including when it is queued behind the gull bonus.

High Tide starts with base winnings of 2× the triggering stake. The displayed pair starts at ×1 / ×2. Pressing while the higher panel is lit advances one multiplier; the lower panel loses the unbanked bonus. Collect pays the current lower multiplier times the base, irrespective of the active light. Nine successful presses reach ×10 and automatically bank 10 times the base (20× the original stake). Previously banked wins are safe.

This is a timing game, not an independent random gamble. The frame loop and input share one displayed-side snapshot; the production gamble draws no random number. Panels alternate with equal dwell times, starting at 620 ms per panel and decreasing by 30 ms per level to 380 ms at ×9. Paused rules and hidden tabs stop the selector. Actual success depends on player timing and device responsiveness, so there is no single game-wide RTP.

For the explicitly hypothetical blind-tap model below, each tap independently hits high with probability 1/2. Nine consecutive hits have probability 1/512; always attempting ×10 returns an expected 10/512 of the base. Perfect timing instead earns the full 10× base. These are model assumptions and bounds, not measured human accuracy or advertised odds.

## Empirical full-game sessions

Ten independent seeded batches of 20,000 paid spins per strategy; 600,000 spins overall, stake 1, 100-credit start and free refills. Intervals are approximate 95% intervals from between-batch standard errors, not guarantees about an individual session. Free nudges and bonus gambles are excluded from the stake denominator.

| Policy | Returned / staked ± interval | Shakedowns | Held signs | Timed attempts / hits | Refills |
|---|---:|---:|---:|---:|---:|
| no-reel-features | 81.755% ± 1.646% | 14127 | 44162 | 0 / 0 | 361 |
| casual-collect | 102.811% ± 1.391% | 14834 | 44220 | 0 / 0 | 28 |
| numbers-blind-climb | 83.177% ± 2.048% | 16164 | 43645 | 32407 / 16282 | 342 |

No-reel-features skips conventional holds/nudges and collects the Shakedown pot immediately. Casual-collect holds a matching pair, prefers an immediately paying nudge (including a complete sign), and collects. Numbers-blind-climb holds up to two numbered stops worth at least 2, nudges towards pay/letters, and models independent blind taps until loss or ×10. All policies collect after the first safe gull pick. None is proven optimal; do not label these figures optimal RTP.

The v1 92.72% optimal-return figure excluded this new feature and no longer describes the whole game. Historical calculations are retained in MATH-V1.md and scripts/analyze-math-v1.js. This free-credit simulator now deliberately offers an additional frequent bonus; there is no advertised RTP or claim that every possible strategy stays below 100%. There is no purchase, cash-out, or shared credit economy.
