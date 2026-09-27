# Seaside Shakedown v3 — High Tide

Timing adjustment: the first pair now switches every 225 ms, decreasing by 12.5 ms at each level to 125 ms per option at ×9 / ×10. A boundary test checks both sides at every stage. Payouts, save format and the displayed-side input snapshot are unchanged.

The wheel has been replaced by two alternating multiplier panels. Start at ×1 / ×2; pressing GAMBLE on the visibly lit higher panel advances one multiplier, while pressing on the lower panel loses the unbanked bonus. Collect always pays the lower multiplier times the starting winnings (2× the triggering stake). Nine successful presses reach ×10 and automatically pay ten times that starting amount.

This is a timing game. A single frame loop paints the active panel, and pointer-down, keyboard and accessible activation capture that displayed side. There is no random outcome behind the timing display. Rules/hidden tabs pause the selector. Duplicate/stale input is rejected; results and payouts are saved before their reveal. Schema v4 preserves unfinished old wheel pots as the new ×1 base and never re-pays completed bonuses.

The maximum award gets a persistent gold 10× panel, illuminated ladder, gold cabinet glow, rotating rays, star confetti and an extended fanfare. Reduced motion uses steady multiplier panels with an alternating NOW marker, and a static maximum-win display.

Validation includes 32 logic tests, all nine collect/loss levels, exact ×10 settlement, no random draws in gambles, old-save migration and the shared display/input clock. Four browser suites cover eight layouts, timed pointer/keyboard/accessible input, duplicate presses, reload during reveal, rules pause, collect while the higher panel is lit, all bonus outcomes and the animated maximum win. Production verification runs the same suites against the published site. MATH.md now models timing accuracy explicitly rather than advertising wheel odds. Device checks use desktop Edge with mobile viewport emulation.

## V2.2 whole credits and flashing lamps

Single-cherry awards now round up to whole credits before settlement: stakes 1, 2 and 5 return 1, 1 and 3 credits. Save schema v3 rounds existing fractional balances and last returns upward while preserving progress, preferences and active features. A stake-1 return is labelled as a refund. Other payouts, reel strips and feature probabilities are unchanged. The rules, design and current mathematics report have been updated.

SHAKEDOWN HELD now flashes its border and label. Added chasing reel bulbs, alternating prize lamps, pulsing available feature buttons, spin/gamble illumination and a pulsing current bonus ladder lamp. Effects are confined to individual lamps, with a slow held flash and slower ambient pulses. Both reduced-motion preferences keep all lamps steady.

Validation includes 28 logic tests, exhaustive whole-credit line awards at all three stakes, 10,000 randomized actions, 600,000 simulated paid spins, and four browser suites. New checks cover upward save migration without repeat rounding, preserved held progress, actual held-border frame changes, ambient lamps and both reduced-motion settings. Browser suites are also run against the published site before delivery. Tests use desktop Edge with emulated mobile viewports.

## V2.1 visual release

Complete visual overhaul inspired by the user's photograph of a real British fruit machine. Original illustrated backglass, live payout lamp decals, large SHAKEDOWN letter inserts, glossy SVG reel symbols, cylindrical reel lighting, metal cabinet rails, red seven-segment meters, a cyan message display and illuminated moulded controls replace the original teal-and-cream presentation. Both bonus panels use the same cabinet materials and lighting.

Approved gameplay, random draws, payout tables, feature rules and save schema are unchanged. Numeric meter text remains available to accessibility tools. DESIGN.md records the new art direction; ART.md preserves the built-in ImageGen prompt and the local asset provenance.

Validation: 24 engine tests pass. All three browser suites pass locally, covering eight viewport layouts, 30 paid spins, holds/nudges, both bonuses, sign progression, gamble outcomes, saved state, duplicate inputs, reduced motion and error recovery. New visual checks prevent payout decals from clipping or covering the sign, and prevent reel controls from overlapping the message display. Normal, held and bonus screenshots were inspected at phone, landscape and desktop sizes. Production verification uses these same three suites against the public URL after deployment.

The production build is approximately 381 KB uncompressed, or 325 KB when assets are individually gzipped. The 300 KB backglass WebP accounts for most of this; the build remains within the 500 KB initial-transfer design target. Actual CDN transfer varies with compression and caching. Browser testing uses desktop Edge viewport emulation; physical mobile hardware was not tested.

## V2 gameplay release

Numbered reel symbols and an animated nine-letter SHAKEDOWN sign are implemented. The 25% Shakedown hold chance carries progress between spins. Completing the sign opens Double or Drench: a 2× starting pot, independent 50/50 doubles or washouts, and automatic collection at 32×. The existing gull bonus remains and queues the new bonus when both trigger together.

V2 validation covers 24 logic tests, 10,000 randomized transitions, a production build, and 600,000 simulated paid spins. Three browser suites verify ordinary play plus incremental lamp reset/fill/carry, badges, eight bonus layouts, both bonus queues, collection, doubling, washout, the cap, double-click prevention, refresh during a wheel reveal, reduced motion and migration of v1 saves. Screenshots of the held sign and bonus at small/standard portrait and landscape sizes were inspected.

Production verification uses the same scripts with `TEST_URL=https://seaside-shakedown.pages.dev`. The v1 92.72% full-game return is historical; see the updated MATH.md for current measurements and exact 50/50 wheel mathematics. The new simulated casual strategy triggers Shakedown roughly once per 13–14 paid spins on average; this is not a promise about an individual session.

## Original release record

- Public game: https://seaside-shakedown.pages.dev
- GitHub: https://github.com/cravo/seaside-shakedown
- Hosting: Cloudflare Pages, `seaside-shakedown`, production branch `main`, direct upload.

The deployed game passed both browser suites against its HTTPS production URL: eight viewport layouts, 30 paid spins, holds, nudges, bonus collect and loss, jackpot, free refill, mute and reduced motion, rule-dialog focus, saved feature selections, duplicate input, refresh during animation, corrupt saves, unavailable storage/audio, and Web Locks ownership transfer. No uncaught browser errors were recorded. The final layout check also verifies every visible cabinet button stays within the viewport.

Verified viewports: 320×568, 360×640, 375×667, 390×844, 430×932, 667×375, 844×390 and 1280×900. Screenshots of normal play and each feature were visually inspected. Small-screen bonus spacing and the long Continue label were corrected during this review.

Ten automated engine tests pass, including exhaustive evaluation of 8,000 base outcomes and 10,000 randomized state transitions. The math script enumerates optimal feature choices and simulates six million paid spins. Tuning reduced the original hold/nudge offer rates from 20% each to 8% each; exact optimal return is 92.7197%. The paytable and reel strips remain as originally specified.

The production build is approximately 39 KB uncompressed and 16 KB when its individual assets are gzipped, far below the 500 KB design budget. These are measured build sizes; the CDN's actual transfer size depends on compression and cache state.

Limitations: browser testing uses current desktop Microsoft Edge with mobile viewport emulation, not physical iOS/Android hardware. Browsers without Web Locks show a single-tab notice; their fallback does not guarantee atomic simultaneous updates across tabs. Credits are fictional, local saves are editable, and refills are unlimited. There is no service worker or offline reload guarantee. GitHub pushes require a separate Pages deployment.
