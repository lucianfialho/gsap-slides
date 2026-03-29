import matter from "gray-matter";
import { Marked } from "marked";
import {
  createHighlighter,
  type Highlighter,
  type BundledLanguage,
} from "shiki";
import type { Slide, SlideElement, SlideFrontmatter } from "./types.js";

export type { Slide, SlideElement, SlideFrontmatter, GSAPVars } from "./types.js";

// Slide separator: a line containing only `---` that is NOT inside frontmatter.
// Frontmatter appears at the very start of a slide block (after splitting).
const SLIDE_SEPARATOR = "\n---\n";

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

  // Detect if the very first line is `---` (document-level frontmatter)
  let isFirstLine = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isSeparatorLine = line.trim() === "---";

    if (isFirstLine && isSeparatorLine) {
      // Opening frontmatter for the first slide
      isFirstLine = false;
      inFrontmatter = true;
      current.push(line);
      continue;
    }
    isFirstLine = false;

    if (inFrontmatter) {
      current.push(line);
      if (isSeparatorLine) {
        // Closing frontmatter delimiter
        inFrontmatter = false;
      }
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
 * Parse a complete Markdown string into an array of Slide objects.
 *
 * Slides are separated by `---` on its own line. Each slide can contain
 * YAML frontmatter at its top to configure transitions and animations.
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
export async function parseSlides(markdown: string): Promise<Slide[]> {
  const marked = await createMarkedInstance();
  const blocks = splitSlides(markdown);

  const slides = await Promise.all(
    blocks.map((block, index) => parseSlideBlock(block, index, marked)),
  );

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
