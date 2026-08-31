export type BrushType = "brush" | "pen" | "pencil" | "marker" | "spray" | "eraser";

export type BrushState = {
  type: BrushType;
  size: number; // stroke diameter in card-space px
  opacity: number; // 0..100
  color: string; // #rrggbb
};

export const DEFAULT_BRUSH: BrushState = {
  type: "brush",
  size: 16,
  opacity: 100,
  color: "#1b1a17",
};

/** Size chips shown in the brush panel. */
export const SIZE_PRESETS = [3, 8, 18, 38, 72];

export const BRUSH_META: Record<BrushType, { label: string; hint: string }> = {
  brush: { label: "Brush", hint: "Soft round" },
  pen: { label: "Pen", hint: "Crisp ink" },
  pencil: { label: "Pencil", hint: "Grainy sketch" },
  marker: { label: "Marker", hint: "Flat highlighter" },
  spray: { label: "Spray can", hint: "Airbrush scatter" },
  eraser: { label: "Eraser", hint: "Rub to clear" },
};

export const BRUSH_ORDER: BrushType[] = ["brush", "pen", "pencil", "marker", "spray", "eraser"];
