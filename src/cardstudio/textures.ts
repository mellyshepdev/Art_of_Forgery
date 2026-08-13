import p5 from "p5";
import type { TextureKind } from "./types";

// ---------------------------------------------------------------------------
// p5.js owns generative/procedural textures. Each generator runs headless in
// instance mode against an offscreen <canvas>, draws once, and hands back a
// data URL. That URL is then used exactly like an uploaded image — Fabric.js
// tiles or fits it as a pattern/image fill. p5 never touches the live DOM.
// ---------------------------------------------------------------------------

export interface TextureParams {
  kind: TextureKind;
  seed: number;
  scale: number; // 0.5 - 3, controls grain/dot/hatch density
  colorA: string;
  colorB: string;
  width?: number;
  height?: number;
}

export function bakeTexture(params: TextureParams): Promise<string> {
  const { kind, seed, scale, colorA, colorB, width = 512, height = 512 } = params;

  return new Promise((resolve) => {
    const holder = document.createElement("div");
    holder.style.position = "fixed";
    holder.style.left = "-9999px";
    document.body.appendChild(holder);

    const sketch = (p: p5) => {
      p.setup = () => {
        p.createCanvas(width, height);
        p.noLoop();
        p.randomSeed(seed);
        p.noiseSeed(seed);

        const a = p.color(colorA);
        const b = p.color(colorB);

        p.background(b);

        if (kind === "grain") {
          const density = 9000 * scale;
          for (let i = 0; i < density; i++) {
            const x = p.random(width);
            const y = p.random(height);
            const n = p.noise(x * 0.01, y * 0.01);
            const c = p.lerpColor(b, a, n);
            p.stroke(c);
            p.strokeWeight(p.random(0.6, 1.6));
            p.point(x, y);
          }
        } else if (kind === "dot-grid") {
          const step = 26 / scale;
          p.noStroke();
          for (let y = step / 2; y < height; y += step) {
            for (let x = step / 2; x < width; x += step) {
              const n = p.noise(x * 0.02, y * 0.02);
              p.fill(p.lerpColor(b, a, 0.35 + n * 0.6));
              p.circle(x, y, step * 0.42 * (0.7 + n * 0.6));
            }
          }
        } else if (kind === "hatch") {
          const gap = 10 / scale;
          p.stroke(a);
          p.strokeWeight(1.1);
          for (let d = -height; d < width; d += gap) {
            const jitter = p.map(p.noise(d * 0.01), 0, 1, -4, 4);
            p.line(d + jitter, 0, d + height + jitter, height);
          }
        } else if (kind === "marble") {
          p.loadPixels();
          const nScale = 0.006 * scale;
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const n =
                p.noise(x * nScale, y * nScale) +
                0.35 * Math.sin(x * nScale * 6 + p.noise(y * nScale * 3) * 8);
              const t = p.constrain(n, 0, 1);
              const c = p.lerpColor(b, a, t);
              const idx = (x + y * width) * 4;
              p.pixels[idx] = p.red(c);
              p.pixels[idx + 1] = p.green(c);
              p.pixels[idx + 2] = p.blue(c);
              p.pixels[idx + 3] = 255;
            }
          }
          p.updatePixels();
        }

        const dataUrl = (p as any).canvas.toDataURL("image/png");
        resolve(dataUrl);
        // Clean up after the current tick so toDataURL has definitely flushed.
        setTimeout(() => {
          instance.remove();
          holder.remove();
        }, 0);
      };
    };

    const instance = new p5(sketch, holder);
  });
}

export const textureLibrary: { kind: TextureKind; label: string }[] = [
  { kind: "grain", label: "Grain" },
  { kind: "dot-grid", label: "Dot grid" },
  { kind: "hatch", label: "Hatch" },
  { kind: "marble", label: "Marble" },
];