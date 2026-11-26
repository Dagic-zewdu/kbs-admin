import { createWorker as createBarcodeWorker } from "@/components/barcode/read-barcode";
import { findExpiry, gs1Expiry, type DateFound } from "@/lib/expiry-date";
import type { OcrModel } from "./ocr-worker";

/** Tilted packages: each frame is read at the next angle */
const ANGLES = [0, 8, -8, 16, -16];
/** The same date twice, so one misread digit can't give a wrong date */
const SURE_AFTER = 2;
const READ_TIMEOUT_MS = 20000;

const createOcr = () => {
  const worker = new Worker(new URL("./ocr-worker.ts", import.meta.url), { type: "module" });
  const waiting = new Map<number, (text: string | null) => void>();
  let lastId = 0;
  let hasFailed = false;
  worker.onerror = () => {
    hasFailed = true;
    waiting.forEach((resolve) => resolve(null));
    waiting.clear();
  };
  worker.onmessage = ({ data }: MessageEvent<{ id: number; text?: string; error?: string }>) => {
    if (data.error) console.error("Date reader:", data.error);
    waiting.get(data.id)?.(data.error ? null : (data.text ?? ""));
    waiting.delete(data.id);
  };
  const send = (message: { image?: ImageData; model: OcrModel; warmUp?: boolean }) =>
    new Promise<string | null>((resolve) => {
      if (hasFailed) return resolve(null);
      const id = ++lastId;
      waiting.set(id, resolve);
      setTimeout(() => waiting.delete(id) && resolve(null), READ_TIMEOUT_MS);
      worker.postMessage({ id, ...message }, message.image ? [message.image.data.buffer] : []);
    });
  return { send, hasFailed: () => hasFailed, stop: () => worker.terminate() };
};

/** The band in the frame, turned by `angle` so the text lies flat */
const grab = (canvas: HTMLCanvasElement, source: CanvasImageSource, width: number, height: number, angle: number, band = true) => {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context || !width || !height) return null;
  const cropWidth = band ? width * 0.9 : width;
  const cropHeight = band ? Math.min(height * 0.4, cropWidth * 0.45) : height;
  const scale = Math.min(1, 1280 / cropWidth);
  canvas.width = Math.round(cropWidth * scale);
  canvas.height = Math.round(cropHeight * scale);
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.setTransform(scale, 0, 0, scale, canvas.width / 2, canvas.height / 2);
  context.rotate((angle * Math.PI) / 180);
  context.drawImage(source, -width / 2, -height / 2, width, height);
  context.setTransform(1, 0, 0, 1, 0, 0);
  return context.getImageData(0, 0, canvas.width, canvas.height);
};

const voteFor = () => {
  const votes = new Map<string, number>();
  return (found: DateFound | null) => {
    if (!found) return null;
    const key = `${found.kind}:${found.date}`;
    const count = (votes.get(key) ?? 0) + 1;
    votes.set(key, count);
    return count >= SURE_AFTER ? found : null;
  };
};

/** Starts the engine while the camera opens. `watch` calls back once, with a date read twice. */
export const createDateScanner = () => {
  const ocr = createOcr();
  const codes = createBarcodeWorker(true);
  const ready = ocr.send({ model: "fast", warmUp: true });
  let isStopped = false;

  const watch = (video: HTMLVideoElement, onDate: (found: DateFound, source: "text" | "code") => void) => {
    const vote = voteFor();
    const canvas = document.createElement("canvas");
    const finish = (found: DateFound, source: "text" | "code") => {
      if (isStopped) return;
      isStopped = true;
      onDate(found, source);
    };
    const runText = async () => {
      await ready;
      for (let turn = 0; !isStopped && !ocr.hasFailed(); turn++) {
        const image = grab(canvas, video, video.videoWidth, video.videoHeight, ANGLES[turn % ANGLES.length]);
        const text = image ? await ocr.send({ image, model: "fast" }) : null;
        const sure = vote(text ? findExpiry(text) : null);
        if (sure) finish(sure, "text");
        await new Promise((resolve) => setTimeout(resolve, image ? 30 : 150));
      }
    };
    // A GS1 2D code carries the date as data: nothing to misread
    const runCodes = async () => {
      const codeCanvas = document.createElement("canvas");
      while (!isStopped) {
        const image = grab(codeCanvas, video, video.videoWidth, video.videoHeight, 0, false);
        const found = image ? await codes.read(image) : null;
        const date = found ? gs1Expiry(found.code) : null;
        if (date) finish({ date, kind: "expiry", swapped: null, isMonthOnly: false }, "code");
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    };
    runText();
    runCodes();
  };

  return {
    ready,
    watch,
    stop: () => {
      isStopped = true;
      ocr.stop();
      codes.stop();
    },
  };
};

/** A photo, read with the bigger, more accurate model at every angle. The date seen most wins. */
export const readDatePhoto = async (file: File) => {
  const ocr = createOcr();
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const counts = new Map<string, { found: DateFound; count: number }>();
    for (const angle of ANGLES) {
      const image = grab(canvas, bitmap, bitmap.width, bitmap.height, angle, false);
      const text = image ? await ocr.send({ image, model: "accurate" }) : null;
      const found = text ? findExpiry(text) : null;
      if (!found) continue;
      const key = `${found.kind}:${found.date}`;
      const entry = counts.get(key) ?? { found, count: 0 };
      entry.count += 1;
      counts.set(key, entry);
      // Three angles agree: no need to read the rest
      if (entry.count >= 3) break;
    }
    return [...counts.values()].sort((a, b) => b.count - a.count)[0]?.found ?? null;
  } finally {
    ocr.stop();
  }
};
