import { Command } from "commander";
import { buildSlides } from "./commands/build.js";
import { exportPdf } from "./commands/pdf.js";

const program = new Command();

program
  .name("gsap-slides")
  .description("Create animated slide decks from Markdown using GSAP")
  .version("0.1.0");

program
  .command("dev")
  .description("Start the development server for your slide deck")
  .argument("[file]", "Path to the Markdown slides file", "slides.md")
  .action((file: string) => {
    console.log(`Starting dev server for: ${file}`);
    // TODO: launch Vite dev server with the slide deck
  });

program
  .command("build")
  .description("Build the slide deck for production")
  .argument("[file]", "Path to the Markdown slides file", "slides.md")
  .option("-o, --output <dir>", "Output directory", "dist")
  .option("--pdf [filename]", "Export as PDF instead of HTML")
  .option("--width <pixels>", "Viewport width for PDF export", "1920")
  .option("--height <pixels>", "Viewport height for PDF export", "1080")
  .action(
    async (
      file: string,
      options: {
        output: string;
        pdf?: boolean | string;
        width: string;
        height: string;
      },
    ) => {
      try {
        if (options.pdf !== undefined && options.pdf !== false) {
          // PDF export
          const pdfFilename =
            typeof options.pdf === "string"
              ? options.pdf
              : "slides.pdf";
          console.log(`Exporting PDF from: ${file}`);
          const pdfPath = await exportPdf({
            file,
            output: pdfFilename,
            width: parseInt(options.width, 10),
            height: parseInt(options.height, 10),
          });
          console.log(`PDF exported to: ${pdfPath}`);
        } else {
          // Static HTML build
          console.log(`Building slides from: ${file}`);
          const outputPath = await buildSlides({
            file,
            output: options.output,
          });
          console.log(`Build complete: ${outputPath}`);
        }
      } catch (error) {
        console.error(
          "Build failed:",
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    },
  );

program.parse();
