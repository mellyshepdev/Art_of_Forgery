import { LayoutGrid, Image as ImageIcon, Box } from "lucide-react";

export type AppMode = "card" | "canvas" | "3d";

const TABS: { id: AppMode; label: string; icon: typeof LayoutGrid }[] = [
  { id: "card",   label: "Card",   icon: LayoutGrid },
  { id: "canvas", label: "Canvas", icon: ImageIcon },
  { id: "3d",     label: "3D",     icon: Box },
];

/** Mode switcher, drawn as part of the top bar rather than above it.
 *
 *  It used to render its own <header> with a "Art of Forgery Studio" title and
 *  a Ready pill, which stacked straight on top of App's own .topbar - two
 *  titles ("Art of Forgery Studio" over "FORGE/STUDIO") and two bottom borders.
 *  It also styled itself in Tailwind zinc/emerald/indigo with font-mono, which
 *  matches nothing else here: the studio is #151816 bars, #292e2b rules, a
 *  #c8dc82 accent and Inter with tight tracking.
 *
 *  So: no title, no second border, and the app's own palette. Same background
 *  as .topbar with no rule beneath, so this strip and the bar below it read as
 *  one header with a single border at the bottom.
 */
export function AppNavigation({ mode, setMode }: { mode: AppMode; setMode: (m: AppMode) => void }) {
  return (
    <nav className="mode-nav">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={`mode-tab${mode === id ? " is-active" : ""}`}
          onClick={() => setMode(id)}
          aria-pressed={mode === id}
        >
          <Icon size={14} strokeWidth={1.7} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
