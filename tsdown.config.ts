import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/schema.ts"],
  format: ["esm"],
  minify: true,
  dts: true,
  treeshake: true,
  sourcemap: false,
  clean: true,
  outDir: "dist",
  target: "es2022",
});
