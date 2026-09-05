import { useEffect, useRef } from "react";
import * as fabric from "fabric";
import type { Fill } from "./types";
import { PATTERN_DATA_URLS } from "./patterns";
import { radiiOf, samplePoints, type CardSlot } from "../data/cardSlots";

// ---------------------------------------------------------------------------
// One Fabric.Canvas per zone, sized to that zone's box, positioned absolutely
// underneath the zone's (unmoving) text. This is a *fill renderer*, not a
// general editor: there is exactly one background object, always clipped to
// the zone's fixed silhouette, so the fill can never spill outside the
// locked outline or shift the zone's geometry.
// ---------------------------------------------------------------------------

// The clip is always a polygon, never an Ellipse/Rect, because the slot grid
// in cardSlots.ts describes outlines two different ways - per-corner `radii`
// and hand-dragged `points` - and fabric's Rect only takes one uniform rx/ry.
// samplePoints() already traces `radii` into the same point list the DOM
// renders, so going through it for both cases is what keeps the fabric fill
// aligned to the pixel with the CSS outline sitting on top of it.
function clipPathFor(slot: CardSlot, w: number, h: number): fabric.Object {
  const pts = slot.points?.length ? slot.points : samplePoints({ ...slot, radii: radiiOf(slot) });
  return new fabric.Polygon(
    pts.map(([x, y]) => ({ x: x * w, y: y * h })),
    { left: 0, top: 0, originX: "center", originY: "center" },
  );
}

function angleToCoords(angleDeg: number) {
  // Convert a 0-360 angle into gradient start/end coords on a unit square,
  // so any angle (not just the 8 CSS compass points) is supported.
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  return {
    x1: 0.5 - dx * 0.5, y1: 0.5 - dy * 0.5,
    x2: 0.5 + dx * 0.5, y2: 0.5 + dy * 0.5,
  };
}

export function FabricFillLayer({
  slot,
  fill,
  width,
  height,
}: {
  slot: CardSlot;
  fill: Fill;
  width: number;
  height: number;
}) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.StaticCanvas | null>(null);

  useEffect(() => {
    if (!canvasElRef.current) return;
    const canvas = new fabric.StaticCanvas(canvasElRef.current, { width, height });
    fabricRef.current = canvas;
    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    let cancelled = false;

    const render = async () => {
      canvas.clear();
      const clip = clipPathFor(slot, width, height);
      clip.set({ left: width / 2, top: height / 2 });

      let bg: fabric.Object;

      if (fill.kind === "solid") {
        bg = new fabric.Rect({ width, height, left: 0, top: 0, fill: fill.color ?? "#888" });
      } else if (fill.kind === "gradient") {
        const { x1, y1, x2, y2 } = angleToCoords(fill.angle ?? 0);
        const gradient = new fabric.Gradient({
          type: "linear",
          coords: { x1: x1 * width, y1: y1 * height, x2: x2 * width, y2: y2 * height },
          colorStops: (fill.stops ?? []).map((s) => ({ offset: s.offset, color: s.color })),
        });
        bg = new fabric.Rect({ width, height, left: 0, top: 0, fill: gradient });
      } else if (fill.kind === "pattern") {
        const src = fill.pattern === "custom" && fill.patternImageUrl
          ? fill.patternImageUrl
          : PATTERN_DATA_URLS[fill.pattern ?? "diagonal-stripes"](fill.patternColor ?? "#8a6d3a");
        const img = await loadImage(src);
        // fabric.Pattern wants the raw <img>, not the FabricImage wrapper.
        const pattern = new fabric.Pattern({
          source: img.getElement() as HTMLImageElement,
          repeat: "repeat",
          patternTransform: [fill.patternScale ?? 1, 0, 0, fill.patternScale ?? 1, 0, 0],
        });
        bg = new fabric.Rect({ width, height, left: 0, top: 0, fill: pattern });
      } else if (fill.kind === "texture" && fill.textureDataUrl) {
        const img = await loadImage(fill.textureDataUrl);
        img.set({ left: 0, top: 0 });
        img.scaleToWidth(width);
        if ((img.getScaledHeight() ?? 0) < height) img.scaleToHeight(height);
        bg = img;
      } else if (fill.kind === "image" && fill.imageUrl) {
        const img = await loadImage(fill.imageUrl);
        const scale = Math.max(width / img.width!, height / img.height!) * ((fill.imageScale ?? 100) / 100);
        img.set({
          left: width * ((fill.imageX ?? 50) / 100),
          top: height * ((fill.imageY ?? 50) / 100),
          originX: "center",
          originY: "center",
          scaleX: scale,
          scaleY: scale,
        });
        bg = img;
      } else {
        bg = new fabric.Rect({ width, height, left: 0, top: 0, fill: "#5a5a5a" });
      }

      bg.set({ clipPath: clip, opacity: (fill.opacity ?? 100) / 100, selectable: false, evented: false });
      if (cancelled) return;
      canvas.add(bg);
      canvas.requestRenderAll();
    };

    render();
    return () => {
      cancelled = true;
    };
  }, [slot, fill, width, height]);

  return <canvas ref={canvasElRef} className="fabric-fill-layer" />;
}

function loadImage(src: string): Promise<fabric.FabricImage> {
  return new Promise((resolve, reject) => {
    fabric.FabricImage.fromURL(src, { crossOrigin: "anonymous" })
      .then((img) => resolve(img))
      .catch(reject);
  });
}