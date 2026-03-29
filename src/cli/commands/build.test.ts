import { describe, it, expect } from "vitest";
import { generateSlideHTML, generateEntryScript } from "./build.js";

describe("build", () => {
  describe("generateSlideHTML", () => {
    it("produces valid HTML with the markdown embedded", () => {
      const md = "# Hello\n---\n## World";
      const html = generateSlideHTML(md);

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("window.__GSAP_SLIDES_MD__");
      expect(html).toContain(JSON.stringify(md));
      expect(html).toContain('<div id="slides-container"></div>');
      expect(html).toContain('<script type="module" src="./entry.ts">');
    });

    it("escapes special characters in markdown", () => {
      const md = 'He said "hello" & <world>';
      const html = generateSlideHTML(md);

      // The escaped markdown should be present in the output
      expect(html).toContain("He said");
      expect(html).toContain("<world>");
    });

    it("escapes </script> in markdown to prevent injection", () => {
      const md = 'test</script><script>alert("xss")</script>end';
      const html = generateSlideHTML(md);

      // The markdown script tags should be escaped, so the raw
      // closing tag does not appear inside the JSON string assignment
      const scriptBlock = html.match(
        /window\.__GSAP_SLIDES_MD__\s*=\s*(.*);/,
      );
      expect(scriptBlock).not.toBeNull();
      // The JSON value itself should not contain a literal </script
      expect(scriptBlock![1]).not.toContain("</script");
    });

    it("includes required CSS styles", () => {
      const html = generateSlideHTML("# Test");

      expect(html).toContain("#slides-container");
      expect(html).toContain(".gsap-slide");
      expect(html).toContain("background: #1a1a2e");
    });

    it("handles empty markdown", () => {
      const html = generateSlideHTML("");

      expect(html).toContain('window.__GSAP_SLIDES_MD__ = ""');
    });

    it("handles markdown with backticks and template literals", () => {
      const md = "```js\nconst x = `${foo}`;\n```";
      const html = generateSlideHTML(md);

      expect(html).toContain(JSON.stringify(md));
    });
  });

  describe("generateEntryScript", () => {
    it("imports parser and renderer", () => {
      const script = generateEntryScript();

      expect(script).toContain("import { parseSlides }");
      expect(script).toContain("import { renderSlides }");
    });

    it("reads markdown from window global", () => {
      const script = generateEntryScript();

      expect(script).toContain("__GSAP_SLIDES_MD__");
    });

    it("sets up keyboard navigation", () => {
      const script = generateEntryScript();

      expect(script).toContain("ArrowRight");
      expect(script).toContain("ArrowLeft");
      expect(script).toContain("keydown");
    });

    it("references slides-container element", () => {
      const script = generateEntryScript();

      expect(script).toContain("slides-container");
    });
  });
});
