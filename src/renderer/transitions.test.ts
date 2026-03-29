import { describe, it, expect } from "vitest";
import { getTransition, listTransitions } from "./transitions.js";
import type { TransitionName } from "./transitions.js";

describe("transitions", () => {
  describe("listTransitions", () => {
    it("returns all 7 built-in presets plus none", () => {
      const names = listTransitions();
      expect(names).toContain("fade");
      expect(names).toContain("slideLeft");
      expect(names).toContain("slideRight");
      expect(names).toContain("slideUp");
      expect(names).toContain("slideDown");
      expect(names).toContain("zoom");
      expect(names).toContain("flip");
      expect(names).toContain("none");
      expect(names).toHaveLength(8);
    });
  });

  describe("getTransition", () => {
    it("resolves each built-in name to a function", () => {
      const names: TransitionName[] = [
        "fade",
        "slideLeft",
        "slideRight",
        "slideUp",
        "slideDown",
        "zoom",
        "flip",
        "none",
      ];
      for (const name of names) {
        const fn = getTransition(name);
        expect(typeof fn).toBe("function");
      }
    });

    it("falls back to fade for unknown names", () => {
      const fadeFn = getTransition("fade");
      const unknownFn = getTransition("doesNotExist");
      expect(unknownFn).toBe(fadeFn);
    });
  });
});
