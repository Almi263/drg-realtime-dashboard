import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: "@/auth", replacement: path.resolve(__dirname, "auth.ts") },
      { find: "@", replacement: path.resolve(__dirname, "src") },
    ],
  },
});
