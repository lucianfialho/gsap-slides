/**
 * GSAP-powered slide transition presets.
 *
 * Each transition factory returns a function that receives the exiting element,
 * entering element, and a shared gsap.timeline, then appends the appropriate
 * tweens.
 */

import gsap from "gsap";

/** Direction of navigation: 1 = forward, -1 = backward */
export type Direction = 1 | -1;

/**
 * A transition function appends enter/exit tweens to the provided timeline.
 */
export type TransitionFn = (
  timeline: gsap.core.Timeline,
  leaving: HTMLElement,
  entering: HTMLElement,
  direction: Direction,
) => void;

/** All built-in transition names. */
export type TransitionName =
  | "fade"
  | "slideLeft"
  | "slideRight"
  | "slideUp"
  | "slideDown"
  | "zoom"
  | "flip"
  | "none";

/* ------------------------------------------------------------------ */
/*  Preset implementations                                            */
/* ------------------------------------------------------------------ */

const fade: TransitionFn = (tl, leaving, entering, _dir) => {
  tl.to(leaving, { autoAlpha: 0, duration: 0.6, ease: "power2.inOut" });
  tl.fromTo(
    entering,
    { autoAlpha: 0 },
    { autoAlpha: 1, duration: 0.6, ease: "power2.inOut" },
    "<",
  );
};

const slideLeft: TransitionFn = (tl, leaving, entering, _dir) => {
  tl.to(leaving, {
    x: "-100%",
    autoAlpha: 0,
    duration: 0.6,
    ease: "power2.inOut",
  });
  tl.fromTo(
    entering,
    { x: "100%", autoAlpha: 0 },
    { x: "0%", autoAlpha: 1, duration: 0.6, ease: "power2.inOut" },
    "<",
  );
};

const slideRight: TransitionFn = (tl, leaving, entering, _dir) => {
  tl.to(leaving, {
    x: "100%",
    autoAlpha: 0,
    duration: 0.6,
    ease: "power2.inOut",
  });
  tl.fromTo(
    entering,
    { x: "-100%", autoAlpha: 0 },
    { x: "0%", autoAlpha: 1, duration: 0.6, ease: "power2.inOut" },
    "<",
  );
};

const slideUp: TransitionFn = (tl, leaving, entering, _dir) => {
  tl.to(leaving, {
    y: "-100%",
    autoAlpha: 0,
    duration: 0.6,
    ease: "power2.inOut",
  });
  tl.fromTo(
    entering,
    { y: "100%", autoAlpha: 0 },
    { y: "0%", autoAlpha: 1, duration: 0.6, ease: "power2.inOut" },
    "<",
  );
};

const slideDown: TransitionFn = (tl, leaving, entering, _dir) => {
  tl.to(leaving, {
    y: "100%",
    autoAlpha: 0,
    duration: 0.6,
    ease: "power2.inOut",
  });
  tl.fromTo(
    entering,
    { y: "-100%", autoAlpha: 0 },
    { y: "0%", autoAlpha: 1, duration: 0.6, ease: "power2.inOut" },
    "<",
  );
};

const zoom: TransitionFn = (tl, leaving, entering, _dir) => {
  tl.to(leaving, {
    scale: 0.5,
    autoAlpha: 0,
    duration: 0.6,
    ease: "power2.inOut",
  });
  tl.fromTo(
    entering,
    { scale: 1.5, autoAlpha: 0 },
    { scale: 1, autoAlpha: 1, duration: 0.6, ease: "power2.inOut" },
    "<",
  );
};

const flip: TransitionFn = (tl, leaving, entering, direction) => {
  const axis = direction === 1 ? "rotationY" : "rotationY";
  tl.to(leaving, {
    [axis]: direction * -90,
    autoAlpha: 0,
    duration: 0.4,
    ease: "power2.in",
    transformPerspective: 1000,
  });
  tl.fromTo(
    entering,
    { [axis]: direction * 90, autoAlpha: 0, transformPerspective: 1000 },
    {
      [axis]: 0,
      autoAlpha: 1,
      duration: 0.4,
      ease: "power2.out",
      transformPerspective: 1000,
    },
    ">-0.1",
  );
};

const none: TransitionFn = (tl, leaving, entering, _dir) => {
  tl.set(leaving, { autoAlpha: 0 });
  tl.set(entering, { autoAlpha: 1 });
};

/* ------------------------------------------------------------------ */
/*  Registry                                                          */
/* ------------------------------------------------------------------ */

const transitionMap: Record<TransitionName, TransitionFn> = {
  fade,
  slideLeft,
  slideRight,
  slideUp,
  slideDown,
  zoom,
  flip,
  none,
};

/**
 * Resolve a transition name to its function.
 * Falls back to `fade` for unknown names.
 */
export function getTransition(name: string): TransitionFn {
  return transitionMap[name as TransitionName] ?? transitionMap.fade;
}

/** List every built-in transition name. */
export function listTransitions(): TransitionName[] {
  return Object.keys(transitionMap) as TransitionName[];
}
