import { radiiOf, samplePoints, type CardSlot } from "../data/cardSlots";
import { PATTERN_DATA_URLS } from "../cardstudio/patterns";
import type { Fill } from "../cardstudio/types";

// ---------------------------------------------------------------------------
// Real vector export.
//
// The PNG/JPG path screenshots the live DOM, so it carries every bit of screen
// chrome - backdrop gradients, vignettes, box-shadows - and lands as pixels.
// This one emits the *printable* card instead: the frame and any photographic
// content stay raster (embedded as data URLs so the file stands alone), while
// every slot outline, fill and text line comes out as real geometry a printer or
// Illustrator/Inkscape can scale and re-edit.
//
// It deliberately does NOT try to reproduce the editor's decorative CSS. A
// vector card that matches the screen pixel for pixel is not achievable and
// not what the format is for.
// ---------------------------------------------------------------------------

export type SvgExportInput = {
  width: number;
  height: number;
  /** Frame artwork URL (same one the card is showing). */
  templateSrc: string;
  slots: CardSlot[];
  /** Flat hex per slot id. */
  fill: Record<number, string>;
  /** 0-100 per slot id. */
  opacity: Record<number, number>;
  /** Gradient/pattern/texture/image per slot id. */
  rich: Record<number, Fill>;
  /** Raster content dropped into a slot, by slot id (portrait, icons, seal). */
  images: Record<number, string>;
  /** Text content by slot id, plus its styling. */
  text: Record<number, string>;
  subtitle?: string;
};

const xml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const n5 = (v: number) => Math.round(v * 1e5) / 1e5;

/** Inline every external asset. An SVG that still points at /images/... is
 *  useless the moment it leaves the app, which is the only reason to export
 *  one in the first place. */
async function inlineAsset(src: string): Promise<string> {
  if (src.startsWith("data:")) return src;
  const res = await fetch(src, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Could not read ${src}`);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** The slot outline in card pixels. Goes through the same samplePoints() the
 *  editor and the fabric clip use, so all three describe one shape. */
function slotPath(slot: CardSlot, W: number, H: number): string {
  const pts = slot.points?.length ? slot.points : samplePoints({ ...slot, radii: radiiOf(slot) });
  const x = slot.x * W;
  const y = slot.y * H;
  const w = slot.w * W;
  const h = slot.h * H;
  return (
    pts.map(([px, py], i) => `${i === 0 ? "M" : "L"}${n5(x + px * w)} ${n5(y + py * h)}`).join(" ") + " Z"
  );
}

function gradientDef(id: string, fill: Fill): string {
  const angle = ((fill.angle ?? 0) * Math.PI) / 180;
  const dx = Math.cos(angle) * 0.5;
  const dy = Math.sin(angle) * 0.5;
  const stops = (fill.stops ?? [])
    .map((s) => `<stop offset="${n5(s.offset)}" stop-color="${xml(s.color)}"/>`)
    .join("");
  return (
    `<linearGradient id="${id}" x1="${n5(0.5 - dx)}" y1="${n5(0.5 - dy)}" ` +
    `x2="${n5(0.5 + dx)}" y2="${n5(0.5 + dy)}">${stops}</linearGradient>`
  );
}

function patternDef(id: string, fill: Fill, tileHref: string): string {
  const scale = fill.patternScale ?? 1;
  const size = 24 * scale;
  return (
    `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${n5(size)}" height="${n5(size)}">` +
    `<image href="${xml(tileHref)}" width="${n5(size)}" height="${n5(size)}" preserveAspectRatio="none"/>` +
    `</pattern>`
  );
}

