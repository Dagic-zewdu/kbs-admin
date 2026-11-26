/** Reads barcodes off the page's thread, so the camera picture never stutters. ZXing in C++ (WebAssembly). */
import { prepareZXingModule, readBarcodes } from "zxing-wasm/reader";

const wasmUrl = new URL("zxing-wasm/reader/zxing_reader.wasm", import.meta.url).href;
// Served by us: the default is a public CDN
const ready = prepareZXingModule({ overrides: { locateFile: () => wasmUrl }, fireImmediately: true });

const scope = self as unknown as {
  onmessage: (event: MessageEvent<{ id: number; image: ImageData; gs1?: boolean }>) => void;
  postMessage: (message: { id: number; code?: string; format?: string; error?: string }) => void;
};

scope.onmessage = async ({ data: { id, image, gs1 } }) => {
  try {
    await ready;
    const [found] = await readBarcodes(image, {
      // gs1: 2D codes that can carry the expiry date, read with their (17) data
      formats: gs1 ? ["DataMatrix", "QRCode"] : ["EAN13", "EAN8", "UPCA", "UPCE", "Code128", "Code39", "ITF"],
      maxNumberOfSymbols: 1,
      tryHarder: true,
      tryInvert: false,
      textMode: gs1 ? "HRI" : "Plain",
    });
    scope.postMessage({ id, code: found?.text || undefined, format: found?.format });
  } catch (error) {
    scope.postMessage({ id, error: String(error) });
  }
};
