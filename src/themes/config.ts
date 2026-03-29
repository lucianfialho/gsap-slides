/**
 * Config file loading logic for gsap-slides.
 *
 * Loads gsap-slides.config.js (or .ts) from the project root
 * and merges with defaults.
 */

import type { SlideConfig } from "./index.js";
import { resolveConfig } from "./index.js";

/** Supported config file names, checked in order */
export const CONFIG_FILE_NAMES = [
  "gsap-slides.config.js",
  "gsap-slides.config.ts",
  "gsap-slides.config.mjs",
] as const;

/**
 * Load a config object from a raw imported module.
 * Handles both default exports and named exports.
 */
export function parseConfigModule(mod: unknown): SlideConfig {
  if (mod === null || mod === undefined) return {};

  if (typeof mod === "object") {
    const obj = mod as Record<string, unknown>;
    // Handle { default: ... } (ES module default export)
    if ("default" in obj && typeof obj.default === "object" && obj.default !== null) {
      return obj.default as SlideConfig;
    }
    return obj as SlideConfig;
  }

  return {};
}

/**
 * Resolve a user config into a fully populated config with defaults applied.
 */
export function loadConfig(userConfig: SlideConfig = {}): Required<SlideConfig> {
  return resolveConfig(userConfig);
}

/**
 * Validate a config object and return any warnings.
 */
export function validateConfig(config: SlideConfig): string[] {
  const warnings: string[] = [];

  if (config.theme && !["dark", "light", "minimal", "hacker"].includes(config.theme)) {
    warnings.push(
      `Unknown theme "${config.theme}". Available themes: dark, light, minimal, hacker.`,
    );
  }

  if (config.accentColor && !/^#[0-9a-fA-F]{3,8}$/.test(config.accentColor)) {
    warnings.push(
      `Invalid accent color "${config.accentColor}". Use a valid hex color (e.g., #3b82f6).`,
    );
  }

  if (config.transition?.duration !== undefined) {
    if (config.transition.duration < 0 || config.transition.duration > 10) {
      warnings.push(
        `Transition duration ${config.transition.duration}s is out of recommended range (0-10s).`,
      );
    }
  }

  if (config.slide?.width !== undefined && config.slide.width <= 0) {
    warnings.push("Slide width must be a positive number.");
  }

  if (config.slide?.height !== undefined && config.slide.height <= 0) {
    warnings.push("Slide height must be a positive number.");
  }

  return warnings;
}
