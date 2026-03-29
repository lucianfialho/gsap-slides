/**
 * CSS variable generation for gsap-slides themes.
 *
 * Generates CSS custom property declarations from theme definitions
 * and config, including per-slide overrides.
 */

import type { ThemeDefinition, SlideConfig, SlideOverrides } from "./index.js";
import { getTheme, resolveConfig } from "./index.js";

/**
 * Generate a CSS string with custom property declarations for a theme.
 * Applies accent color override from the config if provided.
 */
export function generateThemeCSS(config: SlideConfig = {}): string {
  const resolved = resolveConfig(config);
  const theme = getTheme(resolved.theme);

  const variables = { ...theme.variables };

  // Override accent color if custom one is specified
  if (resolved.accentColor !== variables["--gs-accent"]) {
    variables["--gs-accent"] = resolved.accentColor;
  }

  // Add font variables
  variables["--gs-font-heading"] = resolved.fonts.heading;
  variables["--gs-font-body"] = resolved.fonts.body;
  variables["--gs-font-code"] = resolved.fonts.code;

  // Add slide dimension variables
  variables["--gs-slide-width"] = `${resolved.slide.width}px`;
  variables["--gs-slide-height"] = `${resolved.slide.height}px`;
  variables["--gs-slide-padding"] = resolved.slide.padding;

  const declarations = Object.entries(variables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");

  return `:root {\n${declarations}\n}`;
}

/**
 * Generate inline style overrides for a single slide.
 * Used for per-slide background/color customization via frontmatter.
 */
export function generateSlideOverrideStyle(overrides: SlideOverrides): string {
  const styles: string[] = [];

  if (overrides.background) {
    styles.push(`background: ${overrides.background}`);
  }
  if (overrides.color) {
    styles.push(`color: ${overrides.color}`);
  }

  return styles.join("; ");
}

/**
 * Build a complete CSS variables object (as a flat record) from theme + config.
 * Useful for programmatic access to resolved variable values.
 */
export function resolveThemeVariables(
  config: SlideConfig = {},
): Record<string, string> {
  const resolved = resolveConfig(config);
  const theme = getTheme(resolved.theme);

  const variables = { ...theme.variables };

  if (resolved.accentColor !== variables["--gs-accent"]) {
    variables["--gs-accent"] = resolved.accentColor;
  }

  variables["--gs-font-heading"] = resolved.fonts.heading;
  variables["--gs-font-body"] = resolved.fonts.body;
  variables["--gs-font-code"] = resolved.fonts.code;
  variables["--gs-slide-width"] = `${resolved.slide.width}px`;
  variables["--gs-slide-height"] = `${resolved.slide.height}px`;
  variables["--gs-slide-padding"] = resolved.slide.padding;

  return variables;
}

/**
 * Apply theme CSS variables to a given HTML element.
 */
export function applyThemeToElement(
  element: HTMLElement,
  config: SlideConfig = {},
): void {
  const variables = resolveThemeVariables(config);
  for (const [key, value] of Object.entries(variables)) {
    element.style.setProperty(key, value);
  }
}

/**
 * Apply per-slide overrides to an individual slide element.
 */
export function applySlideOverrides(
  element: HTMLElement,
  overrides: SlideOverrides,
): void {
  if (overrides.background) {
    element.style.background = overrides.background;
  }
  if (overrides.color) {
    element.style.color = overrides.color;
  }
}
