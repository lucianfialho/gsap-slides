/**
 * Markdown slide parser.
 *
 * Splits a Markdown document into individual slides using `---` as the
 * slide separator.  Extracts optional frontmatter (YAML-style key/value
 * pairs) and presenter notes from each slide.
 */

export interface SlideFrontmatter {
  [key: string]: string;
}

export interface Slide {
  /** Raw Markdown content of the slide (without frontmatter or notes) */
  content: string;
  /** Zero-based index of the slide */
  index: number;
  /** Optional frontmatter key/value pairs */
  frontmatter?: SlideFrontmatter;
  /** Optional presenter notes extracted from <!-- notes ... --> blocks */
  notes?: string;
}

/**
 * Extract frontmatter from the beginning of a slide's raw text.
 * Frontmatter is a block of `key: value` lines that appears before any
 * Markdown heading or content.  Returns the remaining content and the
 * parsed key/value pairs.
 */
export function extractFrontmatter(raw: string): {
  content: string;
  frontmatter?: SlideFrontmatter;
} {
  // Frontmatter lines look like "key: value" at the very start of the block
  const lines = raw.split("\n");
  const fm: SlideFrontmatter = {};
  let i = 0;

  // Skip leading blank lines
  while (i < lines.length && lines[i].trim() === "") i++;

  // Collect key: value lines
  while (i < lines.length) {
    const match = lines[i].match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*:\s*(.+)$/);
    if (match) {
      fm[match[1]] = match[2].trim();
      i++;
    } else {
      break;
    }
  }

  if (Object.keys(fm).length === 0) {
    return { content: raw };
  }

  const remaining = lines.slice(i).join("\n");
  return { content: remaining, frontmatter: fm };
}

/**
 * Extract presenter notes from a slide's content.
 * Notes are wrapped in `<!-- notes ... -->` HTML comments.
 */
export function extractNotes(raw: string): {
  content: string;
  notes?: string;
} {
  const notesRegex = /<!--\s*notes\s*\n([\s\S]*?)-->/;
  const match = raw.match(notesRegex);
  if (!match) return { content: raw };

  const notes = match[1].trim();
  const content = raw.replace(notesRegex, "").trim();
  return { content, notes };
}

/**
 * Parse a Markdown string into an array of slides.
 * Slides are separated by a line containing only `---`.
 */
export function parseSlides(markdown: string): Slide[] {
  const parts = markdown.split(/\n---\n/);
  return parts.map((raw, index) => {
    const trimmed = raw.trim();
    const { content: afterFm, frontmatter } = extractFrontmatter(trimmed);
    const { content, notes } = extractNotes(afterFm.trim());

    const slide: Slide = { content, index };
    if (frontmatter) slide.frontmatter = frontmatter;
    if (notes) slide.notes = notes;
    return slide;
  });
}
