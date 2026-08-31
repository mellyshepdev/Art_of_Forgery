import { useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { toJpeg, toPng } from "html-to-image";
import { cardTemplates, templateSrc } from "./data/cardTemplates";
import { cardSlots, slotById, slotStyle } from "./data/cardSlots";
import { DEFAULT_BRUSH, type BrushState } from "./paint/brushes";
import { BrushPanel } from "./paint/BrushPanel";
import { PaintCanvas, type PaintCanvasHandle } from "./paint/PaintCanvas";
import "./paint/paint.css";
import {
  Brush,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Cloud,
  Download,
  Eraser,
  Eye,
  EyeOff,
  FilePlus2,
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
  Trash2,
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
  const [cardName, setCardName] = useState("");
  const [cardSubtitle, setCardSubtitle] = useState("");
  const [health, setHealth] = useState("");
  const [rank, setRank] = useState("");
  const [zoom, setZoom] = useState(78);
  const [artScale, setArtScale] = useState(108);
  const [artX, setArtX] = useState(50);
  const [artY, setArtY] = useState(50);
  const [frameWeight, setFrameWeight] = useState(74);
  const [layerOpacity, setLayerOpacity] = useState(defaultOpacity);
  const [artUrl, setArtUrl] = useState<string | null>(null);
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
  const [showGuides, setShowGuides] = useState(true);
  const [slotFill, setSlotFill] = useState<Record<number, string>>({});
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [zoomLocked, setZoomLocked] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ id: number; startX: number; startY: number; originX: number; originY: number } | null>(null);

  const paintRef = useRef<PaintCanvasHandle>(null);
  const lastBrushTypeRef = useRef<BrushState["type"]>("brush");
  const [panelMode, setPanelMode] = useState<"layers" | "paint">("layers");
  const [brush, setBrush] = useState<BrushState>(DEFAULT_BRUSH);
  const [eyedropper, setEyedropper] = useState(false);
  const [paintHistory, setPaintHistory] = useState({ canUndo: false, canRedo: false });
  const [bgBusy, setBgBusy] = useState(false);
  const paintMode = panelMode === "paint";

  const selected = useMemo(() => layers.find((layer) => layer.id === selectedLayer) ?? layers[0], [selectedLayer]);
  const theme = themes[themeKey];
  const template = cardTemplates[templateIndex];
  const currentTemplateName = template.name;

  const selectLayer = (id: LayerId) => {
    const next = layers.find((layer) => layer.id === id);
    setSelectedLayer(id);
    // While the zoom is locked to a slot, changing layer must not yank the view.
    if (next && !zoomLocked) setZoom(id === "frame" ? 78 : id === "art" ? 86 : 94);
  };

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const newBlankCanvas = () => {
    setPanelMode("paint");
    setEyedropper(false);
    window.requestAnimationFrame(() => paintRef.current?.clearWhite());
  };

  const handleUndo = () => {
    if (paintMode) paintRef.current?.undo();
    else flash("Nothing to undo yet");
  };

  const handleRedo = () => {
    if (paintMode) paintRef.current?.redo();
    else flash("Nothing to redo yet");
  };

  const toggleEraser = () => {
    setEyedropper(false);
    setBrush((current) => {
      if (current.type === "eraser") {
        return { ...current, type: lastBrushTypeRef.current };
      }
      lastBrushTypeRef.current = current.type;
      return { ...current, type: "eraser" };
    });
  };

  /** Click a slot: select it, zoom to 350% centred on it, and lock the zoom
   *  so moving between layers no longer throws you back out. */
  const pickSlot = (id: number) => {
    const slot = cardSlots.find((s) => s.id === id);
    if (!slot) return;
    setSelectedSlot(id);
    setZoom(350);
    setZoomLocked(true);
    setPan({ x: 0, y: 0 });
    flash(`${slot.id}. ${slot.name} - locked to the grid`);
  };

  const exitZoom = () => {
    setZoomLocked(false);
    setSelectedSlot(null);
    setZoom(78);
    setPan({ x: 0, y: 0 });
  };

  /* Grab-to-pan. PointerEvents means mouse, pen and touch all take the same
     path, and capture keeps the drag alive if the cursor leaves the stage. */
  const canPan = (zoomLocked || tool === "hand") && !paintMode;

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canPan || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    event.preventDefault();
    setPan({
      x: drag.originX + (event.clientX - drag.startX),
      y: drag.originY + (event.clientY - drag.startY),
    });
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  /** Zoom origin follows the chosen slot, so 200% lands on what you clicked. */
  const zoomOrigin = useMemo(() => {
    const slot = cardSlots.find((s) => s.id === selectedSlot);
    if (!slot) return selected.origin;
    return `${(slot.x + slot.w / 2) * 100}% ${(slot.y + slot.h / 2) * 100}%`;
  }, [selectedSlot, selected.origin]);

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
    const total = cardTemplates.length;
    const next = direction === "next" ? (templateIndex + 1) % total : (templateIndex - 1 + total) % total;
    setTemplateIndex(next);
    flash(`${cardTemplates[next].name} applied`);
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
    setCardName("");
    setCardSubtitle("");
    setHealth("");
    setRank("");
    setArtScale(108);
    setArtX(50);
    setArtY(50);
    setFrameWeight(74);
    setTemplateIndex(0);
    setArtUrl(null);
    setSlotFill({});
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
          <span>{cardName || "Untitled card"}</span><small>{template.name}</small>
        </div>
        <div className="top-actions">
          <ToolButton label="Undo" active={paintMode && paintHistory.canUndo} onClick={handleUndo}><Undo2 size={17} /></ToolButton>
          <ToolButton label="Redo" active={paintMode && paintHistory.canRedo} onClick={handleRedo}><Redo2 size={17} /></ToolButton>
          <button className="ghost-top-button" onClick={newBlankCanvas} title="Start a blank white canvas"><FilePlus2 size={15} /> New canvas</button>
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
        <aside className={`layers-panel ${paintMode ? "is-paint" : ""}`}>
          <div className="panel-heading">
            <span>{paintMode ? "BRUSHES" : "LAYERS"}</span>
            <div className="panel-mode-toggle" role="group" aria-label="Left panel mode">
              <button
                type="button"
                className={!paintMode ? "is-active" : ""}
                aria-pressed={!paintMode}
                title="Card layers"
                onClick={() => setPanelMode("layers")}
              >
                <Layers3 size={13} />
              </button>
              <button
                type="button"
                className={paintMode ? "is-active" : ""}
                aria-pressed={paintMode}
                title="Paint &amp; brushes"
                onClick={() => setPanelMode("paint")}
              >
                <Brush size={13} />
              </button>
            </div>
          </div>
          {paintMode ? (
            <BrushPanel
              brush={brush}
              onChange={(patch) => setBrush((current) => ({ ...current, ...patch }))}
              eyedropper={eyedropper}
              onToggleEyedropper={() => setEyedropper((value) => !value)}
              onWhiteCanvas={() => paintRef.current?.clearWhite()}
              onClearCanvas={() => paintRef.current?.clearTransparent()}
              onRemoveBackground={() => paintRef.current?.removeBackground()}
              onLoadImage={(file) => paintRef.current?.loadImageFile(file)}
              bgBusy={bgBusy}
            />
          ) : (
            <>
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
            </>
          )}
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
              <ToolButton label={showGuides ? "Hide slot guides" : "Show slot guides"} active={showGuides} onClick={() => setShowGuides((value) => !value)}><Frame size={16} /></ToolButton>
              <ToolButton label="Show numbered edit points" active={showMarkers} onClick={() => setShowMarkers((value) => !value)}><ZoomIn size={16} /></ToolButton>
              <ToolButton label={zoomLocked ? "Exit zoom" : "Fit to canvas"} onClick={exitZoom}><Maximize2 size={16} /></ToolButton>
            </div>
          </div>

          <div
            className={`card-stage tool-${tool} ${canPan ? "can-pan" : ""} ${dragRef.current ? "is-panning" : ""}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <div className="stage-grid" />
            <div
              className="card-transform"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
                transformOrigin: zoomOrigin,
              }}
            >
              <div className={`game-card ${showGuides ? "show-guides" : ""}`} ref={cardRef} style={cardVariables}>
                <img className="template-plate" src={templateSrc(template)} alt={`${template.name} card frame`} />

                {artUrl && (
                  <div className="slot-art" style={slotStyle(slotById(5))}>
                    <img src={artUrl} alt="Card artwork" style={{ transform: `translate(${artX - 50}%, ${artY - 50}%) scale(${artScale / 100})` }} />
                  </div>
                )}
                {graphicUrl && <img className="custom-graphic" src={graphicUrl} alt="Custom border graphic" />}

                {cardSlots.map((slot) => {
                  const fill = slotFill[slot.id];
                  const text =
                    slot.id === 1 ? health :
                    slot.id === 2 ? cardName :
                    slot.id === 3 ? rank : "";
                  return (
                    <button
                      key={slot.id}
                      className={`slot slot-${slot.shape} ${selectedSlot === slot.id ? "is-selected" : ""}`}
                      style={{ ...slotStyle(slot), background: fill ?? undefined }}
                      onClick={(event) => { event.stopPropagation(); pickSlot(slot.id); }}
                      aria-label={`Slot ${slot.id}: ${slot.name}`}
                    >
                      {text && <span className="slot-text">{text}</span>}
                      {showGuides && <i className="slot-num" data-export-hide="true">{slot.id}</i>}
                    </button>
                  );
                })}

                {cardSubtitle && (
                  <div className="slot-subtitle" style={slotStyle(slotById(2))}>{cardSubtitle}</div>
                )}

                <PaintCanvas
                  ref={paintRef}
                  active={paintMode}
                  brush={brush}
                  eyedropper={eyedropper}
                  onPickColor={(hex) => {
                    setBrush((current) => ({ ...current, color: hex }));
                    setEyedropper(false);
                    flash(`Picked ${hex.toUpperCase()}`);
                  }}
                  onHistoryChange={(canUndo, canRedo) => setPaintHistory({ canUndo, canRedo })}
                  onBusyChange={setBgBusy}
                  onNotify={flash}
                />
              </div>
            </div>

            {paintMode && (
              <div className="paint-quickbar">
                <button type="button" onClick={handleUndo} disabled={!paintHistory.canUndo} title="Undo" aria-label="Undo"><Undo2 size={16} /></button>
                <button type="button" onClick={handleRedo} disabled={!paintHistory.canRedo} title="Redo" aria-label="Redo"><Redo2 size={16} /></button>
                <span className="paint-quickbar-sep" />
                <button
                  type="button"
                  className={brush.type === "eraser" ? "is-active" : ""}
                  aria-pressed={brush.type === "eraser"}
                  onClick={toggleEraser}
                  title="Eraser"
                  aria-label="Eraser"
                >
                  <Eraser size={16} />
                </button>
                <button type="button" onClick={() => paintRef.current?.clearTransparent()} title="Erase everything" aria-label="Erase everything"><Trash2 size={16} /></button>
              </div>
            )}
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
            <section className="property-section">
              <div className="section-label">
                <span>TEMPLATE</span>
                <button aria-label="Reset template" onClick={() => setTemplateIndex(0)}><RotateCcw size={13} /></button>
              </div>
              <div className="template-selector">
                <button aria-label="Previous template" onClick={() => handleTemplateChange("prev")}><ChevronLeft size={16} /></button>
                <div className="template-name">
                  <strong>{currentTemplateName}</strong>
                  <small>{templateIndex + 1} / {cardTemplates.length}</small>
                </div>
                <button aria-label="Next template" onClick={() => handleTemplateChange("next")}><ChevronRight size={16} /></button>
              </div>
              <div className="template-grid">
                {cardTemplates.map((item, index) => (
                  <button
                    key={item.id}
                    className={`template-chip ${index === templateIndex ? "is-active" : ""}`}
                    onClick={() => { setTemplateIndex(index); flash(`${item.name} applied`); }}
                    title={item.name}
                    aria-label={item.name}
                  >
                    <img src={templateSrc(item)} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            </section>
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
