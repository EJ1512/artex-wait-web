"use strict";

document.documentElement.classList.add("has-js");

// Wide screens get the full-screen panel deck. Smaller screens use a normal
// scrolling document so no panel content is ever trapped off-screen.
const panelModeQuery = window.matchMedia("(min-width: 901px)");
const usePanels = panelModeQuery.matches;
document.documentElement.classList.add(usePanels ? "panel-mode" : "scroll-mode");

// Re-initialize the right layout mode if the viewport crosses the breakpoint,
// debounced so transient window resizing never causes reload churn.
let modeReloadTimer = 0;
if (typeof panelModeQuery.addEventListener === "function") {
  panelModeQuery.addEventListener("change", () => {
    window.clearTimeout(modeReloadTimer);
    modeReloadTimer = window.setTimeout(() => {
      if (panelModeQuery.matches !== usePanels) window.location.reload();
    }, 400);
  });
}

const SUPABASE_URL = "https://epbvkvbjqjaipbnhlshr.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_C_3JNhKS1CiOTZAhv7Vldg_St0-K3Nr";
const WAITLIST_SOURCE = "artex_landing_page";
// This value is an internal database contract used by the live RLS policy.
const WAITLIST_INTEREST = "General ArtEx waitlist";

// Mirrors the Supabase RLS insert policy so invalid input fails fast client-side.
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const EMAIL_MIN_LENGTH = 6;
const EMAIL_MAX_LENGTH = 254;
const NAME_MAX_LENGTH = 120;

const ARTIST_SIGNALS = [
  {
    name: "Drake",
    code: "DRKE",
    subtitle: "Mainstream demand rising",
    priceStart: 38.84,
    priceEnd: 40.52,
    image: "https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9",
    points: createMarketPoints(13, 292, 136, 84, [
      { at: 0.18, depth: -40, width: 0.035 },
      { at: 0.36, depth: 48, width: 0.055 },
      { at: 0.58, depth: 32, width: 0.045 },
      { at: 0.82, depth: -34, width: 0.05 },
    ]),
  },
  {
    name: "Taylor Swift",
    code: "TSWF",
    subtitle: "Global demand rising",
    priceStart: 52.36,
    priceEnd: 55.81,
    image: "https://i.scdn.co/image/ab6761610000e5ebe2e8e7ff002a4afda1c7147e",
    points: createMarketPoints(57, 296, 118, 88, [
      { at: 0.16, depth: -38, width: 0.04 },
      { at: 0.33, depth: 46, width: 0.05 },
      { at: 0.55, depth: -30, width: 0.045 },
      { at: 0.78, depth: 40, width: 0.055 },
    ]),
  },
  {
    name: "Kanye West",
    code: "KWST",
    subtitle: "Market energy rising",
    priceStart: 31.26,
    priceEnd: 34.18,
    image: "https://i.scdn.co/image/ab6761610000e5eb6e835a500e791bf9c27a422a",
    points: createMarketPoints(27, 304, 142, 96, [
      { at: 0.12, depth: 34, width: 0.035 },
      { at: 0.28, depth: -48, width: 0.04 },
      { at: 0.47, depth: 50, width: 0.06 },
      { at: 0.72, depth: -42, width: 0.045 },
      { at: 0.89, depth: 30, width: 0.035 },
    ]),
  },
  {
    name: "Bad Bunny",
    code: "BBNY",
    subtitle: "Worldwide momentum rising",
    priceStart: 44.12,
    priceEnd: 46.97,
    image: "https://i.scdn.co/image/ab6761610000e5eb81f47f44084e0a09b5f0fa13",
    points: createMarketPoints(73, 288, 124, 92, [
      { at: 0.14, depth: 36, width: 0.04 },
      { at: 0.31, depth: -44, width: 0.05 },
      { at: 0.5, depth: 34, width: 0.045 },
      { at: 0.69, depth: -40, width: 0.05 },
      { at: 0.86, depth: 28, width: 0.04 },
    ]),
  },
  {
    name: "SZA",
    code: "SZA",
    subtitle: "Fan conviction rising",
    priceStart: 27.65,
    priceEnd: 30.24,
    image: "https://i.scdn.co/image/ab6761610000e5ebfd0a9fb6c252a3ba44079acf",
    points: createMarketPoints(41, 286, 128, 72, [
      { at: 0.2, depth: 42, width: 0.045 },
      { at: 0.34, depth: -36, width: 0.04 },
      { at: 0.52, depth: 46, width: 0.05 },
      { at: 0.76, depth: -32, width: 0.05 },
    ]),
  },
];

