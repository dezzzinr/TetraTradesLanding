# TetraTrades landing site

A static HTML, CSS and vanilla JavaScript site. No build step is required.

## Pages

- `index.html` — landing page and market ticker
- `markets.html` — market overview and selectable seven-day price chart
- `about.html` — platform overview
- `help.html` — common questions and support

The account and trading calls to action link to `https://tetra-trades.vercel.app/`.
The new content is a starting point; review all product claims, prices, links and
legal disclosures before publishing.

## Preview and deploy

```sh
python3 -m http.server 8080
```

Visit `http://localhost:8080`. Deploy all files, including the `fonts` folder, to
a static host. The site has not been pushed to GitHub or deployed by this project.

## Smartsupp

In `config.js`, set `smartsuppKey` to the **website chat code/key** from your
Smartsupp dashboard under Settings → Chat box → Installation. The chat widget
then loads on each page, and the footer's Live chat link opens it. Leave the key
empty to keep the widget disabled; the link goes to the support page instead.
The website key is public client-side configuration: **do not put API secrets,
passwords or private credentials in this file**. Check your consent and privacy
requirements before enabling the widget. Smartsupp availability and behavior
depend on your account settings and the visitor's browser.

## Translation

The Translate control loads Google Translate's third-party website widget on
request. Google provides the languages and machine translation; availability,
accuracy, dynamic content, browser restrictions and persistence are controlled
by Google and are not guaranteed. Translation may send page content and visitor
data to Google. Test it and provide appropriate privacy/consent notices for your
jurisdiction. The original English page remains usable if the widget cannot load.

## Market data

The browser requests CoinGecko's public `/coins/markets` and `/global` endpoints.
Coin images and seven-day sparklines come from the market response. The larger
chart uses the same seven-day historical series; the price and change are USD,
not USDT. A refresh occurs every 60 seconds and on tab focus. CoinGecko may rate
limit or deny requests. A session cache is labeled **cached**, and sample values
are labeled **sample** when no live or cached data is available; the large chart
is not drawn from sample data. Global statistics have their own cache and can
be unavailable or stale independently of the ticker. Do not treat these values
as executable quotes. Some portfolio and bot illustrations are examples, not
real user balances or performance history.

## Project files

- `styles.css` — responsive design, light/dark themes and page styles
- `script.js` — market data and landing page interactions
- `site.js` — translation control and optional Smartsupp integration
- `config.js` — public Smartsupp website key
- `favicon.svg`, `fonts/` — local visual assets

External network requests are made to CoinGecko and its image CDN, Google when
translation is used, and Smartsupp when configured. Ad blockers, network
restrictions, rate limits and privacy settings can affect those services.
