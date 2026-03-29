import { Command } from "commander";
import { startDevServer } from "./commands/dev.js";

const program = new Command();

program
  .name("gsap-slides")
  .description("Create animated slide decks from Markdown using GSAP")
  .version("0.1.0");

program
  .command("dev")
  .description("Start the development server for your slide deck")
  .argument("[file]", "Path to the Markdown slides file", "slides.md")
  .option("-p, --port <number>", "Dev server port", "3000")
  .option("--presenter", "Open in presenter mode with notes and next-slide preview", false)
  .action(async (file: string, options: { port: string; presenter: boolean }) => {
    await startDevServer(file, {
      port: parseInt(options.port, 10),
      presenter: options.presenter,
    });
  });

program
  .command("build")
  .description("Build the slide deck for production")
  .argument("[file]", "Path to the Markdown slides file", "slides.md")
  .option("-o, --output <dir>", "Output directory", "dist")
  .action((file: string, options: { output: string }) => {
    console.log(`Building slides from: ${file} -> ${options.output}`);
    // TODO: build static slide deck
  });

program.parse();
