# Seaside Shakedown — Game Design & Build Specification

Version: 3.0
Date: 26 September 2026  
Status: High Tide replaces the random wheel with a displayed-light timing gamble from ×1 to ×10. Whole credits, the cabinet redesign and ambient lighting remain. Save schema v4 preserves previous progress; release validation is tracked in RELEASE.md.

## 1. Purpose and scope

Build a playful British seaside fruit machine in JavaScript, playable entirely within one mobile screen. Publish its source to GitHub and host the finished game on Cloudflare Pages.

The player spends fictional credits to spin three reels, wins from a single centre payline, and uses holds and nudges. Numbers attached to reel stops fill a large SHAKEDOWN sign and unlock High Tide. Three gulls independently trigger Seagull Steal. The appeal is the physical rhythm of the reels, lighting the sign, and choosing when to collect a growing bonus pot.

There is no real money, purchase, cash-out, account, advertising, or server-side economy. Credits are freely refillable. The presentation says “Just for fun · fictional credits”. Avoid currency symbols, betting-service language, and claims that the player can earn money.

### First-release deliverables

- Complete game with spinning reels, payouts, holds, nudges, and Seagull Steal.
- Responsive portrait cabinet; usable compact landscape arrangement.
- Original local SVG artwork, animated lights, and synthesized sound effects.
- Rules and paytable, mute control, reduced-motion support, and keyboard access.
- Local save of credits and preferences, with graceful storage failure handling.
- Automated game-logic checks and browser verification at mobile sizes.
- GitHub repository with source, design document, README, and release instructions.
- Working production Cloudflare Pages URL, verified after deployment.

Excluded from this release: multiplayer, leaderboards, accounts, real-money features, progressive pooled jackpots, autoplay, daily rewards, installable/offline PWA support, and a backend. These exclusions keep the first version focused; do not substitute them for the required features above.

## 2. Theme and personality

**Premise:** One last spin at a much-loved seaside arcade. A cheeky gull has its eye on your chips. The machine is a loud, illustrated British cabinet with blue and purple backglass, gold payout lamps, crimson lettering, chrome trim and illuminated plastic controls.

**Tone:** Friendly, cheeky, and unmistakably British. Weathered details provide character without making the interface dirty or difficult to read. The player should feel welcomed, never mocked for losing.

**Title:** Seaside Shakedown  
**Cabinet subtitle:** A little luck by the sea  
**Bonus:** Seagull Steal  
**Top win:** The Big Seaside Jackpot

Example messages:

- Ready: “Fancy a spin?”
- Ordinary loss: “Another day at the seaside.”
- Hold offer: “Hang on to the good bits.”
- Nudge offer: “Give it a little nudge.”
- Small win: “Lovely little win!”
- Large win: “Chips are on you!”
- Bonus entry: “Watch your chips!”
- Empty balance: “The arcade’s still open. Grab some more credits.”

Use a small varied message set, selected cosmetically after the result. Copy never promises that a win is due, implies an upcoming outcome, or presents a loss as a win.

## 3. Screen design

### Portrait composition

The game is a single cabinet centred in the viewport, with a maximum width of approximately 460 CSS pixels. The surrounding desktop background expands; the cabinet does not grow into a dashboard.

```text
┌──────────────────────────────────┐
│ SEASIDE SHAKEDOWN       [♪] [?]   │
│ A little luck by the sea          │
│       ★ JACKPOT 100× ★            │
│ CREDIT       LAST WIN       STAKE │
│ 100          —             1     │
│ ┌────────┬────────┬────────┐      │
│ │   ·    │   ·    │   ·    │      │
│▶│ cherry │ lemon  │ chips  │◀     │
│ │   ·    │   ·    │   ·    │      │
│ └────────┴────────┴────────┘      │
│ [ HOLD ]  [ HOLD ]  [ HOLD ]      │
│       Fancy a spin?              │
│ [STAKE 1 ▾]       [    SPIN    ]  │
│ Just for fun · fictional credits │
└──────────────────────────────────┘
```

