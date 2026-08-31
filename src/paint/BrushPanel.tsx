import type { ChangeEvent } from "react";
import {
  Brush,
  Eraser,
  Highlighter,
  ImagePlus,
  Loader2,
  Pen,
  Pencil,
  Pipette,
  SprayCan,
  Square,
  Trash2,
  Wand2,
} from "lucide-react";
import { BRUSH_META, BRUSH_ORDER, SIZE_PRESETS, type BrushState, type BrushType } from "./brushes";

const TOOL_ICON: Record<BrushType, typeof Brush> = {
  brush: Brush,
  pen: Pen,
  pencil: Pencil,
  marker: Highlighter,
  spray: SprayCan,
  eraser: Eraser,
};

type Props = {
  brush: BrushState;
  onChange: (patch: Partial<BrushState>) => void;
  eyedropper: boolean;
  onToggleEyedropper: () => void;
  onWhiteCanvas: () => void;
  onClearCanvas: () => void;
  onRemoveBackground: () => void;
  onLoadImage: (file: File) => void;
  bgBusy: boolean;
};

export function BrushPanel({
  brush,
  onChange,
  eyedropper,
  onToggleEyedropper,
  onWhiteCanvas,
  onClearCanvas,
  onRemoveBackground,
  onLoadImage,
  bgBusy,
}: Props) {
  const pickImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onLoadImage(file);
    event.target.value = "";
  };

  return (
    <div className="brush-panel">
      <div className="brush-tools">
        {BRUSH_ORDER.map((type) => {
          const Icon = TOOL_ICON[type];
          return (
            <button
              key={type}
              type="button"
              className={`brush-tool ${brush.type === type ? "is-active" : ""}`}
              aria-pressed={brush.type === type}
              title={`${BRUSH_META[type].label} — ${BRUSH_META[type].hint}`}
              onClick={() => onChange({ type })}
            >
              <Icon size={17} />
              <span>{BRUSH_META[type].label}</span>
            </button>
          );
        })}
      </div>

      <div className="brush-field">
        <div className="section-label"><span>SIZE</span><output>{brush.size}px</output></div>
        <div className="brush-sizes">
          {SIZE_PRESETS.map((size) => (
            <button
              key={size}
              type="button"
              className={`brush-size-chip ${brush.size === size ? "is-active" : ""}`}
              onClick={() => onChange({ size })}
              aria-label={`${size} pixels`}
            >
              <i style={{ width: Math.max(3, Math.min(20, size / 3.6)), height: Math.max(3, Math.min(20, size / 3.6)) }} />
            </button>
          ))}
        </div>
        <input
          type="range"
          min={1}
          max={120}
          value={brush.size}
          onChange={(event) => onChange({ size: Number(event.target.value) })}
        />
      </div>

      <div className="brush-field">
        <div className="section-label"><span>OPACITY</span><output>{brush.opacity}%</output></div>
        <input
          type="range"
          min={5}
          max={100}
          value={brush.opacity}
          onChange={(event) => onChange({ opacity: Number(event.target.value) })}
        />
      </div>

      <div className="brush-field">
        <div className="section-label"><span>COLOR</span></div>
        <div className="brush-color-row">
          <label className="brush-swatch" style={{ background: brush.color }}>
            <input
              type="color"
              value={brush.color}
              onChange={(event) => onChange({ color: event.target.value })}
              aria-label="Brush color"
            />
          </label>
          <input
            className="brush-hex"
            value={brush.color.toUpperCase()}
            spellCheck={false}
            onChange={(event) => {
              const next = event.target.value.trim();
              if (/^#[0-9a-fA-F]{6}$/.test(next)) onChange({ color: next.toLowerCase() });
            }}
          />
          <button
            type="button"
            className={`brush-eyedrop ${eyedropper ? "is-active" : ""}`}
            aria-pressed={eyedropper}
            title="Pick a color from the canvas"
            onClick={onToggleEyedropper}
          >
            <Pipette size={15} />
          </button>
        </div>
        {eyedropper && <p className="brush-hint">Click the canvas to sample a color.</p>}
      </div>

      <div className="brush-actions">
        <button type="button" className="brush-action primary" onClick={onRemoveBackground} disabled={bgBusy}>
          {bgBusy ? <Loader2 size={15} className="spin" /> : <Wand2 size={15} />}
          {bgBusy ? "Removing background…" : "Remove background"}
        </button>
        <button type="button" className="brush-action" onClick={onWhiteCanvas}>
          <Square size={15} /> White canvas
        </button>
        <button type="button" className="brush-action" onClick={onClearCanvas}>
          <Trash2 size={15} /> Clear canvas
        </button>
        <label className="brush-action as-label">
          <input type="file" accept="image/*" onChange={pickImage} />
          <ImagePlus size={15} /> Place image
        </label>
      </div>

      <p className="brush-hint">
        Background removal runs MediaPipe Selfie Segmentation, then Fabric.js clips the
        painting to the mask. First run downloads the model.
      </p>
    </div>
  );
}
