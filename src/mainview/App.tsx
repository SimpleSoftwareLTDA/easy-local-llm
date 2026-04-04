import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Electroview } from "electrobun/view";
import icon from "../../assets/icon.ico";
import { TitleBar } from "./TitleBar";

function App() {
	const [status, setStatus] = useState<"checking" | "downloading" | "ready" | "error">("checking");
	const [statusMessage, setStatusMessage] = useState("Verificando dependências do sistema...");
	const [downloadProgress, setDownloadProgress] = useState(0);
	const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
	const [input, setInput] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const [isThinkingEnabled, setIsThinkingEnabled] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		// Initialize Electrobun RPC Bridge as an Electrobun Assistant
		// This opens the WebSocket/Bridge connection to the Bun process
		const rpc = Electroview.defineRPC({
			handlers: {
				requests: {},
				messages: {}
			}
		});

		const view = new Electroview({ rpc });

		// @ts-ignore - Expose for TitleBar onClick handlers
		window.Electrobun = { rpc: view.rpc };

		console.log("ELL Renderer: RPC Bridge Active");
	}, []);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages, isTyping]);

	useEffect(() => {
		// Connection to status API on Bun Process
		const checkStatus = async () => {
			try {
				const res = await fetch("http://localhost:11445/api/status");
				if (!res.ok) throw new Error("not ready");
				const data = await res.json();
				if (data.message) setStatusMessage(data.message);
				if (data.status === "downloading") {
					setStatus("downloading");
					setDownloadProgress(data.progress);
					setTimeout(checkStatus, 1000);
				} else if (data.status === "error") {
					setStatus("error");
					setTimeout(checkStatus, 5000);
				} else if (data.status === "ready") {
					setStatus("ready");
				} else {
					setStatus("checking");
					setTimeout(checkStatus, 2000);
				}
			} catch (e) {
				setTimeout(checkStatus, 2000);
			}
		};
		checkStatus();
	}, []);

	const handleSend = async () => {
		if (!input.trim() || status !== "ready") return;

		const userMsg = { role: "user", content: input };
		setMessages((prev) => [...prev, userMsg]);
		setInput("");
		setIsTyping(true);

		const systemPrompt = `${isThinkingEnabled ? "<|think|>" : ""}You are Ell, an incredibly smart and fast and private local assistant. 
With these guidelines:

# Engagement Rules & Operational Culture

## Writing Style & Typography
### 🧠 The Behavior-First Filter
- Eliminate "AI Slop": Cut vague metaphors. If it sounds like a motivational poster, delete it.
- The Behavioral Test: For every sentence, ask: "Does this tell the reader exactly what to do?"
- Maximize Value per Word: Distill messages to their essence.
- Direct & Blunt: Tell them to "work 10 hours if necessary and DO what it takes." Be direct and actionable.
- Punctuation & Flow: NEVER use the long dash (—); use the semicolon (;) instead.

## Operational Standards
- Prioritize Logic over Vibes; ensure Premium Aesthetics.
- When in doubt, apply the PASTOR framework for copy: Person, Pain, Amplify, Solution, Transformation, Offer, Response.`;

		const payload = {
			model: "gemma-4-e4b-it",
			messages: [
				{ role: "system", content: systemPrompt },
				...messages,
				userMsg
			],
			stream: false
		};

		try {
			// Connect to Local llama.cpp via Bun Proxy
			const response = await fetch("http://localhost:11444/v1/chat/completions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const data = await response.json();
			const botReply = data.choices[0].message.content;

			setMessages((prev) => [...prev, { role: "assistant", content: botReply }]);
		} catch (error) {
			setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Erro ao se conectar à instância do Local ELL." }]);
		} finally {
			setIsTyping(false);
		}
	};

	return (
		<div className="h-screen flex flex-col bg-[#09090b] text-zinc-100 font-sans select-none">
			{/* TitleBar: always mounted, never conditionally removed */}
			<TitleBar
				isThinkingEnabled={isThinkingEnabled}
				onToggleThinking={() => setIsThinkingEnabled((v) => !v)}
				isReady={status === "ready"}
			/>

			{/* Content area: fills remaining height */}
			<div className="flex-1 relative overflow-hidden">

				{/* Loader Screen */}
				<div className={`absolute inset-0 z-50 flex items-center justify-center bg-[#09090b] transition-all duration-700 ease-in-out ${status === "ready" ? "opacity-0 pointer-events-none scale-105" : "opacity-100"}`}>
					<div className={`bg-white/5 border border-white/10 backdrop-blur-xl p-10 flex w-full max-w-md flex-col gap-6 items-center rounded-3xl shadow-2xl transition-transform duration-700 ${status === "ready" ? "scale-95" : "scale-100"}`}>
						<div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)] ${status === "error" ? "bg-red-500/20 shadow-red-500/50" : "bg-gradient-to-br from-indigo-500 to-purple-600 animate-pulse"}`}>
							{status === "error" ? <span className="text-2xl">❌</span> : <img src={icon} alt="ELL Icon" className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />}
						</div>
						<h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent">Easy Local Chat</h1>

						{status === "checking" ? (
							<p className="text-zinc-500 animate-pulse text-sm">{statusMessage}</p>
						) : status === "error" ? (
							<p className="text-red-400 text-sm italic text-center">{statusMessage || "Não foi possível iniciar o serviço. Veja o console."}</p>
						) : (
							<div className="w-full flex flex-col gap-2">
								<div className="flex justify-between text-xs text-zinc-400 font-medium tracking-wider">
									<span>BAIXANDO MODELO DE LINGUAGEM</span>
									<span>{downloadProgress}%</span>
								</div>
								<div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-white/5">
									<div
										className="bg-indigo-500 h-2 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(99,102,241,0.8)]"
										style={{ width: `${Math.max(downloadProgress, 1)}%` }}
									></div>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Chat View */}
				<div className={`absolute inset-0 flex flex-col transition-all duration-700 ease-out z-10 ${status === "ready" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
					<main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center custom-scrollbar">
						<div className="w-full max-w-3xl flex flex-col gap-6 pb-20">
							{messages.length === 0 ? (
								<div className="h-full flex flex-col items-center justify-center pt-20 pb-10 opacity-50">
									<div className="w-20 h-20 mb-6 bg-white/5 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/5">
										<img src={icon} alt="ELL Icon" className="w-12 h-12 object-contain" />
									</div>
									<h2 className="text-2xl font-medium tracking-tight mb-2 text-white">Ready to assist.</h2>
									<p className="text-zinc-300">Fast, local, and private.</p>
								</div>
							) : (
								messages.map((msg, i) => (
									<div key={i} className={`flex w-[90%] ${msg.role === "user" ? "self-end justify-end" : "self-start justify-start"}`}>
										<div className={`
											px-6 py-4 rounded-3xl text-[15px] leading-relaxed max-w-full relative shadow-sm
											${msg.role === "user"
											? "bg-zinc-800 text-zinc-100 rounded-br-sm border border-zinc-700/50"
											: "bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-zinc-200 rounded-bl-sm border border-indigo-500/20 backdrop-blur-sm shadow-[0_4px_24px_rgba(99,102,241,0.05)]"}
										`}>
											{msg.role === "user" ? (
												msg.content
											) : (
												<div className="prose prose-zinc prose-invert max-w-none prose-p:leading-snug prose-pre:bg-zinc-900/80 prose-pre:border prose-pre:border-white/10 prose-headings:font-medium prose-a:text-indigo-400">
													<ReactMarkdown>{msg.content}</ReactMarkdown>
												</div>
											)}
										</div>
									</div>
								))
							)}

							{isTyping && (
								<div className="flex w-[80%] self-start justify-start">
									<div className="px-6 py-5 rounded-3xl bg-zinc-900/50 rounded-bl-sm flex items-center gap-1.5 border border-white/5 backdrop-blur-sm">
										<div className="w-2 h-2 rounded-full bg-indigo-500/50 animate-bounce" style={{ animationDelay: "0ms" }}></div>
										<div className="w-2 h-2 rounded-full bg-indigo-500/50 animate-bounce" style={{ animationDelay: "150ms" }}></div>
										<div className="w-2 h-2 rounded-full bg-indigo-500/50 animate-bounce" style={{ animationDelay: "300ms" }}></div>
									</div>
								</div>
							)}
							<div ref={messagesEndRef} />
						</div>
					</main>

					<footer className="w-full max-w-3xl mx-auto p-4 md:p-6 shrink-0">
						<div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-[2rem] p-2 shadow-2xl focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all duration-300">
							<input
								type="text"
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSend()}
								placeholder="Message ELL..."
								className="flex-1 bg-transparent border-none text-zinc-200 placeholder:text-zinc-600 px-4 py-2 outline-none text-[15px]"
								disabled={isTyping}
							/>
							<button
								onClick={handleSend}
								disabled={!input.trim() || isTyping}
								className="bg-zinc-100 hover:bg-white text-zinc-900 disabled:opacity-30 disabled:hover:bg-zinc-100 p-2.5 rounded-full transition-colors focus:outline-none"
							>
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<line x1="22" y1="2" x2="11" y2="13"></line>
									<polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
								</svg>
							</button>
						</div>
						<p className="text-center text-xs text-zinc-100 mt-4 mx-auto w-full">Easy Local Chat runs entirely on your local machine.</p>
					</footer>
				</div>

			</div>
		</div>
	);
}

export default App;