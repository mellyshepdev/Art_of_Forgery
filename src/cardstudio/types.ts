// ---------------------------------------------------------------------------
// Card Studio — shared types
// ---------------------------------------------------------------------------
 
/** The 19 fixed zones on the card template. IDs match the reference markers. */
export type ZoneId =
  | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10"
  | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18" | "19";
 
export type ZoneShape = "circle" | "roundedRect" | "pill" | "rect";
 
export type GradientStop = { color: string; offset: number }; // offset 0-1
 
export type FillKind = "solid" | "gradient" | "pattern" | "texture" | "image";
 
export type PatternPreset =
  | "diagonal-stripes"
  | "checker"
  | "dots"
  | "crosshatch"
  | "scales"
  | "custom";
 
export type TextureKind = "grain" | "dot-grid" | "hatch" | "marble";
 
export interface Fill {
  kind: FillKind;
 
  // solid
  color?: string; // hex
 
  // gradient
  angle?: number; // degrees, 0-360, any angle
  stops?: GradientStop[];
 
  // pattern
  pattern?: PatternPreset;
  patternColor?: string;
  patternScale?: number; // 0.5 - 3
  patternImageUrl?: string; // for "custom" pattern (tiled)
 
  // texture (p5-generated, baked to a data URL then treated like an image fill)
  texture?: TextureKind;
  textureSeed?: number;
  textureScale?: number;
  textureColorA?: string;
  textureColorB?: string;
  textureDataUrl?: string; // cache of the last bake
 
  // image (upload, cover-fit, user can pan/zoom)
  imageUrl?: string;
  imageScale?: number; // percent, 100 = cover-fit
  imageX?: number; // percent offset
  imageY?: number; // percent offset
 
  opacity?: number; // 0-100, applies to the whole fill
}
 
export const defaultFill = (): Fill => ({
  kind: "solid",
  color: "#caa968",
  angle: 45,
  stops: [
    { color: "#caa968", offset: 0 },
    { color: "#6b4f2a", offset: 1 },
  ],
  pattern: "diagonal-stripes",
  patternColor: "#8a6d3a",
  patternScale: 1,
  texture: "grain",
  textureSeed: 1,
  textureScale: 1,
  textureColorA: "#caa968",
  textureColorB: "#3a2c17",
  imageScale: 100,
  imageX: 50,
  imageY: 50,
  opacity: 100,
});
 
/** Fixed, non-negotiable geometry + typography for a zone. Never changes per-card. */
export interface ZoneGeometry {
  id: ZoneId;
  label: string;
  shape: ZoneShape;
  /** Position/size as a % of the 500x710 card canvas — matches App.css card-studio-zone-* rules. */
  box: { top: number; left: number; width: number; height: number };
  /** Corner radius in px, only used for roundedRect. */
  radius?: number;
  /** If this zone carries locked text, its typography spec (font/size/position never change). */
  text?: {
    defaultValue: string;
    maxLength: number;
    fontFamily: string;
    fontSize: number; // px at 500x710 base scale
    fontWeight: number;
    color: string;
    align: "left" | "center" | "right";
    uppercase?: boolean;
  };
  /** If this zone holds a swappable portrait/graphic instead of a generic fill. */
  isPortrait?: boolean;
}
 