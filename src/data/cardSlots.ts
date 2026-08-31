export type SlotShape = "circle" | "rect";
export type SlotKind = "text" | "fill" | "image";

/** Corner radii as percentages, clockwise from top-left:
 *  [top-left, top-right, bottom-right, bottom-left]. Optional - a slot with
 *  no radii falls back to whatever its `.slot-circle` / `.slot-rect` CSS does. */
export type SlotRadii = [number, number, number, number];

export type CardSlot = {
  /** 1-20, the number shown on the guide overlay */
  id: number;
  name: string;
  shape: SlotShape;
  kind: SlotKind;
  /** all coords are fractions of the card, never pixels, so they hold at any size */
  x: number; y: number; w: number; h: number;
  radii?: SlotRadii;
};

/** THE MASTER GRID - set in stone.
 *
 *  Every template shares this one array, so a numbered section sits in exactly
 *  the same place on every card. Nothing in the app writes to it: slots cannot
 *  be dragged, resized or moved per-card, and switching template only swaps the
 *  background art. Style a slot (e.g. fill it blue) and that applies to the same
 *  number on every card, because per-slot state is keyed by `id`.
 *
 *  Frozen so a stray mutation is a runtime error, not a silent drift. To change
 *  a location, edit it HERE and rebuild - that is the only path. */
export const cardSlots: readonly CardSlot[] = Object.freeze([
  { id: 1,  name: "HP badge",              shape: "circle", kind: "text",  x: 0.04996, y: 0.02272, w: 0.15451, h: 0.10544, radii: [50, 50, 49, 50] },
  { id: 2,  name: "Name bar",              shape: "rect",   kind: "text",  x: 0.23585, y: 0.03814, w: 0.62382, h: 0.04451 },
  { id: 3,  name: "Rank badge",            shape: "circle", kind: "text",  x: 0.85573, y: 0.02896, w: 0.11843, h: 0.08544, radii: [50, 50, 50, 50] },
  { id: 4,  name: "Rivet upper-left",      shape: "circle", kind: "fill",  x: 0.03548, y: 0.18954, w: 0.05875, h: 0.03947, radii: [49, 50, 50, 50] },
  { id: 5,  name: "Main portrait",         shape: "circle", kind: "image", x: 0.11888, y: 0.08531, w: 0.77658, h: 0.51060, radii: [50, 50, 50, 50] },
  { id: 6,  name: "Rivet upper-right",     shape: "circle", kind: "fill",  x: 0.92309, y: 0.18930, w: 0.05875, h: 0.03947 },
  { id: 7,  name: "Rivet lower-left",      shape: "circle", kind: "fill",  x: 0.01938, y: 0.46573, w: 0.09875, h: 0.06647, radii: [49, 50, 50, 49] },
  { id: 8,  name: "Rivet lower-right",     shape: "circle", kind: "fill",  x: 0.90012, y: 0.46673, w: 0.09675, h: 0.06447 },
  { id: 9,  name: "Ability 1 icon",        shape: "circle", kind: "image", x: 0.14912, y: 0.54813, w: 0.08537, h: 0.05868 },
  { id: 10, name: "Ability 1 text",        shape: "rect",   kind: "text",  x: 0.11200, y: 0.53972, w: 0.79348, h: 0.08011, radii: [0, 3, 3, 3] },
  { id: 11, name: "Ability 2 icon",        shape: "circle", kind: "image", x: 0.15012, y: 0.62945, w: 0.08537, h: 0.05884 },
  { id: 12, name: "Ability 2 text",        shape: "rect",   kind: "text",  x: 0.11200, y: 0.61897, w: 0.79348, h: 0.07911 },
  { id: 13, name: "Ability 3 icon",        shape: "circle", kind: "image", x: 0.14812, y: 0.71152, w: 0.08937, h: 0.05905, radii: [50, 50, 50, 50] },
  { id: 14, name: "Ability 3 text",        shape: "rect",   kind: "text",  x: 0.11200, y: 0.70095, w: 0.79348, h: 0.07911 },
  { id: 15, name: "Mounted companion",     shape: "circle", kind: "image", x: 0.09242, y: 0.81835, w: 0.26754, h: 0.17885 },
  { id: 16, name: "Stud left of faction",  shape: "circle", kind: "fill",  x: 0.38018, y: 0.82308, w: 0.04089, h: 0.02881 },
  { id: 17, name: "Faction seal",          shape: "circle", kind: "image", x: 0.45701, y: 0.84365, w: 0.10113, h: 0.06820 },
  { id: 18, name: "Stud right of faction", shape: "circle", kind: "fill",  x: 0.59162, y: 0.82308, w: 0.04489, h: 0.02981, radii: [50, 44, 50, 50] },
  { id: 19, name: "Flying companion",      shape: "circle", kind: "image", x: 0.65609, y: 0.81735, w: 0.26690, h: 0.18185 },
  { id: 20, name: "Name plate 2",          shape: "circle", kind: "text",  x: 0.33304, y: 0.09053, w: 0.34482, h: 0.02900, radii: [50, 50, 50, 50] },
]);

export const slotById = (id: number) => cardSlots.find((s) => s.id === id)!;

export const slotStyle = (s: CardSlot) => ({
  left: `${s.x * 100}%`,
  top: `${s.y * 100}%`,
  width: `${s.w * 100}%`,
  height: `${s.h * 100}%`,
  ...(s.radii ? { borderRadius: s.radii.map((r) => `${r}%`).join(" ") } : null),
});
