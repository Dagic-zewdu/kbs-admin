"use client";

import { Camera, Flashlight, Loader2, SwitchCamera, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cameraError, closeUpCamera, keepFocusing, openCamera, saveCamera, savedCamera } from "./camera";
import { createScanner, readPhoto } from "./read-barcode";

const HELP_AFTER_MS = 6000;

interface ScannerDialogProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  title?: string;
  /** Below the camera, e.g. what was scanned so far. With it the camera stays open between scans. */
  footer?: React.ReactNode;
}

/** Opens the camera and reads the barcode by itself. Mount it only while it's open. */
export function ScannerDialog({ onScan, onClose, title = "Scan barcode", footer }: ScannerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const onScanRef = useRef(onScan);
  const hasFooterRef = useRef(Boolean(footer));
  const titleId = useId();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [cameras, setCameras] = useState<string[]>([]);
  /** Chosen with the switch button; null: the best one */
  const [cameraId, setCameraId] = useState<string | null>(null);
  const [activeCamera, setActiveCamera] = useState("");
  const [isMirrored, setIsMirrored] = useState(false);
  const [needsHelp, setNeedsHelp] = useState(false);
  const [isReadingPhoto, setIsReadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");

  useEffect(() => {
    onScanRef.current = onScan;
  });

  useEffect(() => {
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    let isStopped = false;
    let stream: MediaStream | undefined;
    let helpTimer: ReturnType<typeof setTimeout>;
    const scanner = createScanner();

    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("No camera access");
        const wanted = cameraId ?? savedCamera();
        let opened = await openCamera(wanted);
        // Names are known only once the camera is allowed
        const found = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === "videoinput");
        const better = wanted ? undefined : closeUpCamera(found);
        if (better && better.deviceId !== opened.getVideoTracks()[0].getSettings().deviceId) {
          opened.getTracks().forEach((track) => track.stop());
          opened = await openCamera(better.deviceId);
        }
        // Closed while the permission question was open
        if (isStopped) return opened.getTracks().forEach((track) => track.stop());
        stream = opened;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        if (isStopped) return;
        const track = stream.getVideoTracks()[0];
        trackRef.current = track;
        const settings = track.getSettings();
        setCameras(found.map((device) => device.deviceId));
        setActiveCamera(settings.deviceId ?? "");
        // A camera facing you is shown like a mirror, so it's easy to aim. The readers get the real picture.
        setIsMirrored(settings.facingMode ? settings.facingMode === "user" : /facetime|front|integrated|webcam/i.test(track.label));
        setHasTorch(Boolean((track.getCapabilities?.() as { torch?: boolean } | undefined)?.torch));
        setIsTorchOn(false);
        setIsReady(true);
        helpTimer = setTimeout(() => setNeedsHelp(true), HELP_AFTER_MS);
        keepFocusing(track);
        scanner.watch(
          video,
          (code) => {
            navigator.vibrate?.(80);
            if (settings.deviceId) saveCamera(settings.deviceId);
            onScanRef.current(code);
          },
          // With a list below, the camera keeps reading one product after another
          { continuous: hasFooterRef.current },
        );
      } catch (problem) {
        if (!isStopped) setError(cameraError(problem));
      }
    };
    start();

    return () => {
      isStopped = true;
      clearTimeout(helpTimer);
      scanner.stop();
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraId]);

  const switchCamera = () => {
    setIsReady(false);
    setNeedsHelp(false);
    setCameraId(cameras[(cameras.indexOf(activeCamera) + 1) % cameras.length]);
  };

  const takePhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoError("");
    setIsReadingPhoto(true);
    const code = await readPhoto(file).catch(() => null);
    setIsReadingPhoto(false);
    if (code) onScanRef.current(code);
    else setPhotoError("No barcode was found in the photo. Take it closer, sharp and in good light.");
  };

  const toggleTorch = async () => {
    try {
      await trackRef.current?.applyConstraints({ advanced: [{ torch: !isTorchOn } as MediaTrackConstraintSet] });
      setIsTorchOn(!isTorchOn);
    } catch {
      setHasTorch(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={`m-auto h-dvh max-h-none w-screen max-w-none overflow-hidden bg-gray-950 p-0 text-white sm:w-[calc(100%-2rem)] sm:max-w-lg sm:rounded-xl ${footer ? "sm:h-[90dvh]" : "sm:h-auto sm:max-h-[90dvh]"}`}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close scanner" className="flex size-11 items-center justify-center rounded-lg hover:bg-white/10">
            <X className="size-5" />
          </button>
        </div>
        <div className={`relative overflow-hidden bg-black ${footer ? "h-[38dvh] shrink-0 sm:aspect-video sm:h-auto" : "flex-1 sm:aspect-[4/3] sm:flex-none"}`}>
          <video ref={videoRef} muted playsInline className={`absolute inset-0 size-full object-cover ${isMirrored ? "-scale-x-100" : ""}`} />
          {isReady && (
            <div className="pointer-events-none absolute inset-x-8 top-1/2 h-36 -translate-y-1/2 rounded-xl border-2 border-white/90 shadow-[0_0_0_100vmax_rgba(0,0,0,0.45)]" />
          )}
          {!isReady && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="size-8 animate-spin" aria-label="Opening the camera" />
            </div>
          )}
          {error && (
            <p role="alert" className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm">
              {error}
            </p>
          )}
        </div>
        <div className="space-y-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-sm">
          <p aria-live="polite" className="text-center">
            {photoError ||
              (isReady && needsHelp
                ? "Not read yet? Hold it 15 to 25 cm away, flat, with good light, until the bars look sharp. Or use a photo."
                : isReady && "Hold the barcode inside the frame. It's read automatically.")}
          </p>
          <div className="flex items-center justify-center gap-3">
            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-white/15 px-4 font-medium hover:bg-white/25 focus-within:ring-2 focus-within:ring-white">
              {isReadingPhoto ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Camera className="size-5" aria-hidden />}
              Use a photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                disabled={isReadingPhoto}
                className="sr-only"
                onChange={(event) => {
                  takePhoto(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
            {cameras.length > 1 && (
              <button
                type="button"
                onClick={switchCamera}
                aria-label="Use another camera"
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
              >
                <SwitchCamera className="size-5" />
              </button>
            )}
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                aria-pressed={isTorchOn}
                aria-label="Light"
                className={`flex size-11 shrink-0 items-center justify-center rounded-full ${isTorchOn ? "bg-white text-gray-900" : "bg-white/15"}`}
              >
                <Flashlight className="size-5" />
              </button>
            )}
          </div>
        </div>
        {footer && <div className="flex min-h-0 flex-1 flex-col border-t border-white/10 bg-white text-gray-900">{footer}</div>}
      </div>
    </dialog>
  );
}