function seededRandom(seed) {
  let value = seed % 2147483647;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function createMarketPoints(seed, startY, endY, volatility, shocks) {
  const random = seededRandom(seed);
  const count = 92;
  const points = [];
  let price = startY;

  for (let index = 0; index < count; index += 1) {
    const t = index / (count - 1);
    const baseline = startY + (endY - startY) * t;
    const pullToTrend = (baseline - price) * 0.16;
    const noise = (random() - 0.5) * volatility * (0.62 + random() * 0.78);
    const microMove = Math.sin(t * Math.PI * 18 + seed) * volatility * 0.08;
    const shockMove = shocks.reduce((total, shock) => {
      const distance = (t - shock.at) / shock.width;
      return total + shock.depth * Math.exp(-distance * distance);
    }, 0);

    price += pullToTrend + noise * 0.34 + microMove;
    const y = Math.max(72, Math.min(318, price + shockMove));
    points.push({ x: Math.round(t * 724), y: Math.round(y) });
  }

  points[0] = { x: 0, y: startY };
  points[points.length - 1] = { x: 724, y: endY };
  return points;
}

const configured =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("YOUR_PROJECT") &&
  SUPABASE_PUBLIC_KEY &&
  !SUPABASE_PUBLIC_KEY.includes("YOUR_SUPABASE");

const panels = Array.from(document.querySelectorAll("[data-panel]"));
const panelLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
let activePanelIndex = 0;
let panelLocked = false;
let touchStartY = 0;
let revealTimer = 0;

function revealPanelContent(panel) {
  window.clearTimeout(revealTimer);

  panels.forEach((item) => {
    if (item === panel) return;
    item.querySelectorAll(".reveal").forEach((element) => element.classList.remove("in-view"));
  });

  revealTimer = window.setTimeout(() => {
    panel.querySelectorAll(".reveal").forEach((element) => element.classList.add("in-view"));
  }, 80);
}

function setActivePanel(index) {
  if (!panels.length) return;

  const nextIndex = Math.max(0, Math.min(index, panels.length - 1));
  if (nextIndex === activePanelIndex && panels[nextIndex].classList.contains("is-active")) return;

  const previousIndex = activePanelIndex;
  activePanelIndex = nextIndex;
  document.documentElement.classList.toggle("panel-forward", previousIndex < activePanelIndex);
  document.documentElement.classList.toggle("panel-backward", previousIndex > activePanelIndex);

  panels.forEach((panel, panelIndex) => {
    panel.classList.toggle("is-active", panelIndex === activePanelIndex);
    panel.classList.toggle("is-before", panelIndex < activePanelIndex);
    panel.classList.toggle("is-after", panelIndex > activePanelIndex);
  });

  revealPanelContent(panels[activePanelIndex]);

  const activeId = panels[activePanelIndex].id || "top";
  if (window.location.hash !== `#${activeId}`) {
    history.replaceState(null, "", activeId === "top" ? window.location.pathname : `#${activeId}`);
  }
}

function movePanel(direction) {
  if (panelLocked || !panels.length) return;

  const nextIndex = activePanelIndex + direction;
  if (nextIndex < 0 || nextIndex >= panels.length) return;

  panelLocked = true;
  setActivePanel(nextIndex);
  window.setTimeout(() => {
    panelLocked = false;
  }, 1320);
}

function getPanelIndexFromHash(hash) {
  const id = hash.replace("#", "");
  if (!id || id === "top") return 0;
  const target = document.getElementById(id);
  const targetPanel = target?.matches("[data-panel]") ? target : target?.closest("[data-panel]");
  const panelId = targetPanel?.id || id;
  const index = panels.findIndex((panel) => panel.id === panelId);
  return index >= 0 ? index : 0;
}

if (usePanels && panels.length) {
  const startIndex = getPanelIndexFromHash(window.location.hash);
  activePanelIndex = -1;
  setActivePanel(startIndex);

  window.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      if (Math.abs(event.deltaY) < 18) return;
      movePanel(event.deltaY > 0 ? 1 : -1);
    },
    { passive: false }
  );

  window.addEventListener("keydown", (event) => {
    if (["ArrowDown", "PageDown", " "].includes(event.key)) {
      event.preventDefault();
      movePanel(1);
    }

    if (["ArrowUp", "PageUp"].includes(event.key)) {
      event.preventDefault();
      movePanel(-1);
    }
  });

  window.addEventListener(
    "touchstart",
    (event) => {
      touchStartY = event.touches[0].clientY;
    },
    { passive: true }
  );

  window.addEventListener(
    "touchmove",
    (event) => {
      event.preventDefault();
      const touchY = event.touches[0].clientY;
      const delta = touchStartY - touchY;
      if (Math.abs(delta) < 46) return;
      movePanel(delta > 0 ? 1 : -1);
      touchStartY = touchY;
    },
    { passive: false }
  );

  panelLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      const targetIndex = getPanelIndexFromHash(href);
      event.preventDefault();
      setActivePanel(targetIndex);
      if (href === "#waitlist") {
        revealWaitlistForm({ focus: true });
      }
    });
  });
} else if (panels.length) {
  const revealElements = Array.from(document.querySelectorAll(".reveal"));

  if ("IntersectionObserver" in window && revealElements.length) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -40px 0px" }
    );
    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add("in-view"));
  }
}

