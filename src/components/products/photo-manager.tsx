"use client";

import { FadeImage } from "@/components/ui/fade-image";
import { ArrowLeft, ArrowRight, Camera, Loader2, Sparkles, Trash2, Upload } from "lucide-react";
import { PhotoViewer } from "@/components/photos/photo-viewer";
import { ProductCamera } from "@/components/photos/product-camera";
import { useId, useRef, useState } from "react";
import { getErrorMessage } from "@/lib/api-error";
import { resizeImage } from "@/lib/resize-image";
import { useUploadProductPhotoMutation } from "@/store/api/products.api";
import { MAX_PHOTOS, type ProductPhoto } from "@/types/product";

interface PhotoManagerProps {
  photos: ProductPhoto[];
  /** Gets the change as a function, because uploads finish while other photos change */
  onChange: (update: (photos: ProductPhoto[]) => ProductPhoto[]) => void;
  onUploading: (isUploading: boolean) => void;
  /** Saved product: an optimized photo is used right away */
  productId?: string;
  /** The photo was replaced on the server already: nothing new to save */
  onSaved?: (update: (photos: ProductPhoto[]) => ProductPhoto[]) => void;
}

/** Up to 8 photos. The first is the main photo; the arrows change the order. */
export function PhotoManager({ photos, onChange, onUploading, productId, onSaved }: PhotoManagerProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [remaining, setRemaining] = useState(0);
  const [message, setMessage] = useState("");
  const [upload] = useUploadProductPhotoMutation();
  const [viewing, setViewing] = useState<string | null>(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const viewed = photos.find((photo) => photo.fileId === viewing);
  const viewedIndex = viewed ? photos.indexOf(viewed) : -1;
  const room = MAX_PHOTOS - photos.length;
  const isUploading = remaining > 0;

  const add = async (files: File[]) => {
    if (inputRef.current) inputRef.current.value = "";
    if (!files.length || isUploading) return;
    const chosen = files.slice(0, room);
    const problems: string[] = [];
    if (files.length > room) problems.push(`Only ${MAX_PHOTOS} photos are allowed, so some were left out.`);
    setMessage("");
    setRemaining(chosen.length);
    onUploading(true);

    for (const file of chosen) {
      try {
        const result = await upload(await resizeImage(file));
        if (result.data) {
          const { id, url } = result.data.data;
          onChange((current) => [...current, { fileId: id, url }]);
        } else problems.push(`${file.name}: ${getErrorMessage(result.error)}`);
      } catch {
        problems.push(`${file.name} can't be read. Use a JPEG, PNG or WebP photo.`);
      }
      setRemaining((count) => count - 1);
    }
    setRemaining(0);
    onUploading(false);
    setMessage(problems.join(" "));
  };

  const move = (index: number, step: 1 | -1) =>
    onChange((current) => {
      const next = [...current];
      [next[index], next[index + step]] = [next[index + step], next[index]];
      return next;
    });

  const buttonClasses =
    "flex size-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className="space-y-2">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {photos.map((photo, index) => (
          <li key={photo.fileId} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="relative aspect-square bg-gray-50">
              <button type="button" onClick={() => setViewing(photo.fileId)} aria-label={`Open photo ${index + 1}`} className="block size-full cursor-zoom-in">
                <FadeImage src={photo.url} alt={`Photo ${index + 1}`} className="size-full" />
              </button>
              {index === 0 && (
                <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">Main</span>
              )}
              {photo.original && (
                <span className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-emerald-700 shadow-sm">
                  <Sparkles className="size-3" aria-hidden /> Optimized
                </span>
              )}
            </div>
            <div className="flex justify-between border-t border-gray-100">
              <button type="button" className={buttonClasses} aria-label={`Move photo ${index + 1} earlier`} disabled={index === 0} onClick={() => move(index, -1)}>
                <ArrowLeft className="size-4" />
              </button>
              <button
                type="button"
                className={`${buttonClasses} hover:bg-red-50 hover:text-red-700`}
                aria-label={`Remove photo ${index + 1}`}
                onClick={() => onChange((current) => current.filter((item) => item.fileId !== photo.fileId))}
              >
                <Trash2 className="size-4" />
              </button>
              <button
                type="button"
                className={buttonClasses}
                aria-label={`Move photo ${index + 1} later`}
                disabled={index === photos.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowRight className="size-4" />
              </button>
            </div>
          </li>
        ))}
        {room > 0 && (
          <li className="grid min-h-36 gap-2">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => setIsTakingPhoto(true)}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50/40 p-3 text-center text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="size-6 animate-spin" aria-hidden /> : <Camera className="size-6" aria-hidden />}
              {isUploading ? `Uploading ${remaining}…` : "Take a photo"}
            </button>
            <label
              htmlFor={inputId}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                add([...event.dataTransfer.files]);
              }}
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-300 p-2 text-center text-sm font-medium text-gray-700 focus-within:border-brand-500 hover:border-brand-300 hover:bg-brand-50/40"
            >
              <Upload className="size-4" aria-hidden /> Upload photos
              <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept="image/*"
                multiple
                disabled={isUploading}
                className="sr-only"
                onChange={(event) => add([...(event.target.files ?? [])])}
              />
            </label>
          </li>
        )}
      </ul>
      <p className="text-xs text-gray-500">
        {photos.length} of {MAX_PHOTOS} photos. At least 1 is needed to go live.
      </p>
      {message && <p className="text-sm text-red-600">{message}</p>}
      {viewed && (
        <PhotoViewer
          photo={viewed}
          label={`Photo ${viewedIndex + 1}${viewedIndex === 0 ? " (main)" : ""}`}
          productId={productId}
          onClose={() => setViewing(null)}
          onOptimized={(made) => {
            const replace = (current: ProductPhoto[]) => current.map((item) => (item.fileId === viewed.fileId ? made : item));
            if (productId && onSaved) onSaved(replace);
            else onChange(replace);
            setViewing(made.fileId);
          }}
        />
      )}
      {isTakingPhoto && (
        <ProductCamera
          onClose={() => setIsTakingPhoto(false)}
          onPhoto={(file) => {
            setIsTakingPhoto(false);
            add([file]);
          }}
        />
      )}
    </div>
  );
}
