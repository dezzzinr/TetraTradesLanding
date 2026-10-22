# TetraTrades — Landing Page (plain HTML + CSS, black & white)

A monochrome, editorial-style marketing site for the **TetraTrades** trading platform.
No framework, no build step: one HTML file, one stylesheet, one small vanilla JS file,
a favicon and a self-hosted font. Upload the folder to any web server and it works.

Every call-to-action links to the live app: **https://tetra-trades.vercel.app/**

```
tetratrades-landing-html/
├── index.html        all markup, inline SVG icon sprite, SEO meta
├── styles.css        monochrome design system (white/black + black/white themes)
├── script.js         optional enhancements (theme toggle, tabs, live prices…)
├── favicon.svg       black tile + white tetrahedron mark
└── fonts/
    └── inter-latin.woff2   self-hosted Inter variable font (latin, 100–900)
```

## Deploy

Copy the folder contents to any static host — Nginx, Apache, Netlify, Cloudflare Pages,
S3, cPanel. Nothing to install, compile or server-render.

```bash
sudo cp -r tetratrades-landing-html/* /var/www/tetratrades/
```

To repoint the CTAs (all 29 of them are plain `href`s):

```bash
sed -i 's|https://tetra-trades.vercel.app/|https://your-app.example.com/|g' index.html
```

## The black & white system

Two themes, both strictly monochrome, switched with the nav toggle and remembered in
`localStorage` (`tetratrades_theme`); without JavaScript the OS preference applies.

| Token | Light | Dark |
| --- | --- | --- |
| Background | `#ffffff` | `#000000` |
| Surface / soft | `#ffffff` / `#f5f5f5` | `#0d0d0d` / `#161616` |
| Ink (text, primary buttons) | `#0a0a0a` | `#f5f5f5` |
| Muted / faint | `#5c5c5c` / `#8a8a8a` | `#a3a3a3` / `#7a7a7a` |
| Lines | `#e6e6e6` / `#cfcfcf` | `#262626` / `#3a3a3a` |

Primary buttons, the active tab, the brand tile and the CTA band are solid ink with
knocked-out text, and invert automatically with the theme (`color: var(--bg)` on
`background: var(--blue)`), so a single token pair drives the whole accent system.
Coin badges, avatars, window chrome, sparkline-adjacent chips and the headline gradient
are all grayscale too.

**One deliberate exception:** market direction keeps green/red (`--green`, `--red`) for
24h changes, P&L figures and sparklines, because colour is the fastest way to read
gain vs loss. To make the page 100% grayscale, set both tokens to `var(--ink)` in the
`:root` and `[data-theme="dark"]` blocks — nothing else references them.

## What JavaScript does — and what happens without it

`script.js` is loaded with `defer` and is purely additive. With JavaScript disabled the
page is still complete and usable:

| Feature | With JS | Without JS |
| --- | --- | --- |
| Theme | toggle + saved choice | follows OS light/dark preference (CSS media query) |
| Product tabs | switch panels | all four panels render stacked, nothing hidden |
| Live prices | whole page revalues from CoinGecko, 60s refresh, cache + sample fallback | baked-in quotes and figures in the HTML |
| Mobile menu | opens/closes, Escape, scroll lock | opens/closes (hidden checkbox + CSS) |
| Scroll reveals | fade-up on scroll | content simply visible |
| Stat counters | count up on scroll | final values shown |

## Editing content

| What | Where |
| --- | --- |
| Headline, verbs, proof stats, hero mock | `index.html`, hero section |
| Coin cards, live hooks, global strip | `index.html` `#coin-rail` + `.global-strip` + `data-*` hooks; live fetch + samples in `script.js` (`COINS`, `SAMPLE`) |
| Stats band | `index.html`, `data-count` attributes drive the animation |
| Platform tabs & mock panels | `index.html`, the four `.showcase-panel` blocks |
| Steps, features, plans, CTA, footer | `index.html`, matching sections |
| Colours, radii, shadows, spacing | token block at the top of `styles.css` |
| Icons | `<symbol>` sprite at the top of `<body>`; use as `<svg class="ic" width="16" height="16"><use href="#i-name"/></svg>` |
| Brand mark | `#i-tetra` symbol + `favicon.svg` |

## Notes

- **Zero third-party requests.** Icons are one inline SVG sprite (lucide path data plus
  hand-drawn X/Telegram/Discord/YouTube glyphs and the tetrahedron brand mark), and Inter
  is self-hosted as a variable font — fast, offline-capable and privacy-clean.
- **Live data everywhere.** CoinGecko's keyless public API is fetched in the browser
  (`/simple/price` for quotes, `/global` for market stats) and revalues the whole page,
  not just the ticker:
  - ticker coin cards — price + 24h change (`data-live-price` / `data-live-change`),
  - hero BTC badge and the trade-panel header quote,
  - hero portfolio mock — each holding row is `qty × live price`
    (`data-holding-value` with `data-qty` / `data-cost`), the total adds the cash balance
    (`data-portfolio-total` + `data-cash`), "today" is the holdings-weighted 24h move
    (`data-portfolio-today`) and open P&L is measured against the fixed cost basis
    (`data-portfolio-pnl`),
  - the trade panel's position P&L and ROE against a fixed entry
    (`data-position-pnl` / `data-position-roe` with `data-entry` / `data-qty` / `data-margin`),
  - the global stats strip above the ticker — total market cap, 24h volume, BTC
    dominance and live asset count (`data-global="mcap|vol|btc|count"`).
  Quotes refresh every 60s and on tab focus. Successful responses are cached in
  `sessionStorage` for 15 minutes, so a rate-limited or offline reload still shows the
  session's last live numbers; only with no cache at all does the page fall back to the
  clearly-labelled sample figures (`Sample prices — live feed unavailable`). Every value
  is also baked into the HTML, so the page is correct with JavaScript disabled or the
  API unreachable. Change a cost basis or cash balance by editing the `data-*`
  attributes in `index.html` — no script changes needed.
- **Accessibility:** semantic landmarks, tablist/tabpanel roles on both tab groups,
  labelled icon buttons, visible focus rings, and full `prefers-reduced-motion` support.

## Local preview

```bash
python3 -m http.server 8080 --directory tetratrades-landing-html
# then open http://localhost:8080
```