const previewPanel = document.querySelector(".exchange-panel");
const graphAvatar = document.querySelector("[data-graph-avatar]");
const graphName = document.querySelector("[data-graph-name]");
const graphPrice = document.querySelector("[data-graph-price]");
const graphChange = document.querySelector("[data-graph-change]");
const graphChangeArrow = graphChange ? graphChange.querySelector("i") : null;
const graphChangeValue = graphChange ? graphChange.querySelector("b") : null;

function setGraphChange(pct) {
  if (!graphChange) return;
  const up = pct >= 0;
  graphChange.classList.toggle("up", up);
  graphChange.classList.toggle("down", !up);
  if (graphChangeArrow) graphChangeArrow.textContent = up ? "▲" : "▼";
  if (graphChangeValue) graphChangeValue.textContent = `${Math.abs(pct).toFixed(2)}%`;
}
const trendChart = document.querySelector("[data-trend-chart]");
const trendPaths = document.querySelectorAll("[data-trend-line], [data-trend-glow], [data-trend-scan]");
const trendDrawPaths = document.querySelectorAll("[data-trend-line], [data-trend-glow]");
const trendScan = document.querySelector("[data-trend-scan]");
const trendDot = document.querySelector("[data-trend-dot]");
let trendRevealTimer = 0;
let trendFrame = 0;
let priceTickTimer = 0;

function pointsToPath(points) {
  if (!points.length) return "";
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
}

function setTrendPath(points) {
  const d = pointsToPath(points);
  trendPaths.forEach((path) => {
    path.setAttribute("d", d);
  });

  if (trendDot && points.length) {
    const lastPoint = points[points.length - 1];
    trendDot.setAttribute("cx", lastPoint.x);
    trendDot.setAttribute("cy", lastPoint.y);

    if (points.length > 1) {
      trendDot.style.opacity = "0.95";
    }
  }
}

function prepareTrendForDraw(points) {
  window.clearTimeout(trendRevealTimer);
  window.clearTimeout(priceTickTimer);
  window.cancelAnimationFrame(trendFrame);

  trendPaths.forEach((path) => {
    path.style.transition = "none";
    path.style.strokeDasharray = "";
    path.style.strokeDashoffset = "";
  });

  setTrendPath(points.slice(0, 1));

  // The blurred glow path is kept invisible while the line draws frame by
  // frame; rasterizing the blur on every frame is too costly on weak GPUs.
  trendDrawPaths.forEach((path) => {
    path.style.opacity = path.hasAttribute("data-trend-glow") ? "0" : "1";
  });

  if (trendScan) {
    trendScan.style.animation = "none";
    trendScan.style.opacity = "0";
    trendScan.setAttribute("d", "");
    trendScan.getBoundingClientRect();
  }

  if (trendDot) {
    trendDot.style.animation = "none";
    trendDot.style.opacity = "0";
    trendDot.getBoundingClientRect();
  }
}

