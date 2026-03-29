import matter from "gray-matter";
import { Marked } from "marked";
import {
  createHighlighter,
  type Highlighter,
  type BundledLanguage,
} from "shiki";
import type { Slide, SlideElement, SlideFrontmatter } from "./types.js";

export type { Slide, SlideElement, SlideFrontmatter, GSAPVars } from "./types.js";

/**
 * Cached Shiki highlighter instance. Created lazily on first call.
 */
let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark", "github-light"],
      langs: [
        "javascript",
        "typescript",
        "html",
        "css",
        "json",
        "bash",
        "python",
        "markdown",
        "yaml",
        "jsx",
        "tsx",
      ],
    });
  }
  return highlighterPromise;
}

/**
 * Load an additional language into the highlighter on demand.
 */
async function ensureLanguage(
  highlighter: Highlighter,
  lang: string,
): Promise<boolean> {
  const loaded = highlighter.getLoadedLanguages();
  if (loaded.includes(lang)) return true;
  try {
    await highlighter.loadLanguage(lang as BundledLanguage);
    return true;
  } catch {
    return false;
  }
}

/**
 * Build a Marked instance with Shiki-powered syntax highlighting.
 */
async function createMarkedInstance(): Promise<Marked> {
  const highlighter = await getHighlighter();
  const marked = new Marked();

  marked.use({
    renderer: {
      code({ text, lang }: { text: string; lang?: string | null }) {
        // Shiki highlighting is sync once the highlighter is ready,
        // but we pre-loaded common languages above. For unknown langs
        // we fall back to plain text.
        const language = lang ?? "text";

        // Check if language is loaded; if not, use "text" as fallback.
        const loaded = highlighter.getLoadedLanguages();
        const safeLang = loaded.includes(language) ? language : "text";

        return highlighter.codeToHtml(text, {
          lang: safeLang,
          theme: "github-dark",
        });
      },
    },
  });

  return marked;
}

/**
 * Extract SlideElement entries from an HTML string by finding
 * top-level heading, paragraph, list, image, pre, and blockquote tags.
 */
function extractElements(html: string): SlideElement[] {
  const elements: SlideElement[] = [];
  // Match top-level block elements
  const tagPattern =
    /<(h[1-6]|p|ul|ol|li|img|pre|blockquote|table|figure|video|audio)(\s[^>]*)?\/?>([\s\S]*?)<\/\1>|<(img|hr|br)(\s[^>]*)?\/?\s*>/gi;

  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = tagPattern.exec(html)) !== null) {
    const tag = (match[1] ?? match[4]).toLowerCase();
    const attrString = match[2] ?? match[5] ?? "";
    const innerContent = match[3] ?? "";

    const attributes: Record<string, string> = {};
    const attrPattern = /(\w[\w-]*)=["']([^"']*?)["']/g;
    let attrMatch: RegExpExecArray | null;
    while ((attrMatch = attrPattern.exec(attrString)) !== null) {
      attributes[attrMatch[1]] = attrMatch[2];
    }

    elements.push({
      selector: `[data-slide-element="${index}"]`,
      tag,
      content: innerContent.trim(),
      attributes,
    });
    index++;
  }

  return elements;
}

/**
 * Split raw markdown into individual slide blocks.
 *
 * Convention (matching Slidev/Marp):
 * - `---` on its own line is always a slide separator
 * - If the document starts with `---`, the first `---...---` block is
 *   frontmatter for slide 0 (not a separator)
 * - After each separator, if the next non-empty content starts with
 *   `---` immediately followed by YAML and closed by `---`, that is
 *   frontmatter for that slide
 *
 * We process line-by-line to correctly distinguish frontmatter delimiters
 * from slide separators.
 */
