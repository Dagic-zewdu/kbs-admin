import type { SubjectResult } from "./subject-worker";

export type CheckLevel = "good" | "warning" | "bad" | "checking";

export interface PhotoCheck {
  level: CheckLevel;
  message: string;
}

/** Sharpness (how much the light changes from pixel to pixel) and brightness of the middle of a small frame */
export const measureFrame = (image: ImageData) => {
  const { width, height, data } = image;
  const gray = new Float32Array(width * height);
  let sum = 0;
  for (let i = 0; i < width * height; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    sum += gray[i];
  }
  let edges = 0;
  let squares = 0;
  let count = 0;
  for (let y = Math.floor(height * 0.2); y < height * 0.8; y++) {
    for (let x = Math.floor(width * 0.2); x < width * 0.8; x++) {
      const at = y * width + x;
      const laplace = 4 * gray[at] - gray[at - 1] - gray[at + 1] - gray[at - width] - gray[at + width];
      edges += laplace;
      squares += laplace * laplace;
      count++;
    }
  }
  const mean = edges / count;
  return { sharpness: squares / count - mean * mean, brightness: sum / (width * height) };
};

/** Tuned on real KBS photos at 160 px, sharp, blurred and darkened (Notion PC3.2). White backgrounds are normal, so only a nearly white frame is too bright. */
export const BLURRY_BELOW = 150;
const DARK_BELOW = 55;
const BRIGHT_ABOVE = 248;
const NONE_BELOW = 0.03;
const SMALL_BELOW = 0.18;
const EDGE = 0.015;

/** What to tell the person holding the camera. The photo can always be taken anyway. */
export const judgePhoto = (subject: SubjectResult | null, frame: { sharpness: number; brightness: number } | null): PhotoCheck => {
  if (frame && frame.brightness < DARK_BELOW) return { level: "warning", message: "Too dark. Find more light." };
  if (frame && frame.brightness > BRIGHT_ABOVE) return { level: "warning", message: "Too bright. Move out of direct light." };
  if (!subject) return { level: "checking", message: "Looking for the product…" };
  if (subject.area < NONE_BELOW || !subject.box) return { level: "bad", message: "No product found. Point the camera at it." };
  const { left, top, right, bottom } = subject.box;
  const cutSides = [left < EDGE, top < EDGE, right > 1 - EDGE, bottom > 1 - EDGE].filter(Boolean).length;
  if (cutSides >= 2 || subject.area > 0.92) return { level: "warning", message: "Move back. Part of the product is cut off." };
  if (subject.area < SMALL_BELOW) return { level: "warning", message: "Move closer. The product is small." };
  if (frame && frame.sharpness < BLURRY_BELOW) return { level: "warning", message: "Hold still. It's blurry." };
  return { level: "good", message: "Good. Take the photo." };
};
