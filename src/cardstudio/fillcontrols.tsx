import { useState } from "react";
import type { ChangeEvent } from "react";
import type { Fill, FillKind } from "./types";
import { ColorWheel } from "./ColorWheel";
import { patternLibrary } from "./patterns";
import { textureLibrary, bakeTexture } from "./textures";

const FILL_TABS: { id: FillKind; label: string }[] = [
  { id: "solid", label: "Solid" },
  { id: "gradient", label: "Gradient" },
  { id: "pattern", label: "Pattern" },
  { id: "texture", label: "Texture" },
  { id: "image", label: "Image" },
];

export function FillControls({
  fill,
  onChange,
}: {
  fill: Fill;
  onChange: (next: Fill) => void;
}) {
  const [baking, setBaking] = useState(false);

  const patch = (partial: Partial<Fill>) => onChange({ ...fill, ...partial });

  const onImageUpload = (event: ChangeEvent<HTMLInputElement>, key: "imageUrl" | "patternImageUrl") => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") patch({ [key]: reader.result } as Partial<Fill>);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const rebakeTexture = async (overrides: Partial<Fill> = {}) => {
    setBaking(true);
    const merged = { ...fill, ...overrides };
    const dataUrl = await bakeTexture({
      kind: merged.texture ?? "grain",
      seed: merged.textureSeed ?? 1,
      scale: merged.textureScale ?? 1,
      colorA: merged.textureColorA ?? "#caa968",
      colorB: merged.textureColorB ?? "#3a2c17",
    });
    onChange({ ...merged, textureDataUrl: dataUrl });
    setBaking(false);
  };

  return (
    <div className="fill-controls">
      <div className="fill-tabs">
        {FILL_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`fill-tab ${fill.kind === tab.id ? "is-active" : ""}`}
            onClick={() => patch({ kind: tab.id })}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {fill.kind === "solid" && (
        <div className="fill-panel">
          <ColorWheel value={fill.color ?? "#caa968"} onChange={(hex) => patch({ color: hex })} />
          <label className="hex-input">
            <span>Hex</span>
            <input
              value={(fill.color ?? "").toUpperCase()}
              onChange={(event) => patch({ color: event.target.value })}
              maxLength={7}
            />
          </label>
        </div>
      )}

      {fill.kind === "gradient" && (
        <div className="fill-panel">
          <label className="range-label">
            <span>Angle</span>
            <output>{fill.angle ?? 0}°</output>
          </label>
          <input
            type="range"
            min={0}
            max={360}
            value={fill.angle ?? 0}
            onChange={(event) => patch({ angle: Number(event.target.value) })}
          />
          <div className="angle-dial" style={{ transform: `rotate(${fill.angle ?? 0}deg)` }} />

          {(fill.stops ?? []).map((stop, index) => (
            <div className="gradient-stop-row" key={index}>
              <input
                type="color"
                value={stop.color}
                onChange={(event) => {
                  const stops = [...(fill.stops ?? [])];
                  stops[index] = { ...stop, color: event.target.value };
                  patch({ stops });
                }}
              />
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(stop.offset * 100)}
                onChange={(event) => {
                  const stops = [...(fill.stops ?? [])];
                  stops[index] = { ...stop, offset: Number(event.target.value) / 100 };
                  patch({ stops });
                }}
              />
            </div>
          ))}
          <button
            className="ghost-button"
            onClick={() =>
              patch({ stops: [...(fill.stops ?? []), { color: "#ffffff", offset: 1 }] })
            }
          >
            Add stop
          </button>
        </div>
      )}

      {fill.kind === "pattern" && (
        <div className="fill-panel">
          <div className="pattern-grid">
            {patternLibrary.map((preset) => (
              <button
                key={preset.id}
                className={`pattern-swatch ${fill.pattern === preset.id ? "is-active" : ""}`}
                onClick={() => patch({ pattern: preset.id })}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {fill.pattern === "custom" && (
            <label className="upload-zone">
              <input type="file" accept="image/*" onChange={(event) => onImageUpload(event, "patternImageUrl")} />
              <span>Upload tile image</span>
            </label>
          )}
          <input
            type="color"
            value={fill.patternColor ?? "#8a6d3a"}
            onChange={(event) => patch({ patternColor: event.target.value })}
          />
          <label className="range-label">
            <span>Pattern scale</span>
            <output>{fill.patternScale ?? 1}x</output>
          </label>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.1}
            value={fill.patternScale ?? 1}
            onChange={(event) => patch({ patternScale: Number(event.target.value) })}
          />
        </div>
      )}

      {fill.kind === "texture" && (
        <div className="fill-panel">
          <div className="pattern-grid">
            {textureLibrary.map((tex) => (
              <button
                key={tex.kind}
                className={`pattern-swatch ${fill.texture === tex.kind ? "is-active" : ""}`}
                onClick={() => {
                  patch({ texture: tex.kind });
                  rebakeTexture({ texture: tex.kind });
                }}
              >
                {tex.label}
              </button>
            ))}
          </div>
          <div className="texture-colors">
            <input type="color" value={fill.textureColorA ?? "#caa968"} onChange={(e) => { patch({ textureColorA: e.target.value }); rebakeTexture({ textureColorA: e.target.value }); }} />
            <input type="color" value={fill.textureColorB ?? "#3a2c17"} onChange={(e) => { patch({ textureColorB: e.target.value }); rebakeTexture({ textureColorB: e.target.value }); }} />
          </div>
          <label className="range-label">
            <span>Grain scale</span>
            <output>{fill.textureScale ?? 1}x</output>
          </label>
          <input
            type="range"
            min={0.3}
            max={3}
            step={0.1}
            value={fill.textureScale ?? 1}
            onChange={(event) => {
              patch({ textureScale: Number(event.target.value) });
            }}
            onMouseUp={() => rebakeTexture()}
          />
          <button className="ghost-button" onClick={() => rebakeTexture({ textureSeed: Math.random() * 9999 | 0 })} disabled={baking}>
            {baking ? "Generating…" : "Shuffle"}
          </button>
        </div>
      )}

      {fill.kind === "image" && (
        <div className="fill-panel">
          <label className="upload-zone">
            <input type="file" accept="image/*" onChange={(event) => onImageUpload(event, "imageUrl")} />
            <span>Upload image</span>
          </label>
          <label className="range-label">
            <span>Scale</span>
            <output>{fill.imageScale ?? 100}%</output>
          </label>
          <input type="range" min={80} max={200} value={fill.imageScale ?? 100} onChange={(e) => patch({ imageScale: Number(e.target.value) })} />
          <div className="range-split">
            <label><span>X</span><input type="number" value={fill.imageX ?? 50} onChange={(e) => patch({ imageX: Number(e.target.value) })} /></label>
            <label><span>Y</span><input type="number" value={fill.imageY ?? 50} onChange={(e) => patch({ imageY: Number(e.target.value) })} /></label>
          </div>
        </div>
      )}

      <label className="range-label">
        <span>Fill opacity</span>
        <output>{fill.opacity ?? 100}%</output>
      </label>
      <input
        type="range"
        min={0}
        max={100}
        value={fill.opacity ?? 100}
        onChange={(event) => patch({ opacity: Number(event.target.value) })}
      />
    </div>
  );
}