import React from "react";
import { LayoutGrid, Image as ImageIcon, Box, Layers } from "lucide-react";

export type AppMode = "card" | "canvas" | "3d" | "border";

interface AppNavigationProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

export const AppNavigation: React.FC<AppNavigationProps> = ({ mode, setMode }) => {
  return (
    <header className="h-12 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 z-30 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-bold text-sm tracking-wide text-zinc-100">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-500 to-indigo-500 flex items-center justify-center text-white text-xs font-black shadow-md">
            A
          </div>
          <span>Art of Forgery Studio</span>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 shadow-inner">
        <button
          onClick={() => setMode("card")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mode === "card"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
          }`}
        >
          <LayoutGrid size={15} />
          <span>Card Studio</span>
        </button>

        <button
          onClick={() => setMode("border")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mode === "border"
              ? "bg-amber-600 text-white shadow-md"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
          }`}
        >
          <Layers size={15} />
          <span>Border Creator</span>
        </button>

        <button
          onClick={() => setMode("canvas")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mode === "canvas"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
          }`}
        >
          <ImageIcon size={15} />
          <span>Free Canvas</span>
        </button>

        <button
          onClick={() => setMode("3d")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mode === "3d"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
          }`}
        >
          <Box size={15} />
          <span>3D Character Studio</span>
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Ready</span>
      </div>
    </header>
  );
};
