# Seaside Shakedown

A little luck by the sea. A mobile fruit machine with numbered reels, an illuminated SHAKEDOWN sign, holds, nudges, and two seaside bonuses.

**Play:** https://seaside-shakedown.pages.dev  
**Source:** https://github.com/cravo/seaside-shakedown

Fictional credits only. Start with 100, choose a stake of 1, 2 or 5, and spin. Only the centre line pays. Below 1 credit, refill to 100 for free. The question-mark button contains the paytable and all rules. There are no purchases, accounts, or cash prizes.

**New in v2:** symbols carry no number, 1, 2 or 3. Their total lights the nine SHAKEDOWN letters. Each spin resets them unless you earn SHAKEDOWN HELD, which carries the lit letters into the next spin. Fill the sign for **Double or Drench**: collect a 2× stake pot, or take 50/50 double-or-nothing spins up to 32×. A washout loses only that bonus pot. Existing balances and gull bonuses migrate automatically.

## Development

Requires Node.js 22+ and pnpm 11+. Install with `pnpm install`, then:

```sh
pnpm dev           # local Vite server
pnpm test          # engine, random selection, save and recovery tests
pnpm math          # number distribution and 600,000 production-engine spins
pnpm test:browser  # starts headless installed Microsoft Edge; dev server must be running
pnpm build        # dist/ production assets
pnpm preview      # inspect the production build locally
```

The browser script uses Edge via Playwright. Change its `channel` or install a Playwright browser if Edge is unavailable. Set `TEST_URL` to run against a preview or deployed site. Screenshots and reports go into ignored `artifacts/`.

## Implementation

Vanilla JavaScript ES modules, CSS and semantic HTML; Vite bundles the static site. `src/game/engine.js` is a pure transition function. Payout data is shared with the rules. Outcomes use unbiased browser cryptographic randomness, independent of cosmetic effects. Credits use integer half-credit units.

Round outcomes and payouts are committed to one localStorage snapshot before animation. Reloading shows the settled result and preserves pending holds, nudges, and bonus picks. Browser Web Locks allow one active game tab; a queued tab takes over when the owner closes. On browsers without Web Locks, use one tab at a time; the fallback refreshes saved state before each action but cannot guarantee atomic multi-tab updates. Blocked storage falls back to memory with a visible notice.

Read [DESIGN.md](DESIGN.md) before making changes. [MATH.md](MATH.md) records the current rules and reproducible simulation results. The old 92.72% figure applies only to v1, before numbered reels; it is preserved in [MATH-V1.md](MATH-V1.md). No optimal-return claim is made for v2 and no return percentage is advertised in the game.

[RELEASE.md](RELEASE.md) records live-site verification and the remaining device-coverage limitations.

## Verification

- Logic tests cover every paytable outcome at all stakes, all 8,000 base results, feature thresholds, held indices, nudge wraparound, both bonuses, invalid saves, unbiased random sampling, and 10,000 randomized state transitions. Shakedown checks cover reset/carry/chaining, exact number totals, the eight wheel outcomes, the 32× cap, queued bonuses and v1 save migration.
- Three browser suites cover eight sizes from 320×568 portrait to desktop, 30 paid spins, animated letter fill, wheel outcomes, rules/focus, feature persistence, nudges, bonuses, refill, mute, duplicate clicks, reload during animations and tab ownership.
- Screenshots are visually inspected at small and standard mobile sizes. Tests emulate mobile viewport dimensions in desktop Edge; physical iOS/Android device verification remains a manual follow-up.
- Artwork, sound, scripts and styles require no third-party runtime services. There is no service worker: initial loading and reloading still require a connection.

## Cloudflare Pages

The project is `seaside-shakedown`, production branch `main`, output directory `dist`. With an authenticated Wrangler installation:

```sh
pnpm build
pnpm deploy
```

The initial deployment uses the connected Cloudflare API and a short-lived project upload token. `scripts/upload-pages.js` uploads assets using a token supplied only through stdin; the deployment manifest then goes to the Pages deployments API. No credentials belong in this repository. Direct upload is configured; GitHub pushes do not automatically redeploy. Run the build and deploy commands when publishing a change.

`scripts/publish-github.ps1` is a one-time repository setup helper that reads an existing Git credential only in memory. Routine source publication uses `git push`.

## Art and sound

The seven symbols in `public/art/` are original local SVG drawings. Cabinet, scenery and lighting are CSS. All sounds are synthesized with Web Audio after user interaction. No external fonts, copyrighted recordings, or image dependencies are required.
