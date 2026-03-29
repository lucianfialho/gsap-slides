/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { setupNavigation } from "./navigation.js";

function makeContainer(): HTMLDivElement {
  return document.createElement("div");
}

function fireKey(key: string) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
}

describe("navigation", () => {
  it("calls next on ArrowRight", () => {
    const container = makeContainer();
    const cbs = {
      next: vi.fn(),
      prev: vi.fn(),
      toggleFullscreen: vi.fn(),
      toggleOverview: vi.fn(),
    };
    setupNavigation(container, cbs);
    fireKey("ArrowRight");
    expect(cbs.next).toHaveBeenCalledTimes(1);
  });

  it("calls prev on ArrowLeft", () => {
    const container = makeContainer();
    const cbs = {
      next: vi.fn(),
      prev: vi.fn(),
      toggleFullscreen: vi.fn(),
      toggleOverview: vi.fn(),
    };
    setupNavigation(container, cbs);
    fireKey("ArrowLeft");
    expect(cbs.prev).toHaveBeenCalledTimes(1);
  });

  it("calls toggleFullscreen on f key", () => {
    const container = makeContainer();
    const cbs = {
      next: vi.fn(),
      prev: vi.fn(),
      toggleFullscreen: vi.fn(),
      toggleOverview: vi.fn(),
    };
    setupNavigation(container, cbs);
    fireKey("f");
    expect(cbs.toggleFullscreen).toHaveBeenCalledTimes(1);
  });

  it("calls toggleOverview on o key", () => {
    const container = makeContainer();
    const cbs = {
      next: vi.fn(),
      prev: vi.fn(),
      toggleFullscreen: vi.fn(),
      toggleOverview: vi.fn(),
    };
    setupNavigation(container, cbs);
    fireKey("o");
    expect(cbs.toggleOverview).toHaveBeenCalledTimes(1);
  });

  it("calls next on space key", () => {
    const container = makeContainer();
    const cbs = {
      next: vi.fn(),
      prev: vi.fn(),
      toggleFullscreen: vi.fn(),
      toggleOverview: vi.fn(),
    };
    setupNavigation(container, cbs);
    fireKey(" ");
    expect(cbs.next).toHaveBeenCalledTimes(1);
  });

  it("removes listeners on destroy", () => {
    const container = makeContainer();
    const cbs = {
      next: vi.fn(),
      prev: vi.fn(),
      toggleFullscreen: vi.fn(),
      toggleOverview: vi.fn(),
    };
    const { destroy } = setupNavigation(container, cbs);
    destroy();
    fireKey("ArrowRight");
    expect(cbs.next).not.toHaveBeenCalled();
  });

  it("calls next on click (non-interactive element)", () => {
    const container = makeContainer();
    document.body.appendChild(container);
    const cbs = {
      next: vi.fn(),
      prev: vi.fn(),
      toggleFullscreen: vi.fn(),
      toggleOverview: vi.fn(),
    };
    setupNavigation(container, cbs);
    const event = new MouseEvent("click", { bubbles: true });
    container.dispatchEvent(event);
    expect(cbs.next).toHaveBeenCalledTimes(1);
    document.body.removeChild(container);
  });
});
