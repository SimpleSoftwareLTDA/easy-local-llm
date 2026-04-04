/**
 * TitleBar — Client-Side Decoration (CSD) bar.
 *
 * Single source of truth for the window title bar, drag region, and native
 * window controls (minimize / maximize / close). Rendered once at the root
 * of App so it persists across every application state (checking, downloading,
 * ready, error) without being redefined per-screen.
 *
 * PASTOR UX framework notes:
 *   P - Person:  Local LLM users needing privacy & a clean native feel.
 *   A - Pain:    Duplicate / mismatched title bars breaking immersion.
 *   S - Solution: Single CSD component, always mounted above all screens.
 *   T - Transformation: From a per-screen ad-hoc header to a universal shell.
 *   O - Offer:   Clean, distraction-free interface across all states.
 *   R - Response: Instant click-to-control window management from any screen.
 */

interface TitleBarProps {
	isThinkingEnabled: boolean;
	onToggleThinking: () => void;
	isReady: boolean;
}

export function TitleBar({ isThinkingEnabled, onToggleThinking, isReady }: TitleBarProps) {
	return (
		<header
			className="w-full h-[52px] bg-zinc-950/80 border-b border-white/5 backdrop-blur-md grid grid-cols-[1fr_auto_1fr] items-stretch shrink-0 z-[110] electrobun-webkit-app-region-drag"
			onDoubleClick={(e) => {
				const target = e.target as HTMLElement | null;
				if (target?.closest?.(".electrobun-webkit-app-region-no-drag")) return;
				// @ts-ignore
				window.Electrobun?.rpc.send("window:maximize");
			}}
		>
			{/* Left: Deep Think toggle — hidden until ready */}
			<div className="h-full flex items-center pl-3">
				<div
					className={`flex items-center gap-3 transition-opacity duration-300 ${
						isReady ? "opacity-100" : "opacity-0 pointer-events-none"
					}`}
				>
					<span
						className={`text-xs font-medium tracking-wide transition-colors pointer-events-none ${
							isThinkingEnabled ? "text-indigo-400" : "text-zinc-600"
						}`}
					>
						Deep Think
					</span>
					<button
						type="button"
						aria-label={isThinkingEnabled ? "Disable Deep Think" : "Enable Deep Think"}
						onClick={onToggleThinking}
						className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-inset electrobun-webkit-app-region-no-drag ${
							isThinkingEnabled ? "bg-indigo-500" : "bg-zinc-800"
						}`}
					>
						<span
							className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
								isThinkingEnabled ? "translate-x-5" : "translate-x-0"
							}`}
						/>
					</button>
				</div>
			</div>

			{/* Center: Title */}
			<div className="h-full flex justify-center items-center pointer-events-none">
				<h2 className="text-[10px] leading-none font-black uppercase tracking-[0.3em] bg-gradient-to-r from-zinc-300 to-zinc-600 bg-clip-text text-transparent">
					Easy Local Chat
				</h2>
			</div>

			{/* Right: Window Controls */}
			<div className="h-full flex justify-end items-stretch">
				<button
					type="button"
					// @ts-ignore
					onClick={() => window.Electrobun?.rpc.send("window:minimize")}
					aria-label="Minimize window"
					className="electrobun-webkit-app-region-no-drag w-[46px] flex items-center justify-center hover:bg-white/5 transition-colors text-zinc-500 hover:text-zinc-200 focus:outline-none"
				>
					<svg width="10" height="1" viewBox="0 0 10 1" fill="none">
						<rect width="10" height="1" fill="currentColor" />
					</svg>
				</button>

				<button
					type="button"
					// @ts-ignore
					onClick={() => window.Electrobun?.rpc.send("window:maximize")}
					aria-label="Maximize or restore window"
					className="electrobun-webkit-app-region-no-drag w-[46px] flex items-center justify-center hover:bg-white/5 transition-colors text-zinc-500 hover:text-zinc-200 focus:outline-none"
				>
					<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
						<rect x="1.5" y="1.5" width="9" height="9" stroke="currentColor" strokeWidth="1.2" />
					</svg>
				</button>

				<button
					type="button"
					// @ts-ignore
					onClick={() => window.Electrobun?.rpc.send("window:close")}
					aria-label="Close window"
					className="electrobun-webkit-app-region-no-drag w-[46px] flex items-center justify-center hover:bg-[#c42b1c] transition-colors text-zinc-500 hover:text-white focus:outline-none"
				>
					<svg width="10" height="10" viewBox="0 0 10 10" fill="none">
						<path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
					</svg>
				</button>
			</div>
		</header>
	);
}