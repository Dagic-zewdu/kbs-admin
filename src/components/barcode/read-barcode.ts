/** Reads a barcode from a video frame: the browser's own reader where there is one (Android, Chrome), else ZXing (iPhone, Firefox). */
export type FrameReader = (video: HTMLVideoElement) => Promise<string | null>;

const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf"];

interface NativeDetector {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
}
interface NativeDetectorClass {
  new (options: { formats: string[] }): NativeDetector;
  getSupportedFormats: () => Promise<string[]>;
}

const nativeReader = async (): Promise<FrameReader | null> => {
  const Detector = (window as { BarcodeDetector?: NativeDetectorClass }).BarcodeDetector;
  if (!Detector) return null;
  try {
    const supported = await Detector.getSupportedFormats();
    if (!supported.includes("ean_13")) return null;
    const detector = new Detector({ formats: FORMATS.filter((format) => supported.includes(format)) });
    return async (video) => (await detector.detect(video))[0]?.rawValue ?? null;
  } catch {
    return null;
  }
};

const zxingReader = async (): Promise<FrameReader> => {
  // Loaded only when needed: it's a big library
  const { BarcodeFormat, BinaryBitmap, DecodeHintType, HybridBinarizer, MultiFormatReader, RGBLuminanceSource } = await import("@zxing/library");
  const reader = new MultiFormatReader();
  reader.setHints(
    new Map<number, unknown>([
      [
        DecodeHintType.POSSIBLE_FORMATS,
        [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.ITF,
        ],
      ],
      [DecodeHintType.TRY_HARDER, true],
    ]),
  );
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  return async (video) => {
    if (!context || !video.videoWidth) return null;
    // The middle of the picture, where the frame is drawn
    const width = Math.min(1000, video.videoWidth);
    const height = Math.round((width * video.videoHeight * 0.6) / video.videoWidth);
    canvas.width = width;
    canvas.height = height;
    context.drawImage(video, 0, video.videoHeight * 0.2, video.videoWidth, video.videoHeight * 0.6, 0, 0, width, height);
    const { data } = context.getImageData(0, 0, width, height);
    const gray = new Uint8ClampedArray(width * height);
    for (let pixel = 0; pixel < gray.length; pixel++) {
      const at = pixel * 4;
      gray[pixel] = (data[at] * 306 + data[at + 1] * 601 + data[at + 2] * 117) >> 10;
    }
    try {
      return reader.decode(new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(gray, width, height)))).getText();
    } catch {
      return null; // nothing readable in this frame
    } finally {
      reader.reset();
    }
  };
};

export const createFrameReader = async () => (await nativeReader()) ?? zxingReader();
