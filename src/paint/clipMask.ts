import * as fabric from "fabric";

/**
 * Clip `source` by `mask` using Fabric.js: the mask's opaque pixels are kept,
 * everything else becomes transparent. Fabric renders the mask as an image
 * `clipPath` (composited through `destination-in`), which is the clipping-mask
 * path we want for background removal.
 *
 * Returns a fresh RGBA canvas the same size as `source`.
 */
export async function applyClipMask(
  source: HTMLCanvasElement,
  mask: HTMLCanvasElement,
): Promise<HTMLCanvasElement> {
  const width = source.width;
  const height = source.height;

  const stage = new fabric.StaticCanvas(undefined, {
    width,
    height,
    enableRetinaScaling: false,
    renderOnAddRemove: false,
  });

  try {
    const base = new fabric.FabricImage(source, {
      left: 0,
      top: 0,
      originX: "left",
      originY: "top",
      objectCaching: false,
    });

    const clip = new fabric.FabricImage(mask, {
      left: 0,
      top: 0,
      originX: "left",
      originY: "top",
      scaleX: width / mask.width,
      scaleY: height / mask.height,
      absolutePositioned: true,
      objectCaching: false,
    });
    base.clipPath = clip;

    stage.add(base);
    stage.renderAll();

    return stage.toCanvasElement(1, { left: 0, top: 0, width, height });
  } finally {
    stage.dispose();
  }
}
