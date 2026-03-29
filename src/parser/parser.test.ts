import { describe, it, expect } from "vitest";
import { parseSlides } from "./index.js";

describe("parseSlides", () => {
  it("parses a single slide", () => {
    const slides = parseSlides("# Hello World");
    expect(slides).toHaveLength(1);
    expect(slides[0].content).toBe("# Hello World");
    expect(slides[0].index).toBe(0);
  });

  it("parses multiple slides separated by ---", () => {
    const md = `# Slide 1\n---\n# Slide 2\n---\n# Slide 3`;
    const slides = parseSlides(md);
    expect(slides).toHaveLength(3);
    expect(slides[0].content).toBe("# Slide 1");
    expect(slides[1].content).toBe("# Slide 2");
    expect(slides[2].content).toBe("# Slide 3");
  });

  it("assigns correct indices", () => {
    const md = `A\n---\nB\n---\nC`;
    const slides = parseSlides(md);
    expect(slides[0].index).toBe(0);
    expect(slides[1].index).toBe(1);
    expect(slides[2].index).toBe(2);
  });

  it("trims whitespace from slide content", () => {
    const md = `  # Slide 1  \n---\n  # Slide 2  `;
    const slides = parseSlides(md);
    expect(slides[0].content).toBe("# Slide 1");
    expect(slides[1].content).toBe("# Slide 2");
  });

  it("handles empty input", () => {
    const slides = parseSlides("");
    expect(slides).toHaveLength(1);
    expect(slides[0].content).toBe("");
  });
});
