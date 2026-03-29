import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli/index.ts"],
  format: ["esm"],
  target: "node18",
  outDir: "dist/cli",
  clean: true,
  dts: false,
  sourcemap: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
  // These are resolved at runtime via dynamic import or Vite's own bundling
  external: ["vite", "vite-plugin-singlefile", "playwright", "fsevents"],
});
