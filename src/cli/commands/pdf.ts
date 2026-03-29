/**
 * PDF export command.
 *
 * Uses Playwright to capture each slide as a static snapshot and
 * combine them into a single PDF file.
 */

import { resolve } from "path";
import { readFileSync, existsSync } from "fs";
import { buildSlides } from "./build.js";

export interface PdfOptions {
  /** Path to the markdown file */
  file: string;
  /** Output PDF path */
  output: string;
  /** Viewport width in pixels */
  width: number;
  /** Viewport height in pixels */
  height: number;
}

/**
 * Export a slide deck to PDF.
 *
 * 1. Builds the static HTML first (reuses the build command)
 * 2. Opens the HTML in a headless Chromium via Playwright
 * 3. Navigates through each slide and captures a snapshot
 * 4. Combines all snapshots into a single PDF
 */
export async function exportPdf(options: PdfOptions): Promise<string> {
  const { file, output, width, height } = options;

  // Step 1: Build the static HTML
  const tmpOutDir = resolve(process.cwd(), ".gsap-slides-pdf-tmp");
  const htmlPath = await buildSlides({ file, output: tmpOutDir });

  if (!existsSync(htmlPath)) {
    throw new Error(`Build failed: ${htmlPath} not found`);
  }

  const pdfPath = resolve(process.cwd(), output);

  try {
    // Dynamically import playwright so it's only needed for PDF export
    const { chromium } = await import("playwright");

    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width, height },
    });
    const page = await context.newPage();

    // Load the built HTML file
    await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });

    // Count the number of slides
    const slideCount = await page.evaluate(() => {
      return document.querySelectorAll(".gsap-slide").length;
    });

    // Disable GSAP animations for clean static captures
    await page.evaluate(() => {
      const gsapModule = (window as any).gsap;
      if (gsapModule && gsapModule.globalTimeline) {
        gsapModule.globalTimeline.pause();
      }
    });

    // Make all slides visible and positioned for printing, one at a time
    // We generate a multi-page PDF by iterating slides
    const slides: Buffer[] = [];
    for (let i = 0; i < slideCount; i++) {
      // Show only the current slide
      await page.evaluate((idx: number) => {
        const allSlides =
          document.querySelectorAll<HTMLElement>(".gsap-slide");
        allSlides.forEach((s, j) => {
          if (j === idx) {
            s.style.opacity = "1";
            s.style.visibility = "visible";
            s.style.transform = "none";
          } else {
            s.style.opacity = "0";
            s.style.visibility = "hidden";
          }
        });
      }, i);

      // Small delay for rendering
      await page.waitForTimeout(100);

      const pdfBuf = await page.pdf({
        width: `${width}px`,
        height: `${height}px`,
        printBackground: true,
        pageRanges: "1",
      });
      slides.push(pdfBuf);
    }

    // If there's only one slide, just use it directly.
    // Otherwise, merge PDFs. For simplicity we use a page-per-slide approach
    // by printing the whole thing at once with all slides laid out.
    // Re-approach: show each slide one at a time and print all pages in one go.

    // Simpler approach: set up all slides as separate "pages" for print
    await page.evaluate((h: number) => {
      const allSlides =
        document.querySelectorAll<HTMLElement>(".gsap-slide");
      const container = document.getElementById("slides-container");
      if (container) {
        container.style.position = "static";
        container.style.width = "100%";
        container.style.height = "auto";
      }
      allSlides.forEach((s) => {
        s.style.opacity = "1";
        s.style.visibility = "visible";
        s.style.transform = "none";
        s.style.position = "relative";
        s.style.width = "100%";
        s.style.height = `${h}px`;
        s.style.pageBreakAfter = "always";
        s.style.display = "flex";
        s.style.inset = "auto";
      });
    }, height);

    await page.waitForTimeout(200);

    await page.pdf({
      path: pdfPath,
      width: `${width}px`,
      height: `${height}px`,
      printBackground: true,
    });

    await browser.close();

    return pdfPath;
  } finally {
    // Clean up the temporary build
    const { rmSync } = await import("fs");
    rmSync(tmpOutDir, { recursive: true, force: true });
  }
}