function createPriceTicks(points, priceStart, priceEnd) {
  if (!points.length) return [];

  const ys = points.map((point) => point.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const yRange = Math.max(1, maxY - minY);
  const startLevel = (maxY - points[0].y) / yRange;
  const priceRange = priceEnd - priceStart;

  return points.map((point, index) => {
    if (index === 0) return priceStart;
    if (index === points.length - 1) return priceEnd;

    const progress = index / (points.length - 1);
    const trendValue = priceStart + priceRange * progress;
    const level = (maxY - point.y) / yRange;
    const previousPoint = points[index - 1];
    const localMove = (previousPoint.y - point.y) / yRange;
    const tickValue =
      trendValue +
      (level - startLevel) * priceRange * 0.42 +
      localMove * priceRange * 0.85;

    return Math.max(priceStart * 0.94, Math.min(priceEnd * 1.08, tickValue));
  });
}

function startTrendDraw(points, priceStart, priceEnd) {
  const duration = 4300;
  const start = performance.now();
  const shouldAnimatePrice =
    graphPrice &&
    Number.isFinite(priceStart) &&
    Number.isFinite(priceEnd);
  const priceTicks = shouldAnimatePrice ? createPriceTicks(points, priceStart, priceEnd) : [];
  let lastVisibleCount = 0;
  let lastPriceValue = priceStart;

  if (shouldAnimatePrice) {
    graphPrice.textContent = priceStart.toFixed(2);
    setGraphChange(0);
    graphPrice.classList.remove("is-rising");
    graphPrice.classList.remove("is-tick-up", "is-tick-down");
    graphPrice.getBoundingClientRect();
    graphPrice.classList.add("is-rising");
  }

  window.requestAnimationFrame(() => {
    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const visibleCount = Math.max(2, Math.ceil(progress * points.length));
      const visiblePoints = points.slice(0, visibleCount);

      setTrendPath(visiblePoints);

      if (shouldAnimatePrice && visibleCount !== lastVisibleCount) {
        const tickIndex = Math.min(priceTicks.length - 1, visibleCount - 1);
        const value = priceTicks[tickIndex];
        graphPrice.textContent = value.toFixed(2);
        setGraphChange(((value - priceStart) / priceStart) * 100);
        graphPrice.classList.remove("is-tick-up", "is-tick-down");
        graphPrice.classList.add(value >= lastPriceValue ? "is-tick-up" : "is-tick-down");
        window.clearTimeout(priceTickTimer);
        priceTickTimer = window.setTimeout(() => {
          graphPrice.classList.remove("is-tick-up", "is-tick-down");
        }, 72);
        lastPriceValue = value;
        lastVisibleCount = visibleCount;
      }

      if (progress < 1) {
        trendFrame = window.requestAnimationFrame(frame);
        return;
      }

      trendRevealTimer = window.setTimeout(() => {
        trendDrawPaths.forEach((path) => {
          if (!path.hasAttribute("data-trend-glow")) return;
          path.style.transition = "opacity 720ms ease";
          path.style.opacity = "0.22";
        });

        if (trendScan) {
          trendScan.setAttribute("d", pointsToPath(points));
          trendScan.style.opacity = "";
          trendScan.style.animation = "signalTravel 4.2s ease-in-out infinite";
        }

        if (trendDot) {
          trendDot.style.opacity = "";
          trendDot.style.animation = "";
        }
      }, 120);
    }

    trendFrame = window.requestAnimationFrame(frame);
  });
}

function drawTrendFromStart(points, priceStart, priceEnd) {
  prepareTrendForDraw(points);
  startTrendDraw(points, priceStart, priceEnd);
}

function applyArtistSignal(index) {
  const artist = ARTIST_SIGNALS[index % ARTIST_SIGNALS.length];
  if (!previewPanel || !artist) return;

  previewPanel.classList.add("is-switching");

  window.setTimeout(() => {
    [graphAvatar].forEach((image) => {
      if (!image) return;
      image.src = artist.image;
      image.alt = `${artist.code} Spotify artist profile image`;
    });

    if (graphName) graphName.textContent = artist.code;

    prepareTrendForDraw(artist.points);
    previewPanel.classList.remove("is-switching");
    startTrendDraw(artist.points, artist.priceStart, artist.priceEnd);
  }, 720);
}

if (trendChart) {
  const initialArtist = ARTIST_SIGNALS[0];
  drawTrendFromStart(initialArtist.points, initialArtist.priceStart, initialArtist.priceEnd);
}