Only the centre horizontal line pays. Portions of neighbouring symbols are visible above and below to establish a physical reel and make nudges understandable. A pair of clear arrows marks the payline.

The three contextual reel buttons display HOLD during a hold offer and NUDGE during a nudge offer. They are disabled outside those modes. The primary button becomes COLLECT during the bonus; during a nudge offer it reads SPIN and explicitly forfeits unused nudges before buying a new spin. The message strip explains the current action.

### Layout rules

- Target 390 × 844; verify 320 × 568, 360 × 640, 375 × 667, 390 × 844, and 430 × 932 CSS pixels.
- Normal gameplay requires no page scrolling at these sizes.
- Use the dynamic viewport height and safe-area insets, with a fallback for older viewport sizing.
- Shrink decorative header space, reel height, and margins before shrinking essential controls or text.
- Main spin target: at least 64 pixels tall where space permits. All interactive targets: at least 44 × 44 pixels.
- Primary body text approximately 16 pixels; secondary text no smaller than 12 pixels.
- Balance and status remain visible throughout every animation and bonus.
- Rules use an accessible overlay with an internally scrollable body and persistent close control. A rules overlay may scroll; gameplay may not require scrolling.
- On short landscape screens, place title/status and controls beside the reels. Support at least 667 × 375 and 844 × 390.
- At enlarged text settings, preserve readability and access even if the layout must scroll. Do not clip essential information to enforce the ordinary-size single-screen target.

### First visit

Start at 100 credits and stake 1, with static non-winning display symbols and no automatic spin. Show one compact message: “Match 3 on the centre line. Tap SPIN to start.” The rules button is always available. Avoid an onboarding carousel or a modal before the first spin.

## 4. Core game rules

### Credits and stake

- Starting balance: 100 credits.
- Stake choices: 1, 2, and 5 credits, cycled by the stake control.
- All wins are multiples of the stake committed to that round.
- Retain the legacy scale of 1 credit = 2 integer units for save compatibility, but every current wallet amount and return must be even. Round each settled line payout up to the next whole credit before crediting it. Never hide fractions using display formatting.
- Disable stake changes during a spin, unresolved bonus, hold offer, or nudge offer. Offer a small “Skip feature” action during holds/nudges to return to ordinary idle and unlock stake selection.
- A paid spin deducts its stake exactly once, before animation starts.
- A nudge costs nothing; holding reels does not make the next spin free.
- Payouts are gross returns added after the stake deduction. A single cherry returns half stake rounded up (1, 1 or 3 credits at stakes 1, 2 or 5). Label a stake-1 refund “Your stake back”; at larger stakes label it a partial return. Neither is celebrated as a profitable win.
- If the balance is below the selected stake, keep the stake selector available when idle. When the balance is below the minimum stake, show “Refill to 100” as the primary action.
- Refill sets the balance to 100; it does not add 100 repeatedly. It is available only below the minimum stake. Refilling clears pending reel features and leaves preferences intact.

### Reels and randomness

Three independent fixed circular strips, each containing 20 stops. A fresh unheld reel selects a uniformly random stop. Use a small injectable random-source interface; production uses browser cryptographic randomness with unbiased integer sampling, and tests use seeded or scripted randomness.

Symbol key: C = cherries, L = lemon, I = ice cream, F = chips, G = gull, B = bell, S = lucky seven.

Initial strips, top to bottom, wrapping from the last entry to the first:

```text
Reel 1: C L I F C B L G I S C F L B I G C S L F
Reel 2: L C F I G L S C B F L I C G S I L B F C
Reel 3: I F L C B I G L C S F C L I B G F L S C
```

Each strip has C×4, L×4, I×3, F×3, G×2, B×2, S×2. Different ordering changes nudge opportunities while preserving the base probabilities. Three of a kind can occur for every symbol.

