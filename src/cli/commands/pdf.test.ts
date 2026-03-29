import { describe, it, expect } from "vitest";
import type { PdfOptions } from "./pdf.js";

describe("pdf", () => {
  describe("PdfOptions interface", () => {
    it("accepts valid options", () => {
      const options: PdfOptions = {
        file: "slides.md",
        output: "slides.pdf",
        width: 1920,
        height: 1080,
      };

      expect(options.file).toBe("slides.md");
      expect(options.output).toBe("slides.pdf");
      expect(options.width).toBe(1920);
      expect(options.height).toBe(1080);
    });

    it("supports custom dimensions", () => {
      const options: PdfOptions = {
        file: "deck.md",
        output: "output.pdf",
        width: 1280,
        height: 720,
      };

      expect(options.width).toBe(1280);
      expect(options.height).toBe(720);
    });
  });
});
