const { defineConfig } = require('tsup');

module.exports = defineConfig({
  format: ['cjs', 'esm'],
  entry: ['./src/main.ts'],
  dts: true,
  shims: true,
  skipNodeModulesBundle: true,
  clean: true,
});
