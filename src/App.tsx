import { useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type ReactNode } from "react";
import { toJpeg, toPng } from "html-to-image";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Cloud,
  Download,
  Eye,
  EyeOff,
  Frame,
  Hand,
  ImagePlus,
  Layers3,
  Maximize2,
  Minus,
  MousePointer2,
  Plus,
  Redo2,
  RotateCcw,
  Sparkles,
  Undo2,
  Upload,
  X,
  ZoomIn,
} from "lucide-react";

type LayerId =
  | "art"
  | "identity"
  | "health"
  | "rank"
  | "abilities"
  | "companion-left"
  | "faction"
  | "companion-right"
  | "frame";

type ThemeKey = "verdant" | "obsidian" | "arcane" | "ember";
type ExportFormat = "png" | "jpg";
type TemplateKey = "ridge" | "bevel" | "filigree" | "forge" | "minimal";

type FrameTemplate = {
  id: TemplateKey;
  name: string;
  metal: string;
  metalLight: string;
  metalDeep: string;
  borderStyle: string;
  radius: string;
  weight: number;
  crown: boolean;
  corners: boolean;
};

const frameTemplates: FrameTemplate[] = [
  { id: "ridge", name: "Verdant Ridge", metal: "#766036", metalLight: "#a18348", metalDeep: "#312719", borderStyle: "ridge", radius: "15px", weight: 74, crown: true, corners: true },
  { id: "bevel", name: "Obsidian Bevel", metal: "#5f646b", metalLight: "#9aa1aa", metalDeep: "#1c1f23", borderStyle: "double", radius: "10px", weight: 62, crown: false, corners: true },
  { id: "filigree", name: "Arcane Filigree", metal: "#6b57a8", metalLight: "#b9a4f5", metalDeep: "#241c3a", borderStyle: "groove", radius: "22px", weight: 88, crown: true, corners: true },
  { id: "forge", name: "Ember Forge", metal: "#8a4526", metalLight: "#e09055", metalDeep: "#2d150c", borderStyle: "ridge", radius: "8px", weight: 96, crown: true, corners: false },
  { id: "minimal", name: "Clean Minimal", metal: "#3c433d", metalLight: "#5c655d", metalDeep: "#141815", borderStyle: "solid", radius: "18px", weight: 30, crown: false, corners: false },
];

type Layer = {
  id: LayerId;
  number: string;
  label: string;
  helper: string;
  origin: string;
};

const layers: Layer[] = [
  { id: "art", number: "01", label: "Core artwork", helper: "Image & crop", origin: "50% 31%" },
  { id: "identity", number: "02", label: "Identity banner", helper: "Name & title", origin: "50% 7%" },
  { id: "health", number: "03", label: "Health crest", helper: "Primary stat", origin: "9% 10%" },
  { id: "rank", number: "04", label: "Rank crest", helper: "Class mark", origin: "91% 10%" },
  { id: "abilities", number: "05", label: "Ability suite", helper: "3 abilities", origin: "50% 63%" },
  { id: "companion-left", number: "06", label: "Ground companion", helper: "Portrait & copy", origin: "20% 91%" },
  { id: "faction", number: "07", label: "Faction seal", helper: "Affiliation", origin: "50% 90%" },
  { id: "companion-right", number: "08", label: "Flying companion", helper: "Portrait & copy", origin: "80% 91%" },
  { id: "frame", number: "09", label: "Frame overlay", helper: "Border & graphics", origin: "50% 50%" },
];

const themes: Record<ThemeKey, { name: string; dark: string; deep: string; accent: string; glow: string }> = {
  verdant: { name: "Verdant", dark: "#101f1b", deep: "#071411", accent: "#b6d25e", glow: "#d8ef82" },
  obsidian: { name: "Obsidian", dark: "#19191d", deep: "#09090b", accent: "#d3ab63", glow: "#f0ce8a" },
  arcane: { name: "Arcane", dark: "#19162e", deep: "#090719", accent: "#9f84ed", glow: "#c7b5ff" },
  ember: { name: "Ember", dark: "#2a1713", deep: "#160806", accent: "#dd7a43", glow: "#ffb56e" },
};

