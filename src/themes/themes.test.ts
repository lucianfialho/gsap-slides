import { describe, it, expect } from "vitest";
import {
  themes,
  themeNames,
  getTheme,
  defaultConfig,
  resolveConfig,
} from "./index.js";
import type { SlideConfig, SlideOverrides } from "./index.js";
import {
  generateThemeCSS,
  generateSlideOverrideStyle,
  resolveThemeVariables,
} from "./variables.js";
import {
  buildGoogleFontsUrl,
  generateFontLinkTag,
  generateLocalFontCSS,
  generateTypographyCSS,
} from "./fonts.js";
import {
  parseConfigModule,
  loadConfig,
  validateConfig,
  CONFIG_FILE_NAMES,
} from "./config.js";

// --- Theme definitions ---

describe("themes", () => {
  it("provides 4 built-in themes", () => {
    expect(themeNames).toHaveLength(4);
    expect(themeNames).toContain("dark");
    expect(themeNames).toContain("light");
    expect(themeNames).toContain("minimal");
    expect(themeNames).toContain("hacker");
  });

  it("each theme has required CSS variables", () => {
    const requiredVars = [
      "--gs-bg",
      "--gs-text",
      "--gs-accent",
      "--gs-code-bg",
      "--gs-code-text",
      "--gs-heading",
      "--gs-border",
    ];

    for (const name of themeNames) {
      const theme = themes[name];
      for (const v of requiredVars) {
        expect(theme.variables).toHaveProperty(v);
      }
    }
  });

  it("getTheme returns the correct theme", () => {
    expect(getTheme("dark").name).toBe("dark");
    expect(getTheme("light").name).toBe("light");
    expect(getTheme("hacker").name).toBe("hacker");
    expect(getTheme("minimal").name).toBe("minimal");
  });

  it("getTheme falls back to dark for unknown theme", () => {
    expect(getTheme("nonexistent").name).toBe("dark");
  });

  it("dark theme has dark background", () => {
    expect(themes["dark"].variables["--gs-bg"]).toBe("#1a1a2e");
  });

  it("light theme has white background", () => {
    expect(themes["light"].variables["--gs-bg"]).toBe("#ffffff");
  });

  it("minimal theme has no colored accent", () => {
    expect(themes["minimal"].variables["--gs-accent"]).toBe("#000000");
  });

  it("hacker theme has green text", () => {
    expect(themes["hacker"].variables["--gs-text"]).toBe("#00ff41");
  });
});

// --- Config resolution ---

describe("resolveConfig", () => {
  it("returns defaults when called with no args", () => {
    const config = resolveConfig();
    expect(config.theme).toBe("dark");
    expect(config.accentColor).toBe("#3b82f6");
    expect(config.fonts.heading).toBe("Inter");
    expect(config.fonts.body).toBe("Inter");
    expect(config.fonts.code).toBe("JetBrains Mono");
    expect(config.transition.default).toBe("slideLeft");
    expect(config.transition.duration).toBe(0.6);
    expect(config.slide.width).toBe(1920);
    expect(config.slide.height).toBe(1080);
    expect(config.slide.padding).toBe("80px");
  });

  it("overrides specific values while keeping defaults", () => {
    const config = resolveConfig({ theme: "hacker", accentColor: "#ff0000" });
    expect(config.theme).toBe("hacker");
    expect(config.accentColor).toBe("#ff0000");
    expect(config.fonts.heading).toBe("Inter"); // still default
  });

  it("deep merges fonts", () => {
    const config = resolveConfig({ fonts: { heading: "Roboto" } });
    expect(config.fonts.heading).toBe("Roboto");
    expect(config.fonts.body).toBe("Inter"); // default
    expect(config.fonts.code).toBe("JetBrains Mono"); // default
  });

  it("deep merges transition", () => {
    const config = resolveConfig({ transition: { duration: 1.0 } });
    expect(config.transition.duration).toBe(1.0);
    expect(config.transition.ease).toBe("power2.inOut"); // default
  });

  it("deep merges slide dimensions", () => {
    const config = resolveConfig({ slide: { padding: "40px" } });
    expect(config.slide.padding).toBe("40px");
    expect(config.slide.width).toBe(1920); // default
  });
});

// --- CSS variable generation ---

describe("generateThemeCSS", () => {
  it("generates valid CSS with :root selector", () => {
    const css = generateThemeCSS();
    expect(css).toContain(":root {");
    expect(css).toContain("--gs-bg:");
    expect(css).toContain("--gs-text:");
    expect(css).toContain("--gs-accent:");
    expect(css).toContain("}");
  });

  it("includes font variables", () => {
    const css = generateThemeCSS();
    expect(css).toContain("--gs-font-heading: Inter");
    expect(css).toContain("--gs-font-body: Inter");
    expect(css).toContain("--gs-font-code: JetBrains Mono");
  });

  it("includes slide dimension variables", () => {
    const css = generateThemeCSS();
    expect(css).toContain("--gs-slide-width: 1920px");
    expect(css).toContain("--gs-slide-height: 1080px");
    expect(css).toContain("--gs-slide-padding: 80px");
  });

  it("applies custom accent color", () => {
    const css = generateThemeCSS({ accentColor: "#ff0000" });
    expect(css).toContain("--gs-accent: #ff0000");
  });

  it("uses the correct theme variables", () => {
    const css = generateThemeCSS({ theme: "hacker" });
    expect(css).toContain("--gs-bg: #0a0a0a");
    expect(css).toContain("--gs-text: #00ff41");
  });
});

