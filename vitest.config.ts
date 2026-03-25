import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["server/**/*.ts", "lib/**/*.ts", "constants/**/*.ts"],
      exclude: ["server/replit_integrations/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});
