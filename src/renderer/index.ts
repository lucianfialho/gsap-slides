/**
 * HTML + GSAP renderer.
 *
 * Converts parsed slides into HTML elements and applies GSAP animations
 * for transitions.
 */

import gsap from "gsap";
import type { Slide } from "../parser/index.js";

/**
 * Render an array of slides into a container element with GSAP transitions.
 */
export function renderSlides(
  container: HTMLElement,
  slides: Slide[],
): { goTo: (index: number) => void } {
  let currentIndex = 0;

  // Create slide elements
  slides.forEach((slide, i) => {
    const el = document.createElement("section");
    el.className = "gsap-slide";
    el.innerHTML = slide.content;
    el.style.position = "absolute";
    el.style.inset = "0";
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    if (i !== 0) {
      gsap.set(el, { autoAlpha: 0, x: "100%" });
    }
    container.appendChild(el);
  });

  function goTo(index: number) {
    if (index === currentIndex || index < 0 || index >= slides.length) return;

    const slideElements = container.querySelectorAll<HTMLElement>(".gsap-slide");
    const current = slideElements[currentIndex];
    const next = slideElements[index];
    const direction = index > currentIndex ? 1 : -1;

    const tl = gsap.timeline();
    tl.to(current, {
      x: `${-100 * direction}%`,
      autoAlpha: 0,
      duration: 0.6,
      ease: "power2.inOut",
    });
    tl.fromTo(
      next,
      { x: `${100 * direction}%`, autoAlpha: 0 },
      { x: "0%", autoAlpha: 1, duration: 0.6, ease: "power2.inOut" },
      "<",
    );

    currentIndex = index;
  }

  return { goTo };
}