function splitSlides(markdown: string): string[] {
  const normalised = markdown.replace(/\r\n/g, "\n").trim();
  if (normalised.length === 0) return [];

  const lines = normalised.split("\n");
  const blocks: string[] = [];
  let current: string[] = [];
  let inFrontmatter = false;
  let inCodeBlock = false;

  // Detect if the very first line is `---` (document-level frontmatter)
  let isFirstLine = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    const isSeparatorLine = trimmedLine === "---";

    // Track fenced code block state (``` or ~~~)
    if (!inFrontmatter && /^(`{3,}|~{3,})/.test(trimmedLine)) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        current.push(line);
        continue;
      } else {
        // Closing fence
        inCodeBlock = false;
        current.push(line);
        continue;
      }
    }

    // While inside a code block, never treat --- as separator
    if (inCodeBlock) {
      current.push(line);
      continue;
    }

    if (isFirstLine && isSeparatorLine) {
      // Opening frontmatter for the first slide
      isFirstLine = false;
      inFrontmatter = true;
      current.push(line);
      continue;
    }
    isFirstLine = false;

    if (inFrontmatter) {
      if (isSeparatorLine) {
        // Closing frontmatter delimiter
        current.push(line);
        inFrontmatter = false;
        continue;
      }

      // Safeguard: detect non-YAML content that indicates frontmatter was
      // never properly closed. Markdown headings, blank lines followed by
      // non-key-value content, or lines without a colon are signs.
      const looksLikeYaml = /^\s*[\w][\w\s-]*:/.test(line) || trimmedLine === "";
      if (!looksLikeYaml && /^#{1,6}\s/.test(trimmedLine)) {
        // This is a markdown heading — frontmatter was not closed.
        // Rewind: treat the opening --- as a separator instead, and
        // re-process all buffered lines as regular content.
        inFrontmatter = false;
        // Remove the leading --- from current (it was the unclosed opener)
        if (current.length > 0 && current[0].trim() === "---") {
          current.shift();
        }
        current.push(line);
        continue;
      }

      current.push(line);
      continue;
    }

    if (isSeparatorLine) {
      // This is a slide separator. Flush current block.
      const blockContent = current.join("\n").trim();
      if (blockContent.length > 0) {
        blocks.push(blockContent);
      }
      current = [];

      // Peek ahead: if the next non-empty line is `---`, it opens
      // frontmatter for the next slide. Skip to it and push the
      // opening delimiter into current so the loop picks up the
      // closing delimiter.
      let peek = i + 1;
      while (peek < lines.length && lines[peek].trim() === "") {
        peek++;
      }
      if (peek < lines.length && lines[peek].trim() === "---") {
        // Advance i past blank lines to the opening ---
        i = peek;
        current.push(lines[i]);
        inFrontmatter = true;
      }
      continue;
    }

    current.push(line);
  }

  // Flush remaining
  const lastBlock = current.join("\n").trim();
  if (lastBlock.length > 0) {
    blocks.push(lastBlock);
  }

  return blocks;
}

/**
 * Parse a single slide block (frontmatter + markdown body) into a Slide object.
 */
async function parseSlideBlock(
  block: string,
  id: number,
  marked: Marked,
): Promise<Slide> {
  const { data, content } = matter(block);
  const frontmatter: SlideFrontmatter = data;

  const html = await marked.parse(content);
  const elements = extractElements(html);

  return {
    id,
    content: html,
    frontmatter,
    elements,
  };
}

/**
 * Options for {@link parseSlides}.
 */
export interface ParseSlidesOptions {
  /**
   * When `true`, strip `<script>` tags and inline event handler attributes
   * (e.g. `onclick`, `onerror`) from the rendered HTML. Defaults to `false`.
   */
  sanitize?: boolean;
}

/**
 * Sanitize HTML by removing `<script>` tags and inline event handler
 * attributes (`on*="..."`).
 */
function sanitizeHtml(html: string): string {
  // Remove <script>...</script> and self-closing <script ... />
  let result = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  result = result.replace(/<script\b[^>]*\/?\s*>/gi, "");
  // Remove on* event handler attributes
  result = result.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  return result;
}

/**
 * Parse a complete Markdown string into an array of Slide objects.
 *
 * Slides are separated by `---` on its own line. Each slide can contain
 * YAML frontmatter at its top to configure transitions and animations.
 *
 * @security **This function renders raw HTML by default.** Marked allows
 * arbitrary HTML passthrough, which means untrusted input may contain
 * `<script>` tags, event handlers (`onclick`, `onerror`, etc.), or other
 * XSS vectors. Only pass **trusted** Markdown to this function, or enable
 * the `sanitize` option to strip script tags and event handlers.
 *
 * @example
 * ```ts
 * const slides = await parseSlides(`
 * ---
 * transition: fade
 * duration: 0.5
 * ---
 * # Welcome
 *
 * First slide content
 *
 * ---
 *
 * ---
 * animation: slideLeft
 * ---
 * # Second Slide
 *
 * More content here
 * `);
 * ```
 */
export async function parseSlides(
  markdown: string,
  options?: ParseSlidesOptions,
): Promise<Slide[]> {
  const marked = await createMarkedInstance();
  const blocks = splitSlides(markdown);

  const slides = await Promise.all(
    blocks.map((block, index) => parseSlideBlock(block, index, marked)),
  );

  if (options?.sanitize) {
    for (const slide of slides) {
      slide.content = sanitizeHtml(slide.content);
    }
  }

  return slides;
}

/**
 * Pre-load an additional Shiki language so it is available for
 * code block highlighting.
 */
export async function loadLanguage(lang: string): Promise<boolean> {
  const highlighter = await getHighlighter();
  return ensureLanguage(highlighter, lang);
}

/**
 * Extract simple key: value frontmatter from the beginning of a raw
 * Markdown slide block (without --- delimiters). Lightweight utility
 * for quick extraction without the full async pipeline.
 */
export function extractFrontmatter(raw: string): {
  content: string;
  frontmatter?: Record<string, string>;
} {
  const lines = raw.split("\n");
  const fm: Record<string, string> = {};
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;
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
 * Extract presenter notes from a slide's raw Markdown content.
 * Notes are wrapped in HTML comment blocks.
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
