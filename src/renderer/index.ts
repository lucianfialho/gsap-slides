/**
 * HTML + GSAP renderer.
 *
 * Converts parsed slides into HTML elements and applies GSAP animations
 * for transitions, element animations, and navigation.
 */

import gsap from "gsap";
import type { Slide } from "../parser/index.js";
import {
  type TransitionName,
  type Direction,
  getTransition,
} from "./transitions.js";
import { type AnimationOptions, getAnimation } from "./animations.js";
import { setupNavigation, type NavigationCleanup } from "./navigation.js";

/* Re-export sub-modules for consumers */
export { getTransition, listTransitions } from "./transitions.js";
export type { TransitionName, TransitionFn, Direction } from "./transitions.js";
export { getAnimation, listAnimations } from "./animations.js";
export type { AnimationName, AnimationOptions } from "./animations.js";
export { setupNavigation } from "./navigation.js";
export type { NavigationCallbacks, NavigationCleanup } from "./navigation.js";

/** Options for the slide renderer. */
export interface RenderOptions {
  /** Default transition between slides (default: "fade"). */
  transition?: TransitionName | string;
  /** Element animation preset name. */
  animation?: string;
  /** Options forwarded to the element animation. */
  animationOptions?: AnimationOptions;
  /** Whether to bind keyboard/click/touch navigation (default: true). */
  navigation?: boolean;
}

/** Handle returned by renderSlides. */
export interface SlideController {
  /** Navigate to a specific slide by zero-based index. */
  goTo: (index: number) => void;
  /** Advance to the next slide. */
  next: () => void;
  /** Go back to the previous slide. */
  prev: () => void;
  /** Current slide index (read via getter). */
  readonly currentIndex: number;
  /** Total number of slides. */
  readonly total: number;
  /** Remove all event listeners. */
  destroy: () => void;
}

/**
 * Render an array of slides into a container element with GSAP transitions.
 */
export function renderSlides(
  container: HTMLElement,
  slides: Slide[],
  options: RenderOptions = {},
): SlideController {
  const {
    transition: transitionName = "fade",
    animation: animationName,
    animationOptions,
    navigation: enableNav = true,
  } = options;

  let currentIndex = 0;
  let isAnimating = false;
  let navCleanup: NavigationCleanup | undefined;
  let overviewActive = false;
  let activeElementTimeline: gsap.core.Timeline | undefined;

  // Resolve transition
  const transitionFn = getTransition(transitionName);

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
      gsap.set(el, { autoAlpha: 0 });
    }
    container.appendChild(el);
  });

  // Run element animation on the first slide
  const slideElements = () =>
    container.querySelectorAll<HTMLElement>(".gsap-slide");

  function runElementAnimation(slideEl: HTMLElement) {
    if (!animationName) return;
    // Kill previous element animation timeline to avoid leaks
    if (activeElementTimeline) {
      activeElementTimeline.kill();
      activeElementTimeline = undefined;
    }
    const animFn = getAnimation(animationName);
    if (animFn) {
      activeElementTimeline = animFn(slideEl, animationOptions);
    }
  }

  // Animate the first visible slide
  runElementAnimation(slideElements()[0]);

  function goTo(index: number) {
    if (index === currentIndex || index < 0 || index >= slides.length) return;
    if (isAnimating) return;
    if (overviewActive) return;

    isAnimating = true;

    const els = slideElements();
    const leaving = els[currentIndex];
    const entering = els[index];
    const direction: Direction = index > currentIndex ? 1 : -1;

    // Kill active element animation before transitioning away
    if (activeElementTimeline) {
      activeElementTimeline.kill();
      activeElementTimeline = undefined;
    }

    // Reset entering slide position
    gsap.set(entering, { x: "0%", y: "0%", scale: 1, rotationY: 0, rotationX: 0 });

    try {
      const tl = gsap.timeline({
        onComplete: () => {
          isAnimating = false;
          runElementAnimation(entering);
        },
      });

      transitionFn(tl, leaving, entering, direction);
    } catch {
      isAnimating = false;
    }
    currentIndex = index;
  }

  function next() {
    if (overviewActive) return;
    goTo(currentIndex + 1);
  }

  function prev() {
    if (overviewActive) return;
    goTo(currentIndex - 1);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      container.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  /** Listeners attached to slide elements during overview mode. */
  let overviewClickHandlers: Array<{ el: HTMLElement; handler: (e: Event) => void }> = [];

  function cleanupOverviewClicks() {
    overviewClickHandlers.forEach(({ el, handler }) => {
      el.removeEventListener("click", handler);
    });
    overviewClickHandlers = [];
  }

  function exitOverviewToSlide(index: number) {
    cleanupOverviewClicks();
    overviewActive = false;
    currentIndex = index;
    const els = slideElements();
    els.forEach((el, i) => {
      gsap.to(el, {
        autoAlpha: i === index ? 1 : 0,
        scale: 1,
        x: "0%",
        y: "0%",
        transformOrigin: "50% 50%",
        duration: 0.4,
        ease: "power2.out",
      });
    });
  }

  function toggleOverview() {
    const els = slideElements();
    overviewActive = !overviewActive;

    if (overviewActive) {
      const cols = Math.ceil(Math.sqrt(els.length));
      els.forEach((el, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        gsap.to(el, {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1 / cols,
          transformOrigin: `${col * (100 / (cols - 1 || 1))}% ${row * (100 / (cols - 1 || 1))}%`,
          duration: 0.4,
          ease: "power2.out",
        });

        // In overview, clicking a slide jumps to it and exits overview
        const handler = (e: Event) => {
          e.stopPropagation();
          exitOverviewToSlide(i);
        };
        el.addEventListener("click", handler);
        overviewClickHandlers.push({ el, handler });
      });
    } else {
      cleanupOverviewClicks();
      // Restore: hide all except current
      els.forEach((el, i) => {
        gsap.to(el, {
          autoAlpha: i === currentIndex ? 1 : 0,
          scale: 1,
          x: "0%",
          y: "0%",
          transformOrigin: "50% 50%",
          duration: 0.4,
          ease: "power2.out",
        });
      });
    }
  }

  // Wire up navigation
  if (enableNav) {
    navCleanup = setupNavigation(container, {
      next,
      prev,
      toggleFullscreen,
      toggleOverview,
    });
  }

  return {
    goTo,
    next,
    prev,
    get currentIndex() {
      return currentIndex;
    },
    total: slides.length,
    destroy() {
      if (activeElementTimeline) {
        activeElementTimeline.kill();
        activeElementTimeline = undefined;
      }
      cleanupOverviewClicks();
      navCleanup?.destroy();
    },
  };
}
