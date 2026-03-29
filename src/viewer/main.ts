/**
 * Viewer entry point.
 *
 * Loads slides, renders them with GSAP, and wires up keyboard navigation.
 */

import { parseSlides } from "../parser/index.js";
import { renderSlides } from "../renderer/index.js";

const sampleMarkdown = `
# Welcome to gsap-slides

Create beautiful presentations with Markdown and GSAP

---

## Features

- Write slides in Markdown
- GSAP-powered animations
- Vite dev server with HMR

---

## Get Started

\`\`\`bash
npx gsap-slides dev slides.md
\`\`\`
`;

const container = document.getElementById("slides-container");
if (!container) throw new Error("Missing #slides-container element");

const slides = parseSlides(sampleMarkdown);

// Navigation is now handled internally by the renderer
renderSlides(container, slides, {
  transition: "fade",
  animation: "stagger",
});
