"use client";

import clsx from "clsx";
import { Check, CheckCircle2, CircleAlert, Loader2, RotateCcw, Sparkles, X, XCircle } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cameraError, keepFocusing, openCamera, savedCamera } from "@/components/barcode/camera";
import { getErrorMessage } from "@/lib/api-error";
import { resizeImage } from "@/lib/resize-image";
import { PhotoSizes } from "./photo-sizes";
import { useOptimizePhotoMutation, useUploadProductPhotoMutation } from "@/store/api/products.api";
import type { ProductPhoto } from "@/types/product";
import { judgePhoto, measureFrame, type CheckLevel, type PhotoCheck } from "./photo-check";
import { SUBJECT_SIZE, type Engine, type SubjectResult } from "./subject-worker";

const FRAME_SIZE = 160;
/** The shortest rest between two product checks */
const MIN_REST_MS = 150;
/** A live picture that stops for this long has frozen */
const FREEZE_MS = 250;
/** This many freezes within FREEZE_WINDOW_MS move the check off the graphics chip */
const FREEZES_TO_SWITCH = 3;
const FREEZE_WINDOW_MS = 5000;
const ENGINE_KEY = "kbs.productCheckEngine";

/** The processor once this device's graphics chip made the picture freeze, else the graphics chip */
const savedEngine = (): Engine => {
  try {
    return localStorage.getItem(ENGINE_KEY) === "cpu" ? "cpu" : "gpu";
  } catch {
    return "gpu";
  }
};
const saveEngine = (engine: Engine) => {
  try {
    localStorage.setItem(ENGINE_KEY, engine);
  } catch {
    // Private window: it is simply worked out again next time
  }
};
const FRAME_EVERY_MS = 250;

const looks: Record<CheckLevel, { icon: typeof CheckCircle2; className: string; box: string }> = {
  good: {
    icon: CheckCircle2,
    className: "bg-emerald-600 text-white",
    box: "border-emerald-400",
  },
  warning: {
    icon: CircleAlert,
    className: "bg-amber-500 text-gray-950",
    box: "border-amber-400",
  },
  bad: {
    icon: XCircle,
    className: "bg-red-600 text-white",
    box: "border-red-500",
  },
  checking: {
    icon: Loader2,
    className: "bg-white/20 text-white",
    box: "border-white/70",
  },
};

interface ProductCameraProps {
  /** The chosen photo, already uploaded: the original, or the optimized copy */
  onUse: (photo: ProductPhoto) => void;
  onClose: () => void;
}

interface Shot {
  file: File;
  preview: string;
}

/**
 * Takes a product photo. Before the shutter it says how the picture looks (the shutter always works).
 * After it, the photo is shown with Retake, Optimize and Use photo.
 */
