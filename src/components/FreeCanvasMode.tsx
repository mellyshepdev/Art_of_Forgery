import React, { useState, useRef } from "react";
import {
  Upload,
  Move,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Download,
  Crosshair,
  Sliders,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Scissors
} from "lucide-react";

export interface CanvasImageItem {
  id: string;
  src: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  brightness: number;
  contrast: number;
  tint: string;
  cutout: boolean;
  cutoutColor: string;
  cutoutTolerance: number;
}

interface FreeCanvasModeProps {
  images: CanvasImageItem[];
  setImages: React.Dispatch<React.SetStateAction<CanvasImageItem[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}

export const FreeCanvasMode: React.FC<FreeCanvasModeProps> = ({
  images,
  setImages,
  selectedId,
  setSelectedId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas Pan & Zoom State (Zoom up to 1500x = 1500%)
  const [zoom, setZoom] = useState<number>(100);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dot Cursor state
  const [showDotCursor, setShowDotCursor] = useState<boolean>(true);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: -100, y: -100 });

  // Dragging image state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Multi-file Image Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const newImg: CanvasImageItem = {
            id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            src,
            name: file.name,
            x: (index * 30) - (img.width / 4),
            y: (index * 30) - (img.height / 4),
            width: Math.min(img.width, 600) || 300,
            height: Math.min(img.height, 600) || 300,
            rotation: 0,
            opacity: 100,
            brightness: 100,
            contrast: 100,
            tint: "#ffffff",
            cutout: false,
            cutoutColor: "#ffffff",
            cutoutTolerance: 30
          };
          setImages((prev) => [...prev, newImg]);
          setSelectedId(newImg.id);
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const selectedItem = images.find((item) => item.id === selectedId) || null;

  const updateSelectedItem = (key: keyof CanvasImageItem, value: any) => {
    if (!selectedId) return;
    setImages((prev) =>
      prev.map((img) => (img.id === selectedId ? { ...img, [key]: value } : img))
    );
  };

  // Perform background cutout removal using HTML5 Canvas pixel manipulation
  const applyBackgroundCutout = (item: CanvasImageItem) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Parse target color
      const hex = item.cutoutColor.replace("#", "");
      const targetR = parseInt(hex.substring(0, 2), 16) || 255;
      const targetG = parseInt(hex.substring(2, 4), 16) || 255;
      const targetB = parseInt(hex.substring(4, 6), 16) || 255;
      const tolerance = item.cutoutTolerance * 2.55;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const distance = Math.sqrt(
          Math.pow(r - targetR, 2) +
          Math.pow(g - targetG, 2) +
          Math.pow(b - targetB, 2)
        );

        if (distance <= tolerance) {
          data[i + 3] = 0; // Make transparent
        }
      }

      ctx.putImageData(imageData, 0, 0);
      const processedSrc = canvas.toDataURL("image/png");
      updateSelectedItem("src", processedSrc);
      updateSelectedItem("cutout", true);
    };
    img.src = item.src;
  };

  const bringForward = () => {
    if (!selectedId) return;
    setImages((prev) => {
      const idx = prev.findIndex((item) => item.id === selectedId);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[idx + 1];
      next[idx + 1] = temp;
      return next;
    });
  };

  const sendBackward = () => {
    if (!selectedId) return;
    setImages((prev) => {
      const idx = prev.findIndex((item) => item.id === selectedId);
      if (idx <= 0) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[idx - 1];
      next[idx - 1] = temp;
      return next;
    });
  };

  const bringToFront = () => {
    if (!selectedId) return;
    setImages((prev) => {
      const item = prev.find((i) => i.id === selectedId);
      if (!item) return prev;
      return [...prev.filter((i) => i.id !== selectedId), item];
    });
  };

  const sendToBack = () => {
    if (!selectedId) return;
    setImages((prev) => {
      const item = prev.find((i) => i.id === selectedId);
      if (!item) return prev;
      return [item, ...prev.filter((i) => i.id !== selectedId)];
    });
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setImages((prev) => prev.filter((item) => item.id !== selectedId));
    setSelectedId(null);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || e.target === containerRef.current || (e.target as HTMLElement).id === "canvas-board") {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      if (e.target === containerRef.current || (e.target as HTMLElement).id === "canvas-board") {
        setSelectedId(null);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }

    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else if (draggingId) {
      const scale = zoom / 100;
      setImages((prev) =>
        prev.map((img) =>
          img.id === draggingId
            ? {
                ...img,
                x: (e.clientX - dragOffset.x) / scale,
                y: (e.clientY - dragOffset.y) / scale
              }
            : img
        )
      );
    }
  };

  const handlePointerUp = () => {
    setIsPanning(false);
    setDraggingId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prev) => Math.max(10, Math.min(1500, Math.round(prev * zoomFactor))));
  };

  const handleItemPointerDown = (e: React.PointerEvent, item: CanvasImageItem) => {
    e.stopPropagation();
    setSelectedId(item.id);
    setDraggingId(item.id);
    const scale = zoom / 100;
    setDragOffset({
      x: e.clientX - item.x * scale,
      y: e.clientY - item.y * scale
    });
  };

  const handleExport = (format: "png" | "jpg") => {
    if (images.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    images.forEach((img) => {
      minX = Math.min(minX, img.x);
      minY = Math.min(minY, img.y);
      maxX = Math.max(maxX, img.x + img.width);
      maxY = Math.max(maxY, img.y + img.height);
    });

    const padding = 40;
    const exportWidth = Math.max(800, Math.ceil(maxX - minX + padding * 2));
    const exportHeight = Math.max(600, Math.ceil(maxY - minY + padding * 2));

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = exportWidth;
    exportCanvas.height = exportHeight;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, exportWidth, exportHeight);

    let loadedCount = 0;
    images.forEach((imgItem) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.save();
        const drawX = imgItem.x - minX + padding + imgItem.width / 2;
        const drawY = imgItem.y - minY + padding + imgItem.height / 2;
        ctx.translate(drawX, drawY);
        ctx.rotate((imgItem.rotation * Math.PI) / 180);
        ctx.globalAlpha = imgItem.opacity / 100;
        ctx.filter = `brightness(${imgItem.brightness}%) contrast(${imgItem.contrast}%)`;

        ctx.drawImage(
          img,
          -imgItem.width / 2,
          -imgItem.height / 2,
          imgItem.width,
          imgItem.height
        );
        ctx.restore();

        loadedCount++;
        if (loadedCount === images.length) {
          const dataUrl = exportCanvas.toDataURL(
            format === "png" ? "image/png" : "image/jpeg",
            0.95
          );
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = `canvas-export.${format}`;
          a.click();
        }
      };
      img.src = imgItem.src;
    });
  };

  return (
    <div className="mode-workspace">
      <aside className="layers-panel">
        <div className="panel-heading"><span>IMAGES</span><span className="panel-count">{images.length}</span></div>
        <div className="layer-stack">
          {images.length === 0 && <p className="panel-empty">Nothing imported yet.</p>}
          {images.map((img, i) => (
            <button
              key={img.id}
              className={`layer-row ${selectedId === img.id ? "is-active" : ""}`}
              onClick={() => setSelectedId(img.id)}
            >
              <span className="layer-number">{String(i + 1).padStart(2, "0")}</span>
              <span className="layer-copy"><strong>{img.name}</strong><small>image</small></span>
            </button>
          ))}
        </div>
        <div className="layers-footer">
          <button onClick={() => setSelectedId(null)}>Deselect</button>
        </div>
      </aside>

      <div className="canvas-toolbar">
        <label className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer text-xs font-semibold transition">
          <Upload size={15} />
          <span>Import Images</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>

        <div className="h-4 w-px bg-zinc-700" />

        <button
          onClick={() => setZoom((z) => Math.max(10, z - 25))}
          className="p-1.5 hover:bg-zinc-700 rounded-lg text-zinc-300 hover:text-white transition"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <span className="text-xs font-mono w-14 text-center font-bold text-emerald-400">
          {zoom}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(1500, z + 25))}
          className="p-1.5 hover:bg-zinc-700 rounded-lg text-zinc-300 hover:text-white transition"
          title="Zoom In (Up to 1500x)"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => {
            setZoom(100);
            setPan({ x: 0, y: 0 });
          }}
          className="p-1.5 hover:bg-zinc-700 rounded-lg text-zinc-300 hover:text-white transition"
          title="Reset Zoom & Pan"
        >
          <RefreshCw size={15} />
        </button>

        <div className="h-4 w-px bg-zinc-700" />

        <button
          onClick={() => setShowDotCursor(!showDotCursor)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
            showDotCursor
              ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/50"
              : "bg-zinc-700/50 text-zinc-400 hover:text-zinc-200"
          }`}
          title="Toggle Precision Dot Cursor"
        >
          <Crosshair size={14} />
          <span>Dot Cursor</span>
        </button>

        <div className="h-4 w-px bg-zinc-700" />

        <div className="flex items-center gap-1">
          <button
            onClick={() => handleExport("png")}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg text-xs font-medium transition"
          >
            <Download size={14} />
            <span>PNG</span>
          </button>
          <button
            onClick={() => handleExport("jpg")}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg text-xs font-medium transition"
          >
            <Download size={14} />
            <span>JPG</span>
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 h-full w-full relative overflow-hidden bg-zinc-950 cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      >
        <div
          id="canvas-board"
          className="absolute inset-0 bg-white shadow-2xl transition-transform origin-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
            transformOrigin: "0 0"
          }}
        >
          {images.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <div
                key={item.id}
                onPointerDown={(e) => handleItemPointerDown(e, item)}
                className={`absolute cursor-move group transition-shadow ${
                  isSelected
                    ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-white"
                    : "hover:ring-1 hover:ring-emerald-400/60"
                }`}
                style={{
                  left: `${item.x}px`,
                  top: `${item.y}px`,
                  width: `${item.width}px`,
                  height: `${item.height}px`,
                  transform: `rotate(${item.rotation}deg)`,
                  transformOrigin: "center center",
                  opacity: item.opacity / 100,
                  filter: `brightness(${item.brightness}%) contrast(${item.contrast}%)`
                }}
              >
                <img
                  src={item.src}
                  alt={item.name}
                  className="w-full h-full object-contain pointer-events-none select-none"
                />

                {item.tint && item.tint !== "#ffffff" && (
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-color"
                    style={{ backgroundColor: item.tint }}
                  />
                )}

                {isSelected && (
                  <div className="absolute -inset-1 border border-emerald-500 border-dashed pointer-events-none">
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-emerald-500 rounded-full" />
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-emerald-500 rounded-full" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-emerald-500 rounded-full" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-emerald-500 rounded-full" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {showDotCursor && cursorPos.x >= 0 && (
          <div
            className="pointer-events-none fixed z-50 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{
              left: `${cursorPos.x + (containerRef.current?.getBoundingClientRect().left || 0)}px`,
              top: `${cursorPos.y + (containerRef.current?.getBoundingClientRect().top || 0)}px`
            }}
          >
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white shadow-md animate-pulse" />
            <div className="absolute w-6 h-6 border border-emerald-400/40 rounded-full" />
          </div>
        )}
      </div>

      <div className="properties-panel">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-emerald-400" />
            <h3 className="font-semibold text-sm text-zinc-100">
              Image Properties
            </h3>
          </div>
          {selectedItem && (
            <button
              onClick={deleteSelected}
              className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
              title="Delete Image"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {selectedItem ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs text-zinc-300">
            <div className="space-y-2">
              <label className="text-zinc-400 font-medium block uppercase tracking-wider text-[10px]">
                Layer Ordering
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={bringToFront}
                  className="flex flex-col items-center p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition"
                  title="Bring to Front"
                >
                  <ChevronsUp size={16} />
                  <span className="text-[9px] mt-1">Front</span>
                </button>
                <button
                  onClick={bringForward}
                  className="flex flex-col items-center p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition"
                  title="Bring Forward"
                >
                  <ArrowUp size={16} />
                  <span className="text-[9px] mt-1">Forward</span>
                </button>
                <button
                  onClick={sendBackward}
                  className="flex flex-col items-center p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition"
                  title="Send Backward"
                >
                  <ArrowDown size={16} />
                  <span className="text-[9px] mt-1">Backward</span>
                </button>
                <button
                  onClick={sendToBack}
                  className="flex flex-col items-center p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition"
                  title="Send to Back"
                >
                  <ChevronsDown size={16} />
                  <span className="text-[9px] mt-1">Back</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-zinc-400 font-medium block uppercase tracking-wider text-[10px]">
                Transform & Dimensions
              </label>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-zinc-400 text-[11px]">Width (px)</span>
                  <input
                    type="number"
                    value={Math.round(selectedItem.width)}
                    onChange={(e) =>
                      updateSelectedItem("width", Number(e.target.value))
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-1.5 mt-1 text-zinc-100"
                  />
                </div>
                <div>
                  <span className="text-zinc-400 text-[11px]">Height (px)</span>
                  <input
                    type="number"
                    value={Math.round(selectedItem.height)}
                    onChange={(e) =>
                      updateSelectedItem("height", Number(e.target.value))
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-1.5 mt-1 text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-zinc-400">Rotation</span>
                  <span className="font-mono">{selectedItem.rotation}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={selectedItem.rotation}
                  onChange={(e) =>
                    updateSelectedItem("rotation", Number(e.target.value))
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-3 border-t border-zinc-800 pt-4">
              <label className="text-zinc-400 font-medium block uppercase tracking-wider text-[10px]">
                Image Filters & Tone
              </label>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Opacity</span>
                  <span className="font-mono">{selectedItem.opacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedItem.opacity}
                  onChange={(e) =>
                    updateSelectedItem("opacity", Number(e.target.value))
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Brightness</span>
                  <span className="font-mono">{selectedItem.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={selectedItem.brightness}
                  onChange={(e) =>
                    updateSelectedItem("brightness", Number(e.target.value))
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Contrast</span>
                  <span className="font-mono">{selectedItem.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={selectedItem.contrast}
                  onChange={(e) =>
                    updateSelectedItem("contrast", Number(e.target.value))
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span>Color Tint</span>
                  <input
                    type="color"
                    value={selectedItem.tint}
                    onChange={(e) => updateSelectedItem("tint", e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Background Cutout & Transparency Tools */}
            <div className="space-y-3 border-t border-zinc-800 pt-4">
              <label className="text-zinc-400 font-medium block uppercase tracking-wider text-[10px]">
                Background Transparency & Cutout
              </label>

              <div className="flex items-center justify-between">
                <span>Cutout Color Key</span>
                <input
                  type="color"
                  value={selectedItem.cutoutColor}
                  onChange={(e) => updateSelectedItem("cutoutColor", e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Color Tolerance</span>
                  <span className="font-mono">{selectedItem.cutoutTolerance}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="80"
                  value={selectedItem.cutoutTolerance}
                  onChange={(e) =>
                    updateSelectedItem("cutoutTolerance", Number(e.target.value))
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <button
                onClick={() => applyBackgroundCutout(selectedItem)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition"
              >
                <Scissors size={14} />
                <span>Apply Background Cutout</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-500 space-y-2">
            <Move size={32} className="stroke-1 text-zinc-600" />
            <p className="text-xs">Select an image on the canvas to adjust transform, layers, filters, and color tinting.</p>
          </div>
        )}
      </div>
    </div>
  );
};