The logical outcome is selected before visual movement begins. Animation presents that outcome faithfully. Do not reroll an outcome because the player is winning, losing, leaving, or low on credits; do not move symbols to manufacture near misses. Cosmetic randomness must not consume the game random stream.

### Paytable

| Centre-line result | Return × stake |
| --- | ---: |
| Three cherries | 8× |
| Three lemons | 10× |
| Three ice creams | 15× |
| Three chips | 20× |
| Three gulls | 35× plus Seagull Steal |
| Three bells | 50× |
| Three lucky sevens | 100× |
| Exactly two consecutive cherries starting on the left | 2× |
| Exactly one cherry starting on the left | Half stake, rounded up: 1 / 1 / 3 credits at stakes 1 / 2 / 5 |
| Anything else | 0× |

Award only the highest matching line result, never overlapping cherry awards. “Exactly one cherry starting on the left” means reel 1 is C and reel 2 is not C; reel 3 may be any symbol. “Exactly two” means C,C,non-C. A cherry in the middle or right alone does not pay. Bonus earnings are additional to the three-gull line payout.

Display the same paytable data in the rules and use it in the evaluator; do not maintain two independent copies.

## 5. Holds and nudges

Features are available only after a zero-return ordinary paid spin in which all three reels were spun. A held spin and any nudge resolution cannot award another hold or nudge. This prevents feature chains and keeps the state understandable.

After an eligible loss, draw one integer from 0–99:

- 0–7: offer HOLD.
- 8–15: offer two NUDGES.
- 16–99: return to idle.

Release balancing changed the original 20%/20% offers to 8%/8%. Exact analysis found that the original rates returned 139.27% under optimal feature play. The revised rates return 92.72%; the original strips and paytable are unchanged. See `MATH.md` for the complete analysis and six million reproducible simulated paid spins.

### Hold

- Allow zero, one, or two reels to be selected; never all three.
- Selected reels glow and their controls read HELD with a non-colour selection indicator.
- Pressing SPIN pays the existing stake, retains selected stop indices, and randomizes the other reels.
- The offer is consumed when that spin is committed, even if no reels were selected.
- The held spin can win any paytable award and trigger the gull bonus, but cannot create another feature offer.
- Skip feature clears the selection and returns to idle without spending credits.
- If the player cannot afford the next spin, explain the balance requirement and allow skipping the offer to change stake or refill.

### Nudge

- Grant two nudges. The player may use both on the same reel or one on each of two reels.
- Each tap advances that reel's centre stop from index i to (i + 1) mod 20. Animate the next symbol from below moving onto the payline.
- Evaluate after each nudge. At the first nonzero payout, settle immediately and expire remaining nudges. This includes a partial cherry return.
- If two nudges produce no payout, return to idle.
- SPIN forfeits remaining nudges and starts a new ordinary paid spin. Its newly committed result is eligible for features under the ordinary-spin rules.
- Skip feature forfeits nudges without spending credits.
- Show “2 nudges left” / “1 nudge left” and disable input during each short nudge animation.

## 6. Seagull Steal bonus

**Trigger:** Three gulls on the centre line, including a result reached by holding or nudging. Pay the 35× line return, then replace the reel area with a small seaside picnic scene. This is a separate bonus; the surrounding cabinet and balance remain visible.

Five face-down chip cartons contain four chip prizes and one hungry gull. Randomly shuffle this exact deck on entry:

```text
[1× stake, 2× stake, 3× stake, 5× stake, GULL]
```

- The first pick is required; there is no collect action at zero accumulated bonus.
- Picking chips adds their value to a visible unbanked bonus pot.
- After a chip pick, choose another carton or press COLLECT to bank the pot and exit.
- Picking the gull loses only the unbanked bonus pot and ends the bonus. The original 35× line win remains paid.
- Revealing all four chip prizes automatically banks 11× stake and ends the bonus.
- Each carton is selectable once. Concealed artwork and accessibility labels must not leak its content.
- Reveal the remaining carton contents at the end, then restore the reel area after a brief result acknowledgement.
- No timers, reaction tests, purchases, or extra lives.
- Use the stake from the triggering spin, never a current UI setting.