export function ProductCamera({ onUse, onClose }: ProductCameraProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const titleId = useId();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");
  const [subject, setSubject] = useState<SubjectResult | null>(null);
  /** Where the video really is inside its frame, measured with each result */
  const [layout, setLayout] = useState<VideoLayout | null>(null);
  const [frame, setFrame] = useState<{
    sharpness: number;
    brightness: number;
  } | null>(null);
  const [isTaking, setIsTaking] = useState(false);
  /** The check runs only while aiming: it pauses once a photo is taken */
  const isPausedRef = useRef(false);
  const [shot, setShot] = useState<Shot | null>(null);
  /** The taken photo on the server, so it's uploaded once */
  const [uploaded, setUploaded] = useState<ProductPhoto | null>(null);
  const [optimized, setOptimized] = useState<(ProductPhoto & { size: number }) | null>(null);
  const [shown, setShown] = useState<"optimized" | "original">("optimized");
  const [busy, setBusy] = useState<"" | "optimizing" | "saving">("");
  const [problem, setProblem] = useState("");
  const [upload] = useUploadProductPhotoMutation();
  const [optimize] = useOptimizePhotoMutation();
  const check: PhotoCheck = judgePhoto(subject, frame);
  const look = looks[check.level];
  const Icon = look.icon;

  useEffect(() => {
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
    let isStopped = false;
    let stream: MediaStream | undefined;
    let frameTimer: ReturnType<typeof setInterval>;
    let worker: Worker | undefined;

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
        const smallContext = small.getContext("2d", {
          willReadFrequently: true,
        })!;
        frameTimer = setInterval(() => {
          if (!video.videoWidth || isPausedRef.current) return;
          smallContext.drawImage(video, 0, 0, FRAME_SIZE, FRAME_SIZE);
          setFrame(measureFrame(smallContext.getImageData(0, 0, FRAME_SIZE, FRAME_SIZE)));
        }, FRAME_EVERY_MS);

        /*
         * The product, one frame at a time. The live picture comes first:
         * the check rests at least as long as it worked, and if the picture still freezes
         * (a phone's graphics chip busy with the check), the check moves to the processor.
         */
        let engine = savedEngine();
        let sentAt = 0;
        let gotResult = false;
        /** One frame at the checker at a time, even right after a switch */
        let isChecking = false;
        const model = document.createElement("canvas");
        model.width = SUBJECT_SIZE;
        model.height = SUBJECT_SIZE;
        const modelContext = model.getContext("2d", {
          willReadFrequently: true,
        })!;
        let id = 0;
        const next = () => {
          if (isStopped || !video.videoWidth || isChecking) return;
          if (isPausedRef.current) {
            setTimeout(next, 300);
            return;
          }
          modelContext.drawImage(video, 0, 0, SUBJECT_SIZE, SUBJECT_SIZE);
          const image = modelContext.getImageData(0, 0, SUBJECT_SIZE, SUBJECT_SIZE);
          sentAt = performance.now();
          isChecking = true;
          worker?.postMessage({ id: ++id, image }, [image.data.buffer]);
        };
        const startWorker = () => {
          worker?.terminate();
          const current = new Worker(new URL("./subject-worker.ts", import.meta.url), { type: "module" });
          worker = current;
          current.postMessage({ engine });
          current.onmessage = ({ data }: MessageEvent<{ id: number; result?: SubjectResult; error?: string }>) => {
            if (isStopped || current !== worker) return;
            isChecking = false;
            if (data.result && !isPausedRef.current) {
              gotResult = true;
              setSubject(data.result);
              setLayout(measureVideo(video));
            }
            if (data.error) console.error("Product check:", data.error);
            setTimeout(next, Math.max(MIN_REST_MS, performance.now() - sentAt));
          };
        };
        startWorker();
        next();

        // Watches the live picture; ignores long gaps from a hidden tab
        if ("requestVideoFrameCallback" in video) {
          let last = performance.now();
          let freezes: number[] = [];
          const watch = () => {
            if (isStopped) return;
            const now = performance.now();
            const gap = now - last;
            last = now;
            if (engine === "gpu" && gotResult && !isPausedRef.current && gap > FREEZE_MS && gap < 2000 && document.visibilityState === "visible") {
              freezes = [...freezes.filter((at) => now - at < FREEZE_WINDOW_MS), now];
              if (freezes.length >= FREEZES_TO_SWITCH) {
                console.info("Product check: the camera picture froze, moving the check to the processor");
                engine = "cpu";
                saveEngine("cpu");
                startWorker();
                isChecking = false;
                next();
              }
            }
            video.requestVideoFrameCallback(watch);
          };
          video.requestVideoFrameCallback(watch);
        }
      } catch (problem) {
        if (!isStopped) setError(cameraError(problem));
      }
    };
    start();

    return () => {
      isStopped = true;
      clearInterval(frameTimer);
      worker?.terminate();
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
    if (!blob) return;
    isPausedRef.current = true;
    // Made upload-ready now, so the size shown is the size saved
    const file = await resizeImage(new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" }));
    setShot({ file, preview: URL.createObjectURL(file) });
  };

  const retake = () => {
    if (shot) URL.revokeObjectURL(shot.preview);
    setShot(null);
    setUploaded(null);
    setOptimized(null);
    setShown("optimized");
    setProblem("");
    setSubject(null);
    setFrame(null);
    isPausedRef.current = false;
  };

  useEffect(
    () => () => {
      if (shot) URL.revokeObjectURL(shot.preview);
    },
    [shot],
  );

  const uploadShot = async (taken: Shot) => {
    if (uploaded) return uploaded;
    const result = await upload(taken.file);
    if (!result.data) throw new Error(getErrorMessage(result.error));
    const photo = { fileId: result.data.data.id, url: result.data.data.url, size: result.data.data.size };
    setUploaded(photo);
    return photo;
  };

  const runOptimize = async () => {
    if (!shot) return;
    setBusy("optimizing");
    setProblem("");
    try {
      const original = await uploadShot(shot);
      const result = await optimize({ fileId: original.fileId });
      if (!result.data) throw new Error(getErrorMessage(result.error));
      const { photo, original: kept } = result.data.data;
      // Shown only once it has loaded, so the old picture never sits under "Optimized"
      const preload = new Image();
      preload.src = photo.url;
      await preload.decode().catch(() => undefined);
      setOptimized({
        fileId: photo.fileId,
        url: photo.url,
        size: photo.size,
        original: { fileId: kept.fileId, url: kept.url, size: kept.size },
      });
      setShown("optimized");
    } catch (failure) {
      setProblem(failure instanceof Error ? failure.message : "The photo couldn't be optimized.");
    }
    setBusy("");
  };

  const usePhoto = async () => {
    if (!shot) return;
    // Once optimized, the optimized photo is used; the Original tab is only for comparing (the original stays kept as its source)
    if (optimized) {
      return onUse(optimized);
    }
    setBusy("saving");
    setProblem("");
    try {
      onUse(await uploadShot(shot));
    } catch (failure) {
      setProblem(failure instanceof Error ? failure.message : "The photo couldn't be saved.");
      setBusy("");
    }
  };

  const reviewSrc = optimized && shown === "optimized" ? optimized.url : shot?.preview;

  const box = subject?.box;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className="m-auto h-dvh max-h-none w-screen max-w-none overflow-hidden bg-gray-950 p-0 text-white sm:h-[92dvh] sm:w-[calc(100%-2rem)] sm:max-w-lg sm:rounded-xl"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <h2 id={titleId} className="text-base font-semibold">
            {shot ? "Check the photo" : "Take a product photo"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(busy)}
            aria-label="Close"
            className="flex size-11 items-center justify-center rounded-lg hover:bg-white/10"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
          {/* The whole frame is shown, so the box matches what is taken */}
          <video ref={videoRef} muted playsInline className={clsx("absolute inset-0 size-full object-contain", shot && "invisible")} />
          {shot && (
            <div className={clsx("absolute inset-0", optimized && shown === "optimized" && "bg-white")}>
              {/* eslint-disable-next-line @next/next/no-img-element -- a local preview or a signed link */}
              <img
                src={reviewSrc}
                alt={optimized && shown === "optimized" ? "The optimized photo" : "The photo you took"}
                className="size-full object-contain"
              />
              {busy === "optimizing" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 text-sm font-medium">
                  <Loader2 className="size-8 animate-spin" aria-hidden />
                  Optimizing… about 10 seconds
                </div>
              )}
            </div>
          )}
          {!shot && isReady && box && layout && <VideoBox layout={layout} box={box} className={look.box} />}
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
          {shot && optimized && (
            <div
              role="tablist"
              aria-label="Which photo"
              className="absolute inset-x-0 top-3 mx-auto flex w-fit gap-1 rounded-full bg-gray-900/80 p-1 text-sm shadow-lg"
            >
              {(["optimized", "original"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={shown === item}
                  onClick={() => setShown(item)}
                  className={clsx("rounded-full px-3 py-1.5 font-medium", shown === item ? "bg-white text-gray-900" : "text-white hover:bg-white/10")}
                >
                  {item === "optimized" ? "Optimized" : "Original"}
                </button>
              ))}
            </div>
          )}
          {!shot && isReady && (
            <p
              aria-live="polite"
              className={clsx(
                "absolute inset-x-4 top-3 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium shadow-lg",
                look.className,
              )}
            >
              <Icon className={clsx("size-5 shrink-0", check.level === "checking" && "animate-spin")} aria-hidden />
              {check.message}
            </p>
          )}
        </div>

        {shot ? (
          <div className="max-h-[45dvh] space-y-3 overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <PhotoSizes tone="dark" original={optimized?.original?.size ?? shot.file.size} optimized={optimized?.size} />
            {problem && (
              <p role="alert" className="rounded-lg bg-red-600/90 px-3 py-2 text-sm">
                {problem}
              </p>
            )}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={retake}
                disabled={Boolean(busy)}
                className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-white/10 px-2 text-sm font-medium hover:bg-white/20 disabled:opacity-40"
              >
                <RotateCcw className="size-4" aria-hidden /> Retake
              </button>
              <button
                type="button"
                onClick={runOptimize}
                disabled={Boolean(busy) || Boolean(optimized)}
                className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-white/10 px-2 text-sm font-medium hover:bg-white/20 disabled:opacity-40"
              >
                {busy === "optimizing" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
                {optimized ? "Optimized" : "Optimize"}
              </button>
              <button
                type="button"
                onClick={usePhoto}
                disabled={Boolean(busy)}
                className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-2 text-sm font-semibold hover:bg-emerald-500 disabled:opacity-40"
              >
                {busy === "saving" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" aria-hidden />}
                {optimized ? "Use optimized photo" : "Use photo"}
              </button>
            </div>
          </div>
        ) : (
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
        )}
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
  return {
    offsetX: (frame.width - shownWidth) / 2,
    offsetY: (frame.height - shownHeight) / 2,
    shownWidth,
    shownHeight,
  };
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
