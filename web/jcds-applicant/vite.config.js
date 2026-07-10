import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: "@", replacement: "/src" }],
  },
  optimizeDeps: {
    exclude: ["js-big-decimal"],
  },
  base: '/jcdms-applicant/',

  preview: {
    port: 3001,
  },

  server: {
    port: 3001,
    base: '/jcdms-applicant/',
  },
});
