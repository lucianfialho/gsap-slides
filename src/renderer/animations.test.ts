import { describe, it, expect } from "vitest";
import { getAnimation, listAnimations } from "./animations.js";
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
});