Copy explains the risk before the second pick: “Collect your chips, or risk the pot for another pick.” Picking the gull gives a quick comic squawk and “The gull nicked the bonus chips!” without a punitive animation.

The largest line return is 100×. For fresh v3 bonuses, High Tide can add 20× the triggering stake, for a maximum combined round return of 120×. A gull round can return 46× from the line and gull bonus, plus up to 20× from a queued High Tide bonus, for a maximum 66×. An unfinished migrated wheel pot is preserved as the new starting base and may exceed the normal fresh base.

## 6A. Numbered reels and the SHAKEDOWN sign (v2)

This section supersedes v1 assumptions about the header, save schema and full-game return.

- Every reel stop has either no number, 1, 2 or 3, shown as a small brass badge attached to the artwork. Blank means zero and has no badge. Each reel contains eight blanks, five 1s, four 2s and three 3s. Exact stop assignments live in `NUMBER_STRIPS` in `src/game/config.js`.
- The header's large SHAKEDOWN word has nine individual letter lamps. After a paid spin, light them from left to right at approximately 85 ms per new letter, using the centre-line number total. Show the count out of nine and a number-sum caption. Reduced motion updates the lamps immediately.
- At spin start, clear the previous lights unless SHAKEDOWN HELD was awarded. A held sign carries its previous count into the new spin. After a nonzero, incomplete result, a separate 25% random chance awards SHAKEDOWN HELD for the next paid spin. Repeated holds can extend a run. This is independent of the ordinary reel HOLD feature.
- Conventional held reels retain their stop numbers, which count again on the next paid spin. Nudges replace this spin's total: count = min(9, carried letters + current centre-line total). Never add the same reel total again on each nudge. A nudge can complete the sign. It does not draw a new Shakedown hold chance.
- Changing stake or refilling clears held letters. Skipping a conventional hold/nudge does not clear them. Insufficient funds do not consume the held sign.
- At nine letters, cap the display, cancel remaining conventional holds/nudges, and trigger one High Tide bonus. If Seagull Steal also triggers, play it first, retain a persisted Shakedown queue flag, then enter High Tide. Do not discard either reward.

### High Tide

The starting winnings are **2× the triggering stake**. Show two illuminated multiplier panels: initially ×1 and ×2. Alternate the active panel using one animation-frame loop. Pressing GAMBLE on the higher panel advances to ×2 / ×3, then ×3 / ×4 and so on. Pressing on the lower panel loses the entire unbanked bonus. COLLECT pays the lower multiplier times the starting winnings, regardless of which panel is lit. Nine higher hits reach **×10**, automatically banking ten times the base. Existing wallet credits and credited line wins remain safe.

This is a timing game. There is no hidden random outcome and no 50/50 claim about a deliberate player's success. Start at 620 ms per panel and shorten each subsequent level by 30 ms, reaching 380 ms at ×9 / ×10. The displayed side is the exact snapshot consumed by pointer-down, Enter/Space key-down, or accessible click activation. Never recompute a hidden side at input time. Delayed frames switch once rather than running invisible cycles. Pause the selector while rules are open or the page is hidden, preserving its current side. Sound/preferences must not reset a live stage.

Commit the captured side and monetary change before the 650 ms stopped-panel reveal (180 ms with reduced motion). Lock inputs through the reveal; the reducer also rejects stale stage snapshots. Reload resumes the committed pot/result without retrying a miss or paying twice. Normal layout keeps both options, the collect amount, gamble control and ten-step ladder visible on one screen. The lowest multiplier and the base winnings are explicit.