const abilities = [
  { tag: "ATK / NATURE", title: "ROOTBOUND CRUSH", detail: "Deal 18 damage. Entangle the target for 1 turn.", cost: "2", glyph: "I" },
  { tag: "UTIL / GUARD", title: "MOSSVEIL WARD", detail: "Prevent the next 12 damage dealt to an ally.", cost: "1", glyph: "II" },
  { tag: "PASSIVE / GROWTH", title: "ANCIENT BLOOM", detail: "At the start of turn, restore 4 HP to your companions.", cost: "P", glyph: "III" },
];

const defaultVisibility: Record<LayerId, boolean> = {
  art: true,
  identity: true,
  health: true,
  rank: true,
  abilities: true,
  "companion-left": true,
  faction: true,
  "companion-right": true,
  frame: true,
};

const defaultOpacity: Record<LayerId, number> = {
  art: 100,
  identity: 100,
  health: 100,
  rank: 100,
  abilities: 100,
  "companion-left": 100,
  faction: 100,
  "companion-right": 100,
  frame: 100,
};

function ToolButton({ children, label, active = false, onClick }: { children: ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button className={`tool-button ${active ? "is-active" : ""}`} title={label} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

function CardMarker({ number, className, selected, onClick }: { number: string; className: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      className={`card-marker ${className} ${selected ? "is-selected" : ""}`}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label={`Edit section ${number}`}
      data-export-hide="true"
    >
      {number}
    </button>
  );
}

function App() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [selectedLayer, setSelectedLayer] = useState<LayerId>("art");
  const [visibility, setVisibility] = useState(defaultVisibility);
  const [themeKey, setThemeKey] = useState<ThemeKey>("verdant");
  const [accent, setAccent] = useState(themes.verdant.accent);
  const [cardName, setCardName] = useState("ORYN, WARDEN OF THE WILD");
  const [cardSubtitle, setCardSubtitle] = useState("SENTINEL OF THE OLD GROVE");
  const [health, setHealth] = useState("120");
  const [rank, setRank] = useState("V");
  const [zoom, setZoom] = useState(78);
  const [artScale, setArtScale] = useState(108);
  const [artX, setArtX] = useState(50);
  const [artY, setArtY] = useState(50);
  const [frameWeight, setFrameWeight] = useState(74);
  const [layerOpacity, setLayerOpacity] = useState(defaultOpacity);
  const [artUrl, setArtUrl] = useState("/images/verdant-colossus.jpg");
  const [borderUrl, setBorderUrl] = useState<string | null>(null);
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [graphicUrl, setGraphicUrl] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [exportOpen, setExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [tool, setTool] = useState<"select" | "hand">("select");
  const [templateIndex, setTemplateIndex] = useState(0);

  const selected = useMemo(() => layers.find((layer) => layer.id === selectedLayer) ?? layers[0], [selectedLayer]);
  const theme = themes[themeKey];
  const template = frameTemplates[templateIndex];
  const currentTemplateName = template.name;

  const selectLayer = (id: LayerId) => {
    const next = layers.find((layer) => layer.id === id);
    setSelectedLayer(id);
    if (next) setZoom(id === "frame" ? 78 : id === "art" ? 86 : 94);
  };

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const readUpload = (event: ChangeEvent<HTMLInputElement>, setter: (value: string) => void, message: string) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setter(reader.result);
        flash(message);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const toggleVisibility = (id: LayerId) => setVisibility((current) => ({ ...current, [id]: !current[id] }));

  const changeTheme = (key: ThemeKey) => {
    setThemeKey(key);
    setAccent(themes[key].accent);
  };

  const handleTemplateChange = (direction: "prev" | "next") => {
    const total = frameTemplates.length;
    const next = direction === "next" ? (templateIndex + 1) % total : (templateIndex - 1 + total) % total;
    setTemplateIndex(next);
    setFrameWeight(frameTemplates[next].weight);
    flash(`${frameTemplates[next].name} template applied`);
  };

  const exportCard = async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);
    setExportOpen(false);
    const hiddenElements = cardRef.current.querySelectorAll<HTMLElement>("[data-export-hide='true']");
    cardRef.current.classList.add("is-exporting");
    hiddenElements.forEach((element) => {
      element.dataset.previousDisplay = element.style.display;
      element.style.display = "none";
    });

    try {
      const options = { cacheBust: true, pixelRatio: 3, backgroundColor: theme.deep };
      const dataUrl = exportFormat === "jpg"
        ? await toJpeg(cardRef.current, { ...options, quality: 0.96 })
        : await toPng(cardRef.current, options);
      const link = document.createElement("a");
      link.download = `${cardName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "forged-card"}.${exportFormat}`;
      link.href = dataUrl;
      link.click();
      flash(`High-resolution ${exportFormat.toUpperCase()} exported`);
    } catch {
      flash("Export failed. Try a smaller image file.");
    } finally {
      hiddenElements.forEach((element) => {
        element.style.display = element.dataset.previousDisplay ?? "";
      });
      cardRef.current?.classList.remove("is-exporting");
      setIsExporting(false);
    }
  };

  const resetCard = () => {
    setThemeKey("verdant");
    setAccent(themes.verdant.accent);
    setCardName("ORYN, WARDEN OF THE WILD");
    setCardSubtitle("SENTINEL OF THE OLD GROVE");
    setHealth("120");
    setRank("V");
    setArtScale(108);
    setArtX(50);
    setArtY(50);
    setFrameWeight(74);
    setTemplateIndex(0);
    setArtUrl("/images/verdant-colossus.jpg");
    setBorderUrl(null);
    setFrameUrl(null);
    setGraphicUrl(null);
    setVisibility(defaultVisibility);
    setLayerOpacity(defaultOpacity);
    flash("Card restored to its original state");
  };

  const layerStyle = (id: LayerId) => ({
    opacity: visibility[id] ? layerOpacity[id] / 100 : 0,
    pointerEvents: visibility[id] ? ("auto" as const) : ("none" as const),
  });

  const cardVariables = {
    "--theme-dark": theme.dark,
    "--theme-deep": theme.deep,
    "--accent": accent,
    "--accent-glow": theme.glow,
    "--frame-weight": `${frameWeight / 100}`,
    "--frame-metal": template.metal,
    "--frame-metal-light": template.metalLight,
    "--frame-metal-deep": template.metalDeep,
    "--frame-border-style": template.borderStyle,
    "--frame-radius": template.radius,
  } as CSSProperties;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark"><Sparkles size={17} strokeWidth={1.6} /></div>
          <div><strong>FORGE</strong><span>/STUDIO</span></div>
        </div>
        <div className="project-crumbs">
          <button><ChevronLeft size={16} /> Projects</button><i />
          <span>Oryn, Warden of the Wild</span><small>Draft saved</small>
        </div>
        <div className="top-actions">
          <ToolButton label="Undo"><Undo2 size={17} /></ToolButton>
          <ToolButton label="Redo"><Redo2 size={17} /></ToolButton>
          <button className="save-button" onClick={() => flash("Draft saved to your workspace")}><Cloud size={15} /> Save</button>
          <div className="export-wrap">
            <button className="export-button" onClick={exportCard} disabled={isExporting}>
              <Download size={16} /> {isExporting ? "Rendering" : "Export"}
            </button>
            <button className="export-chevron" aria-label="Export settings" onClick={() => setExportOpen((open) => !open)}><ChevronDown size={15} /></button>
            {exportOpen && (
              <div className="export-menu">
                <p>EXPORT FORMAT</p>
                {(["png", "jpg"] as ExportFormat[]).map((format) => (
                  <button key={format} onClick={() => setExportFormat(format)}>
                    <span>{format.toUpperCase()} <small>{format === "png" ? "Transparent-ready" : "Smaller file"}</small></span>
                    {exportFormat === format && <Check size={15} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="avatar" aria-label="Account">AS</button>
        </div>
      </header>

      <div className="workspace">
        <aside className="layers-panel">
          <div className="panel-heading"><span>LAYERS</span><button aria-label="Layer options"><Layers3 size={15} /></button></div>
          <div className="layer-stack">
            {layers.map((layer) => (
              <button key={layer.id} className={`layer-row ${selectedLayer === layer.id ? "is-active" : ""}`} onClick={() => selectLayer(layer.id)}>
                <span className="layer-number">{layer.number}</span>
                <span className="layer-copy"><strong>{layer.label}</strong><small>{layer.helper}</small></span>
                <span
                  className="visibility-toggle"
                  role="button"
                  tabIndex={0}
                  aria-label={`${visibility[layer.id] ? "Hide" : "Show"} ${layer.label}`}
                  onClick={(event) => { event.stopPropagation(); toggleVisibility(layer.id); }}
                  onKeyDown={(event) => { if (event.key === "Enter") toggleVisibility(layer.id); }}
                >
                  {visibility[layer.id] ? <Eye size={14} /> : <EyeOff size={14} />}
                </span>
              </button>
            ))}
          </div>
          <div className="layers-footer">
            <button onClick={() => flash("Blank graphic layer added")}><Plus size={15} /> Add layer</button>
            <button aria-label="Help"><CircleHelp size={16} /></button>
          </div>
        </aside>

        <main className="canvas-area">
          <div className="canvas-toolbar">
            <div className="tool-group">
              <ToolButton label="Select tool" active={tool === "select"} onClick={() => setTool("select")}><MousePointer2 size={16} /></ToolButton>
              <ToolButton label="Pan tool" active={tool === "hand"} onClick={() => setTool("hand")}><Hand size={16} /></ToolButton>
            </div>
            <div className="zoom-control">
              <button aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(58, value - 5))}><Minus size={14} /></button>
              <button className="zoom-value" onClick={() => setZoom(78)}>{zoom}%</button>
              <button aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(200, value + 5))}><Plus size={14} /></button>
            </div>
            <div className="tool-group canvas-options">
              <ToolButton label="Show numbered edit points" active={showMarkers} onClick={() => setShowMarkers((value) => !value)}><ZoomIn size={16} /></ToolButton>
              <ToolButton label="Fit to canvas" onClick={() => setZoom(78)}><Maximize2 size={16} /></ToolButton>
            </div>
          </div>

          <div className={`card-stage tool-${tool}`}>
            <div className="stage-grid" />
            <div className="card-transform" style={{ transform: `scale(${zoom / 100})`, transformOrigin: selected.origin }}>
              <div className="game-card" ref={cardRef} style={cardVariables}>
                <div className="card-backdrop" /><div className="inner-keyline" />

                <section className={`card-art section-target ${selectedLayer === "art" ? "is-editing" : ""}`} style={layerStyle("art")} onClick={() => selectLayer("art")}>
                  <img src={artUrl} alt="Ancient forest guardian card artwork" style={{ transform: `translate(${artX - 50}%, ${artY - 50}%) scale(${artScale / 100})` }} />
                  <div className="art-vignette" />
                </section>

                <section className={`identity-banner section-target ${selectedLayer === "identity" ? "is-editing" : ""}`} style={layerStyle("identity")} onClick={() => selectLayer("identity")}>
                  <div className="banner-wing left" /><div className="banner-wing right" />
                  <p>{cardName}</p><span>{cardSubtitle}</span>
                </section>

                <section className={`health-crest stat-crest section-target ${selectedLayer === "health" ? "is-editing" : ""}`} style={layerStyle("health")} onClick={() => selectLayer("health")}>
                  <div className="crest-points" /><div className="crest-core"><strong>{health}</strong><span>HP</span></div>
                </section>

                <section className={`rank-crest stat-crest section-target ${selectedLayer === "rank" ? "is-editing" : ""}`} style={layerStyle("rank")} onClick={() => selectLayer("rank")}>
                  <div className="crest-points" /><div className="crest-core"><strong>{rank}</strong><span>RANK</span></div>
                </section>

                <div className="side-rail rail-left"><span>GROVE</span><i /><span>WARDEN</span></div>
                <div className="side-rail rail-right"><span>ANCIENT</span><i /><span>ROOT</span></div>
                {graphicUrl && <img className="custom-graphic" src={graphicUrl} alt="Custom border graphic" />}

                <section className={`ability-panel section-target ${selectedLayer === "abilities" ? "is-editing" : ""}`} style={layerStyle("abilities")} onClick={() => selectLayer("abilities")}>
                  {abilities.map((ability) => (
                    <div className="ability-row" key={ability.title}>
                      <div className="ability-icon"><span>{ability.glyph}</span></div>
                      <div className="ability-copy"><p><small>{ability.tag}</small> {ability.title}</p><span>{ability.detail}</span></div>
                      <div className="ability-cost">{ability.cost}</div>
                    </div>
                  ))}
                </section>

                <div className="companion-label"><span /> COMPANIONS <span /></div>
                <section className={`companion companion-left section-target ${selectedLayer === "companion-left" ? "is-editing" : ""}`} style={layerStyle("companion-left")} onClick={() => selectLayer("companion-left")}>
                  <div className="companion-image companion-stag" /><strong>BRIAR STAG</strong><small>MOUNT / THORNBURST</small>
                </section>
                <section className={`faction-seal section-target ${selectedLayer === "faction" ? "is-editing" : ""}`} style={layerStyle("faction")} onClick={() => selectLayer("faction")}>
                  <div className="leaf-glyph"><i /><i /><i /></div><span>FACTION</span><strong>THE VERDANT OATH</strong><small>NATURE / GUARDIAN</small>
                </section>
                <section className={`companion companion-right section-target ${selectedLayer === "companion-right" ? "is-editing" : ""}`} style={layerStyle("companion-right")} onClick={() => selectLayer("companion-right")}>
                  <div className="companion-image companion-owl" /><strong>DUSK OWL</strong><small>FLYING / FORESIGHT</small>
                </section>

                <div className={`ornate-frame ${selectedLayer === "frame" ? "is-editing" : ""}`} style={layerStyle("frame")} onClick={() => selectLayer("frame")}>
                  {template.corners && (
                    <>
                      <div className="corner corner-tl" /><div className="corner corner-tr" /><div className="corner corner-bl" /><div className="corner corner-br" />
                    </>
                  )}
                  {template.crown && <div className="top-crown"><i /><b /><i /></div>}
                </div>
                {borderUrl && <img className="uploaded-border" src={borderUrl} alt="Uploaded border artwork" style={layerStyle("frame")} />}
                {frameUrl && <img className="uploaded-frame" src={frameUrl} alt="Uploaded frame overlay" style={layerStyle("frame")} />}

                {showMarkers && (
                  <>
                    <CardMarker number="1" className="marker-art" selected={selectedLayer === "art"} onClick={() => selectLayer("art")} />
                    <CardMarker number="2" className="marker-identity" selected={selectedLayer === "identity"} onClick={() => selectLayer("identity")} />
                    <CardMarker number="3" className="marker-health" selected={selectedLayer === "health"} onClick={() => selectLayer("health")} />
                    <CardMarker number="4" className="marker-rank" selected={selectedLayer === "rank"} onClick={() => selectLayer("rank")} />
                    <CardMarker number="5" className="marker-abilities" selected={selectedLayer === "abilities"} onClick={() => selectLayer("abilities")} />
                    <CardMarker number="6" className="marker-companion-left" selected={selectedLayer === "companion-left"} onClick={() => selectLayer("companion-left")} />
                    <CardMarker number="7" className="marker-faction" selected={selectedLayer === "faction"} onClick={() => selectLayer("faction")} />
                    <CardMarker number="8" className="marker-companion-right" selected={selectedLayer === "companion-right"} onClick={() => selectLayer("companion-right")} />
                    <CardMarker number="9" className="marker-frame" selected={selectedLayer === "frame"} onClick={() => selectLayer("frame")} />
                  </>
                )}
              </div>
            </div>
            <div className="canvas-caption"><span>{cardName}</span><small>744 x 1056 px</small></div>
          </div>
        </main>

        <aside className="properties-panel">
          <div className="properties-title">
            <div><span>{selected.number}</span><p><strong>{selected.label}</strong><small>{selected.helper}</small></p></div>
            <button aria-label="Close properties" onClick={() => selectLayer("art")}><X size={16} /></button>
          </div>

          <div className="property-scroll">
            <section className="property-section">
              <div className="section-label"><span>CONTENT</span><button>Reset</button></div>
              {selectedLayer === "identity" && (
                <>
                  <label className="field-label">Card name</label>
                  <input className="text-input" value={cardName} maxLength={34} onChange={(event) => setCardName(event.target.value.toUpperCase())} />
                  <label className="field-label">Subtitle</label>
                  <input className="text-input" value={cardSubtitle} maxLength={34} onChange={(event) => setCardSubtitle(event.target.value.toUpperCase())} />
                </>
              )}
              {selectedLayer === "health" && (
                <>
                  <label className="field-label">Health value</label>
                  <div className="number-input"><button onClick={() => setHealth(String(Math.max(0, Number(health) - 5)))}><Minus size={14} /></button><input value={health} onChange={(event) => setHealth(event.target.value.replace(/\D/g, "").slice(0, 3))} /><button onClick={() => setHealth(String(Math.min(999, Number(health) + 5)))}><Plus size={14} /></button></div>
                </>
              )}
              {selectedLayer === "rank" && (
                <><label className="field-label">Rank mark</label><input className="text-input rank-input" value={rank} maxLength={2} onChange={(event) => setRank(event.target.value.toUpperCase())} /></>
              )}
              {selectedLayer === "art" && (
                <label className="upload-zone large-upload">
                  <input type="file" accept="image/*" onChange={(event) => readUpload(event, setArtUrl, "Artwork replaced")} />
                  <ImagePlus size={21} /><span><strong>Replace artwork</strong><small>PNG, JPG or WEBP up to 15 MB</small></span><Upload size={15} />
                </label>
              )}
              {selectedLayer === "abilities" && <p className="property-note">Select ability copy directly on the card. Advanced copy editing is available in the full layout view.</p>}
              {selectedLayer.includes("companion") && <p className="property-note">Companion portrait controls inherit the artwork treatment and circular mask.</p>}
              {selectedLayer === "faction" && <p className="property-note">The faction seal uses your accent color and currently selected frame metal.</p>}
              {selectedLayer === "frame" && <p className="property-note">Build a custom edge treatment with transparent PNG border and frame layers.</p>}
            </section>
            {selectedLayer === "frame" && (
              <section className="property-section">
                <div className="section-label">
                  <span>TEMPLATE</span>
                  <button aria-label="Reset template" onClick={() => { setTemplateIndex(0); setFrameWeight(frameTemplates[0].weight); }}><RotateCcw size={13} /></button>
                </div>
                <div className="template-selector">
                  <button aria-label="Previous template" onClick={() => handleTemplateChange("prev")}><ChevronLeft size={16} /></button>
                  <div className="template-name">
                    <strong>{currentTemplateName}</strong>
                    <small>{templateIndex + 1} / {frameTemplates.length}</small>
                  </div>
                  <button aria-label="Next template" onClick={() => handleTemplateChange("next")}><ChevronRight size={16} /></button>
                </div>
              </section>
            )}
            <section className="property-section">
              <div className="section-label"><span>COLOR SYSTEM</span><button aria-label="Color help"><CircleHelp size={13} /></button></div>
              <div className="swatch-row">
                {(Object.keys(themes) as ThemeKey[]).map((key) => (
                  <button key={key} className={`theme-swatch ${themeKey === key ? "is-active" : ""}`} style={{ "--swatch": themes[key].accent, "--swatch-dark": themes[key].dark } as CSSProperties} onClick={() => changeTheme(key)} aria-label={`${themes[key].name} theme`}>
                    {themeKey === key && <Check size={13} />}
                  </button>
                ))}
                <label className="custom-color" title="Custom accent"><input type="color" value={accent} onChange={(event) => setAccent(event.target.value)} /><Plus size={15} /></label>
              </div>
              <div className="color-value"><span style={{ background: accent }} /><div><small>ACCENT</small><strong>{accent.toUpperCase()}</strong></div><button onClick={() => navigator.clipboard?.writeText(accent)}><ChevronRight size={14} /></button></div>
            </section>

            {(selectedLayer === "art" || selectedLayer === "frame") && (
              <section className="property-section">
                <div className="section-label"><span>{selectedLayer === "art" ? "PLACEMENT" : "FRAME DETAIL"}</span><button onClick={() => { setArtScale(108); setArtX(50); setArtY(50); setFrameWeight(74); }}><RotateCcw size={13} /></button></div>
                {selectedLayer === "art" ? (
                  <>
                    <label className="range-label"><span>Scale</span><output>{artScale}%</output></label>
                    <input type="range" min="90" max="150" value={artScale} onChange={(event) => setArtScale(Number(event.target.value))} />
                    <div className="range-split">
                      <label><span>X position</span><input type="number" value={artX} onChange={(event) => setArtX(Number(event.target.value))} /></label>
                      <label><span>Y position</span><input type="number" value={artY} onChange={(event) => setArtY(Number(event.target.value))} /></label>
                    </div>
                  </>
                ) : (
                  <><label className="range-label"><span>Ornament density</span><output>{frameWeight}%</output></label><input type="range" min="20" max="100" value={frameWeight} onChange={(event) => setFrameWeight(Number(event.target.value))} /></>
                )}
              </section>
            )}

            <section className="property-section">
              <div className="section-label"><span>CUSTOM ASSETS</span><button aria-label="Asset info"><CircleHelp size={13} /></button></div>
              <div className="asset-buttons">
                <label><input type="file" accept="image/png,image/webp" onChange={(event) => readUpload(event, setBorderUrl, "Custom border applied")} /><span className="asset-icon"><Frame size={16} /></span><span><strong>Border artwork</strong><small>{borderUrl ? "Custom layer active" : "Transparent PNG"}</small></span><Upload size={14} /></label>
                <label><input type="file" accept="image/png,image/webp" onChange={(event) => readUpload(event, setFrameUrl, "Frame overlay applied")} /><span className="asset-icon"><Layers3 size={16} /></span><span><strong>Frame overlay</strong><small>{frameUrl ? "Overlay active" : "Full-card PNG"}</small></span><Upload size={14} /></label>
                <label><input type="file" accept="image/*" onChange={(event) => readUpload(event, setGraphicUrl, "Custom graphic added")} /><span className="asset-icon"><Sparkles size={16} /></span><span><strong>Border graphic</strong><small>{graphicUrl ? "Graphic active" : "Crest or ornament"}</small></span><Upload size={14} /></label>
              </div>
            </section>

            <section className="property-section compact-section">
              <label className="range-label"><span>Layer opacity</span><output>{layerOpacity[selectedLayer]}%</output></label>
              <input type="range" min="0" max="100" value={layerOpacity[selectedLayer]} onChange={(event) => setLayerOpacity((current) => ({ ...current, [selectedLayer]: Number(event.target.value) }))} />
            </section>
          </div>

          <div className="properties-footer">
            <button onClick={resetCard}><RotateCcw size={15} /> Reset card</button>
            <button className="apply-button" onClick={() => flash(`${selected.label} changes applied`)}><Check size={15} /> Apply</button>
          </div>
        </aside>
      </div>

      {toast && <div className="toast"><Check size={15} /> {toast}</div>}
    </div>
  );
}

export default App;
