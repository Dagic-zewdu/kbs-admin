"use client";

import clsx from "clsx";
import { Loader2, Sparkles, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api-error";
import { useOptimizePhotoMutation } from "@/store/api/products.api";
import type { ProductPhoto } from "@/types/product";
import { ZoomImage } from "./zoom-image";

interface PhotoViewerProps {
  photo: ProductPhoto;
  label: string;
  /** Saved product: it uses the optimized copy right away */
  productId?: string;
  onOptimized: (photo: ProductPhoto) => void;
  onClose: () => void;
}

/** A photo big, to read its labels, with Optimize image. Original and optimized are both kept and shown. */
export function PhotoViewer({ photo, label, productId, onOptimized, onClose }: PhotoViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [shown, setShown] = useState<"current" | "original">("current");
  const [optimize, { isLoading, error, reset }] = useOptimizePhotoMutation();
  const [notice, setNotice] = useState("");
  const isOptimized = Boolean(photo.original);
  const src = shown === "original" && photo.original ? photo.original.url : photo.url;

  useEffect(() => {
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
  }, []);

  const run = async () => {
    reset();
    setNotice("");
    const result = await optimize({ fileId: photo.fileId, productId });
    if (!result.data) return;
    const { photo: made, original } = result.data.data;
    onOptimized({ fileId: made.fileId, url: made.url, original: { fileId: original.fileId, url: original.url } });
    setShown("current");
    setNotice(`Optimized: ${Math.round(made.size / 1024)} KB. ${productId ? "The product now shows it." : "Save the product to keep it."} The original is kept.`);
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!isLoading) onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current && !isLoading) onClose();
      }}
      className="m-auto h-dvh max-h-none w-screen max-w-none bg-white p-0 backdrop:bg-gray-900/60 sm:h-[90dvh] sm:w-[calc(100%-2rem)] sm:max-w-3xl sm:rounded-xl"
    >
      <div className="flex h-full flex-col gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="min-w-0 truncate text-base font-semibold text-gray-900">
            {label}
          </h2>
          <button type="button" onClick={onClose} disabled={isLoading} aria-label="Close" className="flex size-10 shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100">
            <X className="size-5" />
          </button>
        </div>

        {isOptimized && (
          <div role="tablist" aria-label="Which photo" className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1 text-sm font-medium">
            {(["current", "original"] as const).map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={shown === item}
                onClick={() => setShown(item)}
                className={clsx("min-h-9 rounded-md", shown === item ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900")}
              >
                {item === "current" ? "Optimized (shown on the product)" : "Original"}
              </button>
            ))}
          </div>
        )}

        <div className="relative min-h-0 flex-1">
          <ZoomImage key={src} src={src} alt={label} />
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-white/80 text-sm text-gray-700">
              <Loader2 className="size-7 animate-spin text-brand-600" aria-hidden />
              Optimizing… about 10 seconds
            </div>
          )}
        </div>

        {error && <Alert>{getErrorMessage(error)}</Alert>}
        {notice && <Alert type="success">{notice}</Alert>}
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">Hover to magnify, scroll or pinch to zoom, drag to move.</p>
          <Button type="button" onClick={run} isLoading={isLoading}>
            <Sparkles className="size-4" aria-hidden /> {isOptimized ? "Optimize again" : "Optimize image"}
          </Button>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