if (previewPanel && ARTIST_SIGNALS.length > 1) {
  let artistIndex = 0;
  window.setInterval(() => {
    artistIndex = (artistIndex + 1) % ARTIST_SIGNALS.length;
    applyArtistSignal(artistIndex);
  }, 5200);
}

async function joinWaitlist(payload) {
  if (!configured) {
    // Local preview: Supabase keys not set yet. Show the confirmation UI so the
    // page can be reviewed, but nothing is stored. Real inserts happen once
    // SUPABASE_URL / SUPABASE_PUBLIC_KEY are filled in.
    console.warn("Supabase not configured - running waitlist in preview mode (no data saved).");
    return { preview: true };
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLIC_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLIC_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok && response.status !== 409) {
    const details = await response.text();
    throw new Error(`Waitlist insert failed (${response.status}): ${details || "Unknown Supabase error"}`);
  }

  return { preview: false };
}

const form = document.querySelector("[data-waitlist-form]");
const status = document.querySelector("[data-form-status]");
const successCard = document.querySelector("[data-waitlist-success]");
const successEmail = document.querySelector("[data-success-email]");

function revealSuccess(email) {
  if (!successCard) return;
  if (successEmail) successEmail.textContent = email;
  if (form) form.classList.add("is-dismissed");
  successCard.hidden = false;
  // Force reflow so the entry animation always plays.
  void successCard.offsetWidth;
  successCard.classList.add("is-shown");
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const button = form.querySelector('button[type="submit"]');
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const name = String(formData.get("name") || "").trim().slice(0, NAME_MAX_LENGTH);

    status.className = "form-status";
    status.textContent = "";

    // Honeypot: hidden from humans; a filled value means an automated submit.
    if (String(formData.get("company") || "").trim()) {
      revealSuccess(email || "you");
      return;
    }

    if (
      email.length < EMAIL_MIN_LENGTH ||
      email.length > EMAIL_MAX_LENGTH ||
      !EMAIL_PATTERN.test(email)
    ) {
      status.classList.add("error");
      status.textContent = "Enter a valid email address.";
      return;
    }

    const payload = {
      email,
      name: name || null,
      interest: WAITLIST_INTEREST,
      source: WAITLIST_SOURCE,
    };

    button.disabled = true;
    button.querySelector("span").textContent = "Joining...";

    try {
      await joinWaitlist(payload);
      revealSuccess(email);
    } catch (error) {
      console.warn(error.message);
      status.classList.add("error");
      status.textContent = "Something went wrong. Please try again.";
    } finally {
      button.disabled = false;
      button.querySelector("span").textContent = "Join the waitlist";
    }
  });
}

// ── Waitlist headline cycling ─────────────────────────────
const waitlistPanel = document.querySelector('[data-panel="waitlist"]');
const headlinePhrases = document.querySelectorAll("[data-phrase]");
const waitlistCtaRow = document.querySelector("[data-waitlist-cta]");
const showFormBtn = document.querySelector("[data-show-form]");
const waitlistFormEl = document.querySelector("[data-waitlist-form]");
let headlineCycleStarted = false;

headlinePhrases[0]?.classList.add("is-active");

function revealWaitlistForm({ focus = false, scroll = false } = {}) {
  if (!waitlistFormEl) return;

  waitlistFormEl.classList.add("is-revealed");
  waitlistCtaRow?.classList.add("is-visible");

  if (scroll && !usePanels) {
    waitlistFormEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (focus) {
    window.setTimeout(() => {
      waitlistFormEl.querySelector('input[name="email"]')?.focus({ preventScroll: true });
    }, usePanels ? 1050 : 520);
  }
}

function startHeadlineCycle() {
  if (headlineCycleStarted || !headlinePhrases.length) return;
  headlineCycleStarted = true;

  let current = 0;
  headlinePhrases[current].classList.add("is-active");

  function advance() {
    const leaving = current;
    current = (current + 1) % headlinePhrases.length;

    headlinePhrases[leaving].classList.add("is-exiting");
    headlinePhrases[leaving].classList.remove("is-active");

    window.setTimeout(() => {
      headlinePhrases[leaving].classList.remove("is-exiting");
      headlinePhrases[current].classList.add("is-active");

      window.setTimeout(advance, 2800);
    }, 480);
  }

  window.setTimeout(advance, 2800);
}

waitlistCtaRow?.classList.add("is-visible");

if (waitlistPanel) {
  if (usePanels) {
    new MutationObserver(() => {
      if (waitlistPanel.classList.contains("is-active")) {
        window.setTimeout(startHeadlineCycle, 1100);
      }
    }).observe(waitlistPanel, { attributes: true, attributeFilter: ["class"] });

    if (waitlistPanel.classList.contains("is-active")) {
      window.setTimeout(startHeadlineCycle, 1100);
    }
  } else if ("IntersectionObserver" in window) {
    const cycleObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          cycleObserver.disconnect();
          window.setTimeout(startHeadlineCycle, 400);
        }
      },
      { threshold: 0.3 }
    );
    cycleObserver.observe(waitlistPanel);
  } else {
    startHeadlineCycle();
  }
}

