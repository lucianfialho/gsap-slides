/**
 * Element-level GSAP animations.
 *
 * Each animation targets child elements within a slide after the slide
 * transition completes.
 */

import gsap from "gsap";

/** Built-in animation preset names. */
export type AnimationName = "stagger" | "typewriter" | "draw" | "custom";

/** Options that can be passed through slide frontmatter. */
export interface AnimationOptions {
  /** Duration per element (seconds). Default varies by preset. */
  duration?: number;
  /** Stagger delay between elements (seconds). Default 0.15 */
  stagger?: number;
  /** Custom GSAP vars for the `custom` preset (enter state). */
  enter?: gsap.TweenVars;
}

/* ------------------------------------------------------------------ */
/*  Stagger                                                            */
/* ------------------------------------------------------------------ */

/**
 * Animate list items (li) or elements with `[data-animate]` one by one.
 */
export function stagger(
  slide: HTMLElement,
  opts: AnimationOptions = {},
): gsap.core.Timeline {
  const targets =
    slide.querySelectorAll("[data-animate]").length > 0
      ? slide.querySelectorAll("[data-animate]")
      : slide.querySelectorAll("li");

  const tl = gsap.timeline();

  if (targets.length === 0) return tl;

  tl.from(Array.from(targets), {
    autoAlpha: 0,
    y: 20,
    duration: opts.duration ?? 0.4,
    stagger: opts.stagger ?? 0.15,
    ease: "power2.out",
  });

  return tl;
}

/* ------------------------------------------------------------------ */
/*  Typewriter                                                         */
/* ------------------------------------------------------------------ */

/**
 * Typewriter effect: text appears character by character.
 * Targets the first `[data-typewriter]` element, or falls back to the
 * first `<p>` in the slide.
 */
export function typewriter(
  slide: HTMLElement,
  opts: AnimationOptions = {},
): gsap.core.Timeline {
  const target =
    slide.querySelector<HTMLElement>("[data-typewriter]") ??
    slide.querySelector<HTMLElement>("p");

  const tl = gsap.timeline();

  if (!target) return tl;

  // On first run, store the original text so revisits can restore it.
  const stored = target.getAttribute("data-typewriter-original");
  const fullText = stored ?? target.textContent ?? "";
  if (!stored) {
    target.setAttribute("data-typewriter-original", fullText);
  }
  target.textContent = "";
  target.style.visibility = "visible";

  const chars = fullText.split("");
  const perChar = (opts.duration ?? 1.5) / Math.max(chars.length, 1);

  chars.forEach((char, i) => {
    tl.call(
      () => {
        target.textContent += char;
      },
      [],
      i * perChar,
    );
  });

  return tl;
}

/* ------------------------------------------------------------------ */
/*  Draw (SVG path)                                                    */
/* ------------------------------------------------------------------ */

/**
 * Animate SVG `<path>` elements so they appear to draw themselves.
 * Uses stroke-dasharray / stroke-dashoffset.
 */
export function draw(
  slide: HTMLElement,
  opts: AnimationOptions = {},
): gsap.core.Timeline {
  const paths = slide.querySelectorAll<SVGPathElement>("path");
  const tl = gsap.timeline();

  if (paths.length === 0) return tl;

  paths.forEach((path) => {
    const length = path.getTotalLength();
    gsap.set(path, {
      strokeDasharray: length,
      strokeDashoffset: length,
    });
  });

  tl.to(Array.from(paths), {
    strokeDashoffset: 0,
    duration: opts.duration ?? 1.5,
    stagger: opts.stagger ?? 0.2,
    ease: "power2.inOut",
  });

  return tl;
}

/* ------------------------------------------------------------------ */
/*  Custom                                                             */
/* ------------------------------------------------------------------ */

/**
 * Apply custom GSAP vars supplied via frontmatter.
 * Animates from the `enter` vars to the element's natural state.
 */
export function custom(
  slide: HTMLElement,
  opts: AnimationOptions = {},
): gsap.core.Timeline {
  const tl = gsap.timeline();
  const enterVars = opts.enter;
  if (!enterVars) return tl;

  const targets =
    slide.querySelectorAll("[data-animate]").length > 0
      ? slide.querySelectorAll("[data-animate]")
      : [slide];

  tl.from(Array.from(targets), {
    ...enterVars,
    duration: opts.duration ?? 0.6,
    stagger: opts.stagger ?? 0,
    ease: "power2.out",
  });

  return tl;
}

/* ------------------------------------------------------------------ */
/*  Registry                                                           */
/* ------------------------------------------------------------------ */

type AnimationFn = (
  slide: HTMLElement,
  opts?: AnimationOptions,
) => gsap.core.Timeline;

const animationMap: Record<AnimationName, AnimationFn> = {
  stagger,
  typewriter,
  draw,
  custom,
};

/**
 * Resolve an animation name to its function.
 * Returns `undefined` for unknown names (no animation applied).
 */
export function getAnimation(name: string): AnimationFn | undefined {
  return animationMap[name as AnimationName];
}

/** List every built-in animation name. */
export function listAnimations(): AnimationName[] {
  return Object.keys(animationMap) as AnimationName[];
}
