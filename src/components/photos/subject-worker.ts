/** Finds the product in a small camera frame, off the page's thread: u2netp (Apache 2.0, 4.7 MB) on ONNX Runtime */
import * as ort from "onnxruntime-web/wasm";

ort.env.wasm.wasmPaths = `/ort/${ort.env.versions.web}/`;
ort.env.wasm.numThreads = 1;

export const SUBJECT_SIZE = 320;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

export interface SubjectResult {
  /** Share of the frame that is the product */
  area: number;
  /** Its box, 0–1 of the frame */
  box: { left: number; top: number; right: number; bottom: number } | null;
}

const session = ort.InferenceSession.create("/models/u2netp.onnx", { executionProviders: ["wasm"] });

const scope = self as unknown as {
  onmessage: (event: MessageEvent<{ id: number; image: ImageData }>) => void;
  postMessage: (message: { id: number; result?: SubjectResult; error?: string }) => void;
};

scope.onmessage = async ({ data: { id, image } }) => {
  try {
    const model = await session;
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
