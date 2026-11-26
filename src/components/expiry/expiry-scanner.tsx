"use client";

import { Camera, Flashlight, Loader2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cameraError, keepFocusing, openCamera, savedCamera } from "@/components/barcode/camera";
import { Button } from "@/components/ui/button";
import { addMonths, type DateFound } from "@/lib/expiry-date";
import { formatDay } from "@/lib/labels";
import { createDateScanner, readDatePhoto } from "./read-date";

const SHELF_LIVES = [12, 18, 24, 30, 36];
const HELP_AFTER_MS = 8000;

interface ExpiryScannerProps {
  onUse: (date: string) => void;
  onClose: () => void;
}

/** Point the camera at the printed date. Nothing is filled in until it's confirmed. */
export function ExpiryScanner({ onUse, onClose }: ExpiryScannerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const titleId = useId();
  const [attempt, setAttempt] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isLoadingReader, setIsLoadingReader] = useState(true);
  const [error, setError] = useState("");
  const [found, setFound] = useState<DateFound | null>(null);
  const [needsHelp, setNeedsHelp] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isReadingPhoto, setIsReadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");

  useEffect(() => {
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    let isStopped = false;
    let stream: MediaStream | undefined;
    let helpTimer: ReturnType<typeof setTimeout>;
    const scanner = createDateScanner();
    scanner.ready.then(() => !isStopped && setIsLoadingReader(false));

    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("No camera access");
        const opened = await openCamera(savedCamera());
        if (isStopped) return opened.getTracks().forEach((track) => track.stop());
        stream = opened;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        if (isStopped) return;
        const track = stream.getVideoTracks()[0];
        trackRef.current = track;
        setHasTorch(Boolean((track.getCapabilities?.() as { torch?: boolean } | undefined)?.torch));
        setIsReady(true);
        keepFocusing(track);
        helpTimer = setTimeout(() => setNeedsHelp(true), HELP_AFTER_MS);
        scanner.watch(video, (date) => {
          navigator.vibrate?.(80);
          setFound(date);
        });
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
  }, [attempt]);

  const scanAgain = () => {
    setFound(null);
    setNeedsHelp(false);
    setIsReady(false);
    setAttempt((value) => value + 1);
  };

  const toggleTorch = async () => {
    try {
      await trackRef.current?.applyConstraints({ advanced: [{ torch: !isTorchOn } as MediaTrackConstraintSet] });
      setIsTorchOn(!isTorchOn);
    } catch {
      setHasTorch(false);
    }
  };

  const takePhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoError("");
    setIsReadingPhoto(true);
    const date = await readDatePhoto(file).catch(() => null);
    setIsReadingPhoto(false);
    if (date) setFound(date);
    else setPhotoError("No date was found in the photo. Take it closer, sharp and in good light, or type the date.");
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
            Scan the expiry date
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-11 items-center justify-center rounded-lg hover:bg-white/10">
            <X className="size-5" />
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden bg-black sm:aspect-[4/3] sm:flex-none">
          <video ref={videoRef} muted playsInline className="absolute inset-0 size-full object-cover" />
          {isReady && !found && (
            <div className="pointer-events-none absolute inset-x-[5%] top-1/2 h-[22%] -translate-y-1/2 rounded-xl border-2 border-white/90 shadow-[0_0_0_100vmax_rgba(0,0,0,0.45)]" />
          )}
          {!isReady && !error && !found && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="size-8 animate-spin" aria-label="Opening the camera" />
            </div>
          )}
          {error && !found && (
            <p role="alert" className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm">
              {error}
            </p>
          )}
          {found && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-950/85 p-4">
              <Result found={found} onUse={onUse} onAgain={scanAgain} />
            </div>
          )}
        </div>

        <div className="space-y-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-sm">
          {!found && (
            <p aria-live="polite" className="text-center">
              {photoError ||
                (isLoadingReader && isReady
                  ? "Getting the reader ready…"
                  : isReady && needsHelp
                    ? "Not read yet? Hold it closer, straight, with good light, until the date looks sharp. Or use a photo."
                    : isReady && "Hold the date inside the frame. It's read automatically.")}
            </p>
          )}
          <div className="flex items-center justify-center gap-3">
            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-white/15 px-4 font-medium hover:bg-white/25 focus-within:ring-2 focus-within:ring-white">
              {isReadingPhoto ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Camera className="size-5" aria-hidden />}
              {isReadingPhoto ? "Reading the photo…" : "Use a photo"}
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
      </div>
    </dialog>
  );
}

/** What was read, checked by a person before it is used */
function Result({ found, onUse, onAgain }: { found: DateFound; onUse: (date: string) => void; onAgain: () => void }) {
  const [months, setMonths] = useState<number | null>(null);
  const againButton = (
    <Button type="button" variant="secondary" onClick={onAgain} className="w-full">
      Scan again
    </Button>
  );

  if (found.kind === "manufactured") {
    const expiry = months ? addMonths(found.date, months) : null;
    return (
      <div role="status" className="w-full max-w-sm space-y-4 rounded-xl bg-white p-4 text-gray-900">
        <p className="text-sm text-gray-600">Only the manufacturing date was found:</p>
        <p className="text-2xl font-semibold">Made {formatDay(found.date)}</p>
        <fieldset>
          <legend className="text-sm font-medium text-gray-700">How long does it last? (see the package)</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {SHELF_LIVES.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={months === value}
                onClick={() => setMonths(value)}
                className={`min-h-10 rounded-full border px-3 text-sm ${months === value ? "border-brand-600 bg-brand-600 text-white" : "border-gray-300 hover:border-brand-300"}`}
              >
                {value} months
              </button>
            ))}
          </div>
        </fieldset>
        {expiry && (
          <p className="text-sm">
            Expires <strong className="text-base font-semibold">{formatDay(expiry)}</strong>
          </p>
        )}
        <div className="grid gap-2">
          <Button type="button" disabled={!expiry} onClick={() => expiry && onUse(expiry)} className="w-full">
            Use this date
          </Button>
          {againButton}
        </div>
      </div>
    );
  }

  return (
    <div role="status" className="w-full max-w-sm space-y-4 rounded-xl bg-white p-4 text-gray-900">
      <p className="text-sm text-gray-600">{found.swapped ? "The day and month can be read both ways. Which one is on the package?" : "Check it against the package:"}</p>
      {found.swapped ? (
        <div className="grid gap-2">
          {[found.date, found.swapped].map((date) => (
            <Button key={date} type="button" variant="secondary" onClick={() => onUse(date)} className="h-14! w-full text-lg font-semibold">
              {formatDay(date)}
            </Button>
          ))}
        </div>
      ) : (
        <>
          <p className="text-3xl font-semibold">{formatDay(found.date)}</p>
          {found.isMonthOnly && <p className="text-sm text-gray-600">Only the month is printed, so the last day of it is used.</p>}
          <Button type="button" onClick={() => onUse(found.date)} className="w-full">
            Use this date
          </Button>
        </>
      )}
      {againButton}
    </div>
  );
}