if (showFormBtn && waitlistFormEl) {
  showFormBtn.addEventListener("click", () => {
    revealWaitlistForm({ focus: true, scroll: true });
  });
}

if (!usePanels) {
  document.querySelectorAll('a[href="#waitlist"]').forEach((link) => {
    link.addEventListener("click", () => {
      revealWaitlistForm({ focus: true });
    });
  });
}

if (window.location.hash === "#waitlist") {
  revealWaitlistForm({ focus: true });
}

// ── Market radar: continuous 2D morph of the data polygon ─
const radarPolygon = document.querySelector("[data-radar-polygon]");
if (radarPolygon) {
  const RADAR_CX = 230;
  const RADAR_CY = 165;
  const RADAR_R = 120;
  const RADAR_MOTION_SPEED = 0.38;
  const RADAR_ANGLES = [90, 30, -30, -90, -150, 150].map((deg) => (deg * Math.PI) / 180);

  const radarFrame = (now) => {
    const t = (now / 1000) * RADAR_MOTION_SPEED;
    const points = RADAR_ANGLES.map((angle, index) => {
      const sway =
        0.55 +
        0.17 * Math.sin(t * 0.9 + index * 1.7) +
        0.12 * Math.sin(t * 1.6 + index * 2.9) +
        0.07 * Math.sin(t * 2.7 + index * 0.8);
      const radius = RADAR_R * Math.min(0.94, Math.max(0.26, sway));
      const x = RADAR_CX + radius * Math.cos(angle);
      const y = RADAR_CY - radius * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    radarPolygon.setAttribute("points", points);
    window.requestAnimationFrame(radarFrame);
  };

  window.requestAnimationFrame(radarFrame);
}

// ── Focus fade for flowing card feeds ─────────────────────
// Cards fade by distance from the feed's vertical center with a fully
// bright zone in the middle, so the card riding the flow line stays in
// focus while neighbours dim toward the edges. No transforms, no warping.
// Market-signal instrument between the input and quote feeds.
const signalInstrument = document.querySelector("[data-signal-instrument]");
if (signalInstrument) {
  const context = signalInstrument.getContext("2d");
  const instrumentPanel = signalInstrument.closest("[data-panel]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let instrumentWidth = 0;
  let instrumentHeight = 0;
  let instrumentDpr = 1;

  const rgba = (rgb, alpha) => `rgba(${rgb}, ${alpha})`;
  const GOLD = "240, 207, 139";
  const PALE = "244, 239, 228";
  const PROFIT = "145, 223, 170";

  const resizeInstrument = () => {
    const bounds = signalInstrument.getBoundingClientRect();
    instrumentWidth = Math.max(1, bounds.width);
    instrumentHeight = Math.max(1, bounds.height);
    instrumentDpr = Math.min(2, window.devicePixelRatio || 1);
    signalInstrument.width = Math.round(instrumentWidth * instrumentDpr);
    signalInstrument.height = Math.round(instrumentHeight * instrumentDpr);
    context.setTransform(instrumentDpr, 0, 0, instrumentDpr, 0, 0);
  };

  const strokeCurve = (points, color, width, blur = 0) => {
    if (points.length < 2) return;
    context.save();
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length - 1; index += 1) {
      const midpointX = (points[index].x + points[index + 1].x) / 2;
      const midpointY = (points[index].y + points[index + 1].y) / 2;
      context.quadraticCurveTo(points[index].x, points[index].y, midpointX, midpointY);
    }
    const last = points[points.length - 1];
    context.lineTo(last.x, last.y);
    context.strokeStyle = color;
    context.lineWidth = width;
    context.lineCap = "round";
    context.lineJoin = "round";
    if (blur) {
      context.shadowColor = color;
      context.shadowBlur = blur;
    }
    context.stroke();
    context.restore();
  };

  const pointAlongCurve = (points, progress) => {
    const scaledIndex = Math.max(0, Math.min(1, progress)) * (points.length - 1);
    const index = Math.min(points.length - 2, Math.floor(scaledIndex));
    const localProgress = scaledIndex - index;
    const start = points[index];
    const end = points[index + 1];
    return {
      x: start.x + (end.x - start.x) * localProgress,
      y: start.y + (end.y - start.y) * localProgress,
      angle: Math.atan2(end.y - start.y, end.x - start.x),
    };
  };

  const drawInstrument = (now) => {
    if (!instrumentWidth || !instrumentHeight) return;

    const motionScale = reducedMotion.matches ? 0.28 : 1;
    const time = (now / 1000) * motionScale;
    const width = instrumentWidth;
    const height = instrumentHeight;
    const centerY = height / 2;
    const coreLeft = width * 0.25;
    const coreRight = width * 0.72;

    context.clearRect(0, 0, width, height);

    const laneYs = [0.28, 0.5, 0.72].map((ratio) => height * ratio);
    laneYs.forEach((startY, index) => {
      const lanePoints = [];
      const laneSamples = 28;
      for (let sample = 0; sample < laneSamples; sample += 1) {
        const progress = sample / (laneSamples - 1);
        const eased = progress * progress * (3 - 2 * progress);
        lanePoints.push({
          x: progress * coreLeft,
          y: startY + (centerY - startY) * eased,
        });
      }

      const laneGradient = context.createLinearGradient(0, 0, coreLeft, 0);
      laneGradient.addColorStop(0, rgba(PALE, 0));
      laneGradient.addColorStop(0.2, rgba(PALE, 0.07));
      laneGradient.addColorStop(0.78, rgba(PALE, 0.12));
      laneGradient.addColorStop(1, rgba(GOLD, 0.36));
      strokeCurve(lanePoints, laneGradient, 1);

      const phase = (time * (0.105 + index * 0.006) + index * 0.31) % 1;
      const packet = pointAlongCurve(lanePoints, phase);
      const alpha = Math.sin(Math.PI * phase);
      const tickWidth = 12 + index * 2;
      context.save();
      context.translate(packet.x, packet.y);
      context.rotate(packet.angle);
      context.fillStyle = rgba(index === 1 ? GOLD : PALE, 0.26 + alpha * 0.58);
      context.shadowColor = rgba(GOLD, 0.42);
      context.shadowBlur = 5;
      context.fillRect(-tickWidth / 2, -0.75, tickWidth, 1.5);
      context.restore();
    });

    const wavePoints = [];
    const sampleCount = 80;
    for (let index = 0; index < sampleCount; index += 1) {
      const progress = index / (sampleCount - 1);
      const x = coreLeft + progress * (coreRight - coreLeft);
      const envelope = Math.sin(Math.PI * progress);
      const movement =
        Math.sin(progress * Math.PI * 5.2 + time * 0.78) * 7.5 +
        Math.sin(progress * Math.PI * 10 - time * 0.38) * 1.4;
      wavePoints.push({ x, y: centerY + movement * envelope });
    }

    const outputPoints = [];
    const outputSamples = width < 360 ? 24 : 36;
    for (let index = 0; index < outputSamples; index += 1) {
      const progress = index / (outputSamples - 1);
      const x = coreRight + progress * (width - coreRight);
      const eased = progress * progress * (3 - 2 * progress);
      const trend = -12 * eased;
      const envelope = Math.sin(Math.PI * progress);
      const noise =
        Math.sin(progress * Math.PI * 3.8 + time * 0.52) * 2.8 +
        Math.sin(progress * Math.PI * 7.5 - time * 0.26) * 0.8;
      outputPoints.push({ x, y: centerY + trend + noise * envelope });
    }

    const completePath = wavePoints.concat(outputPoints.slice(1));
    strokeCurve(completePath, rgba(PALE, 0.05), 4, 4);
    strokeCurve(wavePoints, rgba(GOLD, 0.08), 4.5, 5);
    strokeCurve(wavePoints, rgba(GOLD, 0.82), 1.25, 1.5);
    strokeCurve(outputPoints, rgba(PROFIT, 0.08), 4.5, 5);
    strokeCurve(outputPoints, rgba(PROFIT, 0.78), 1.25, 1.5);

    const signalPhase = (time * 0.07) % 1;
    const signalPoint = pointAlongCurve(completePath, signalPhase);
    const signalColor = signalPhase < wavePoints.length / completePath.length ? GOLD : PROFIT;
    context.save();
    context.translate(signalPoint.x, signalPoint.y);
    context.rotate(signalPoint.angle);
    context.fillStyle = rgba(signalColor, 0.88);
    context.shadowColor = rgba(signalColor, 0.46);
    context.shadowBlur = 5;
    context.fillRect(-4, -1, 8, 2);
    context.restore();
  };

  const instrumentFrame = (now) => {
    const panelIsVisible = !usePanels || instrumentPanel?.classList.contains("is-active");
    if (!document.hidden && panelIsVisible) drawInstrument(now);
    window.requestAnimationFrame(instrumentFrame);
  };

  resizeInstrument();
  window.addEventListener("resize", resizeInstrument);
  if ("ResizeObserver" in window) {
    new ResizeObserver(resizeInstrument).observe(signalInstrument);
  }
  window.requestAnimationFrame(instrumentFrame);
}

const cardFeeds = Array.from(document.querySelectorAll(".signal-feed"));
if (cardFeeds.length) {
  const feedStates = cardFeeds.map((feed) => {
    const track = feed.querySelector(".feed-track");
    const lists = Array.from(feed.querySelectorAll(".feed-list"));
    const cards = Array.from(feed.querySelectorAll(".feed-list > li"));
    const durationValue = getComputedStyle(feed).getPropertyValue("--feed-duration").trim();
    const durationMs = Math.max(8000, (Number.parseFloat(durationValue) || 28) * 1000);

    return {
      feed,
      track,
      lists,
      cards,
      durationMs,
      distance: 0,
      offset: 0,
    };
  });

  const measureFeed = (state) => {
    if (!state.track || state.lists.length < 2) return;

    const previousDistance = state.distance;
    const nextDistance = state.lists[1].offsetTop - state.lists[0].offsetTop;
    if (nextDistance <= 0) return;

    const progress = previousDistance > 0 ? state.offset / previousDistance : 0;
    state.distance = nextDistance;
    state.offset = progress * nextDistance;
  };

  const updateFeedOpacity = (state) => {
    const bounds = state.feed.getBoundingClientRect();
    if (!bounds.height) return;

    const middle = bounds.top + bounds.height / 2;
    const half = bounds.height / 2;

    state.cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const offset = (rect.top + rect.height / 2 - middle) / half;
      const distance = Math.min(1, Math.abs(offset));
      const opacity = distance < 0.18 ? 1 : Math.max(0.05, 1.18 - distance * 1.24);
      card.style.opacity = opacity.toFixed(3);
    });
  };

  const measureFeeds = () => feedStates.forEach(measureFeed);
  let previousFrame = performance.now();

  const animateFeeds = (now) => {
    const elapsed = Math.min(64, Math.max(0, now - previousFrame));
    previousFrame = now;

    feedStates.forEach((state) => {
      if (!state.track || !state.distance) return;

      const panel = state.feed.closest("[data-panel]");
      const panelIsVisible = !usePanels || panel?.classList.contains("is-active");

      if (!document.hidden && panelIsVisible) {
        const movement = (state.distance * elapsed) / state.durationMs;
        state.offset = (state.offset + movement) % state.distance;
      }

      state.track.style.transform = `translate3d(0, ${-state.offset.toFixed(3)}px, 0)`;
      updateFeedOpacity(state);
    });

    window.requestAnimationFrame(animateFeeds);
  };

  measureFeeds();
  window.addEventListener("load", measureFeeds);
  window.addEventListener("resize", measureFeeds);
  document.addEventListener("visibilitychange", () => {
    previousFrame = performance.now();
  });

  if ("ResizeObserver" in window) {
    const feedResizeObserver = new ResizeObserver(measureFeeds);
    cardFeeds.forEach((feed) => feedResizeObserver.observe(feed));
  }

  window.requestAnimationFrame(animateFeeds);
}
