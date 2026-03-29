/**
 * Markdown slide parser.
 *
 * Splits a Markdown document into individual slides using `---` as the
 * slide separator.
 */

export interface Slide {
  /** Raw Markdown content of the slide */
  content: string;
  /** Zero-based index of the slide */
  index: number;
}

/**
 * Parse a Markdown string into an array of slides.
 * Slides are separated by a line containing only `---`.
 */
export function parseSlides(markdown: string): Slide[] {
  const parts = markdown.split(/\n---\n/);
  return parts.map((content, index) => ({
    content: content.trim(),
    index,
  }));
}
