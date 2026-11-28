/**
 * Two readers look at the camera side by side and the first sure answer wins:
 * the browser's own (Android, Chrome) and ZXing in a worker (every browser).
 * One of them failing doesn't stop the other.
 */
interface Found {
  code: string;
  /** Needs more equal reads: the code has no check digit that catches a wrong read */
  isWeak: boolean;
}

interface NativeDetector {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue: string; format: string }[]>;
}
interface NativeDetectorClass {
  new (options: { formats: string[] }): NativeDetector;
  getSupportedFormats: () => Promise<string[]>;
}

const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf"];
const WEAK_FORMATS = /^(code_?39|itf)/i;
/** Equal reads needed, so a blurred frame can't give a wrong number */
const SURE_AFTER = 2;
const WEAK_SURE_AFTER = 4;
/** A native reader that fails this often is broken on this device */
const MAX_NATIVE_FAILURES = 5;
/** A frame without an answer is given up after this long */
const WORKER_TIMEOUT_MS = 8000;

const toFound = (code: string, format: string): Found => ({ code: code.trim(), isWeak: WEAK_FORMATS.test(format) });
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createNative = async () => {
  const Detector = (window as { BarcodeDetector?: NativeDetectorClass }).BarcodeDetector;
  if (!Detector) return null;
  try {
    const supported = await Detector.getSupportedFormats();
    if (!supported.includes("ean_13")) return null;
    return new Detector({ formats: FORMATS.filter((format) => supported.includes(format)) });
  } catch {
    return null;
  }
};

export const createWorker = (gs1 = false) => {
  const worker = new Worker(new URL("./barcode-worker.ts", import.meta.url), { type: "module" });
  const waiting = new Map<number, (found: Found | null) => void>();
  let lastId = 0;
  let hasFailed = false;
  const fail = () => {
    hasFailed = true;
    waiting.forEach((resolve) => resolve(null));
    waiting.clear();
  };
  worker.onerror = fail;
  worker.onmessage = ({ data }: MessageEvent<{ id: number; code?: string; format?: string; error?: string }>) => {
    if (data.error) console.error("Barcode reader:", data.error);
    waiting.get(data.id)?.(data.code ? toFound(data.code, data.format ?? "") : null);
    waiting.delete(data.id);
  };
  return {
    read: (image: ImageData) =>
      new Promise<Found | null>((resolve) => {
        if (hasFailed) return resolve(null);
        const id = ++lastId;
        waiting.set(id, resolve);
        setTimeout(() => {
          if (waiting.delete(id)) resolve(null);
        }, WORKER_TIMEOUT_MS);
        worker.postMessage({ id, image, gs1 }, [image.data.buffer]);
      }),
    hasFailed: () => hasFailed,
    stop: () => {
      fail();
      worker.terminate();
    },
  };
};

type Reader = ReturnType<typeof createWorker>;

/** Parts of the picture, tried in turn: the middle at full sharpness, everything made smaller, the centre enlarged for tiny or soft bars */
const VIEWS = [
  { width: 0.8, height: 0.5, maxSize: 1920, enlarge: 1 },
  { width: 1, height: 1, maxSize: 1280, enlarge: 1 },
  { width: 0.4, height: 0.3, maxSize: 1920, enlarge: 2.5 },
];

const grab = (canvas: HTMLCanvasElement, source: CanvasImageSource, width: number, height: number, view: (typeof VIEWS)[number]) => {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context || !width || !height) return null;
  // The long side of the frame on screen goes across, also when the phone is upright
  const cropWidth = Math.round(width * (height > width ? Math.min(1, view.width * 1.2) : view.width));
  const cropHeight = Math.round(height * view.height);
  const scale = Math.min(view.enlarge, view.maxSize / Math.max(cropWidth, cropHeight));
  canvas.width = Math.round(cropWidth * scale);
  canvas.height = Math.round(cropHeight * scale);
  context.imageSmoothingQuality = "high";
  context.drawImage(source, (width - cropWidth) / 2, (height - cropHeight) / 2, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
  return context.getImageData(0, 0, canvas.width, canvas.height);
};

/** The same code again this soon is the same product still in front of the camera */
const REPEAT_AFTER_MS = 2000;

/**
 * Loads while the camera opens. `watch` calls back with a sure read: once,
 * or with `continuous` for every product, one after another, until stopped.
 */
export const createScanner = () => {
  const reader: Reader = createWorker();
  const native = createNative();
  let isStopped = false;

  const watch = (video: HTMLVideoElement, onCode: (code: string) => void, options: { continuous?: boolean } = {}) => {
    const seen = new Map<string, number>();
    const lastReported = { code: "", at: 0 };
    const report = (found: Found | null) => {
      if (!found?.code || isStopped) return;
      // A 12-digit UPC is the same code as the EAN with a leading 0: the two readers name it differently
      const code = /^\d{12}$/.test(found.code) ? `0${found.code}` : found.code;
      if (options.continuous && code === lastReported.code && Date.now() - lastReported.at < REPEAT_AFTER_MS) {
        // Still the same product: wait until it's been away a moment
        lastReported.at = Date.now();
        return;
      }
      const times = (seen.get(code) ?? 0) + 1;
      seen.set(code, times);
      if (times >= (found.isWeak ? WEAK_SURE_AFTER : SURE_AFTER)) {
        if (!options.continuous) isStopped = true;
        // Next product starts counting from zero
        seen.clear();
        lastReported.code = code;
        lastReported.at = Date.now();
        onCode(code);
      }
    };

    const runNative = async () => {
      const detector = await native;
      let failures = 0;
      while (detector && !isStopped && failures < MAX_NATIVE_FAILURES) {
        try {
          const [found] = await detector.detect(video);
          failures = 0;
          report(found ? toFound(found.rawValue, found.format) : null);
        } catch {
          failures += 1;
        }
        await wait(50);
      }
    };
    const runWorker = async () => {
      const canvas = document.createElement("canvas");
      for (let turn = 0; !isStopped && !reader.hasFailed(); turn++) {
        const image = grab(canvas, video, video.videoWidth, video.videoHeight, VIEWS[turn % VIEWS.length]);
        if (image) report(await reader.read(image));
        await wait(image ? 15 : 100);
      }
    };
    runNative();
    runWorker();
  };

  return {
    watch,
    stop: () => {
      isStopped = true;
      reader.stop();
    },
  };
};

/** Reads a photo, for when the live camera can't see the bars sharply enough */
export const readPhoto = async (file: File) => {
  const reader = createWorker();
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    for (const view of VIEWS) {
      const image = grab(canvas, bitmap, bitmap.width, bitmap.height, view);
      const found = image && (await reader.read(image));
      if (found) return found.code;
    }
    return null;
  } finally {
    reader.stop();
  }
};