At ×10, show a large gold **10× / MEGA SHAKEDOWN** panel, rotating gold rays, a glowing cabinet edge, all ladder lamps lit, a 64-piece gold/pink star-confetti burst and an extended fanfare. Keep the banked amount and CONTINUE visible; never require an additional collect. The result persists through reload until acknowledged. Reduced motion uses a static golden win panel, no rays, scaling or confetti. Its functional timer uses steady panel surfaces with alternating NOW markers, keeping the game playable without large flashing surfaces.

### State and compatibility

Schema v4 retains the storage key and two-integer-units-per-credit scale. The bonus stores base, lower (1–10), pot, selected (low/high/null), ended and result. Its pot equals base × lower except after a loss. ×10 is automatically settled once. Cosmetic timer phase stays outside the economic save; reloading cannot change a captured result.

Load v1 through the existing Shakedown migration; round v2 balances/last returns upward to whole credits; then migrate v3 wheel bonuses. An unfinished wheel pot becomes the new ×1 base without changing the wallet. Previously collected/completed wheel bonuses remain settled acknowledgements, and losses remain losses. Preserve held reels, carried letters, queued gull/Shakedown bonuses, stakes and preferences. Current records reject odd wallet units, invalid bonus stages and inconsistent pots.

## 7. Game mathematics and balancing

**V3 update:** Timing accuracy now determines High Tide returns. MATH.md documents current simulations and explicitly separates hypothetical blind taps from perfect timing; neither is measured human behaviour. Whole-credit line returns remain unchanged. Prior wheel and v1 return figures are historical, and the original tuning target is not a constraint on this user-requested timing game. Fictional credits remain freely refillable.

The strips, payouts, and feature rates above are the initial implementation specification, not an advertised return-to-player claim.

With whole-credit rounding, independent ordinary line returns are 67.1125%, 59.1125% and 60.7125% at stakes 1, 2 and 5 respectively, before holds, nudges and bonuses. These are verified over all 20³ stop combinations at each stake. The base nonzero-return frequency remains 21.775%. Three gulls and three sevens each occur on 0.1% of independent ordinary spins. MATH.md contains the regenerated full-game simulations; prior release figures are historical.

Holds, nudges, and bonus choices change the total return and session length. Do not quote the base figure as the full-game return. Before release:

1. Enumerate base outcomes and verify the numbers against the actual strips and evaluator.
2. Model optimal bonus collect/pick choices and calculate their expected additional return.
3. Evaluate hold selections and nudge choices, including early settlement and feature eligibility.
4. Run reproducible seeded sessions for no-feature play, a simple casual strategy, and an optimal or exhaustively evaluated feature strategy. Report credits returned divided by credits staked, with sample size and uncertainty for simulations.
5. Inspect session length, feature frequency, bonus frequency, and refill frequency at stake 1 with 100 starting credits.

Desired experience: several minutes of play between refills for casual play, frequent small interactions, an occasional memorable bonus, and no tedious forced waiting. Aim for approximately 90–96% total return under strong feature play; this is a tuning target requiring evidence, not a promise or a reason to manipulate individual outcomes. Check that optimal play does not create an unbounded credit-generating loop.

If the initial math misses the desired experience, tune published payouts or the single feature-offer table, rerun the analysis, and update this document and in-game rules together. Never silently change odds during a session. Record the final measured results in `MATH.md` before release.

## 8. Visual art direction

### Palette

| Role | Colour |
| --- | --- |
| Black cabinet and arcade backdrop | `#15151C` |
| Cobalt / purple printed glass | `#243899` / `#502B82` |
| Cyan message display | `#5DFBFF` |
| Cream reel strips | `#FFFDE9` |
| Red LED segments / primary control | `#FF2744` / `#DF1B39` |
| Gold lamps / lettering | `#FFCD32` / `#FFE350` |

Bright printed artwork surrounds high-contrast functional areas. Credit displays use red seven-segment glyphs on dark glass; the message display uses cyan on black; the reel strip stays cream. Unlit and lit SHAKEDOWN letters differ in brightness, fill and outline. Disabled controls are visibly dimmed.

