/**
 * Theme definitions for gsap-slides.
 *
 * Provides 4 built-in themes: dark, light, minimal, and hacker.
 * Each theme defines CSS variable values for consistent styling.
 */

export interface ThemeDefinition {
  /** Unique theme identifier */
  name: string;
  /** CSS variable values */
  variables: Record<string, string>;
}

export interface SlideConfig {
  theme?: string;
  accentColor?: string;
  fonts?: {
    heading?: string;
    body?: string;
    code?: string;
  };
  transition?: {
    default?: string;
    duration?: number;
    ease?: string;
  };
  slide?: {
    width?: number;
    height?: number;
    padding?: string;
  };
}

export interface SlideOverrides {
  background?: string;
  color?: string;
}

const darkTheme: ThemeDefinition = {
  name: "dark",
  variables: {
    "--gs-bg": "#1a1a2e",
    "--gs-bg-secondary": "#16213e",
    "--gs-text": "#eaeaea",
    "--gs-text-secondary": "#a0a0b0",
    "--gs-accent": "#3b82f6",
    "--gs-accent-hover": "#2563eb",
    "--gs-code-bg": "#0f0f23",
    "--gs-code-text": "#e2e8f0",
    "--gs-code-keyword": "#c084fc",
    "--gs-code-string": "#86efac",
    "--gs-code-comment": "#6b7280",
    "--gs-border": "#2d2d44",
    "--gs-heading": "#f8fafc",
  },
};

const lightTheme: ThemeDefinition = {
  name: "light",
  variables: {
    "--gs-bg": "#ffffff",
    "--gs-bg-secondary": "#f8f9fa",
    "--gs-text": "#1a1a2e",
    "--gs-text-secondary": "#4a5568",
    "--gs-accent": "#3b82f6",
    "--gs-accent-hover": "#2563eb",
    "--gs-code-bg": "#f1f5f9",
    "--gs-code-text": "#1e293b",
    "--gs-code-keyword": "#7c3aed",
    "--gs-code-string": "#059669",
    "--gs-code-comment": "#9ca3af",
    "--gs-border": "#e2e8f0",
    "--gs-heading": "#0f172a",
  },
};

const minimalTheme: ThemeDefinition = {
  name: "minimal",
  variables: {
    "--gs-bg": "#ffffff",
    "--gs-bg-secondary": "#fafafa",
    "--gs-text": "#000000",
    "--gs-text-secondary": "#555555",
    "--gs-accent": "#000000",
    "--gs-accent-hover": "#333333",
    "--gs-code-bg": "#f5f5f5",
    "--gs-code-text": "#000000",
    "--gs-code-keyword": "#000000",
    "--gs-code-string": "#333333",
    "--gs-code-comment": "#888888",
    "--gs-border": "#e0e0e0",
    "--gs-heading": "#000000",
  },
};

const hackerTheme: ThemeDefinition = {
  name: "hacker",
  variables: {
    "--gs-bg": "#0a0a0a",
    "--gs-bg-secondary": "#111111",
    "--gs-text": "#00ff41",
    "--gs-text-secondary": "#00cc33",
    "--gs-accent": "#00ff41",
    "--gs-accent-hover": "#33ff66",
    "--gs-code-bg": "#050505",
    "--gs-code-text": "#00ff41",
    "--gs-code-keyword": "#00ffcc",
    "--gs-code-string": "#ffff00",
    "--gs-code-comment": "#006622",
    "--gs-border": "#003300",
    "--gs-heading": "#00ff41",
  },
};

/** Map of all built-in themes keyed by name */
export const themes: Record<string, ThemeDefinition> = {
  dark: darkTheme,
  light: lightTheme,
  minimal: minimalTheme,
  hacker: hackerTheme,
};

/** List of available built-in theme names */
export const themeNames = Object.keys(themes) as string[];

/**
 * Get a theme definition by name.
 * Returns the dark theme as fallback if the name is not recognized.
 */
export function getTheme(name: string): ThemeDefinition {
  return themes[name] ?? themes["dark"];
}

/** Default configuration values */
export const defaultConfig: Required<SlideConfig> = {
  theme: "dark",
  accentColor: "#3b82f6",
  fonts: {
    heading: "Inter",
    body: "Inter",
    code: "JetBrains Mono",
  },
  transition: {
    default: "slideLeft",
    duration: 0.6,
    ease: "power2.inOut",
  },
  slide: {
    width: 1920,
    height: 1080,
    padding: "80px",
  },
};

/**
 * Merge a partial user config with defaults.
 */
export function resolveConfig(userConfig: SlideConfig = {}): Required<SlideConfig> {
  return {
    theme: userConfig.theme ?? defaultConfig.theme,
    accentColor: userConfig.accentColor ?? defaultConfig.accentColor,
    fonts: {
      ...defaultConfig.fonts,
      ...userConfig.fonts,
    },
    transition: {
      ...defaultConfig.transition,
      ...userConfig.transition,
    },
    slide: {
      ...defaultConfig.slide,
      ...userConfig.slide,
    },
  };
}
