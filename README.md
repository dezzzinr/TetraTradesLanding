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
| Live prices | CoinGecko quotes, 60s refresh, sample fallback | baked-in sample quotes in the HTML |
| Mobile menu | opens/closes, Escape, scroll lock | opens/closes (hidden checkbox + CSS) |
| Scroll reveals | fade-up on scroll | content simply visible |
| Stat counters | count up on scroll | final values shown |

## Editing content

| What | Where |
| --- | --- |
| Headline, verbs, proof stats, hero mock | `index.html`, hero section |
| Coin cards (sample prices/sparklines) | `index.html` `#coin-rail`; live data + samples in `script.js` (`COINS`, `SAMPLE`) |
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
- **Live prices** come from CoinGecko's keyless public API in the browser. If it is
  unreachable the ticker keeps clearly-labelled sample figures and the status pill says
  `Sample prices — live feed unavailable`.
- **Accessibility:** semantic landmarks, tablist/tabpanel roles on both tab groups,
  labelled icon buttons, visible focus rings, and full `prefers-reduced-motion` support.

## Local preview

```bash
python3 -m http.server 8080 --directory tetratrades-landing-html
# then open http://localhost:8080
```
