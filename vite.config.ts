import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { electrobunViteAliases } from "./.hutch/devkit/api/config/electrobun-vite.ts";

export default defineConfig({
	base: "./",
	plugins: [react()],
	root: "src/mainview",
	resolve: {
		alias: electrobunViteAliases(path.resolve(__dirname, ".hutch/devkit")),
	},
	build: {
		outDir: "../../dist",
		emptyOutDir: true,
	},
	server: {
		port: 5173,
		strictPort: true,
	},
});

