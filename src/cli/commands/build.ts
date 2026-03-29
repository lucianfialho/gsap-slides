/**
 * Static HTML build command.
 *
 * Uses Vite's build API to produce a single, self-contained HTML file
 * with all assets inlined. The output works offline and can be hosted
 * anywhere.
 */

import { build as viteBuild } from "vite";
import { resolve, dirname } from "path";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Resolve a path relative to the package root (two levels up from commands/) */
function pkgRoot(): string {
  // In built output: dist/cli/commands/build.js -> go up 3
  // We look for the src directory as a heuristic
  let dir = __dirname;
  for (let i = 0; i < 5; i++) {
    const candidate = resolve(dir, "src/parser/index.ts");
    try {
      readFileSync(candidate);
      return dir;
    } catch {
      dir = dirname(dir);
    }
  }
  // Fallback: assume cwd is inside the package
  return process.cwd();
}

/**
 * Generate the viewer HTML that embeds the markdown content and
 * inlines the parser + renderer + GSAP.
 */
export function generateSlideHTML(markdown: string): string {
  // JSON.stringify + replace </script to prevent breaking out of <script> tags
  const escapedMarkdown = JSON.stringify(markdown).replace(
    /<\/(script)/gi,
    "<\\/$1",
  );

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>gsap-slides</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body {
        width: 100%; height: 100%; overflow: hidden;
        font-family: system-ui, -apple-system, sans-serif;
        background: #1a1a2e; color: #eee;
      }
      #slides-container {
        position: relative; width: 100%; height: 100%;
      }
      .gsap-slide {
        padding: 2rem; font-size: 2rem; text-align: center;
        flex-direction: column; gap: 1rem;
      }
      .gsap-slide h1 { font-size: 3rem; margin-bottom: 1rem; }
    </style>
  </head>
  <body>
    <div id="slides-container"></div>
    <script type="module">
      window.__GSAP_SLIDES_MD__ = ${escapedMarkdown};
    </script>
    <script type="module" src="./entry.ts"></script>
  </body>
</html>`;
}

/**
 * Generate the entry point TS that reads the injected markdown and
 * boots the viewer. Uses absolute aliased imports that Vite will resolve.
 */
export function generateEntryScript(): string {
  return `import { parseSlides } from "@gsap-slides/parser";
import { renderSlides } from "@gsap-slides/renderer";

const markdown = (window as any).__GSAP_SLIDES_MD__ as string;

const container = document.getElementById("slides-container");
if (!container) throw new Error("Missing #slides-container element");

const slides = parseSlides(markdown);
const { goTo } = renderSlides(container, slides);

let currentSlide = 0;

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === " ") {
    e.preventDefault();
    currentSlide = Math.min(currentSlide + 1, slides.length - 1);
    goTo(currentSlide);
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    currentSlide = Math.max(currentSlide - 1, 0);
    goTo(currentSlide);
  }
});
`;
}

export interface BuildOptions {
  /** Path to the markdown file */
  file: string;
  /** Output directory */
  output: string;
}

/**
 * Build a self-contained static HTML slide deck.
 *
 * 1. Reads the markdown source
 * 2. Creates a temporary Vite build root with the markdown injected
 * 3. Runs Vite build with vite-plugin-singlefile to inline everything
 * 4. Writes output/index.html
 */
export async function buildSlides(options: BuildOptions): Promise<string> {
  const { file, output } = options;

  const markdownPath = resolve(process.cwd(), file);
  const markdown = readFileSync(markdownPath, "utf-8");
  const outDir = resolve(process.cwd(), output);

  // Locate the package source directory for the parser and renderer
  const root = pkgRoot();
  const parserPath = resolve(root, "src/parser/index.ts");
  const rendererPath = resolve(root, "src/renderer/index.ts");

  // Create a temporary build directory
  const tmpDir = resolve(outDir, ".gsap-slides-tmp");
  mkdirSync(tmpDir, { recursive: true });

  writeFileSync(resolve(tmpDir, "index.html"), generateSlideHTML(markdown));
  writeFileSync(resolve(tmpDir, "entry.ts"), generateEntryScript());

  try {
    const { viteSingleFile } = await import("vite-plugin-singlefile");

    await viteBuild({
      root: tmpDir,
      logLevel: "warn",
      plugins: [viteSingleFile()],
      build: {
        outDir,
        emptyOutDir: false,
        rollupOptions: {
          input: resolve(tmpDir, "index.html"),
        },
      },
      resolve: {
        alias: {
          "@gsap-slides/parser": parserPath,
          "@gsap-slides/renderer": rendererPath,
        },
      },
    });

    const outputPath = resolve(outDir, "index.html");
    return outputPath;
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}
