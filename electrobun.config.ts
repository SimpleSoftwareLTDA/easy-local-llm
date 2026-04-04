import type { ElectrobunConfig } from "electrobun";

export default {
	app: {
		name: "Easy Local Chat",
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
	}
} satisfies ElectrobunConfig;
