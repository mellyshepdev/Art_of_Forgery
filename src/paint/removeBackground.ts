/**
 * Background removal pipeline: MediaPipe Selfie Segmentation builds a
 * foreground mask, Fabric.js clips the painting to it, and the result is
 * blitted back onto the paint canvas (background now transparent).
 *
 * The heavy libraries load on first use only.
 */
export async function removeBackground(canvas: HTMLCanvasElement): Promise<void> {
  const [{ buildForegroundMask }, { applyClipMask }] = await Promise.all([
    import("./segmentation"),
    import("./clipMask"),
  ]);

  const mask = await buildForegroundMask(canvas);
  const clipped = await applyClipMask(canvas, mask);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(clipped, 0, 0);
  ctx.restore();
}
