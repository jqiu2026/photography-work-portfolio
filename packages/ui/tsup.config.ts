import { defineConfig } from "tsup";

// Unbundled ESM: every source file becomes a dist file, so "use client" directives stay where they are
// (server-safe components stay server-safe). Types come from tsc (tsconfig.build.json).
export default defineConfig({
  entry: ["src/**/*.ts", "src/**/*.tsx"],
  format: ["esm"],
  bundle: false,
  dts: false,
  clean: true,
  target: "es2022",
  outDir: "dist",
  sourcemap: false,
});
