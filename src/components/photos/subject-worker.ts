/**
 * Finds the product in a small camera frame, off the page's thread: u2netp (Apache 2.0, 4.7 MB) on ONNX Runtime.
 * On the phone's graphics chip (WebGPU) when it has one: many times a second. Otherwise on the processor, about once a second.
 * The model was opened up to take any frame size; 192 px finds the same box as 320 px (within 2%) 2.6 times faster.
 */
import type { InferenceSession } from "onnxruntime-web";

export const SUBJECT_SIZE = 192;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

export interface SubjectResult {
  /** Share of the frame that is the product */
  area: number;
  /** Its box, 0–1 of the frame */
  box: { left: number; top: number; right: number; bottom: number } | null;
}

const MODEL = "/models/u2netp-any.onnx";

type Ort = typeof import("onnxruntime-web/wasm");
const start = async (): Promise<{ ort: Ort; model: InferenceSession }> => {
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
  if (gpu && (await gpu.requestAdapter().catch(() => null))) {
    try {
      const ort = (await import("onnxruntime-web/webgpu")) as Ort;
      ort.env.wasm.wasmPaths = `/ort/${ort.env.versions.web}/`;
      ort.env.wasm.numThreads = 1;
      const model = await ort.InferenceSession.create(MODEL, { executionProviders: ["webgpu"] });
      console.info("Product check: graphics chip");
      return { ort, model };
    } catch (problem) {
      console.warn("Product check: graphics chip not usable, using the processor", problem);
    }
  }
  const ort = await import("onnxruntime-web/wasm");
  ort.env.wasm.wasmPaths = `/ort/${ort.env.versions.web}/`;
  ort.env.wasm.numThreads = 1;
  const model = await ort.InferenceSession.create(MODEL, { executionProviders: ["wasm"] });
  console.info("Product check: processor");
  return { ort, model };
};
const engine = start();

const scope = self as unknown as {
  onmessage: (event: MessageEvent<{ id: number; image: ImageData }>) => void;
  postMessage: (message: { id: number; result?: SubjectResult; error?: string }) => void;
};

scope.onmessage = async ({ data: { id, image } }) => {
  try {
    const { ort, model } = await engine;
    const area = SUBJECT_SIZE * SUBJECT_SIZE;
    const input = new Float32Array(3 * area);
    for (let i = 0; i < area; i++) for (let c = 0; c < 3; c++) input[c * area + i] = (image.data[i * 4 + c] / 255 - MEAN[c]) / STD[c];
    const output = await model.run({ [model.inputNames[0]]: new ort.Tensor("float32", input, [1, 3, SUBJECT_SIZE, SUBJECT_SIZE]) });
    const mask = output[model.outputNames[0]].data as Float32Array;
    let low = Infinity;
    let high = -Infinity;
    for (const value of mask) {
      low = Math.min(low, value);
      high = Math.max(high, value);
    }
    // A flat mask means nothing stands out
    if (high - low < 0.2) return scope.postMessage({ id, result: { area: 0, box: null } });
    let count = 0;
    let left = SUBJECT_SIZE;
    let top = SUBJECT_SIZE;
    let right = -1;
    let bottom = -1;
    for (let y = 0; y < SUBJECT_SIZE; y++) {
      for (let x = 0; x < SUBJECT_SIZE; x++) {
        if ((mask[y * SUBJECT_SIZE + x] - low) / (high - low) < 0.5) continue;
        count++;
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
    const box = right < 0 ? null : { left: left / SUBJECT_SIZE, top: top / SUBJECT_SIZE, right: (right + 1) / SUBJECT_SIZE, bottom: (bottom + 1) / SUBJECT_SIZE };
    scope.postMessage({ id, result: { area: count / area, box } });
  } catch (error) {
    scope.postMessage({ id, error: String(error) });
  }
};
