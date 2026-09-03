import * as bodySegmentation from "@tensorflow-models/body-segmentation";

/**
 * MediaPipe Selfie Segmentation, loaded lazily. The wasm + tflite assets are
 * fetched from jsDelivr (pinned to the installed package version) the first
 * time a background removal runs, then the segmenter is reused.
 */
const SOLUTION_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747";

let segmenterPromise: Promise<bodySegmentation.BodySegmenter> | null = null;

function getSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = bodySegmentation
      .createSegmenter(bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation, {
        runtime: "mediapipe",
        solutionPath: SOLUTION_PATH,
        modelType: "general",
      })
      .catch((err) => {
        // allow a later retry if the first load fails (offline, blocked CDN…)
        segmenterPromise = null;
        throw err;
      });
  }
  return segmenterPromise;
}

/**
 * Run selfie segmentation on `source` and return a mask canvas the size of the
 * source: foreground (the subject) is opaque white, background is transparent.
 * Fabric.js then uses this as a clipping mask.
 */
export async function buildForegroundMask(
  source: HTMLCanvasElement | HTMLImageElement,
): Promise<HTMLCanvasElement> {
  const segmenter = await getSegmenter();
  const segmentation = await segmenter.segmentPeople(source, {
    flipHorizontal: false,
  });
  if (!segmentation.length) {
    throw new Error("Couldn't find a subject to keep");
  }

  const maskData = await bodySegmentation.toBinaryMask(
    segmentation,
    { r: 255, g: 255, b: 255, a: 255 }, // foreground -> opaque white
    { r: 0, g: 0, b: 0, a: 0 }, // background -> transparent
    false,
    0.5,
  );

  const mask = document.createElement("canvas");
  mask.width = maskData.width;
  mask.height = maskData.height;
  const ctx = mask.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");
  ctx.putImageData(maskData, 0, 0);
  return mask;
}