describe("generateSlideOverrideStyle", () => {
  it("generates background style", () => {
    const style = generateSlideOverrideStyle({
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    });
    expect(style).toContain("background: linear-gradient");
  });

  it("generates color style", () => {
    const style = generateSlideOverrideStyle({ color: "#fff" });
    expect(style).toBe("color: #fff");
  });

  it("generates both background and color", () => {
    const style = generateSlideOverrideStyle({
      background: "#000",
      color: "#fff",
    });
    expect(style).toContain("background: #000");
    expect(style).toContain("color: #fff");
  });

  it("returns empty string for no overrides", () => {
    const style = generateSlideOverrideStyle({});
    expect(style).toBe("");
  });
});

describe("resolveThemeVariables", () => {
  it("returns a flat record of CSS variables", () => {
    const vars = resolveThemeVariables();
    expect(vars["--gs-bg"]).toBe("#1a1a2e");
    expect(vars["--gs-font-heading"]).toBe("Inter");
    expect(vars["--gs-slide-width"]).toBe("1920px");
  });

  it("applies config overrides", () => {
    const vars = resolveThemeVariables({ theme: "light" });
    expect(vars["--gs-bg"]).toBe("#ffffff");
  });
});

// --- Font loading ---

describe("buildGoogleFontsUrl", () => {
  it("builds a valid Google Fonts URL", () => {
    const url = buildGoogleFontsUrl();
    expect(url).toContain("https://fonts.googleapis.com/css2");
    expect(url).toContain("family=Inter");
    expect(url).toContain("family=JetBrains+Mono");
    expect(url).toContain("display=swap");
  });

  it("deduplicates font families", () => {
    const url = buildGoogleFontsUrl({
      fonts: { heading: "Inter", body: "Inter", code: "Inter" },
    });
    const matches = url.match(/family=Inter/g);
    expect(matches).toHaveLength(1);
  });

  it("handles custom fonts", () => {
    const url = buildGoogleFontsUrl({
      fonts: { heading: "Playfair Display", body: "Lato" },
    });
    expect(url).toContain("family=Playfair+Display");
    expect(url).toContain("family=Lato");
  });
});

describe("generateFontLinkTag", () => {
  it("generates preconnect and stylesheet links", () => {
    const html = generateFontLinkTag();
    expect(html).toContain('rel="preconnect"');
    expect(html).toContain("fonts.googleapis.com");
    expect(html).toContain("fonts.gstatic.com");
    expect(html).toContain('rel="stylesheet"');
  });
});

describe("generateLocalFontCSS", () => {
  it("generates @font-face rules", () => {
    const css = generateLocalFontCSS("CustomFont", [
      { weight: 400, path: "/fonts/custom-regular.woff2" },
      { weight: 700, path: "/fonts/custom-bold.woff2" },
    ]);
    expect(css).toContain("@font-face");
    expect(css).toContain("font-family: 'CustomFont'");
    expect(css).toContain("font-weight: 400");
    expect(css).toContain("font-weight: 700");
    expect(css).toContain("/fonts/custom-regular.woff2");
    expect(css).toContain("font-display: swap");
  });

  it("supports italic style", () => {
    const css = generateLocalFontCSS("CustomFont", [
      { weight: 400, path: "/fonts/custom-italic.woff2", style: "italic" },
    ]);
    expect(css).toContain("font-style: italic");
  });
});

describe("generateTypographyCSS", () => {
  it("generates base typography rules", () => {
    const css = generateTypographyCSS();
    expect(css).toContain("var(--gs-font-body)");
    expect(css).toContain("var(--gs-font-heading)");
    expect(css).toContain("var(--gs-font-code)");
    expect(css).toContain("var(--gs-code-bg)");
  });
});

// --- Config loading ---

describe("parseConfigModule", () => {
  it("handles default export object", () => {
    const result = parseConfigModule({ default: { theme: "light" } });
    expect(result).toEqual({ theme: "light" });
  });

  it("handles direct export object", () => {
    const result = parseConfigModule({ theme: "hacker" });
    expect(result).toEqual({ theme: "hacker" });
  });

  it("returns empty object for null", () => {
    expect(parseConfigModule(null)).toEqual({});
  });

  it("returns empty object for undefined", () => {
    expect(parseConfigModule(undefined)).toEqual({});
  });
});

describe("loadConfig", () => {
  it("returns fully resolved config", () => {
    const config = loadConfig({ theme: "minimal" });
    expect(config.theme).toBe("minimal");
    expect(config.accentColor).toBe("#3b82f6");
    expect(config.fonts.heading).toBe("Inter");
  });
});

describe("validateConfig", () => {
  it("returns no warnings for valid config", () => {
    const warnings = validateConfig({ theme: "dark", accentColor: "#3b82f6" });
    expect(warnings).toHaveLength(0);
  });

  it("warns on unknown theme", () => {
    const warnings = validateConfig({ theme: "neon" });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("Unknown theme");
  });

  it("warns on invalid accent color", () => {
    const warnings = validateConfig({ accentColor: "red" });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("Invalid accent color");
  });

  it("warns on out-of-range duration", () => {
    const warnings = validateConfig({ transition: { duration: 15 } });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("out of recommended range");
  });

  it("warns on non-positive slide dimensions", () => {
    const warnings = validateConfig({ slide: { width: -1 } });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("positive number");
  });
});

describe("CONFIG_FILE_NAMES", () => {
  it("includes expected config file names", () => {
    expect(CONFIG_FILE_NAMES).toContain("gsap-slides.config.js");
    expect(CONFIG_FILE_NAMES).toContain("gsap-slides.config.ts");
    expect(CONFIG_FILE_NAMES).toContain("gsap-slides.config.mjs");
  });
});
