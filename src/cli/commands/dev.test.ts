import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { startDevServer } from "./dev.js";
import { writeFileSync, unlinkSync, mkdirSync } from "fs";
import { resolve } from "path";
import { tmpdir } from "os";

describe("startDevServer", () => {
  const tmpDir = resolve(tmpdir(), "gsap-slides-test-" + Date.now());
  const mdFile = resolve(tmpDir, "test-slides.md");

  beforeEach(() => {
    mkdirSync(tmpDir, { recursive: true });
    writeFileSync(
      mdFile,
      "# Slide 1\n---\n# Slide 2\n---\n# Slide 3",
    );
  });

  afterEach(() => {
    try {
      unlinkSync(mdFile);
    } catch {
      // ignore
    }
  });

  it("starts a server and returns a ViteDevServer instance", async () => {
    const server = await startDevServer(mdFile, {
      port: 0, // random available port
      presenter: false,
    });

    expect(server).toBeDefined();
    expect(server.httpServer).toBeDefined();

    await server.close();
  }, 15000);

  it("starts in presenter mode without error", async () => {
    const server = await startDevServer(mdFile, {
      port: 0,
      presenter: true,
    });

    expect(server).toBeDefined();
    await server.close();
  }, 15000);

  it("exits when file does not exist", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    await expect(
      startDevServer("/nonexistent/path/slides.md", {
        port: 0,
        presenter: false,
      }),
    ).rejects.toThrow("process.exit called");

    exitSpy.mockRestore();
  });
});
