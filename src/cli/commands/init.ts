import { Command } from "commander";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile, copyFile } from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.resolve(__dirname, "..", "templates");

function applyTemplate(content: string, variables: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

async function initProject(name: string): Promise<void> {
  const targetDir = path.resolve(process.cwd(), name);

  if (existsSync(targetDir)) {
    const contents = await readdir(targetDir);
    if (contents.length > 0) {
      console.error(`Error: Directory "${name}" already exists and is not empty.`);
      process.exit(1);
    }
  }

  console.log(`\nCreating a new gsap-slides deck in ${targetDir}\n`);

  const variables = { name };

  // Create directory structure
  await mkdir(path.join(targetDir, "assets"), { recursive: true });

  // Copy and template slides.md
  const slidesContent = await readFile(
    path.join(TEMPLATES_DIR, "slides.md"),
    "utf-8"
  );
  await writeFile(
    path.join(targetDir, "slides.md"),
    applyTemplate(slidesContent, variables)
  );

  // Copy config file (no templating needed)
  await copyFile(
    path.join(TEMPLATES_DIR, "gsap-slides.config.js"),
    path.join(targetDir, "gsap-slides.config.js")
  );

  // Copy and template package.json
  const pkgContent = await readFile(
    path.join(TEMPLATES_DIR, "package.json.tmpl"),
    "utf-8"
  );
  await writeFile(
    path.join(targetDir, "package.json"),
    applyTemplate(pkgContent, variables)
  );

  // Add .gitkeep to assets so it's tracked by git
  await writeFile(path.join(targetDir, "assets", ".gitkeep"), "");

  console.log("  Created slides.md");
  console.log("  Created gsap-slides.config.js");
  console.log("  Created package.json");
  console.log("  Created assets/");
  console.log("");
  console.log("Done! To get started:");
  console.log("");
  console.log(`  cd ${name}`);
  console.log("  npm install");
  console.log("  npm run dev");
  console.log("");
}

export function registerInitCommand(program: Command): void {
  program
    .command("init <name>")
    .description("Scaffold a new gsap-slides presentation")
    .action(async (name: string) => {
      await initProject(name);
    });
}
