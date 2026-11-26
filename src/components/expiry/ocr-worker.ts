/** Reads the text on a package, off the page's thread. PaddleOCR v6 on ONNX Runtime, all served by this site. */
import * as ort from "onnxruntime-web/wasm";
import { PaddleOcrService } from "ppu-paddle-ocr/web";

export type OcrModel = "fast" | "accurate";

ort.env.wasm.wasmPaths = `/ort/${ort.env.versions.web}/`;
// One thread: no special server headers needed, and phones stay cool
ort.env.wasm.numThreads = 1;

const MODELS: Record<OcrModel, { detection: string; recognition: string; charactersDictionary: string }> = {
  fast: { detection: "/ocr/v6/PP-OCRv6_tiny_det.ort", recognition: "/ocr/v6/PP-OCRv6_tiny_rec.ort", charactersDictionary: "/ocr/v6/ppocrv6_tiny_dict.txt" },
  accurate: { detection: "/ocr/v6/PP-OCRv6_small_det.ort", recognition: "/ocr/v6/PP-OCRv6_small_rec.ort", charactersDictionary: "/ocr/v6/ppocrv6_dict.txt" },
};

const services = new Map<OcrModel, Promise<PaddleOcrService>>();
const serviceOf = (model: OcrModel) => {
  if (!services.has(model)) {
    services.set(
      model,
      (async () => {
        const service = new PaddleOcrService({ model: MODELS[model], session: { executionProviders: ["wasm"] } });
        await service.initialize();
        return service;
      })(),
    );
  }
  return services.get(model)!;
};

const scope = self as unknown as {
  onmessage: (event: MessageEvent<{ id: number; image?: ImageData; model: OcrModel; warmUp?: boolean }>) => void;
  postMessage: (message: { id: number; text?: string; error?: string }) => void;
};

scope.onmessage = async ({ data: { id, image, model, warmUp } }) => {
  try {
    const service = await serviceOf(model);
    if (warmUp || !image) return scope.postMessage({ id, text: "" });
    const canvas = new OffscreenCanvas(image.width, image.height);
    canvas.getContext("2d")!.putImageData(image, 0, 0);
    const result = await service.recognize(canvas as unknown as HTMLCanvasElement);
    scope.postMessage({ id, text: result.text ?? "" });
  } catch (error) {
    scope.postMessage({ id, error: String(error) });
  }
};
