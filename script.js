/* TetraTrades landing page — progressive enhancement only.
 *
 * Every feature below degrades gracefully: with JavaScript disabled the page
 * is fully readable (all panels stacked, sample prices shown, OS-preference
 * theme, counters at their final values). This file adds the interactive
 * layer: theme persistence, sticky nav, drawer niceties, tab switching,
 * scroll reveals, animated counters and live CoinGecko prices.
 *
 * No dependencies, no build step. Loaded with `defer`.
 */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var reducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------- theme */
  var THEME_KEY = "tetratrades_theme";

  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  var themeBtn = doc.getElementById("theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try {
        window.localStorage.setItem(THEME_KEY, next);
      } catch (e) { /* private mode / quota — theme still applies this session */ }
      themeBtn.setAttribute(
        "aria-label",
        next === "dark" ? "Switch to light mode" : "Switch to dark mode"
      );
    });
  }

  /* ------------------------------------------------------------ sticky nav */
  var nav = doc.getElementById("nav");
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("is-stuck", window.scrollY > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* --------------------------------------------------------------- drawer */
  var drawerToggle = doc.getElementById("nav-toggle");
  var drawer = doc.getElementById("drawer");

  function setDrawer(open) {
    if (!drawerToggle) return;
    drawerToggle.checked = open;
    doc.body.style.overflow = open ? "hidden" : "";
  }

  if (drawerToggle && drawer) {
    drawerToggle.addEventListener("change", function () {
      doc.body.style.overflow = drawerToggle.checked ? "hidden" : "";
    });
    drawer.addEventListener("click", function (event) {
      if (event.target.closest("a")) setDrawer(false);
    });
    doc.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && drawerToggle.checked) setDrawer(false);
    });
  }

  /* -------------------------------------------------------- showcase tabs */
  var panelButtons = Array.prototype.slice.call(doc.querySelectorAll("[data-panel-btn]"));
  var panels = Array.prototype.slice.call(doc.querySelectorAll("[data-panel]"));

  panelButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var id = button.getAttribute("data-panel-btn");
      panelButtons.forEach(function (other) {
        var on = other === button;
        other.classList.toggle("is-active", on);
        other.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.forEach(function (panel) {
        var on = panel.getAttribute("data-panel") === id;
        panel.classList.toggle("is-active", on);
        // restart the enter animation for the newly visible panel
        if (on) {
          Array.prototype.forEach.call(panel.querySelectorAll(".panel-enter"), function (node) {
            node.style.animation = "none";
            void node.offsetWidth;
            node.style.animation = "";
          });
        }
      });
    });
  });

  /* ------------------------------------------------------- scroll reveals */
  var revealables = Array.prototype.slice.call(doc.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window && !reducedMotion) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealables.forEach(function (node) {
      revealObserver.observe(node);
    });
  } else {
    revealables.forEach(function (node) {
      node.classList.add("is-in");
    });
  }

  /* ------------------------------------------------------ animated counters */
  var counters = Array.prototype.slice.call(doc.querySelectorAll("[data-count]"));

  function formatCount(value, decimals) {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  function animateCounter(node) {
    var target = parseFloat(node.getAttribute("data-count"));
    var decimals = parseInt(node.getAttribute("data-decimals") || "0", 10);
    var prefix = node.getAttribute("data-prefix") || "";
    var suffix = node.getAttribute("data-suffix") || "";

    if (reducedMotion) {
      node.textContent = prefix + formatCount(target, decimals) + suffix;
      return;
    }

    var start = null;
    var duration = 1500;
    function tick(now) {
      if (start === null) start = now;
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = prefix + formatCount(target * eased, decimals) + suffix;
      if (progress < 1) window.requestAnimationFrame(tick);
    }
    window.requestAnimationFrame(tick);
  }

  if ("IntersectionObserver" in window) {
    var counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach(function (node) {
      counterObserver.observe(node);
    });
  }

  /* ---------------------------------------------------- live market ticker */
  var COINS = [
    { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
    { id: "ethereum", symbol: "ETH", name: "Ethereum" },
    { id: "solana", symbol: "SOL", name: "Solana" },
    { id: "ripple", symbol: "XRP", name: "XRP" },
    { id: "cardano", symbol: "ADA", name: "Cardano" },
    { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
    { id: "chainlink", symbol: "LINK", name: "Chainlink" },
    { id: "avalanche-2", symbol: "AVAX", name: "Avalanche" },
    { id: "polkadot", symbol: "DOT", name: "Polkadot" },
    { id: "litecoin", symbol: "LTC", name: "Litecoin" },
  ];

  var rail = doc.getElementById("coin-rail");
  var statusDot = doc.getElementById("ticker-status");
  var statusLabel = doc.getElementById("ticker-status-label");
  var refreshBtn = doc.getElementById("ticker-refresh");
  var sortButtons = Array.prototype.slice.call(doc.querySelectorAll("[data-sort]"));

  var CACHE_MS = 15 * 60 * 1000;

  function cacheSet(key, value) {
    try {
      window.sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), value: value }));
    } catch (e) { /* storage unavailable */ }
  }

  function cacheGet(key) {
    try {
      var raw = window.sessionStorage.getItem(key);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.ts !== "number") return null;
      if (Date.now() - parsed.ts > CACHE_MS) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  var markets = [];
  var state = "loading";
  var updatedAt = null;
  var sortMode = "hot";
  var REFRESH_MS = 60000;

  /* deterministic pseudo-random walk for sample sparklines */
  function makeSpark(seed, base, drift) {
    var points = [];
    var value = base * (1 - drift);
    var s = seed;
    for (var i = 0; i < 24; i += 1) {
      s = (s * 1103515245 + 12345) % 2147483648;
      var noise = (s / 2147483648 - 0.5) * base * 0.012;
      value += base * (drift / 24) + noise;
      points.push(Math.max(value, base * 0.6));
    }
    return points;
  }

  var SAMPLE = [
    { id: "bitcoin", price: 82443.8, change24h: 0.38 },
    { id: "ethereum", price: 2431.4, change24h: 1.18 },
    { id: "solana", price: 105.3, change24h: 0.77 },
    { id: "ripple", price: 2.412, change24h: -0.62 },
    { id: "cardano", price: 0.6841, change24h: 2.14 },
    { id: "dogecoin", price: 0.1523, change24h: -1.87 },
    { id: "chainlink", price: 15.89, change24h: 2.23 },
    { id: "avalanche-2", price: 24.61, change24h: 0.94 },
    { id: "polkadot", price: 3.182, change24h: -0.41 },
    { id: "litecoin", price: 92.47, change24h: 1.06 },
  ].map(function (row, index) {
    var meta = COINS[index];
    return {
      id: row.id,
      symbol: meta.symbol,
      name: meta.name,
      price: row.price,
      change24h: row.change24h,
      spark: makeSpark(index * 13 + 7, row.price, row.change24h / 100),
    };
  });

  function formatPrice(value) {
    var abs = Math.abs(value);
    var digits = abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6;
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  function sparkPath(points) {
    if (!points || points.length < 2) return "";
    var w = 62;
    var h = 22;
    var min = Math.min.apply(null, points);
    var max = Math.max.apply(null, points);
    var span = max - min || 1;
    var step = w / (points.length - 1);
    return points
      .map(function (value, index) {
        var x = index * step;
        var y = h - ((value - min) / span) * (h - 3) - 1.5;
        return (index === 0 ? "M" : "L") + x.toFixed(2) + "," + y.toFixed(2);
      })
      .join(" ");
  }

  function renderRail() {
    if (!rail) return;
    var list = markets.slice();
    if (sortMode === "gainers") list.sort(function (a, b) { return b.change24h - a.change24h; });
    if (sortMode === "losers") list.sort(function (a, b) { return a.change24h - b.change24h; });

    rail.innerHTML = list
      .map(function (market) {
        var up = market.change24h >= 0;
        var spark = market.spark || [];
        var sparkUp = spark.length > 1 ? spark[spark.length - 1] >= spark[0] : up;
        return (
          '<article class="coin-card">' +
          '<div class="coin-top">' +
          '<span class="coin-icon">' + (market.image ? '<img src="' + market.image + '" alt="" loading="lazy" onerror="this.remove()">' : '') + market.symbol.charAt(0) + "</span>" +
          "<span><span class=\"coin-sym\">" + market.symbol + '/USD</span><span class="coin-name">' + market.name + "</span></span>" +
          "</div>" +
          '<div class="coin-price num">' + formatPrice(market.price) + "</div>" +
          '<div class="coin-meta">' +
          '<span class="coin-change num ' + (up ? "up" : "down") + '">' +
          '<svg class="ic" width="12" height="12"><use href="#i-trending-' + (up ? "up" : "down") + '"/></svg> ' +
          (up ? "+" : "") + market.change24h.toFixed(2) + "%</span>" +
          '<svg class="spark" viewBox="0 0 62 22" aria-hidden="true"><path d="' + sparkPath(spark) +
          '" stroke="' + (sparkUp ? "var(--green)" : "var(--red)") + '" fill="none" stroke-width="1.6" stroke-linecap="round"/></svg>' +
          "</div></article>"
        );
      })
      .join("");
  }

  function renderStatus() {
    if (!statusDot || !statusLabel) return;
    statusDot.setAttribute("data-state", state);
    var label =
      state === "live" ? "Live prices" : state === "cached" ? "Cached prices — live feed unavailable" : state === "loading" ? "Fetching live prices" : "Sample prices — live feed unavailable";
    if ((state === "live" || state === "cached") && updatedAt) {
      label += " · " + new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }
    statusLabel.textContent = label;
  }

  function fetchLive() {
    var url =
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=" +
      COINS.length +
      "&page=1&sparkline=true&price_change_percentage=24h&ids=" +
      COINS.map(function (coin) { return coin.id; }).join(",");

    return fetch(url, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("bad status");
        return response.json();
      })
      .then(function (rows) {
        if (!Array.isArray(rows) || rows.length === 0) throw new Error("empty");
        var byId = {};
        rows.forEach(function (row) { byId[row.id] = row; });
        var next = [];
        COINS.forEach(function (meta) {
          var row = byId[meta.id];
          if (!row || typeof row.current_price !== "number") return;
          var raw = (row.sparkline_in_7d && row.sparkline_in_7d.price) || [];
          var spark = raw.filter(function (n) { return typeof n === "number" && Number.isFinite(n); });
          next.push({
            id: meta.id,
            symbol: meta.symbol,
            name: meta.name,
                  price: row.current_price,
            change24h: typeof row.price_change_percentage_24h === "number" ? row.price_change_percentage_24h : 0,
            spark: spark,
            image: typeof row.image === "string" && /^https:\/\/[^\s"<>]+$/.test(row.image) ? row.image : "",
          });
        });
        if (next.length === 0) throw new Error("no rows");
        markets = next;
        state = "live";
        updatedAt = Date.now();
        applyLive(next);
        cacheSet("tt_markets", next);
      })
      .catch(function () {
        var hit = cacheGet("tt_markets");
        if (hit && Array.isArray(hit.value) && hit.value.length) {
          // rate-limited or offline, but we have quotes from this session
          markets = hit.value;
          state = "cached";
          updatedAt = hit.ts;
          applyLive(markets);
        } else if (state === "live" || state === "cached") {
          state = "cached";
        } else {
          markets = SAMPLE;
          state = "sample";
          updatedAt = null;
        }
      })
      .then(function () {
        renderRail();
        renderStatus();
        renderMarketChart();
      });
  }

  /* Seven-day history uses the sparkline returned by /coins/markets, not a mock graph. */
  var chartSelect = doc.getElementById("chart-coin");
  function renderMarketChart() {
    if (!chartSelect) return;
    var market = markets.find(function (m) { return m.id === chartSelect.value; });
    var line = doc.getElementById("chart-line");
    var area = doc.getElementById("chart-area");
    var status = doc.getElementById("chart-status");
    var price = doc.getElementById("chart-price");
    var change = doc.getElementById("chart-change");
    if (!market || !market.spark || market.spark.length < 2 || state === "sample" || state === "loading") {
      line.setAttribute("d", ""); area.setAttribute("d", "");
      price.textContent = "—"; change.textContent = "";
      status.textContent = state === "loading" ? "Loading market data…" : "Chart unavailable";
      return;
    }
    var points = market.spark, min = Math.min.apply(null, points), max = Math.max.apply(null, points), span = max - min || 1;
    var path = points.map(function (v, i) { return (i ? "L" : "M") + (i * 320 / (points.length - 1)).toFixed(2) + "," + (94 - (v - min) / span * 88).toFixed(2); }).join(" ");
    line.setAttribute("d", path); area.setAttribute("d", path + " L320,100 L0,100 Z");
    price.textContent = formatPrice(market.price);
    change.textContent = (market.change24h >= 0 ? "+" : "") + market.change24h.toFixed(2) + "% · 24h";
    change.className = market.change24h >= 0 ? "up" : "down";
    status.textContent = state === "cached" ? "Cached CoinGecko data" : "CoinGecko · 7-day history";
  }
  if (chartSelect) chartSelect.addEventListener("change", renderMarketChart);

  sortButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      sortMode = button.getAttribute("data-sort");
      sortButtons.forEach(function (other) {
        other.setAttribute("aria-selected", other === button ? "true" : "false");
      });
      if (rail) rail.setAttribute("aria-labelledby", button.id);
      renderRail();
      renderMarketChart();
    });
  });

  if (refreshBtn) {
    refreshBtn.addEventListener("click", function () {
      var icon = refreshBtn.querySelector(".ic");
      if (icon) icon.classList.add("spin");
      fetchLive().then(function () {
        if (icon) icon.classList.remove("spin");
      });
    });
  }

  if (rail) {
    // The server-rendered rail already shows sample cards; adopt them as the
    // initial dataset, then try to upgrade to live quotes.
    markets = SAMPLE;
    state = "loading";
    renderStatus();
    fetchLive();
    fetchGlobal();
    window.setInterval(function () {
      fetchLive();
      fetchGlobal();
    }, REFRESH_MS);
    doc.addEventListener("visibilitychange", function () {
      if (doc.visibilityState === "visible") {
        fetchLive();
        fetchGlobal();
      }
    });
  }

  /* ------------------------------------------------ live data everywhere
   * The ticker is not the only live surface: the hero badge, the portfolio
   * mock (holdings valued at live prices, total = cash + holdings, P&L vs a
   * fixed cost basis) and the trade panel's open position all revalue when a
   * live quote arrives. Baked-in HTML values remain as the offline fallback.
   */
  function money2(value) {
    return (value < 0 ? "-" : "") + "$" + Math.abs(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function compactUsd(value) {
    return "$" + new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value);
  }

  function setDirection(el, up) {
    el.classList.toggle("up", up);
    el.classList.toggle("down", !up);
  }

  function applyLive(list) {
    var byId = {};
    list.forEach(function (market) { byId[market.id] = market; });

    doc.querySelectorAll("[data-live-price]").forEach(function (el) {
      var market = byId[el.getAttribute("data-live-price")];
      if (market) el.textContent = formatPrice(market.price);
    });

    doc.querySelectorAll("[data-live-change]").forEach(function (el) {
      var market = byId[el.getAttribute("data-live-change")];
      if (!market) return;
      el.textContent = (market.change24h >= 0 ? "+" : "") + market.change24h.toFixed(2) + "%";
      setDirection(el, market.change24h >= 0);
    });

    var total = 0;
    var previous = 0;
    var pnl = 0;
    doc.querySelectorAll("[data-holding-value]").forEach(function (el) {
      var market = byId[el.getAttribute("data-holding-value")];
      if (!market) return;
      var qty = parseFloat(el.getAttribute("data-qty")) || 0;
      var cost = parseFloat(el.getAttribute("data-cost")) || 0;
      var value = qty * market.price;
      total += value;
      previous += (qty * market.price) / (1 + market.change24h / 100);
      if (cost) pnl += qty * (market.price - cost);
      el.textContent = money2(value);
    });

    var totalEl = doc.querySelector("[data-portfolio-total]");
    var cash = totalEl ? parseFloat(totalEl.getAttribute("data-cash")) || 0 : 0;
    if (totalEl && total > 0) doc.querySelectorAll("[data-portfolio-total]").forEach(function (el) { el.textContent = money2((parseFloat(el.getAttribute("data-cash")) || 0) + total); });

    var todayEl = doc.querySelector("[data-portfolio-today]");
    if (todayEl && previous > 0) {
      var delta = total - previous;
      var pct = (delta / previous) * 100;
      todayEl.textContent =
        (delta >= 0 ? "+" : "-") + money2(Math.abs(delta)).replace("-", "") +
        " (" + (delta >= 0 ? "+" : "") + pct.toFixed(2) + "%) today";
      doc.querySelectorAll("[data-portfolio-today]").forEach(function (el) { el.textContent = todayEl.textContent; setDirection(el.parentElement, delta >= 0); });
    }

    var pnlEl = doc.querySelector("[data-portfolio-pnl]");
    if (pnlEl && total > 0) {
      pnlEl.textContent = (pnl >= 0 ? "+" : "-") + "$" + Math.abs(pnl).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      doc.querySelectorAll("[data-portfolio-pnl]").forEach(function (el) { el.textContent = pnlEl.textContent; setDirection(el, pnl >= 0); });
    }

    doc.querySelectorAll("[data-position-pnl]").forEach(function (el) {
      var market = byId[el.getAttribute("data-position-pnl")];
      if (!market) return;
      var entry = parseFloat(el.getAttribute("data-entry")) || 0;
      var qty = parseFloat(el.getAttribute("data-qty")) || 0;
      var gain = (market.price - entry) * qty;
      el.textContent = (gain >= 0 ? "+" : "-") + "$" + Math.abs(gain).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      setDirection(el, gain >= 0);
      setDirection(el.parentElement, gain >= 0);
    });

    doc.querySelectorAll("[data-position-roe]").forEach(function (el) {
      var market = byId[el.getAttribute("data-position-roe")];
      if (!market) return;
      var entry = parseFloat(el.getAttribute("data-entry")) || 0;
      var qty = parseFloat(el.getAttribute("data-qty")) || 0;
      var margin = parseFloat(el.getAttribute("data-margin")) || 1;
      var roe = (((market.price - entry) * qty) / margin) * 100;
      el.textContent = (roe >= 0 ? "+" : "") + roe.toFixed(1) + "%";
      setDirection(el, roe >= 0);
    });
  }

  function applyGlobal(texts) {
    Object.keys(texts).forEach(function (key) {
      doc.querySelectorAll('[data-global="' + key + '"]').forEach(function (el) {
        el.textContent = texts[key];
      });
    });
  }

  /* CoinGecko /global: total market cap, 24h volume, BTC dominance, asset count */
  function fetchGlobal() {
    fetch("https://api.coingecko.com/api/v3/global", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("bad status");
        return response.json();
      })
      .then(function (json) {
        var data = json && json.data;
        if (!data) return;
        var texts = {};
        if (data.total_market_cap && data.total_market_cap.usd) texts.mcap = compactUsd(data.total_market_cap.usd);
        if (data.total_volume && data.total_volume.usd) texts.vol = compactUsd(data.total_volume.usd);
        if (data.market_cap_percentage && typeof data.market_cap_percentage.btc === "number") {
          texts.btc = data.market_cap_percentage.btc.toFixed(1) + "%";
        }
        if (typeof data.active_cryptocurrencies === "number") {
          texts.count = data.active_cryptocurrencies.toLocaleString("en-US");
        }
        applyGlobal(texts);
        var globalStatus = doc.getElementById("global-status");
        if (globalStatus) globalStatus.textContent = "Global data updated · " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        cacheSet("tt_global", texts);
      })
      .catch(function () {
        var hit = cacheGet("tt_global");
        var globalStatus = doc.getElementById("global-status");
        if (hit && hit.value) {
          applyGlobal(hit.value);
          if (globalStatus) globalStatus.textContent = "Cached global data · " + new Date(hit.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } else if (globalStatus) {
          globalStatus.textContent = "Global data unavailable or stale";
        }
      });
  }
})();
