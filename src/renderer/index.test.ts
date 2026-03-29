/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderSlides } from "./index.js";
import type { Slide } from "../parser/index.js";

function makeSlides(count: number): Slide[] {
  return Array.from({ length: count }, (_, i) => ({
    content: `<h1>Slide ${i + 1}</h1>`,
    frontmatter: {},
    index: i,
  }));
}

function makeContainer(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

describe("renderSlides", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = makeContainer();
  });

  it("creates section elements for each slide", () => {
    const ctrl = renderSlides(container, makeSlides(3), { navigation: false });
    const sections = container.querySelectorAll("section.gsap-slide");
    expect(sections.length).toBe(3);
    expect(ctrl.total).toBe(3);
    ctrl.destroy();
  });

  it("starts at index 0", () => {
    const ctrl = renderSlides(container, makeSlides(3), { navigation: false });
    expect(ctrl.currentIndex).toBe(0);
    ctrl.destroy();
  });

  describe("overview mode blocks navigation", () => {
    it("next() and prev() are no-ops when overview is active", () => {
      const slides = makeSlides(3);
      const ctrl = renderSlides(container, slides, { navigation: true });

      // Move to slide 1 first
      ctrl.goTo(1);
      expect(ctrl.currentIndex).toBe(1);

      // Trigger overview via keyboard 'o'
      const oEvent = new KeyboardEvent("keydown", {
        key: "o",
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(oEvent);

      // Now next/prev should be blocked
      ctrl.next();
      expect(ctrl.currentIndex).toBe(1);

      ctrl.prev();
      expect(ctrl.currentIndex).toBe(1);

      ctrl.destroy();
    });
  });

  describe("destroy", () => {
    it("can be called without errors", () => {
      const ctrl = renderSlides(container, makeSlides(2), { navigation: true });
      expect(() => ctrl.destroy()).not.toThrow();
    });
  });
});
