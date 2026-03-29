/**
 * Font loading for gsap-slides themes.
 *
 * Supports loading Google Fonts or detecting local fonts.
 * Generates appropriate <link> or @font-face declarations.
 */

import type { SlideConfig } from "./index.js";
import { resolveConfig } from "./index.js";

/**
 * Build a Google Fonts URL for the configured font families.
 * Deduplicates fonts and includes common weights.
 */
export function buildGoogleFontsUrl(config: SlideConfig = {}): string {
  const resolved = resolveConfig(config);

  const fontSet = new Set<string>();
  if (resolved.fonts.heading) fontSet.add(resolved.fonts.heading);
  if (resolved.fonts.body) fontSet.add(resolved.fonts.body);
  if (resolved.fonts.code) fontSet.add(resolved.fonts.code);

  if (fontSet.size === 0) return "";

  const families = Array.from(fontSet)
    .map((font) => {
      const encoded = font.replace(/\s+/g, "+");
      return `family=${encoded}:wght@400;500;600;700`;
    })
    .join("&");

  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

/**
 * Generate a <link> element string for Google Fonts.
 * Returns an empty string if no fonts are configured.
 */
export function generateFontLinkTag(config: SlideConfig = {}): string {
  const url = buildGoogleFontsUrl(config);
  if (!url) return "";
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${url}">`;
}

/**
 * Generate CSS @font-face rules for locally hosted font files.
 */
export function generateLocalFontCSS(
  fontName: string,
  fontPaths: { weight: number; path: string; style?: string }[],
): string {
  return fontPaths
    .map(
      ({ weight, path, style = "normal" }) =>
        `@font-face {
  font-family: '${fontName}';
  src: url('${path}');
  font-weight: ${weight};
  font-style: ${style};
  font-display: swap;
}`,
    )
    .join("\n\n");
}

/**
 * Generate the base typography CSS that applies font variables to elements.
 */
export function generateTypographyCSS(): string {
  return `body, .gsap-slide {
  font-family: var(--gs-font-body), system-ui, sans-serif;
  color: var(--gs-text);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--gs-font-heading), system-ui, sans-serif;
  color: var(--gs-heading);
}

code, pre {
  font-family: var(--gs-font-code), 'Courier New', monospace;
}

pre {
  background: var(--gs-code-bg);
  color: var(--gs-code-text);
  padding: 1em;
  border-radius: 8px;
  overflow-x: auto;
}`;
}

/**
 * Inject font loading tags into the document head (browser only).
 */
export function injectFonts(config: SlideConfig = {}): void {
  if (typeof document === "undefined") return;

  const url = buildGoogleFontsUrl(config);
  if (!url) return;

  // Avoid duplicate injection
  const existing = document.querySelector(`link[href="${url}"]`);
  if (existing) return;

  const preconnect1 = document.createElement("link");
  preconnect1.rel = "preconnect";
  preconnect1.href = "https://fonts.googleapis.com";
  document.head.appendChild(preconnect1);

  const preconnect2 = document.createElement("link");
  preconnect2.rel = "preconnect";
  preconnect2.href = "https://fonts.gstatic.com";
  preconnect2.crossOrigin = "";
  document.head.appendChild(preconnect2);

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);
}