### Cabinet and symbols

- Black cabinet with metal edge rails, inset illustrated glass, gold reel bezels and bulb borders; use the supplied Fun Fair photo as material and composition inspiration without copying branding or characters.
- Original seaside backglass mural: gull, chips, pier, fairground wheel, beach huts, stars and magenta/gold scrollwork. Display real three-of-a-kind payouts in lamp decals sourced from `PAYOUTS`, with no invented features or prizes.
- Large condensed, outlined SEASIDE lettering and nine separate SHAKEDOWN lamp inserts. Use system Impact/Arial Black with fallbacks; render LED numerals using local SVG polygons while preserving accessible numeric text.
- Seven original SVG symbols: glossy paired cherries, lemon with leaf, soft-serve cone, chip carton, expressive gull head, brass bell, and red lucky seven.
- Shared dark purple outline, glossy radial shading, consistent apparent size, and strong silhouettes at approximately 56 pixels.
- Use local SVG assets rather than emoji so the art remains consistent across devices.
- The chip cartons in the bonus reuse the same illustration family.
- Controls have square chrome/clear-plastic bezels and coloured illuminated inserts. Bonuses use the same purple backglass, gold lamps and red LED pot readout. Both choices and the odds remain visible.
- Flexible backglass height yields space to the functional reel deck. Target sizes remain 320×568 through 430×932 portrait, 667×375 and 844×390 landscape, and desktop. The landscape cabinet places backglass/controls beside reels. Main play remains within one screen.
- Asset prompt and generation provenance are preserved in `ART.md`. The optimized 1200×800 WebP is self-hosted. Game engine, number strips, odds, saved balances and feature rules are unchanged by this visual release.

### Motion

- Reel stop timings approximately 650 ms, 850 ms, and 1,050 ms after a spin begins; total ordinary round around 1.3 seconds including settlement.
- Held reels remain still; spinning reels retain their normal left-to-right stopping order.
- Nudge movement approximately 180 ms.
- Small win: a short outline glow and number count-up.
- At least 15× return: stronger warm light sweep and a short celebratory jingle.
- 100× jackpot: cabinet lights, a restrained burst of seaside confetti, and a clear result message; controls recover within 2.5 seconds.
- SHAKEDOWN HELD flashes its gold border and label on a 1.1-second cycle. Reel bulbs chase on a 1.4-second cycle; payout lamps alternate on a 3.2-second cycle; available reel feature buttons and spin/gamble buttons pulse. The current bonus ladder lamp glows on a 1.4-second cycle. Keep effects local to lamp surfaces, never flash the whole screen, and leave letter counts and labels readable throughout. Stop animations while the page is hidden.
- Both reduced-motion preferences disable cosmetic cabinet animations. High Tide keeps steady surfaces while its essential NOW marker alternates. Cosmetic effects do not draw random values or change game state.
- Reduced motion replaces scrolling reels with a short dissolve and removes shake/confetti/count-up; it preserves all game information and timing correctness.

## 9. Audio and feedback

Use Web Audio synthesis for a short button click, soft spinning rattle, reel-stop clunk, nudge tick, win chime, jackpot flourish, and gull squawk. No background music in the first release.

Initialize or resume audio only after a user gesture. Default to sound enabled when supported, with a clearly labelled mute toggle and persisted preference. A failed audio initialization must not affect gameplay. Never use sound as the sole indication of an outcome.

Optional light vibration may accompany reel stops when supported; omit it in reduced-motion mode. Do not make vibration a release dependency.

## 10. Technical structure

Use vanilla JavaScript ES modules, semantic HTML, and CSS, with Vite for development and a static production build. Avoid a UI framework and backend for this game.

Planned structure:

