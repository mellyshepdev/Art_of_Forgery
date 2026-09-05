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
  /** 1-20, the number shown on the guide overlay */
  id: number;
  name: string;
  shape: SlotShape;
  kind: SlotKind;
  /** all coords are fractions of the card, never pixels, so they hold at any size */
  x: number; y: number; w: number; h: number;
  radii?: SlotRadii;
  /** Set once a slot has been fine-tuned point by point. Takes over from
   *  `radii`, because an arbitrary outline can no longer be described by
   *  corner rounding. */
  points?: SlotPoint[];
};

/** What a slot's corners look like when it has no explicit radii. Mirrors the
 *  .slot-circle / .slot-rect rules in index.css. */
export const defaultRadii = (shape: SlotShape): SlotRadii =>
  shape === "circle" ? [50, 50, 50, 50] : [3, 3, 3, 3];

export const radiiOf = (s: CardSlot): SlotRadii => s.radii ?? defaultRadii(s.shape);

/** A point on the slot's outline, as a fraction of the slot's own box.
 *  [0,0] is its top-left corner, [1,1] its bottom-right. */
export type SlotPoint = [number, number];

/** Trace the slot's current rounded-rect outline into draggable points, so
 *  fine-tuning starts from exactly the shape already on screen rather than
 *  snapping to something else the moment you grab a point. */
export const samplePoints = (s: CardSlot, perCorner = 5): SlotPoint[] => {
  const [tl, tr, br, bl] = radiiOf(s).map((r) => Math.max(0, Math.min(50, r)) / 100);
  const pts: SlotPoint[] = [];
  // Each corner arc runs between two straight edges; centre is inset by the
  // radius on both axes, and the sweep is a quarter turn.
  const corners: { cx: number; cy: number; rx: number; ry: number; from: number }[] = [
    { cx: tl,     cy: tl,     rx: tl, ry: tl, from: 180 },  // top-left
    { cx: 1 - tr, cy: tr,     rx: tr, ry: tr, from: 270 },  // top-right
    { cx: 1 - br, cy: 1 - br, rx: br, ry: br, from: 0   },  // bottom-right
    { cx: bl,     cy: 1 - bl, rx: bl, ry: bl, from: 90  },  // bottom-left
  ];
  for (const { cx, cy, rx, ry, from } of corners) {
    if (rx <= 0 && ry <= 0) {
      // Square corner - the arc collapses to the corner point itself.
      const x = from === 180 || from === 90 ? 0 : 1;
      const y = from === 180 || from === 270 ? 0 : 1;
      pts.push([x, y]);
      continue;
    }
    for (let i = 0; i <= perCorner; i++) {
      const a = ((from + (90 * i) / perCorner) * Math.PI) / 180;
      pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
  }
  return pts.map(([x, y]) => [round5(x), round5(y)] as SlotPoint);
};

const round5 = (n: number) => Math.round(n * 1e5) / 1e5;

export const pointsToClipPath = (points: SlotPoint[]) =>
  `polygon(${points.map(([x, y]) => `${round5(x * 100)}% ${round5(y * 100)}%`).join(", ")})`;

/** The master grid. Shared by every template - this is what guarantees that
 *  switching template never moves a slot. */
export const cardSlots: CardSlot[] = [
  { id: 1, name: "HP badge", shape: "circle", kind: "text", x: 0.04996, y: 0.02272, w: 0.15451, h: 0.10544, radii: [50, 50, 49, 50] },
  { id: 2, name: "Name bar", shape: "rect", kind: "text", x: 0.23585, y: 0.03814, w: 0.62382, h: 0.04451 },
  { id: 3, name: "Rank badge", shape: "circle", kind: "text", x: 0.85573, y: 0.02896, w: 0.11843, h: 0.08544, radii: [50, 50, 50, 50] },
  { id: 4, name: "Rivet upper-left", shape: "circle", kind: "fill", x: 0.03548, y: 0.18954, w: 0.05875, h: 0.03947, radii: [49, 50, 50, 50] },
  { id: 5, name: "Main portrait", shape: "circle", kind: "image", x: 0.11888, y: 0.08531, w: 0.77658, h: 0.51060, radii: [50, 50, 50, 50] },
  { id: 6, name: "Rivet upper-right", shape: "circle", kind: "fill", x: 0.92309, y: 0.18930, w: 0.05875, h: 0.03947 },
  { id: 7, name: "Rivet lower-left", shape: "circle", kind: "fill", x: 0.01938, y: 0.46573, w: 0.09875, h: 0.06647, radii: [49, 50, 50, 49] },
  { id: 8, name: "Rivet lower-right", shape: "circle", kind: "fill", x: 0.90012, y: 0.46673, w: 0.09675, h: 0.06447 },
  { id: 9, name: "Ability 1 icon", shape: "circle", kind: "image", x: 0.14912, y: 0.54813, w: 0.08537, h: 0.05868 },
  { id: 10, name: "Ability 1 text", shape: "rect", kind: "text", x: 0.11200, y: 0.53972, w: 0.79348, h: 0.08011, radii: [0, 3, 3, 3] },
  { id: 11, name: "Ability 2 icon", shape: "circle", kind: "image", x: 0.15012, y: 0.62945, w: 0.08537, h: 0.05884 },
  { id: 12, name: "Ability 2 text", shape: "rect", kind: "text", x: 0.11200, y: 0.61897, w: 0.79348, h: 0.07911 },
  { id: 13, name: "Ability 3 icon", shape: "circle", kind: "image", x: 0.14812, y: 0.71152, w: 0.08937, h: 0.05905, radii: [50, 50, 50, 50] },
  { id: 14, name: "Ability 3 text", shape: "rect", kind: "text", x: 0.11200, y: 0.70095, w: 0.79348, h: 0.07911 },
  { id: 15, name: "Mounted companion", shape: "circle", kind: "image", x: 0.09242, y: 0.81835, w: 0.26754, h: 0.17885 },
  { id: 16, name: "Stud left of faction", shape: "circle", kind: "fill", x: 0.38018, y: 0.82308, w: 0.04089, h: 0.02881 },
  { id: 17, name: "Faction seal", shape: "circle", kind: "image", x: 0.45701, y: 0.84365, w: 0.10113, h: 0.06820 },
  { id: 18, name: "Stud right of faction", shape: "circle", kind: "fill", x: 0.59162, y: 0.82308, w: 0.04489, h: 0.02981, radii: [50, 44, 50, 50] },
  { id: 19, name: "Flying companion", shape: "circle", kind: "image", x: 0.65609, y: 0.81735, w: 0.26690, h: 0.18185 },
  { id: 20, name: "Name plate 2", shape: "circle", kind: "text", x: 0.33304, y: 0.09053, w: 0.34482, h: 0.02900, radii: [50, 50, 50, 50] },
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
  // A point-edited outline is drawn entirely in SVG - fill and edge both - so
  // the element itself goes invisible and only carries hit-testing and text.
  //
  // It cannot use clip-path: clipping only ever *subtracts* from the element's
  // box, so a point dragged outside the slot's rectangle showed an outline with
  // no fill behind it. The colour has to be real geometry, not a clipped
  // rectangle, or it stops at the box edge on the finished card.
  ...(s.points?.length ? { borderColor: "transparent", background: "transparent" } : null),
});
