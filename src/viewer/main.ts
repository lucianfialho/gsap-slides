/**
 * Viewer entry point.
 *
 * Loads pre-parsed slides, renders them with GSAP transitions,
 * and orchestrates ambient SVG animations, navigation spine,
 * floating geometries, and overlay UI.
 */

import gsap from "gsap";
import { renderSlides } from "../renderer/index.js";

interface Slide {
  id: number;
  content: string;
  frontmatter: Record<string, any>;
  elements: any[];
}

// ---- Virtual Module Imports -------------------------------------------------

let slides: Slide[];
let config: { presenter: boolean };

try {
  slides = (await import("virtual:slides-data")).default;
} catch {
  slides = [
    { id: 0, content: "<h1>Welcome to gsap-slides</h1><p>Create beautiful presentations with Markdown and GSAP</p>", frontmatter: {}, elements: [] },
    { id: 1, content: "<h2>Features</h2><ul><li>Write slides in Markdown</li><li>GSAP-powered animations</li><li>Vite dev server with HMR</li></ul>", frontmatter: {}, elements: [] },
    { id: 2, content: "<h2>Get Started</h2><pre><code>npx gsap-slides dev slides.md</code></pre>", frontmatter: {}, elements: [] },
  ];
}

try {
  config = (await import("virtual:slides-config")).default;
} catch {
  config = { presenter: false };
}

// ---- State ------------------------------------------------------------------
let currentSlide = 0;
let timerStart = Date.now();
let timerInterval: ReturnType<typeof setInterval>;

// ---- DOM Setup --------------------------------------------------------------
const container = document.getElementById("slides-container");
if (!container) throw new Error("Missing #slides-container element");

let renderer = renderSlides(container, slides);

// ========================================================
// Ambient Background Orbs — gentle floating
// ========================================================
function initOrbs() {
  const orbs = document.querySelectorAll<HTMLElement>(".gs-orb");
  orbs.forEach((orb, i) => {
    gsap.set(orb, { opacity: 0 });
    gsap.to(orb, {
      opacity: 1,
      duration: 2,
      delay: i * 0.3,
      ease: "power2.out",
    });
    // Slow drift
    gsap.to(orb, {
      x: () => gsap.utils.random(-60, 60),
      y: () => gsap.utils.random(-40, 40),
      duration: () => gsap.utils.random(8, 14),
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      delay: i * 0.5,
    });
  });
}

// ========================================================
// Floating SVG Geometries — rotate, drift, pulse
// ========================================================
function initGeometries() {
  const geos = document.querySelectorAll<HTMLElement>(".gs-geo");
  geos.forEach((geo, i) => {
    gsap.set(geo, { opacity: 0, scale: 0.5 });

    // Staggered entrance
    gsap.to(geo, {
      opacity: gsap.utils.random(0.3, 0.7),
      scale: 1,
      duration: 1.5,
      delay: 0.5 + i * 0.2,
      ease: "back.out(1.7)",
    });

    // Perpetual slow rotation
    gsap.to(geo, {
      rotation: gsap.utils.random([-360, 360]),
      duration: gsap.utils.random(20, 40),
      ease: "none",
      repeat: -1,
    });

    // Gentle float
    gsap.to(geo, {
      y: () => gsap.utils.random(-30, 30),
      x: () => gsap.utils.random(-20, 20),
      duration: () => gsap.utils.random(6, 12),
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      delay: i * 0.3,
    });
  });
}

// React to slide changes — shift geos subtly
function animateGeosOnNav(slideIndex: number) {
  const geos = document.querySelectorAll<HTMLElement>(".gs-geo");
  const offset = slideIndex * 15;
  geos.forEach((geo, i) => {
    gsap.to(geo, {
      x: `+=${i % 2 === 0 ? offset : -offset}`,
      y: `+=${i % 2 === 0 ? -offset * 0.5 : offset * 0.5}`,
      duration: 1.2,
      ease: "power3.out",
      overwrite: "auto",
    });
  });
}

