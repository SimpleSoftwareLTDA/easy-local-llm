import { BrowserWindow, Updater } from "electrobun/bun";
import { existsSync, mkdirSync, createWriteStream } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { homedir } from "node:os";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

// State for the local LLM server
let llmStatus: "checking" | "downloading" | "launching" | "ready" | "error" = "checking";
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
	
	while(true) {
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

async function setupAndLaunch() {
    try {
	    llmStatus = "checking";
	    
	    // 1. Proactive check for existing llama.server instance on port 11444
	    try {
	        const res = await fetch("http://localhost:11444/health");
	        if (res.ok) {
	            console.log("Existing llama-server detected on port 11444. Reusing instance...");
	            llmStatus = "ready";
	            return;
	        }
	    } catch (e) {
	        // Port free or server not responding, proceed with launch
	        console.log("No existing llama-server detected. Proceeding with launch...");
	    }
	    
	    // 2. Normal Setup Sequence
	    const engineDir = join(homedir(), ".ell-engine");
	    if (!existsSync(engineDir)) mkdirSync(engineDir);
	    
	    const modelFile = join(engineDir, "gemma.gguf");
	    
	    // Ensure llama-server is installed via system package manager
	    try {
	        execSync("llama-server --version", { stdio: "ignore" });
	    } catch {
	        llmStatus = "downloading";
	        console.log("Llama.cpp not found globally. Installing via package manager...");
	        
	        if (process.platform === "win32") {
	            execSync("winget install llama.cpp --accept-package-agreements --accept-source-agreements", { stdio: "inherit" });
	        } else if (process.platform === "darwin") {
	            execSync("brew install llama.cpp", { stdio: "inherit" });
	        } else {
	            // Linux fallback 
	            try {
	                execSync("brew install llama.cpp", { stdio: "inherit" });
	            } catch {
	                execSync("nix profile install nixpkgs#llama-cpp", { stdio: "inherit" });
	            }
	        }
	    }
	    
	    if (!existsSync(modelFile)) {
	        llmStatus = "downloading";
	        downloadProgress = 0;
	        console.log("Downloading GGUF model...");
	        await downloadFile("https://huggingface.co/lmstudio-community/gemma-4-E4B-it-GGUF/resolve/main/gemma-4-E4B-it-Q4_K_M.gguf?download=true", modelFile);
	    }
	    
	    llmStatus = "launching";
	    console.log("Launching llama-server...");
	    
	    // Since it's installed globally, we can call llama-server directly
	    serverProc = Bun.spawn([
	        "llama-server",
	        "-m", modelFile,
	        "--port", "11444",
	        "-c", "2048",
	        "-np", "1",
	        "--flash-attn", "on", // Otimização massiva: Flash Attention
	        "-ngl", "99"    // Forçar descarregamento das camadas pro Vulkan/GPU
	    ], {
	        cwd: engineDir,
	        stdout: "pipe",
	        stderr: "pipe"
	    });
	    serverProc.exited.then((exitCode: number) => {
	        if (exitCode !== 0) {
	            console.error("llama-server crashed silently with exit code:", exitCode);
	            llmStatus = "error";
	        }
	    });
	    
	    // Poll until ready
	    const checkReady = async () => {
	        try {
	            const res = await fetch("http://localhost:11444/health");
	            if (res.ok) {
	                llmStatus = "ready";
	                console.log("llama-server is ready on port 11444!");
	            } else {
	                setTimeout(checkReady, 1000);
	            }
	        } catch {
	             setTimeout(checkReady, 1000);
	        }
	    };
	    checkReady();
    } catch (e) {
        console.error(e);
        llmStatus = "error";
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
			return new Response(JSON.stringify({ status: llmStatus, progress: downloadProgress }), {
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
	title: "Easy Local LLM",
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

console.log("Easy Local LLM started!");

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
