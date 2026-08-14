export type SlotShape = "circle" | "rect";
export type SlotKind = "text" | "fill" | "image";

/** Per-corner rounding, in % of the slot's own width/height, in CSS order:
 *  top-left, top-right, bottom-right, bottom-left. 50 is fully round, 0 is a
 *  square corner. Lets one slot cover a circle *and* the corner of a box that
 *  cuts into it - square off just that corner and the outline bulges out to
 *  swallow it. Omitted means "use the shape's default", so every slot authored
 *  before this existed keeps its exact old outline. */
export type SlotRadii = [number, number, number, number];

export type CardSlot = {
  /** 1-19, the number shown on the guide overlay */
  id: number;
  name: string;
  shape: SlotShape;
  kind: SlotKind;
  /** all coords are fractions of the card, never pixels, so they hold at any size */
  x: number; y: number; w: number; h: number;
  radii?: SlotRadii;
};

/** What a slot's corners look like when it has no explicit radii. Mirrors the
 *  .slot-circle / .slot-rect rules in index.css. */
export const defaultRadii = (shape: SlotShape): SlotRadii =>
  shape === "circle" ? [50, 50, 50, 50] : [3, 3, 3, 3];

export const radiiOf = (s: CardSlot): SlotRadii => s.radii ?? defaultRadii(s.shape);

/** The master grid. Shared by every template - this is what guarantees that
 *  switching template never moves a slot. */
export const cardSlots: CardSlot[] = [
  { id: 1, name: "HP badge", shape: "circle", kind: "text", x: 0.05896, y: 0.04272, w: 0.14151, h: 0.08544 },
  { id: 2, name: "Name bar", shape: "rect", kind: "text", x: 0.23585, y: 0.04114, w: 0.62382, h: 0.04351 },
  { id: 3, name: "Rank badge", shape: "circle", kind: "text", x: 0.84906, y: 0.03244, w: 0.13443, h: 0.08544 },
  { id: 4, name: "Rivet upper-left", shape: "circle", kind: "fill", x: 0.02948, y: 0.18354, w: 0.07075, h: 0.04747 },
  { id: 5, name: "Main portrait", shape: "circle", kind: "image", x: 0.12146, y: 0.11946, w: 0.77358, h: 0.41060 },
  { id: 6, name: "Rivet upper-right", shape: "circle", kind: "fill", x: 0.90802, y: 0.18354, w: 0.07075, h: 0.04747 },
  { id: 7, name: "Rivet lower-left", shape: "circle", kind: "fill", x: 0.03538, y: 0.47073, w: 0.07075, h: 0.04747 },
  { id: 8, name: "Rivet lower-right", shape: "circle", kind: "fill", x: 0.90212, y: 0.47073, w: 0.07075, h: 0.04747 },
  { id: 9, name: "Ability 1 icon", shape: "circle", kind: "image", x: 0.15212, y: 0.56013, w: 0.08137, h: 0.04668 },
  { id: 10, name: "Ability 1 text", shape: "rect", kind: "text", x: 0.25000, y: 0.54272, w: 0.65448, h: 0.07911 },
  { id: 11, name: "Ability 2 icon", shape: "circle", kind: "image", x: 0.15212, y: 0.63845, w: 0.08137, h: 0.04984 },
  { id: 12, name: "Ability 2 text", shape: "rect", kind: "text", x: 0.25000, y: 0.62184, w: 0.65448, h: 0.07911 },
  { id: 13, name: "Ability 3 icon", shape: "circle", kind: "image", x: 0.15212, y: 0.72152, w: 0.08137, h: 0.04905 },
  { id: 14, name: "Ability 3 text", shape: "rect", kind: "text", x: 0.25000, y: 0.70095, w: 0.65448, h: 0.07911 },
  { id: 15, name: "Mounted companion", shape: "circle", kind: "image", x: 0.10142, y: 0.84335, w: 0.25354, h: 0.15585 },
  { id: 16, name: "Stud left of faction", shape: "circle", kind: "fill", x: 0.37618, y: 0.81408, w: 0.05189, h: 0.03481 },
  { id: 17, name: "Faction seal", shape: "circle", kind: "image", x: 0.45401, y: 0.83465, w: 0.10613, h: 0.07120 },
  { id: 18, name: "Stud right of faction", shape: "circle", kind: "fill", x: 0.58962, y: 0.81408, w: 0.05189, h: 0.03481 },
  { id: 19, name: "Flying companion", shape: "circle", kind: "image", x: 0.66509, y: 0.84335, w: 0.25590, h: 0.15585 },
];

export const slotById = (id: number) => cardSlots.find((s) => s.id === id)!;

export const slotStyle = (s: CardSlot) => ({
  left: `${s.x * 100}%`,
  top: `${s.y * 100}%`,
  width: `${s.w * 100}%`,
  height: `${s.h * 100}%`,
  // Only override the stylesheet once a slot has been reshaped by hand, so
  // untouched slots keep rendering exactly as .slot-circle / .slot-rect say.
  ...(s.radii ? { borderRadius: s.radii.map((r) => `${r}%`).join(" ") } : null),
});