// ========================================================
// Navigation Spine — vertical SVG dots + progress line
// ========================================================
let spineDots: SVGCircleElement[] = [];
let spineProgressLine: SVGPathElement | null = null;
const SPINE_DOT_GAP = 28;
const SPINE_DOT_R = 3;
const SPINE_DOT_R_ACTIVE = 5;

function buildNavSpine() {
  const nav = document.getElementById("gs-nav-spine");
  if (!nav) return;

  const total = slides.length;
  const height = (total - 1) * SPINE_DOT_GAP + SPINE_DOT_R_ACTIVE * 2;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", String(height + 20));
  svg.setAttribute("viewBox", `0 0 20 ${height + 20}`);

  // Background line
  const bgLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  bgLine.setAttribute("x1", "10");
  bgLine.setAttribute("y1", "10");
  bgLine.setAttribute("x2", "10");
  bgLine.setAttribute("y2", String(height + 10));
  bgLine.classList.add("gs-spine-line");
  svg.appendChild(bgLine);

  // Progress line (animated)
  const progressLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  progressLine.setAttribute("x1", "10");
  progressLine.setAttribute("y1", "10");
  progressLine.setAttribute("x2", "10");
  progressLine.setAttribute("y2", "10");
  progressLine.classList.add("gs-spine-progress");
  svg.appendChild(progressLine);
  spineProgressLine = progressLine as unknown as SVGPathElement;

  // Dots
  spineDots = [];
  for (let i = 0; i < total; i++) {
    const cy = 10 + i * SPINE_DOT_GAP;
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.classList.add("gs-spine-dot");
    g.setAttribute("data-index", String(i));

    // Glow circle (behind)
    const glow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    glow.setAttribute("cx", "10");
    glow.setAttribute("cy", String(cy));
    glow.setAttribute("r", "8");
    glow.setAttribute("fill", "transparent");
    g.appendChild(glow);

    // Main dot
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", "10");
    dot.setAttribute("cy", String(cy));
    dot.setAttribute("r", String(i === 0 ? SPINE_DOT_R_ACTIVE : SPINE_DOT_R));
    dot.setAttribute("fill", i === 0 ? "#7c6aef" : "rgba(255,255,255,0.2)");
    g.appendChild(dot);

    // Click handler
    g.addEventListener("click", () => goTo(i));

    svg.appendChild(g);
    spineDots.push(dot);
  }

  nav.appendChild(svg);
}

function updateSpine(index: number) {
  spineDots.forEach((dot, i) => {
    gsap.to(dot, {
      attr: {
        r: i === index ? SPINE_DOT_R_ACTIVE : SPINE_DOT_R,
        fill: i === index ? "#7c6aef" : i < index ? "rgba(124,106,239,0.5)" : "rgba(255,255,255,0.2)",
      },
      duration: 0.4,
      ease: "power2.out",
    });
  });

  // Animate progress line
  if (spineProgressLine) {
    const targetY = 10 + index * SPINE_DOT_GAP;
    gsap.to(spineProgressLine, {
      attr: { y2: targetY },
      duration: 0.5,
      ease: "power3.out",
    });
  }
}

