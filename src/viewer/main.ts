/**
 * Viewer entry point.
 *
 * Loads slides from the virtual module (injected by the dev server),
 * renders them with GSAP, and wires up keyboard navigation, slide
 * counter, progress bar, timer, and optional presenter mode.
 */

import { renderSlides } from "../renderer/index.js";

interface Slide {
  id: number;
  content: string;
  frontmatter: Record<string, any>;
  elements: any[];
}

// These virtual modules are provided by the Vite plugin in dev.ts.
// Slides arrive pre-parsed from the server (no gray-matter/shiki in browser).
let slides: Slide[];
let config: { presenter: boolean };

try {
  slides = (await import("virtual:slides-data")).default;
} catch {
  // Fallback for plain `vite dev` without the CLI
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

// ---- UI Overlays ------------------------------------------------------------

function createOverlayUI() {
  // Slide counter
  const counter = document.createElement("div");
  counter.id = "slide-counter";
  document.body.appendChild(counter);

  // Progress bar
  const progressWrap = document.createElement("div");
  progressWrap.id = "progress-bar-wrap";
  const progressFill = document.createElement("div");
  progressFill.id = "progress-bar-fill";
  progressWrap.appendChild(progressFill);
  document.body.appendChild(progressWrap);

  // Timer
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

// ---- Presenter Mode ---------------------------------------------------------

function setupPresenterMode() {
  document.body.classList.add("presenter-mode");

  const presenterPanel = document.createElement("div");
  presenterPanel.id = "presenter-panel";

  // Next slide preview
  const nextPreview = document.createElement("div");
  nextPreview.id = "next-slide-preview";
  nextPreview.innerHTML = "<h3>Next Slide</h3><div class='preview-content'></div>";
  presenterPanel.appendChild(nextPreview);

  // Notes
  const notesPanel = document.createElement("div");
  notesPanel.id = "presenter-notes";
  notesPanel.innerHTML = "<h3>Notes</h3><div class='notes-content'></div>";
  presenterPanel.appendChild(notesPanel);

  document.body.appendChild(presenterPanel);
}

function updatePresenter() {
  if (!config.presenter) return;

  // Update next slide preview
  const previewContent = document.querySelector("#next-slide-preview .preview-content");
  if (previewContent) {
    const nextIndex = currentSlide + 1;
    if (nextIndex < slides.length) {
      previewContent.textContent = slides[nextIndex].content;
    } else {
      previewContent.textContent = "(end of presentation)";
    }
  }

  // Update notes
  const notesContent = document.querySelector("#presenter-notes .notes-content");
  if (notesContent) {
    const fm = slides[currentSlide]?.frontmatter; const notes = fm?.notes as string | undefined;
    notesContent.textContent = notes ?? "(no notes)";
  }
}

// ---- Navigation -------------------------------------------------------------

function goTo(index: number) {
  if (index < 0 || index >= slides.length || index === currentSlide) return;
  renderer.goTo(index);
  currentSlide = index;
  updateOverlay();
  updatePresenter();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === " ") {
    e.preventDefault();
    goTo(currentSlide + 1);
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    goTo(currentSlide - 1);
  }
});

// ---- HMR (hot reload) -------------------------------------------------------

if (import.meta.hot) {
  import.meta.hot.on("slides:update", async (data: { slides: Slide[] }) => {
    // Receive pre-parsed slides from the server
    slides = data.slides;

    // Clamp currentSlide to valid range
    if (currentSlide >= slides.length) currentSlide = slides.length - 1;
    if (currentSlide < 0) currentSlide = 0;

    // Re-render
    container.innerHTML = "";
    renderer = renderSlides(container, slides);

    // Navigate to the current slide (instant, no animation needed for re-render)
    if (currentSlide > 0) {
      renderer.goTo(currentSlide);
    }

    updateOverlay();
    updatePresenter();
  });
}

// ---- Init -------------------------------------------------------------------

createOverlayUI();
updateOverlay();

timerInterval = setInterval(updateTimer, 1000);
updateTimer();

if (config.presenter) {
  setupPresenterMode();
  updatePresenter();
}
