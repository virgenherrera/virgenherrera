import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts"],
  },
  resolve: {
    alias: {
      "@profile-data": resolve(
        import.meta.dirname,
        "../../libs/profile/src/profile.json",
      ),
    },
  },
});
