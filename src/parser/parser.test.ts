import { describe, it, expect } from "vitest";
import { parseSlides, extractFrontmatter, extractNotes } from "./index.js";

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

  it("extracts frontmatter from slides", () => {
    const md = `transition: fade\n# Slide 1\n---\n# Slide 2`;
    const slides = parseSlides(md);
    expect(slides[0].frontmatter).toEqual({ transition: "fade" });
    expect(slides[0].content).toBe("# Slide 1");
    expect(slides[1].frontmatter).toBeUndefined();
  });

  it("extracts presenter notes from slides", () => {
    const md = `# Slide 1\n<!-- notes\nRemember to mention data\n-->\n---\n# Slide 2`;
    const slides = parseSlides(md);
    expect(slides[0].notes).toBe("Remember to mention data");
    expect(slides[0].content).toBe("# Slide 1");
    expect(slides[1].notes).toBeUndefined();
  });

  it("extracts both frontmatter and notes", () => {
    const md = `transition: fade\n# My Slide\nContent here\n<!-- notes\nSay something\n-->`;
    const slides = parseSlides(md);
    expect(slides[0].frontmatter).toEqual({ transition: "fade" });
    expect(slides[0].notes).toBe("Say something");
    expect(slides[0].content).toBe("# My Slide\nContent here");
  });
});

describe("extractFrontmatter", () => {
  it("returns content unchanged when no frontmatter", () => {
    const result = extractFrontmatter("# Hello");
    expect(result.content).toBe("# Hello");
    expect(result.frontmatter).toBeUndefined();
  });

  it("extracts simple key: value pairs", () => {
    const result = extractFrontmatter("transition: fade\nlayout: center\n# Title");
    expect(result.frontmatter).toEqual({ transition: "fade", layout: "center" });
    expect(result.content).toBe("# Title");
  });

  it("handles keys with hyphens", () => {
    const result = extractFrontmatter("bg-color: red\n# Title");
    expect(result.frontmatter).toEqual({ "bg-color": "red" });
  });

  it("skips leading blank lines", () => {
    const result = extractFrontmatter("\n\ntransition: slide\n# Title");
    expect(result.frontmatter).toEqual({ transition: "slide" });
  });
});

describe("extractNotes", () => {
  it("returns content unchanged when no notes", () => {
    const result = extractNotes("# Hello\nWorld");
    expect(result.content).toBe("# Hello\nWorld");
    expect(result.notes).toBeUndefined();
  });

  it("extracts notes from HTML comments", () => {
    const result = extractNotes("# Hello\n<!-- notes\nMy note here\n-->");
    expect(result.notes).toBe("My note here");
    expect(result.content).toBe("# Hello");
  });

  it("handles multiline notes", () => {
    const result = extractNotes("# Title\n<!-- notes\nLine 1\nLine 2\nLine 3\n-->");
    expect(result.notes).toBe("Line 1\nLine 2\nLine 3");
  });
});
