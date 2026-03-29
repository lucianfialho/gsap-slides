/**
 * `gsap-slides dev` command.
 *
 * Starts a Vite-powered dev server that serves the slide viewer.  Watches
 * the Markdown file for changes and pushes updates to the browser via
 * Vite's HMR WebSocket so slides refresh without a full page reload.
 */

import { createServer, type ViteDevServer } from "vite";
import { resolve, dirname } from "path";
import { readFileSync, existsSync, watchFile, unwatchFile } from "fs";
import { fileURLToPath } from "url";
import { parseSlides } from "../../parser/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface DevOptions {
  port: number;
  presenter: boolean;
}

/**
 * Read a markdown file from disk.  Returns empty string if not found.
 */
function readMarkdownFile(filePath: string): string {
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

/**
 * Resolve the project root (where package.json lives).
 * When running from dist/cli/commands/dev.js the root is three levels up.
 * When running via ts-node / vitest it may differ, so we fall back to cwd.
 */
function resolveProjectRoot(): string {
  // Walk up from __dirname looking for package.json
  let dir = __dirname;
  for (let i = 0; i < 5; i++) {
    if (existsSync(resolve(dir, "package.json"))) return dir;
    dir = dirname(dir);
  }
  return process.cwd();
}

export async function startDevServer(
  file: string,
  options: DevOptions,
): Promise<ViteDevServer> {
  const mdPath = resolve(process.cwd(), file);
  const projectRoot = resolveProjectRoot();
  const viewerRoot = resolve(projectRoot, "src/viewer");

  if (!existsSync(mdPath)) {
    console.error(`File not found: ${mdPath}`);
    process.exit(1);
  }

  // Read and parse initial markdown content
  let markdown = readMarkdownFile(mdPath);
  let parsedSlides = await parseSlides(markdown);

  const server = await createServer({
    root: viewerRoot,
    server: {
      port: options.port,
    },
    // Inject virtual modules that provide parsed slides and config to the browser
    plugins: [
      {
        name: "gsap-slides-markdown",
        resolveId(id) {
          if (id === "virtual:slides-data") return "\0virtual:slides-data";
          if (id === "virtual:slides-config") return "\0virtual:slides-config";
          // Keep old virtual module name for backwards compat
          if (id === "virtual:slides-markdown") return "\0virtual:slides-markdown";
          return null;
        },
        load(id) {
          if (id === "\0virtual:slides-data") {
            return `export default ${JSON.stringify(parsedSlides)};`;
          }
          if (id === "\0virtual:slides-markdown") {
            return `export default ${JSON.stringify(markdown)};`;
          }
          if (id === "\0virtual:slides-config") {
            return `export default ${JSON.stringify({ presenter: options.presenter })};`;
          }
          return null;
        },
        configureServer(server) {
          // Watch the markdown file and send HMR updates
          const sendUpdate = async () => {
            markdown = readMarkdownFile(mdPath);
            parsedSlides = await parseSlides(markdown);
            // Invalidate virtual modules
            for (const modId of ["\0virtual:slides-data", "\0virtual:slides-markdown"]) {
              const mod = server.moduleGraph.getModuleById(modId);
              if (mod) server.moduleGraph.invalidateModule(mod);
            }
            server.ws.send({
              type: "custom",
              event: "slides:update",
              data: { slides: parsedSlides },
            });
          };

          watchFile(mdPath, { interval: 300 }, sendUpdate);

          server.httpServer?.on("close", () => {
            unwatchFile(mdPath);
          });
        },
      },
    ],
  });

  await server.listen();
  server.printUrls();

  const mode = options.presenter ? " (presenter mode)" : "";
  console.log(`\n  Watching: ${mdPath}${mode}\n`);

  return server;
}
