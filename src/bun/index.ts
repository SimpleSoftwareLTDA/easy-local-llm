import { BrowserWindow, Updater } from "electrobun/bun";
import { existsSync, mkdirSync, createWriteStream } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

// State for the local LLM server
let llmStatus: "checking" | "downloading" | "launching" | "ready" | "error" = "checking";
let statusMessage = "Verificando dependências do sistema...";
let downloadProgress = 0;
let serverProc: any = null;

async function downloadFile(url: string, path: string) {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Failed to fetch ${url}`);
	const totalSize = Number(response.headers.get("content-length")) || 0;
	let downloadedSize = 0;

	const stream = createWriteStream(path);
	//@ts-ignore
	const reader = response.body.getReader();

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		stream.write(value);
		downloadedSize += value.length;
		if (totalSize) {
			downloadProgress = Math.round((downloadedSize / totalSize) * 100);
		}
	}
	stream.end();
}

async function runCommand(cmd: string[]): Promise<boolean> {
	const proc = Bun.spawn(cmd, { stdout: "pipe", stderr: "pipe" });
	const exitCode = await proc.exited;
	return exitCode === 0;
}

async function isLlamaCppInstalled(): Promise<boolean> {
	return runCommand(["llama-server", "--version"]);
}

async function installLlamaCpp(): Promise<void> {
	if (process.platform === "win32") {
		statusMessage = "Instalando llama.cpp via winget...";
		console.log(statusMessage);
		const ok = await runCommand([
			"winget", "install", "llama.cpp",
			"--accept-package-agreements",
			"--accept-source-agreements",
		]);
		if (!ok) throw new Error("winget install llama.cpp failed");
	} else if (process.platform === "darwin") {
		statusMessage = "Instalando llama.cpp via Homebrew...";
		console.log(statusMessage);
		const ok = await runCommand(["brew", "install", "llama.cpp"]);
		if (!ok) throw new Error("brew install llama.cpp failed");
	} else {
		// Linux: try brew, fall back to nix
		statusMessage = "Instalando llama.cpp via Homebrew...";
		console.log(statusMessage);
		const brewOk = await runCommand(["brew", "install", "llama.cpp"]);
		if (!brewOk) {
			statusMessage = "Homebrew falhou; tentando Nix...";
			console.log(statusMessage);
			const nixOk = await runCommand(["nix", "profile", "install", "nixpkgs#llama-cpp"]);
			if (!nixOk) throw new Error("Both brew and nix failed to install llama.cpp");
		}
	}
}

async function setupAndLaunch() {
	try {
		llmStatus = "checking";
		statusMessage = "Verificando instância existente...";

		// 1. Reuse existing llama-server if already running
		try {
			const res = await fetch("http://localhost:11444/health");
			if (res.ok) {
				console.log("Existing llama-server detected on port 11444. Reusing instance...");
				llmStatus = "ready";
				return;
			}
		} catch {
			console.log("No existing llama-server detected. Proceeding with launch...");
		}

		// 2. Ensure engine dir exists
		const engineDir = join(homedir(), ".ell-engine");
		if (!existsSync(engineDir)) mkdirSync(engineDir);

		const modelFile = join(engineDir, "gemma.gguf");

		// 3. Install llama.cpp if missing
		const installed = await isLlamaCppInstalled();
		if (!installed) {
			llmStatus = "downloading";
			await installLlamaCpp();
		}

		// 4. Download model if missing
		if (!existsSync(modelFile)) {
			llmStatus = "downloading";
			downloadProgress = 0;
			statusMessage = "Baixando modelo de linguagem...";
			console.log(statusMessage);
			await downloadFile(
				"https://huggingface.co/lmstudio-community/gemma-4-E4B-it-GGUF/resolve/main/gemma-4-E4B-it-Q4_K_M.gguf?download=true",
				modelFile
			);
		}

		// 5. Launch server
		llmStatus = "launching";
		statusMessage = "Iniciando o chat local e privado...";
		console.log(statusMessage);

		serverProc = Bun.spawn([
			"llama-server",
			"-m", modelFile,
			"--port", "11444",
			"-c", "2048",
			"-np", "1",
			"--flash-attn", "on",
			"-ngl", "99",
		], {
			cwd: engineDir,
			stdout: "pipe",
			stderr: "pipe",
		});

		serverProc.exited.then((exitCode: number) => {
			if (exitCode !== 0) {
				console.error("llama-server crashed with exit code:", exitCode);
				llmStatus = "error";
				statusMessage = `llama-server encerrou com código ${exitCode}.`;
			}
		});

		// 6. Poll until ready (max 3 min)
		const POLL_INTERVAL_MS = 1000;
		const MAX_POLLS = 180;
		let polls = 0;

		const checkReady = async () => {
			if (polls++ >= MAX_POLLS) {
				llmStatus = "error";
				statusMessage = "Timeout: llama-server não respondeu em 3 minutos.";
				console.error(statusMessage);
				return;
			}
			try {
				const res = await fetch("http://localhost:11444/health");
				if (res.ok) {
					llmStatus = "ready";
					statusMessage = "Pronto.";
					console.log("llama-server is ready on port 11444!");
					return;
				}
			} catch {
				// not yet ready
			}
			setTimeout(checkReady, POLL_INTERVAL_MS);
		};

		checkReady();
	} catch (e) {
		console.error(e);
		llmStatus = "error";
		statusMessage = e instanceof Error ? e.message : "Erro desconhecido.";
	}
}

setupAndLaunch();

// Status Server on 11445
Bun.serve({
	port: 11445,
	fetch(req) {
		const url = new URL(req.url);
		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "OPTIONS, GET",
		};
		if (req.method === "OPTIONS") return new Response("OK", { headers: corsHeaders });
		if (url.pathname === "/api/status") {
			return new Response(JSON.stringify({ status: llmStatus, progress: downloadProgress, message: statusMessage }), {
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}
		return new Response("Not Found", { status: 404, headers: corsHeaders });
	}
});

async function getMainViewUrl(): Promise<string> {
	const channel = await Updater.localInfo.channel();
	if (channel === "dev") {
		try {
			await fetch(DEV_SERVER_URL, { method: "HEAD" });
			console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
			return DEV_SERVER_URL;
		} catch {
			console.log("Vite dev server not running. Run 'bun run dev:hmr' for HMR support.");
		}
	}
	return "views://mainview/index.html";
}

const url = await getMainViewUrl();

const mainWindow = new BrowserWindow({
	title: "Easy Local Chat",
	titleBarStyle: "hidden",
	frame: {
		width: 1024,
		height: 768,
		x: 100,
		y: 100,
	},
	url,
});

// Window Controls via RPC Bridge
if (mainWindow.webview.rpc) {
	// @ts-ignore - Listening for custom window control signals from Renderer
	mainWindow.webview.rpc.addMessageListener('window:minimize', () => {
		console.log("RPC: Window [Minimize] received");
		mainWindow.minimize();
	});

	// @ts-ignore
	mainWindow.webview.rpc.addMessageListener('window:maximize', () => {
		console.log("RPC: Window [Maximize] received");
		if (mainWindow.isMaximized()) {
			mainWindow.unmaximize();
		} else {
			mainWindow.maximize();
		}
	});

	// @ts-ignore
	mainWindow.webview.rpc.addMessageListener('window:close', () => {
		console.log("RPC: Window [Close] received");
		mainWindow.close();
	});
}

console.log("Easy Local Chat started!");

const cleanup = () => {
	if (serverProc) {
		console.log("Shutting down llama-server...");
		try { serverProc.kill(); } catch (e) {}
		serverProc = null;
	}
};

process.on("beforeExit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(0); });
process.on("SIGTERM", () => { cleanup(); process.exit(0); });