export async function buildCardSvg(input: SvgExportInput): Promise<string> {
  const { width: W, height: H, slots, fill, opacity, rich, images, text, subtitle } = input;

  const defs: string[] = [];
  const body: string[] = [];

  const frameHref = await inlineAsset(input.templateSrc);

  // Frame first - everything else sits on top of it, same as the DOM order.
  body.push(`<image href="${xml(frameHref)}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none"/>`);

  for (const slot of slots) {
    const d = slotPath(slot, W, H);
    const alpha = (opacity[slot.id] ?? 100) / 100;
    const r = rich[slot.id];

    if (r) {
      const gid = `fill-${slot.id}`;
      if (r.kind === "gradient") {
        defs.push(gradientDef(gid, r));
        body.push(`<path d="${d}" fill="url(#${gid})" opacity="${n5(alpha * ((r.opacity ?? 100) / 100))}"/>`);
      } else if (r.kind === "pattern") {
        const tile =
          r.pattern === "custom" && r.patternImageUrl
            ? await inlineAsset(r.patternImageUrl)
            : PATTERN_DATA_URLS[r.pattern ?? "diagonal-stripes"](r.patternColor ?? "#8a6d3a");
        defs.push(patternDef(gid, r, tile));
        body.push(`<path d="${d}" fill="url(#${gid})" opacity="${n5(alpha * ((r.opacity ?? 100) / 100))}"/>`);
      } else {
        // texture and image both end up as one raster covering the slot,
        // clipped to its outline.
        const href = r.kind === "texture" ? r.textureDataUrl : r.imageUrl;
        if (href) {
          const inlined = await inlineAsset(href);
          const cid = `clip-${slot.id}`;
          defs.push(`<clipPath id="${cid}"><path d="${d}"/></clipPath>`);
          body.push(
            `<image href="${xml(inlined)}" x="${n5(slot.x * W)}" y="${n5(slot.y * H)}" ` +
              `width="${n5(slot.w * W)}" height="${n5(slot.h * H)}" ` +
              `preserveAspectRatio="xMidYMid slice" clip-path="url(#${cid})" ` +
              `opacity="${n5(alpha * ((r.opacity ?? 100) / 100))}"/>`,
          );
        }
      }
    } else if (fill[slot.id]) {
      body.push(`<path d="${d}" fill="${xml(fill[slot.id])}" opacity="${n5(alpha)}"/>`);
    }

    // Raster content sitting in the slot (portrait, ability icons, seal).
    const img = images[slot.id];
    if (img) {
      const inlined = await inlineAsset(img);
      const cid = `clip-img-${slot.id}`;
      defs.push(`<clipPath id="${cid}"><path d="${d}"/></clipPath>`);
      body.push(
        `<image href="${xml(inlined)}" x="${n5(slot.x * W)}" y="${n5(slot.y * H)}" ` +
          `width="${n5(slot.w * W)}" height="${n5(slot.h * H)}" ` +
          `preserveAspectRatio="xMidYMid slice" clip-path="url(#${cid})"/>`,
      );
    }

    // Text stays live text, not outlines - the whole point of handing a
    // printer an SVG is that they can still fix a typo.
    const label = text[slot.id];
    if (label) {
      // Mirrors .slot-text: Georgia 700, centred in the slot box, sized off
      // the card width the same way the clamp()'d cqw unit does on screen.
      const size = Math.max(9, Math.min(20, W * 0.021));
      body.push(
        `<text x="${n5((slot.x + slot.w / 2) * W)}" y="${n5((slot.y + slot.h / 2) * H)}" ` +
          `font-family="Georgia, 'Times New Roman', serif" font-size="${n5(size)}" font-weight="700" ` +
          `fill="#16130d" text-anchor="middle" dominant-baseline="central">${xml(label)}</text>`,
      );
    }
  }

  if (subtitle) {
    const s2 = slots.find((s) => s.id === 2);
    if (s2) {
      const size = Math.max(7, Math.min(13, W * 0.014));
      body.push(
        `<text x="${n5((s2.x + s2.w / 2) * W)}" y="${n5((s2.y + s2.h) * H)}" ` +
          `font-family="Georgia, 'Times New Roman', serif" font-size="${n5(size)}" ` +
          `letter-spacing="${n5(size * 0.06)}" fill="#4a4034" text-anchor="middle">${xml(subtitle)}</text>`,
      );
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    (defs.length ? `<defs>${defs.join("")}</defs>` : "") +
    body.join("") +
    `</svg>`
  );
}
