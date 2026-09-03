import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { BrushState } from "./brushes";

export type PaintCanvasHandle = {
  /** Fill the whole surface with solid white ("new blank paper"). */
  clearWhite: () => void;
  /** Wipe the surface back to fully transparent. */
  clearTransparent: () => void;
  /** Drop an image file onto the canvas, scaled to fit. */
  loadImageFile: (file: File) => void;
  undo: () => void;
  redo: () => void;
  /** MediaPipe segmentation + Fabric.js clip mask. Resolves true on success. */
  removeBackground: () => Promise<boolean>;
};

type Props = {
  active: boolean;
  brush: BrushState;
  eyedropper: boolean;
  onPickColor: (hex: string) => void;
  onHistoryChange: (canUndo: boolean, canRedo: boolean) => void;
  onBusyChange?: (busy: boolean) => void;
  onNotify?: (message: string) => void;
};

// Card-space drawing resolution. The <canvas> is stretched to the card box with
// CSS, so brush sizes stay in these units regardless of on-screen zoom.
const W = 744;
const H = 1056;
const DPR = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
const HISTORY_LIMIT = 16;

type Point = { x: number; y: number };

function toRgba(hex: string, alpha: number): string {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = Number.parseInt(h, 16);
  if (!Number.isFinite(n)) return `rgba(0, 0, 0, ${alpha})`;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export const PaintCanvas = forwardRef<PaintCanvasHandle, Props>(function PaintCanvas(props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Latest props, so pointer handlers and the imperative handle can stay stable.
  const propsRef = useRef(props);
  propsRef.current = props;

  const drawing = useRef(false);
  const lastPoint = useRef<Point | null>(null);
  const sprayPoint = useRef<Point | null>(null);
  const sprayTimer = useRef<number | null>(null);

  const history = useRef<string[]>([]);
  const historyIndex = useRef(-1);

  // ---- history --------------------------------------------------------------
  const emitHistory = () => {
    propsRef.current.onHistoryChange(
      historyIndex.current > 0,
      historyIndex.current < history.current.length - 1,
    );
  };

  const snapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    history.current = history.current.slice(0, historyIndex.current + 1);
    history.current.push(canvas.toDataURL("image/png"));
    if (history.current.length > HISTORY_LIMIT) history.current.shift();
    historyIndex.current = history.current.length - 1;
    emitHistory();
  };

  /** Run `fn` with an identity transform (device pixels), then restore scale. */
  const withDeviceSpace = (fn: (ctx: CanvasRenderingContext2D) => void) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    fn(ctx);
    ctx.restore();
  };

  const restore = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      withDeviceSpace((ctx) => {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, W * DPR, H * DPR);
        ctx.drawImage(img, 0, 0, W * DPR, H * DPR);
      });
    };
    img.src = dataUrl;
  };

  // ---- drawing ------------------------------------------------------------
  const pointFromEvent = (clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * H,
    };
  };

  const drawSegment = (from: Point, to: Point, pressure: number) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const brush = propsRef.current.brush;
    const alpha = Math.max(0.02, brush.opacity / 100);

    if (brush.type === "pen" || brush.type === "eraser") {
      ctx.globalCompositeOperation = brush.type === "eraser" ? "destination-out" : "source-over";
      ctx.globalAlpha = brush.type === "eraser" ? 1 : alpha;
      ctx.strokeStyle = brush.color;
      ctx.lineWidth = Math.max(0.5, brush.size * (0.4 + 0.6 * pressure));
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
      return;
    }

    if (brush.type === "marker") {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = Math.min(1, alpha * 0.5);
      ctx.strokeStyle = brush.color;
      ctx.lineWidth = brush.size;
      ctx.lineCap = "square";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
      return;
    }

    // brush (soft) + pencil: stamp along the segment
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    const radius = Math.max(0.5, (brush.size / 2) * (0.4 + 0.6 * pressure));
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const spacing =
      brush.type === "pencil" ? Math.max(0.6, radius * 0.5) : Math.max(0.75, radius * 0.3);
    const steps = Math.max(1, Math.round(dist / spacing));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t;

      if (brush.type === "pencil") {
        for (let d = 0; d < 3; d++) {
          const jx = x + (Math.random() - 0.5) * radius * 1.8;
          const jy = y + (Math.random() - 0.5) * radius * 1.8;
          ctx.fillStyle = toRgba(brush.color, alpha * 0.2);
          ctx.beginPath();
          ctx.arc(jx, jy, Math.max(0.35, radius * 0.28), 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, toRgba(brush.color, alpha));
        gradient.addColorStop(0.55, toRgba(brush.color, alpha * 0.55));
        gradient.addColorStop(1, toRgba(brush.color, 0));
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const sprayTick = () => {
    const ctx = ctxRef.current;
    const point = sprayPoint.current;
    if (!ctx || !point) return;
    const brush = propsRef.current.brush;
    const radius = Math.max(2, brush.size / 2);
    const density = Math.max(6, Math.round(radius * 0.9));
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * radius;
      ctx.fillStyle = toRgba(brush.color, (brush.opacity / 100) * 0.12);
      ctx.beginPath();
      ctx.arc(
        point.x + Math.cos(angle) * r,
        point.y + Math.sin(angle) * r,
        Math.random() < 0.18 ? 1.1 : 0.6,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  };

  const sampleColor = (point: Point) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const data = ctx.getImageData(
      Math.max(0, Math.min(W * DPR - 1, Math.round(point.x * DPR))),
      Math.max(0, Math.min(H * DPR - 1, Math.round(point.y * DPR))),
      1,
      1,
    ).data;
    if (data[3] === 0) {
      propsRef.current.onNotify?.("That spot is transparent");
      return;
    }
    const hex =
      "#" +
      [data[0], data[1], data[2]].map((v) => v.toString(16).padStart(2, "0")).join("");
    propsRef.current.onPickColor(hex);
  };

  const stopStroke = (pointerId?: number) => {
    if (sprayTimer.current != null) {
      window.clearInterval(sprayTimer.current);
      sprayTimer.current = null;
    }
    sprayPoint.current = null;
    if (!drawing.current) return;
    drawing.current = false;
    lastPoint.current = null;
    if (pointerId != null) {
      try {
        canvasRef.current?.releasePointerCapture(pointerId);
      } catch {
        /* pointer already released */
      }
    }
    snapshot();
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!propsRef.current.active || event.button !== 0) return;
    const point = pointFromEvent(event.clientX, event.clientY);

    if (propsRef.current.eyedropper) {
      event.stopPropagation();
      sampleColor(point);
      return;
    }

    event.stopPropagation();
    canvasRef.current?.setPointerCapture(event.pointerId);
    drawing.current = true;
    lastPoint.current = point;

    if (propsRef.current.brush.type === "spray") {
      sprayPoint.current = point;
      sprayTick();
      sprayTimer.current = window.setInterval(sprayTick, 45);
    } else {
      drawSegment(point, point, event.pressure || 0.5);
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !propsRef.current.active) return;
    event.stopPropagation();
    event.preventDefault();

    if (propsRef.current.brush.type === "spray") {
      sprayPoint.current = pointFromEvent(event.clientX, event.clientY);
      return;
    }

    let from = lastPoint.current;
    if (!from) return;
    const native = event.nativeEvent;
    const coalesced =
      typeof native.getCoalescedEvents === "function" && native.getCoalescedEvents().length
        ? native.getCoalescedEvents()
        : [native];
    for (const raw of coalesced) {
      const to = pointFromEvent(raw.clientX, raw.clientY);
      drawSegment(from, to, raw.pressure || event.pressure || 0.5);
      from = to;
    }
    lastPoint.current = from;
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    stopStroke(event.pointerId);
  };

  // ---- setup -------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(DPR, DPR);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;

    history.current = [canvas.toDataURL("image/png")];
    historyIndex.current = 0;
    emitHistory();

    return () => {
      if (sprayTimer.current != null) window.clearInterval(sprayTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- imperative API --------------------------------------------------
  useImperativeHandle(
    ref,
    (): PaintCanvasHandle => ({
      clearWhite() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        withDeviceSpace((ctx) => {
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 1;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        });
        snapshot();
        propsRef.current.onNotify?.("Blank white canvas");
      },
      clearTransparent() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        withDeviceSpace((ctx) => {
          ctx.globalCompositeOperation = "source-over";
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
        snapshot();
        propsRef.current.onNotify?.("Canvas cleared");
      },
      loadImageFile(file: File) {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const ctx = ctxRef.current;
            if (!ctx) return;
            const scale = Math.min(W / img.width, H / img.height);
            const dw = img.width * scale;
            const dh = img.height * scale;
            ctx.globalCompositeOperation = "source-over";
            ctx.globalAlpha = 1;
            ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
            snapshot();
            propsRef.current.onNotify?.("Image placed on canvas");
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
      },
      undo() {
        if (historyIndex.current <= 0) return;
        historyIndex.current -= 1;
        restore(history.current[historyIndex.current]);
        emitHistory();
      },
      redo() {
        if (historyIndex.current >= history.current.length - 1) return;
        historyIndex.current += 1;
        restore(history.current[historyIndex.current]);
        emitHistory();
      },
      async removeBackground() {
        const canvas = canvasRef.current;
        if (!canvas) return false;
        propsRef.current.onBusyChange?.(true);
        try {
          const mod = await import("./removeBackground");
          await mod.removeBackground(canvas);
          snapshot();
          propsRef.current.onNotify?.("Background removed");
          return true;
        } catch (err) {
          propsRef.current.onNotify?.(
            err instanceof Error ? err.message : "Background removal failed",
          );
          return false;
        } finally {
          propsRef.current.onBusyChange?.(false);
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const { active, eyedropper } = props;
  return (
    <canvas
      ref={canvasRef}
      className="paint-layer"
      data-export-keep="true"
      style={{
        pointerEvents: active ? "auto" : "none",
        cursor: active ? (eyedropper ? "cell" : "crosshair") : "default",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    />
  );
});
