import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// A large click-and-drag HSV color wheel. Built on the raw Pointer Events
// API (pointerdown/pointermove/pointerup + setPointerCapture) so dragging
// works uniformly across mouse, touch, and pen without separate handlers.
// ---------------------------------------------------------------------------

type HSV = { h: number; s: number; v: number };

function hsvToHex({ h, s, v }: HSV): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHsv(hex: string): HSV {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

export function ColorWheel({
  value,
  onChange,
  size = 220,
}: {
  value: string;
  onChange: (hex: string) => void;
  size?: number;
}) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [hsv, setHsv] = useState<HSV>(() => hexToHsv(value));
  const draggingWheel = useRef(false);

  useEffect(() => {
    // Keep local hsv in sync if the value changes from outside (e.g. hex input, preset).
    setHsv(hexToHsv(value));
  }, [value]);

  const updateFromPoint = useCallback(
    (clientX: number, clientY: number) => {
      const el = wheelRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const radius = rect.width / 2;
      const dist = Math.min(Math.hypot(dx, dy), radius);
      // conic-gradient's 0deg is 12 o'clock; atan2's 0 is 3 o'clock. Without
      // the +90 the wheel returned a hue a quarter turn from the one under the
      // cursor - clicking blue gave green, yellow gave pink.
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      const h = (angle + 360) % 360;
      const s = dist / radius;
      const next = { ...hsv, h, s };
      setHsv(next);
      onChange(hsvToHex(next));
    },
    [hsv, onChange]
  );

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    (event.target as Element).setPointerCapture(event.pointerId);
    draggingWheel.current = true;
    updateFromPoint(event.clientX, event.clientY);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingWheel.current) return;
    updateFromPoint(event.clientX, event.clientY);
  };
  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    draggingWheel.current = false;
    (event.target as Element).releasePointerCapture(event.pointerId);
  };

  const handleR = hsv.s * (size / 2);
  // -90 for the same reason as the pick maths below: the gradient's 0deg is at
  // 12 o'clock while atan2/cos/sin measure from 3 o'clock.
  const handleAngleRad = ((hsv.h - 90) * Math.PI) / 180;
  const handleX = size / 2 + handleR * Math.cos(handleAngleRad);
  const handleY = size / 2 + handleR * Math.sin(handleAngleRad);

  return (
    <div className="color-wheel-block">
      <div
        ref={wheelRef}
        className="color-wheel"
        style={{
          width: size,
          height: size,
          background:
            "conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red), radial-gradient(circle, white 0%, transparent 72%)",
          filter: `brightness(${hsv.v})`,
          touchAction: "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="color-wheel-handle"
          style={{ left: handleX, top: handleY, background: hsvToHex(hsv) }}
        />
      </div>

      <label className="color-wheel-brightness">
        <span>Brightness</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(hsv.v * 100)}
          onChange={(event) => {
            const next = { ...hsv, v: Number(event.target.value) / 100 };
            setHsv(next);
            onChange(hsvToHex(next));
          }}
        />
      </label>
    </div>
  );
}