// ========================================================
// Ghost Slide Number
// ========================================================
function updateSlideNumber(index: number) {
  const el = document.getElementById("gs-slide-number");
  if (!el) return;

  gsap.to(el, {
    opacity: 0,
    y: -20,
    duration: 0.2,
    ease: "power2.in",
    onComplete: () => {
      el.textContent = String(index + 1);
      gsap.fromTo(el,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    },
  });
}

// ========================================================
// Overlay UI
// ========================================================
function createOverlayUI() {
  const counter = document.createElement("div");
  counter.id = "slide-counter";
  document.body.appendChild(counter);

  const progressWrap = document.createElement("div");
  progressWrap.id = "progress-bar-wrap";
  const progressFill = document.createElement("div");
  progressFill.id = "progress-bar-fill";
  progressWrap.appendChild(progressFill);
  document.body.appendChild(progressWrap);

  const timer = document.createElement("div");
  timer.id = "slide-timer";
  document.body.appendChild(timer);
}

function updateOverlay() {
  const counter = document.getElementById("slide-counter");
  if (counter) counter.textContent = `${currentSlide + 1} / ${slides.length}`;

  const fill = document.getElementById("progress-bar-fill");
  if (fill) {
    const pct = slides.length > 1 ? (currentSlide / (slides.length - 1)) * 100 : 100;
    fill.style.width = `${pct}%`;
  }
}

function updateTimer() {
  const el = document.getElementById("slide-timer");
  if (!el) return;
  const elapsed = Math.floor((Date.now() - timerStart) / 1000);
  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");
  el.textContent = `${mins}:${secs}`;
}

// ========================================================
// Presenter Mode
// ========================================================
function setupPresenterMode() {
  document.body.classList.add("presenter-mode");

  const presenterPanel = document.createElement("div");
  presenterPanel.id = "presenter-panel";

  const nextPreview = document.createElement("div");
  nextPreview.id = "next-slide-preview";
  nextPreview.innerHTML = "<h3>Next Slide</h3><div class='preview-content'></div>";
  presenterPanel.appendChild(nextPreview);

  const notesPanel = document.createElement("div");
  notesPanel.id = "presenter-notes";
  notesPanel.innerHTML = "<h3>Notes</h3><div class='notes-content'></div>";
  presenterPanel.appendChild(notesPanel);

  document.body.appendChild(presenterPanel);
}

function updatePresenter() {
  if (!config.presenter) return;

  const previewContent = document.querySelector("#next-slide-preview .preview-content");
  if (previewContent) {
    const nextIndex = currentSlide + 1;
    previewContent.textContent = nextIndex < slides.length
      ? slides[nextIndex].content
      : "(end of presentation)";
  }

  const notesContent = document.querySelector("#presenter-notes .notes-content");
  if (notesContent) {
    const fm = slides[currentSlide]?.frontmatter;
    const notes = fm?.notes as string | undefined;
    notesContent.textContent = notes ?? "(no notes)";
  }
}

// ========================================================
// Navigation
// ========================================================
function goTo(index: number) {
  if (index < 0 || index >= slides.length || index === currentSlide) return;
  renderer.goTo(index);
  currentSlide = index;
  updateOverlay();
  updatePresenter();
  updateSpine(index);
  updateSlideNumber(index);
  animateGeosOnNav(index);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === " " || e.key === "ArrowDown") {
    e.preventDefault();
    goTo(currentSlide + 1);
  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    e.preventDefault();
    goTo(currentSlide - 1);
  }
});

// ========================================================
// HMR (hot reload)
// ========================================================
if (import.meta.hot) {
  import.meta.hot.on("slides:update", async (data: { slides: Slide[] }) => {
    slides = data.slides;
    if (currentSlide >= slides.length) currentSlide = slides.length - 1;
    if (currentSlide < 0) currentSlide = 0;

    container.innerHTML = "";
    renderer = renderSlides(container, slides);

    if (currentSlide > 0) renderer.goTo(currentSlide);

    // Rebuild spine for new slide count
    const nav = document.getElementById("gs-nav-spine");
    if (nav) nav.innerHTML = "";
    spineDots = [];
    spineProgressLine = null;
    buildNavSpine();
    updateSpine(currentSlide);

    updateOverlay();
    updatePresenter();
  });
}

// ========================================================
// Init
// ========================================================
createOverlayUI();
updateOverlay();
buildNavSpine();
updateSpine(0);

timerInterval = setInterval(updateTimer, 1000);
updateTimer();

// Kick off ambient animations
initOrbs();
initGeometries();

if (config.presenter) {
  setupPresenterMode();
  updatePresenter();
}
