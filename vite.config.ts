import { defineConfig } from "vite";
import electron from "vite-plugin-electron";

export default defineConfig({
    plugins: [
        electron([
            {
                entry: "src/main.ts",
                vite: {
                    build: {
                        outDir: "dist",
                        rollupOptions: {
                            output: {
                                entryFileNames: "main.js",
                                format: "esm",
                            },
                        },
                    },
                },
            },
            {
                entry: "src/preload.ts",
                onstart(args) {
                    args.reload();
                },
                vite: {
                    build: {
                        outDir: "dist",
                        rollupOptions: {
                            output: {
                                entryFileNames: "preload.js",
                                format: "cjs",
                                exports: "auto",
                            },
                        },
                        lib: {
                            entry: "src/preload.ts",
                            formats: ["cjs"],
                            fileName: () => "preload.js",
                        },
                    },
                },
            },
            {
                entry: "src/game-observer.ts",
                onstart(args) {
                    args.reload();
                },
                vite: {
                    build: {
                        outDir: "dist",
                        minify: true,
                        rollupOptions: {
                            output: {
                                entryFileNames: "game-observer.js",
                                format: "iife",
                            },
                        },
                    },
                },
            },
        ]),
    ],
});
