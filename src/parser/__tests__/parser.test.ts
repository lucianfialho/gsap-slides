import { describe, it, expect } from "vitest";
import { parseSlides, extractFrontmatter, extractNotes } from "../index.js";

describe("parseSlides", () => {
  it("parses a single slide with no frontmatter", async () => {
    const md = "# Hello World\n\nSome content here.";
    const slides = await parseSlides(md);

    expect(slides).toHaveLength(1);
    expect(slides[0].id).toBe(0);
    expect(slides[0].content).toContain("<h1>");
    expect(slides[0].content).toContain("Hello World");
    expect(slides[0].frontmatter).toEqual({});
  });

  it("parses multiple slides separated by ---", async () => {
    const md = `# Slide One

Content one

---

# Slide Two

Content two

---

# Slide Three

Content three`;

    const slides = await parseSlides(md);

    expect(slides).toHaveLength(3);
    expect(slides[0].id).toBe(0);
    expect(slides[1].id).toBe(1);
    expect(slides[2].id).toBe(2);
    expect(slides[0].content).toContain("Slide One");
    expect(slides[1].content).toContain("Slide Two");
    expect(slides[2].content).toContain("Slide Three");
  });

  it("extracts frontmatter from slides", async () => {
    const md = `---
transition: fade
duration: 0.5
animation: slideLeft
---
# First Slide

Content

---

---
background: "#ff0000"
enter:
  x: -100
  opacity: 0
---
# Second Slide

More content`;

    const slides = await parseSlides(md);

    expect(slides).toHaveLength(2);
    expect(slides[0].frontmatter.transition).toBe("fade");
    expect(slides[0].frontmatter.duration).toBe(0.5);
    expect(slides[0].frontmatter.animation).toBe("slideLeft");

    expect(slides[1].frontmatter.background).toBe("#ff0000");
    expect(slides[1].frontmatter.enter).toEqual({ x: -100, opacity: 0 });
  });

  it("converts markdown to HTML", async () => {
    const md = `# Heading

A paragraph with **bold** and *italic* text.

- Item one
- Item two`;

    const slides = await parseSlides(md);

    expect(slides[0].content).toContain("<h1>");
    expect(slides[0].content).toContain("<strong>bold</strong>");
    expect(slides[0].content).toContain("<em>italic</em>");
    expect(slides[0].content).toContain("<ul>");
    expect(slides[0].content).toContain("<li>");
  });

  it("handles code blocks with syntax highlighting", async () => {
    const md = `# Code Example

\`\`\`javascript
const x = 42;
console.log(x);
\`\`\``;

    const slides = await parseSlides(md);

    // Shiki wraps code in <pre> with class="shiki"
    expect(slides[0].content).toContain("shiki");
    expect(slides[0].content).toContain("42");
  });

  it("handles images", async () => {
    const md = `# Images

![Alt text](https://example.com/image.png)`;

    const slides = await parseSlides(md);

    expect(slides[0].content).toContain("<img");
    expect(slides[0].content).toContain('src="https://example.com/image.png"');
    expect(slides[0].content).toContain('alt="Alt text"');
  });

  it("extracts slide elements", async () => {
    const md = `# Title

A paragraph.

- List item`;

    const slides = await parseSlides(md);
    const elements = slides[0].elements;

    expect(elements.length).toBeGreaterThanOrEqual(2);

    const h1 = elements.find((e) => e.tag === "h1");
    expect(h1).toBeDefined();
    expect(h1!.content).toContain("Title");

    const p = elements.find((e) => e.tag === "p");
    expect(p).toBeDefined();
    expect(p!.content).toContain("A paragraph.");
  });

  it("handles unknown code block languages gracefully", async () => {
    const md = `\`\`\`unknownlang
some code
\`\`\``;

    const slides = await parseSlides(md);

    // Should not throw, falls back to plain text
    expect(slides[0].content).toContain("some code");
  });

  it("handles empty input", async () => {
    const slides = await parseSlides("");
    expect(slides).toHaveLength(0);
  });

  it("preserves custom frontmatter keys", async () => {
    const md = `---
transition: fade
customKey: customValue
nested:
  a: 1
  b: 2
---
# Slide`;

    const slides = await parseSlides(md);

    expect(slides[0].frontmatter.customKey).toBe("customValue");
    expect(slides[0].frontmatter.nested).toEqual({ a: 1, b: 2 });
  });

  it("handles video and audio elements in HTML", async () => {
    const md = `# Media

<video src="video.mp4" controls></video>

<audio src="audio.mp3" controls></audio>`;

    const slides = await parseSlides(md);

    expect(slides[0].content).toContain("video.mp4");
    expect(slides[0].content).toContain("audio.mp3");
  });

  it("does not split slides on --- inside a fenced code block", async () => {
    const md = `# Slide One

\`\`\`yaml
key: value
---
another: thing
\`\`\`

Some text after code.`;

    const slides = await parseSlides(md);

    expect(slides).toHaveLength(1);
    // Shiki renders code with spans, so check for the key tokens
    expect(slides[0].content).toContain("key");
    expect(slides[0].content).toContain("value");
    expect(slides[0].content).toContain("another");
    expect(slides[0].content).toContain("thing");
    expect(slides[0].content).toContain("Some text after code.");
  });

  it("does not split on --- inside tilde fenced code block", async () => {
    const md = `# Slide

~~~
---
~~~

Done.`;

    const slides = await parseSlides(md);

    expect(slides).toHaveLength(1);
    expect(slides[0].content).toContain("Done.");
  });

  it("handles unclosed frontmatter without swallowing the document", async () => {
    const md = `---
# This is a heading, not YAML

Some paragraph content.

---

# Real Second Slide`;

    const slides = await parseSlides(md);

    // The unclosed frontmatter block should not swallow everything.
    // We expect the heading and paragraph to be present in the output.
    expect(slides.length).toBeGreaterThanOrEqual(1);

    const allContent = slides.map((s) => s.content).join(" ");
    expect(allContent).toContain("This is a heading");
    expect(allContent).toContain("Some paragraph content");
  });

  it("handles Windows line endings (\\r\\n)", async () => {
    const md = "# Slide One\r\n\r\nContent one\r\n\r\n---\r\n\r\n# Slide Two\r\n\r\nContent two";

    const slides = await parseSlides(md);

    expect(slides).toHaveLength(2);
    expect(slides[0].content).toContain("Slide One");
    expect(slides[1].content).toContain("Slide Two");
  });

  it("strips script tags when sanitize option is enabled", async () => {
    const md = `# Hello

<script>alert('xss')</script>

<p onclick="alert('xss')">Click me</p>`;

    const slides = await parseSlides(md, { sanitize: true });

    expect(slides[0].content).not.toContain("<script");
    expect(slides[0].content).not.toContain("alert");
    expect(slides[0].content).not.toContain("onclick");
    expect(slides[0].content).toContain("Click me");
  });

  it("preserves script tags when sanitize option is not set", async () => {
    const md = `# Hello

<script>alert('xss')</script>`;

    const slides = await parseSlides(md);

    expect(slides[0].content).toContain("<script");
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
