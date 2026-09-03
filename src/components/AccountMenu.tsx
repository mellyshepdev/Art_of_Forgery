import { useEffect, useRef, useState } from "react";

const SITE = "https://theofficialblacksheepco.com";

/** Account avatar + dropdown, matching the main site's nav-auth.js.
 *
 *  Deliberately the main site's amber treatment rather than the studio's olive:
 *  this is an identity control, and it is the one element that should look the
 *  same on every property so a member recognises it. Structure, classes, menu
 *  items and the ui-avatars fallback are all taken from
 *  main-site/html/js/nav-auth.js so the two stay recognisably one thing.
 *
 *  The forge has no Keycloak of its own, so there is no session to read here:
 *  the main site resolves an avatar through kcAvatarUrl(sub) from the
 *  account-wide store, which needs a token this origin never sees. It therefore
 *  renders the same initials fallback the main site uses when a member has not
 *  uploaded one, and the menu links out to where the session does live.
 */
const ITEMS: { label: string; href: string; d: string }[] = [
  { label: "Portal",       href: `${SITE}/html/portal.html`,            d: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" },
  { label: "Dashboard",    href: `${SITE}/html/portal.html#dashboard`,  d: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" },
  { label: "Live Feed",    href: `${SITE}/html/portal.html#feeds`,      d: "M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" },
  { label: "Welcome Page", href: "https://welcome.theofficialblacksheepco.com", d: "m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" },
];

const Icon = ({ d }: { d: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export function AccountMenu({ name = "User" }: { name?: string }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement | null>(null);

  // Close on outside click and on Escape, same as the main site's handler.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initials = `https://ui-avatars.com/api/?name=${encodeURIComponent(name[0] || "U")}` +
                   `&background=f97316&color=000&size=64&bold=true`;

  return (
    <div className="relative" ref={wrap}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 p-1 rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-all duration-300"
        aria-label="User menu" aria-haspopup="true" aria-expanded={open}
      >
        <img src={initials} alt="" className="w-8 h-8 rounded-full border border-amber-400/50 object-cover bg-zinc-800" />
        <span className="hidden md:inline text-[10px] text-amber-300 tracking-widest px-1 max-w-[120px] truncate">
          {name.split(" ")[0]}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-amber-400 mr-1" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 z-[2000] bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden origin-top-right">
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-xs font-bold text-white truncate">{name}</p>
            <p className="text-[10px] text-zinc-500 truncate">Signed in on the main site</p>
          </div>
          <div className="py-1">
            {ITEMS.map((it) => (
              <a key={it.label} href={it.href} target="_blank" rel="noopener"
                 className="flex items-center gap-3 px-4 py-2.5 text-xs text-zinc-300 hover:bg-orange-500/10 hover:text-orange-400 transition-colors">
                <Icon d={it.d} />
                {it.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
