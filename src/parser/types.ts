/**
 * GSAP animation properties that can be applied to slide transitions.
 */
export interface GSAPVars {
  x?: number | string;
  y?: number | string;
  opacity?: number;
  scale?: number;
  rotation?: number;
  duration?: number;
  ease?: string;
  delay?: number;
  stagger?: number;
  [key: string]: unknown;
}

/**
 * Represents an individual element within a slide that can be
 * independently animated.
 */
export interface SlideElement {
  selector: string;
  tag: string;
  content: string;
  attributes: Record<string, string>;
}

/**
 * Frontmatter configuration for a single slide, controlling
 * transitions, animations, and visual appearance.
 */
export interface SlideFrontmatter {
  transition?: string;
  duration?: number;
  animation?: string;
  enter?: GSAPVars;
  exit?: GSAPVars;
  background?: string;
  [key: string]: unknown;
}

/**
 * A fully parsed slide with HTML content, frontmatter configuration,
 * and individually targetable elements.
 */
export interface Slide {
  id: number;
  content: string;
  frontmatter: SlideFrontmatter;
  elements: SlideElement[];
}
