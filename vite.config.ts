import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Library build configuration
  if (mode === "lib") {
    return {
      plugins: [
        react(),
        dts({
          insertTypesEntry: true,
          include: ["src"],
          exclude: ["src/main.tsx"],
        }),
      ],
      resolve: {
        alias: {
          "@": "/src",
        },
      },
      build: {
        lib: {
          entry: resolve(__dirname, "src/index.ts"),
          name: "PluginTool",
          formats: ["es"],
          fileName: () => "index.js",
        },
        rollupOptions: {
          external: [
            "react",
            "react-dom",
            "react/jsx-runtime",
            "react-router-dom",
          ],
          output: {
            globals: {
              react: "React",
              "react-dom": "ReactDOM",
              "react/jsx-runtime": "jsxRuntime",
              "react-router-dom": "ReactRouterDOM",
            },
            assetFileNames: (assetInfo) => {
              if (assetInfo.name === "style.css") return "styles.css";
              return assetInfo.name || "";
            },
          },
        },
        cssCodeSplit: false,
        sourcemap: true,
      },
    };
  }

  // Default development/production build
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
    server: {
      port: 3000,
      proxy: {
        "/api": {
          target: "http://127.0.0.1:2000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      css: false,
    },
  };
});
