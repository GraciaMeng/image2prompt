import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

function extensionHotFilePlugin(mode: string) {
  return {
    name: "extension-hot-file",
    closeBundle() {
      if (mode !== "development") {
        rmSync(resolve(__dirname, "dist/hot-update.json"), { force: true });
        return;
      }

      mkdirSync(resolve(__dirname, "dist"), { recursive: true });
      writeFileSync(
        resolve(__dirname, "dist/hot-update.json"),
        JSON.stringify(
          {
            buildId: new Date().toISOString()
          },
          null,
          2
        )
      );
    }
  };
}

function releaseManifestPlugin(mode: string) {
  return {
    name: "release-manifest",
    closeBundle() {
      if (mode === "development") {
        return;
      }

      const manifestPath = resolve(__dirname, "dist/manifest.json");
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
        permissions?: string[];
        web_accessible_resources?: Array<{ resources?: string[]; matches?: string[] }>;
      };

      manifest.permissions = manifest.permissions?.filter((permission) => permission !== "alarms");
      manifest.web_accessible_resources = manifest.web_accessible_resources?.filter(
        (entry) => !entry.resources?.includes("hot-update.json")
      );
      if (!manifest.web_accessible_resources?.length) {
        delete manifest.web_accessible_resources;
      }

      writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    }
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), extensionHotFilePlugin(mode), releaseManifestPlugin(mode)],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        options: resolve(__dirname, "index.html"),
        popup: resolve(__dirname, "popup.html"),
        background: resolve(__dirname, "src/background/main.ts"),
        content: resolve(__dirname, "src/content/main.ts")
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background") {
            return "background.js";
          }
          if (chunkInfo.name === "content") {
            return "content.js";
          }
          return "assets/[name]-[hash].js";
        }
      }
    }
  }
}));
