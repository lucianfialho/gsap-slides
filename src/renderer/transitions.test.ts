/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { getTransition, listTransitions } from "./transitions.js";
import type { TransitionName, TransitionFn } from "./transitions.js";

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

  describe("flip transition", () => {
    it("uses rotationY for forward direction and rotationX for backward", async () => {
      const flipFn = getTransition("flip");
      const gsap = await import("gsap");

      const leaving = document.createElement("div");
      const entering = document.createElement("div");

      // Forward direction (1) — capture the properties set on the timeline
      const tlForward = gsap.default.timeline();
      const toSpyFwd = vi.spyOn(tlForward, "to");
      flipFn(tlForward, leaving, entering, 1);

      // The first .to() call is for the leaving element
      const leavingVarsFwd = toSpyFwd.mock.calls[0][1] as Record<string, unknown>;
      expect(leavingVarsFwd).toHaveProperty("rotationY");
      expect(leavingVarsFwd).not.toHaveProperty("rotationX");

      toSpyFwd.mockRestore();

      // Backward direction (-1)
      const tlBackward = gsap.default.timeline();
      const toSpyBwd = vi.spyOn(tlBackward, "to");
      flipFn(tlBackward, leaving, entering, -1);

      const leavingVarsBwd = toSpyBwd.mock.calls[0][1] as Record<string, unknown>;
      expect(leavingVarsBwd).toHaveProperty("rotationX");
      expect(leavingVarsBwd).not.toHaveProperty("rotationY");

      toSpyBwd.mockRestore();
    });
  });
});
