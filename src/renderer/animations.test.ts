/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { getAnimation, listAnimations, typewriter } from "./animations.js";
import type { AnimationName } from "./animations.js";

describe("animations", () => {
  describe("listAnimations", () => {
    it("returns all 4 built-in presets", () => {
      const names = listAnimations();
      expect(names).toContain("stagger");
      expect(names).toContain("typewriter");
      expect(names).toContain("draw");
      expect(names).toContain("custom");
      expect(names).toHaveLength(4);
    });
  });

  describe("getAnimation", () => {
    it("resolves each built-in name to a function", () => {
      const names: AnimationName[] = ["stagger", "typewriter", "draw", "custom"];
      for (const name of names) {
        const fn = getAnimation(name);
        expect(typeof fn).toBe("function");
      }
    });

    it("returns undefined for unknown names", () => {
      const fn = getAnimation("doesNotExist");
      expect(fn).toBeUndefined();
    });
  });

  describe("typewriter", () => {
    it("stores original text in data-typewriter-original on first run", () => {
      const slide = document.createElement("div");
      const p = document.createElement("p");
      p.textContent = "Hello World";
      slide.appendChild(p);

      typewriter(slide);

      expect(p.getAttribute("data-typewriter-original")).toBe("Hello World");
    });

    it("restores from data attribute on subsequent runs (revisit)", () => {
      const slide = document.createElement("div");
      const p = document.createElement("p");
      p.textContent = "Hello World";
      slide.appendChild(p);

      // First run — stores text, clears element
      typewriter(slide);
      expect(p.getAttribute("data-typewriter-original")).toBe("Hello World");

      // Simulate what happens after first animation completes
      // The text content was set to empty, now run again (revisit)
      const tl = typewriter(slide);

      // The data attribute should still hold the original text
      expect(p.getAttribute("data-typewriter-original")).toBe("Hello World");
      // Timeline should have calls scheduled (chars.length > 0)
      expect(tl.duration()).toBeGreaterThan(0);
    });

    it("returns empty timeline when no target element exists", () => {
      const slide = document.createElement("div");
      const tl = typewriter(slide);
      expect(tl.duration()).toBe(0);
    });
  });
});
