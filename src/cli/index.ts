import { Command } from "commander";

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
  .action((file: string, options: { output: string }) => {
    console.log(`Building slides from: ${file} -> ${options.output}`);
    // TODO: build static slide deck
  });

program.parse();
