import type { ElectrobunConfig } from "electrobun";

export default {
	app: {
		name: "Easy Local LLM",
		identifier: "simple.software.ell",
		version: "0.0.1",
	},
	build: {
		// Vite builds to dist/, we copy from there
		copy: {
			"dist/index.html": "views/mainview/index.html",
			"dist/assets": "views/mainview/assets",
			"assets/icon.png": "assets/icon.png",
			"assets/icon.ico": "assets/icon.ico",
		},
		// Ignore Vite output in watch mode — HMR handles view rebuilds separately
		watchIgnore: ["dist/**"],
		mac: {
			icons: "assets/icon.png",
			bundleCEF: false,
		},
		linux: {
			icon: "assets/icon.png",
			bundleCEF: false,
		},
		win: {
			icon: "assets/icon.ico",
			bundleCEF: false,
		},
	},
	scripts: {
		/**
		 * Electrobun v1.16.0 has a bug on Windows where it tries to use a hardcoded
		 * CI path for rcedit (D:\a\...). This manually fixes the icons after build.
		 */
		postBuild: "scripts/fix-win-icon.ts",
	},
} satisfies ElectrobunConfig;