```text
index.html
package.json
pnpm-lock.yaml
src/
  main.js              # bootstrap and UI wiring
  game/config.js       # symbols, strips, paytable, feature thresholds
  game/engine.js       # pure state transitions and legal actions
  game/evaluate.js     # line payouts and feature eligibility
  game/random.js       # production and injectable random sources
  game/save.js         # versioned persistence and recovery
  # DOM updates, accessible status and animation live in main.js
  ui/audio.js          # gesture-gated synthesized effects
  styles.css
public/
  art/                 # local SVG symbols and decorations
tests/
  game.test.js
  browser/             # focused interaction and viewport checks
scripts/
  analyze-math.js
DESIGN.md
MATH.md
README.md
```

State contains a schema version, phase, wallet units, selected stake, committed round stake, reel indices, held flags, remaining nudges, feature eligibility, last round return, active bonus deck/reveals/pot, and preferences. Keep cosmetic animation state separate from economic state.

### State transitions

```text
IDLE → SPINNING → SETTLING
SETTLING → IDLE | HOLD_OFFER | NUDGE_OFFER | BONUS
HOLD_OFFER → SPINNING | IDLE
NUDGE_OFFER → NUDGING | SPINNING | IDLE
NUDGING → NUDGE_OFFER | IDLE | BONUS
BONUS → BONUS | IDLE
```

The reducer validates all actions. The DOM cannot directly edit credits, choose outcomes, or bypass a phase guard. Rules overlays are presentation state and do not alter round state. Only one round may be active at a time. Ignore rapid duplicate input rather than queueing extra spins.

### Settlement and reload safety

- Commit the stake deduction, stop indices, computed line result, and post-round state together before animation; maintain a unique monotonically increasing local round ID.
- Prefer calculating the settled economic snapshot in advance and rendering it after the spin, with a presentation lock. Never rely on a delayed callback to award credits.
- Persist the complete economic snapshot atomically as one versioned JSON record. On reload, show its settled state and pending feature or bonus without replaying a debit or payout.
- For each bonus pick, persist the revealed carton and changed pot/balance before presenting its reveal.
- Persist held selections and nudge progress. Resolving the same round or revealed carton twice must be harmless.
- Validate loaded values, symbol indices, phases, and deck contents. On malformed or unsupported saves, reset to a documented clean 100-credit state and display a brief explanation.
- If storage is unavailable, keep playing in memory and show a one-time “Progress won’t be saved on this device” message.
- Refreshing mid-spin must never provide a free reroll or duplicate payout.
- Local saves are convenience data, not tamper-proof accounting. Do not add authentication or anti-cheat infrastructure.
- For multiple tabs, Web Locks allow only the owning tab to accept game actions; other tabs display a clear inactive state. Closing the owner transfers ownership and reloads the latest snapshot. When Web Locks are unavailable, show a single-tab notice and refresh the latest snapshot before each action. This fallback cannot make multi-tab writes atomic; it is a documented compatibility limitation.

## 11. Accessibility and browser behaviour

- Real buttons with visible focus; meaningful accessible names and pressed states.
- Tab order follows the visual order. Space/Enter activates the focused button; a global Space shortcut may spin only when focus is outside another control and no overlay is open.
- Announce the settled symbols, payout/partial return, new balance, and feature availability through a polite live region, once per result.
- Holds and wins use text/shape cues as well as colour.
- Rules overlay traps focus, closes with Escape, and restores focus to the opener.
- Respect `prefers-reduced-motion` and expose an in-game reduced-motion preference.
- No hover-only controls. Prevent double-tap accidents through action guards, not by globally disabling browser zoom.
- Preserve state on backgrounding; resuming completes presentation of the committed result without a fresh draw.
- Test current mobile Safari and Chrome where available. If only emulated browser coverage is available, state that limitation in the release notes rather than claiming physical-device verification.

## 12. Validation and acceptance criteria

### Logic and recovery

