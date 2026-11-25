"use client";

import { Flashlight, Loader2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createFrameReader } from "./read-barcode";

interface ScannerDialogProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

const cameraError = (error: unknown) => {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError") return "The camera is blocked. Allow it for this site in the browser's settings, or type the barcode.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No camera was found. Type the barcode instead.";
  if (name === "NotReadableError") return "Another app is using the camera. Close it and try again.";
  return "The camera can't be opened here. Type the barcode instead.";
};

/** Opens the camera and reads the barcode by itself. Mount it only while it's open. */
export function ScannerDialog({ onScan, onClose }: ScannerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const onScanRef = useRef(onScan);
  const titleId = useId();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  useEffect(() => {
    onScanRef.current = onScan;
  });

  useEffect(() => {
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
    let isStopped = false;
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setTimeout>;

    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("No camera access");
        const opened = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        // Closed while the permission question was open
        if (isStopped) return opened.getTracks().forEach((track) => track.stop());
        stream = opened;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        const track = stream.getVideoTracks()[0];
        trackRef.current = track;
        setHasTorch(Boolean((track.getCapabilities?.() as { torch?: boolean } | undefined)?.torch));
        setIsReady(true);

        const read = await createFrameReader();
        let last = "";
        const look = async () => {
          if (isStopped) return;
          const code = await read(video).catch(() => null);
          if (isStopped) return;
          // Two equal reads in a row, so a blurred frame can't give a wrong number
          if (code && code === last) {
            navigator.vibrate?.(80);
            return onScanRef.current(code);
          }
          if (code) last = code;
          timer = setTimeout(look, 120);
        };
        look();
      } catch (problem) {
        if (!isStopped) setError(cameraError(problem));
      }
    };
    start();

    return () => {
      isStopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

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
      className="m-auto h-dvh max-h-none w-screen max-w-none overflow-hidden bg-gray-950 p-0 text-white sm:h-auto sm:max-h-[90dvh] sm:w-[calc(100%-2rem)] sm:max-w-lg sm:rounded-xl"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <h2 id={titleId} className="text-base font-semibold">
            Scan barcode
          </h2>
          <button type="button" onClick={onClose} aria-label="Close scanner" className="flex size-11 items-center justify-center rounded-lg hover:bg-white/10">
            <X className="size-5" />
          </button>
        </div>
        <div className="relative flex-1 bg-black sm:aspect-[4/3] sm:flex-none">
          <video ref={videoRef} muted playsInline className="absolute inset-0 size-full object-cover" />
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
        <div className="flex min-h-16 items-center justify-center gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-sm">
          {isReady && <span>Hold the barcode inside the frame. It&apos;s read automatically.</span>}
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
    </dialog>
  );
}
