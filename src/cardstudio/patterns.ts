
Patterns · TS
import type { PatternPreset } from "./types";
 
// ---------------------------------------------------------------------------
// Small tileable SVG patterns, rendered as data URLs. Cheap, crisp at any
// zoom, and easy to recolor per-zone. Fed into Fabric.js as pattern sources.
// ---------------------------------------------------------------------------
 
const svgToDataUrl = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
 
export const PATTERN_DATA_URLS: Record<Exclude<PatternPreset, "custom">, (color: string) => string> &
  Record<"custom", (color: string) => string> = {
  "diagonal-stripes": (color) =>
    svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
      <rect width="24" height="24" fill="transparent"/>
      <path d="M-6 6 L6 -6 M0 24 L24 0 M18 30 L30 18" stroke="${color}" stroke-width="4"/>
    </svg>`),
  checker: (color) =>
    svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
      <rect width="12" height="12" x="0" y="0" fill="${color}"/>
      <rect width="12" height="12" x="12" y="12" fill="${color}"/>
    </svg>`),
  dots: (color) =>
    svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
      <circle cx="10" cy="10" r="3" fill="${color}"/>
    </svg>`),
  crosshatch: (color) =>
    svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
      <path d="M0 0 L20 20 M20 0 L0 20" stroke="${color}" stroke-width="1.4"/>
    </svg>`),
  scales: (color) =>
    svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28">
      <path d="M0 14 a14 14 0 0 1 28 0" fill="none" stroke="${color}" stroke-width="2"/>
      <path d="M-14 0 a14 14 0 0 1 28 0" fill="none" stroke="${color}" stroke-width="2"/>
      <path d="M14 0 a14 14 0 0 1 28 0" fill="none" stroke="${color}" stroke-width="2"/>
    </svg>`),
  custom: (color) => svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="${color}"/></svg>`),
};
 
export const patternLibrary: { id: PatternPreset; label: string }[] = [
  { id: "diagonal-stripes", label: "Diagonal stripes" },
  { id: "checker", label: "Checker" },
  { id: "dots", label: "Dots" },
  { id: "crosshatch", label: "Crosshatch" },
  { id: "scales", label: "Scales" },
  { id: "custom", label: "Custom upload (tiled)" },
];
 