- Every paytable entry and cherry precedence produces the specified integer payout at all three stakes.
- Base enumeration matches the documented probabilities and expected return.
- Stop selection is uniform and handles random-integer rejection correctly.
- Wallet cannot go negative and one action cannot spend or pay twice.
- Holds preserve exact indices; selecting a third held reel is rejected.
- Nudge wraparound, two-nudge limit, first-return settlement, skipping, and subsequent spin behaviour are correct.
- Held/nudged losses cannot create feature chains.
- Bonus deck has exactly one gull, no duplicate picks, correct collect/loss semantics, and automatic final-chip collection.
- The gull bonus triggers from ordinary, held, and nudged three-gull results.
- Reload at spin commit, nudge, feature offer, bonus pick, and payout preserves the correct credits and pending actions.
- Corrupt saves, blocked storage, muted audio, unsupported audio, and repeated input do not break play.
- Multiple-tab behaviour cannot overwrite a newer round with an older balance under the supported ownership mechanism.

### Browser and visual acceptance

- Play at least 30 ordinary rounds plus deliberately exercised holds, nudges, gull bonus, jackpot, low-balance state, and refill using a test-only deterministic random source.
- Test helpers cannot be enabled by query parameters in the deployed production game.
- At every target viewport, all essential controls are visible and normal play has no page overflow or clipped status text.
- Rules, keyboard navigation, focus restoration, mute, and reduced motion work.
- Inspect screenshots of ordinary play, holds, nudges, bonus, and jackpot at the smallest portrait size and the primary target size.
- Verify safe areas, resizing/orientation change, background/resume, and refresh during a round.
- No uncaught browser errors, broken assets, or network requests required after initial assets load for normal gameplay.
- Production assets are local; target initial compressed transfer below 500 KB, excluding browser overhead. Measure it before reporting compliance.

### Publication acceptance

- Production build completes and serves correctly from static hosting.
- Final source and documentation are committed and pushed to the intended GitHub repository; record the repository URL and commit.
- Cloudflare Pages serves the build over HTTPS; record the project and production URL.
- Verify the deployed URL itself, including a paid spin, rules, artwork, and reload persistence. A local preview alone does not satisfy deployment verification.
- README explains installation, development, tests, math analysis, build, and deployment, with the live link.
- All required first-release features are present; known limitations are recorded explicitly.

## 13. Build and release sequence

1. Scaffold the JavaScript project and implement the pure game engine with deterministic tests.
2. Analyze the initial math, tune transparently if needed, and write `MATH.md`.
3. Build the responsive cabinet and original symbol art.
4. Connect ordinary spins, holds, nudges, bonus, and reload-safe persistence.
5. Add sound, motion, accessibility, and short-screen polish.
6. Run logic checks and browser verification; fix the smallest mobile layout first.
7. Create/use the intended GitHub repository, commit the complete project, and push.
8. Deploy the production build to Cloudflare Pages using the available authenticated workflow.
9. Verify the actual hosted game, then deliver both GitHub and play links.

At implementation time, inspect the available GitHub and Cloudflare account/project context before choosing repository ownership or deployment identifiers. Do not invent credentials or treat an unverified deployment as complete. Expected Pages build command: `npm run build`; output directory: `dist`. Confirm current tool requirements when deploying.

## 14. Decision record and maintenance

| Decision | Status |
| --- | --- |
| Seaside Shakedown theme | Selected by user, 26 September 2026 |
| JavaScript, GitHub, Cloudflare Pages, single-screen mobile play | User requirements |
| Three reels, one payline, holds, nudges, gull bonus | Defined by this design for the first release |
| Initial strips and payouts; tuned 8%/8% loss-feature offers | Implemented; exact optimal return 92.72%; see MATH.md |
| Original SVG art and synthesized sound | Default production approach |
| No real money, accounts, or backend | First-release scope |

This file is the implementation reference. Read it before building or resuming work. When a rule, payout, feature, screen layout, or scope decision changes, update the relevant section alongside the code. Keep the implemented rules, in-game help, tests, and math report consistent. Mark actual implementation and deployment progress in the README rather than implying that this design document proves completion.
