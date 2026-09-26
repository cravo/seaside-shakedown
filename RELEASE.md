# First release verification — 26 September 2026

- Public game: https://seaside-shakedown.pages.dev
- GitHub: https://github.com/cravo/seaside-shakedown
- Hosting: Cloudflare Pages, `seaside-shakedown`, production branch `main`, direct upload.

The deployed game passed both browser suites against its HTTPS production URL: eight viewport layouts, 30 paid spins, holds, nudges, bonus collect and loss, jackpot, free refill, mute and reduced motion, rule-dialog focus, saved feature selections, duplicate input, refresh during animation, corrupt saves, unavailable storage/audio, and Web Locks ownership transfer. No uncaught browser errors were recorded. The final layout check also verifies every visible cabinet button stays within the viewport.

Verified viewports: 320×568, 360×640, 375×667, 390×844, 430×932, 667×375, 844×390 and 1280×900. Screenshots of normal play and each feature were visually inspected. Small-screen bonus spacing and the long Continue label were corrected during this review.

Ten automated engine tests pass, including exhaustive evaluation of 8,000 base outcomes and 10,000 randomized state transitions. The math script enumerates optimal feature choices and simulates six million paid spins. Tuning reduced the original hold/nudge offer rates from 20% each to 8% each; exact optimal return is 92.7197%. The paytable and reel strips remain as originally specified.

The production build is approximately 39 KB uncompressed and 16 KB when its individual assets are gzipped, far below the 500 KB design budget. These are measured build sizes; the CDN's actual transfer size depends on compression and cache state.

Limitations: browser testing uses current desktop Microsoft Edge with mobile viewport emulation, not physical iOS/Android hardware. Browsers without Web Locks show a single-tab notice; their fallback does not guarantee atomic simultaneous updates across tabs. Credits are fictional, local saves are editable, and refills are unlimited. There is no service worker or offline reload guarantee. GitHub pushes require a separate Pages deployment.
