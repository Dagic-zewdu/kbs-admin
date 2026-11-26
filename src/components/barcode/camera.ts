/** Opening the back camera, shared by the barcode and expiry-date scanners */

/** The camera that worked last time on this device */
const CAMERA_KEY = "scanner-camera";

export const savedCamera = () => {
  try {
    return localStorage.getItem(CAMERA_KEY);
  } catch {
    return null;
  }
};
export const saveCamera = (id: string) => {
  try {
    localStorage.setItem(CAMERA_KEY, id);
  } catch {
    // Private window: not remembered
  }
};

/** Small bars need many pixels */
const SIZE = { width: { ideal: 1920 }, height: { ideal: 1080 } };

export const openCamera = async (cameraId: string | null) => {
  const back = { facingMode: { ideal: "environment" }, ...SIZE };
  if (cameraId) {
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: false, video: { deviceId: { exact: cameraId }, ...SIZE } });
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotAllowedError") throw error;
      // Unplugged since: use the normal one
    }
  }
  return navigator.mediaDevices.getUserMedia({ audio: false, video: back });
};

/** iPhones with several lenses: only these combined cameras focus close up */
export const closeUpCamera = (cameras: MediaDeviceInfo[]) =>
  cameras.find((camera) => /back triple camera/i.test(camera.label)) ?? cameras.find((camera) => /back dual wide camera/i.test(camera.label));

export const keepFocusing = async (track: MediaStreamTrack) => {
  const modes = (track.getCapabilities?.() as { focusMode?: string[] } | undefined)?.focusMode;
  if (!modes?.includes("continuous")) return;
  await track.applyConstraints({ advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet] }).catch(() => undefined);
};

export const cameraError = (error: unknown) => {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError") return "The camera is blocked. Allow it for this site in the browser's settings, or type the barcode.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No camera was found. Type the barcode instead.";
  if (name === "NotReadableError") return "Another app is using the camera. Close it and try again.";
  return "The camera can't be opened here. Type the barcode instead.";
};

