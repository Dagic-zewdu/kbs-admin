"use client";

import clsx from "clsx";
import { CheckCircle2, CircleAlert, Loader2, X, XCircle } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cameraError, keepFocusing, openCamera, savedCamera } from "@/components/barcode/camera";
import { judgePhoto, measureFrame, type CheckLevel, type PhotoCheck } from "./photo-check";
import { SUBJECT_SIZE, type SubjectResult } from "./subject-worker";

const FRAME_SIZE = 160;
const FRAME_EVERY_MS = 250;

const looks: Record<CheckLevel, { icon: typeof CheckCircle2; className: string; box: string }> = {
  good: { icon: CheckCircle2, className: "bg-emerald-600 text-white", box: "border-emerald-400" },
  warning: { icon: CircleAlert, className: "bg-amber-500 text-gray-950", box: "border-amber-400" },
  bad: { icon: XCircle, className: "bg-red-600 text-white", box: "border-red-500" },
  checking: { icon: Loader2, className: "bg-white/20 text-white", box: "border-white/70" },
};

interface ProductCameraProps {
  onPhoto: (file: File) => void;
  onClose: () => void;
}

/** Takes a product photo. It says how the picture looks; the shutter always works. */
export function ProductCamera({ onPhoto, onClose }: ProductCameraProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const titleId = useId();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");
  const [subject, setSubject] = useState<SubjectResult | null>(null);
  /** Where the video really is inside its frame, measured with each result */
  const [layout, setLayout] = useState<VideoLayout | null>(null);
  const [frame, setFrame] = useState<{ sharpness: number; brightness: number } | null>(null);
  const [isTaking, setIsTaking] = useState(false);
  const check: PhotoCheck = judgePhoto(subject, frame);
  const look = looks[check.level];
  const Icon = look.icon;

  useEffect(() => {
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
    let isStopped = false;
    let stream: MediaStream | undefined;
    let frameTimer: ReturnType<typeof setInterval>;
    const worker = new Worker(new URL("./subject-worker.ts", import.meta.url), { type: "module" });

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
        keepFocusing(stream.getVideoTracks()[0]);
        setIsReady(true);

        // Sharpness and light: cheap, many times a second
        const small = document.createElement("canvas");
        small.width = FRAME_SIZE;
        small.height = FRAME_SIZE;
        const smallContext = small.getContext("2d", { willReadFrequently: true })!;
        frameTimer = setInterval(() => {
          if (!video.videoWidth) return;
          smallContext.drawImage(video, 0, 0, FRAME_SIZE, FRAME_SIZE);
          setFrame(measureFrame(smallContext.getImageData(0, 0, FRAME_SIZE, FRAME_SIZE)));
        }, FRAME_EVERY_MS);

        // The product: as often as the phone can, one frame at a time
        const model = document.createElement("canvas");
        model.width = SUBJECT_SIZE;
        model.height = SUBJECT_SIZE;
        const modelContext = model.getContext("2d", { willReadFrequently: true })!;
        let id = 0;
        const next = () => {
          if (isStopped || !video.videoWidth) return;
          modelContext.drawImage(video, 0, 0, SUBJECT_SIZE, SUBJECT_SIZE);
          const image = modelContext.getImageData(0, 0, SUBJECT_SIZE, SUBJECT_SIZE);
          worker.postMessage({ id: ++id, image }, [image.data.buffer]);
        };
        worker.onmessage = ({ data }: MessageEvent<{ result?: SubjectResult; error?: string }>) => {
          if (isStopped) return;
          if (data.result) {
            setSubject(data.result);
            setLayout(measureVideo(video));
          }
          if (data.error) console.error("Product check:", data.error);
          setTimeout(next, 100);
        };
        next();
      } catch (problem) {
        if (!isStopped) setError(cameraError(problem));
      }
    };
    start();

    return () => {
      isStopped = true;
      clearInterval(frameTimer);
      worker.terminate();
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const take = async () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    setIsTaking(true);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    setIsTaking(false);
    if (blob) onPhoto(new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" }));
  };

  const box = subject?.box;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto h-dvh max-h-none w-screen max-w-none overflow-hidden bg-gray-950 p-0 text-white sm:h-[92dvh] sm:w-[calc(100%-2rem)] sm:max-w-lg sm:rounded-xl"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <h2 id={titleId} className="text-base font-semibold">
            Take a product photo
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-11 items-center justify-center rounded-lg hover:bg-white/10">
            <X className="size-5" />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
          {/* The whole frame is shown, so the box matches what is taken */}
          <video ref={videoRef} muted playsInline className="absolute inset-0 size-full object-contain" />
          {isReady && box && layout && (
            <VideoBox layout={layout} box={box} className={look.box} />
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
          {isReady && (
            <p aria-live="polite" className={clsx("absolute inset-x-4 top-3 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium shadow-lg", look.className)}>
              <Icon className={clsx("size-5 shrink-0", check.level === "checking" && "animate-spin")} aria-hidden />
              {check.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {/* Never disabled by the check: the person decides */}
          <button
            type="button"
            onClick={take}
            disabled={!isReady || isTaking}
            aria-label="Take the photo"
            className="flex size-18 items-center justify-center rounded-full border-4 border-white/80 disabled:opacity-40"
          >
            <span className={clsx("size-14 rounded-full", check.level === "good" ? "bg-emerald-500" : "bg-white")} />
          </button>
        </div>
      </div>
    </dialog>
  );
}

interface VideoLayout {
  offsetX: number;
  offsetY: number;
  shownWidth: number;
  shownHeight: number;
}

/** The video is shown "contain": its picture sits in the middle of its frame */
const measureVideo = (video: HTMLVideoElement): VideoLayout | null => {
  if (!video.videoWidth) return null;
  const frame = video.getBoundingClientRect();
  const scale = Math.min(frame.width / video.videoWidth, frame.height / video.videoHeight);
  const shownWidth = video.videoWidth * scale;
  const shownHeight = video.videoHeight * scale;
  return { offsetX: (frame.width - shownWidth) / 2, offsetY: (frame.height - shownHeight) / 2, shownWidth, shownHeight };
};

/** The product's box, drawn where the video really is inside its frame */
function VideoBox({ layout, box, className }: { layout: VideoLayout; box: NonNullable<SubjectResult["box"]>; className: string }) {
  const { offsetX, offsetY, shownWidth, shownHeight } = layout;
  return (
    <span
      aria-hidden
      className={clsx("pointer-events-none absolute rounded-lg border-[3px] transition-all duration-300", className)}
      style={{
        left: offsetX + box.left * shownWidth,
        top: offsetY + box.top * shownHeight,
        width: (box.right - box.left) * shownWidth,
        height: (box.bottom - box.top) * shownHeight,
      }}
    />
  );
}
