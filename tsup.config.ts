import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    cli: "src/cli.ts",
  },
  format: ["esm"],
  target: "es2022",
  clean: true,
  dts: true,
  sourcemap: true,
  minify: false,
  external: ["axios", "cheerio", "crypto-js", "diff", "js-yaml", "zod"],
});
