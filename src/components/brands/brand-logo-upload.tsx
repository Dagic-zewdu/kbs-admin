"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useId, useRef, useState } from "react";
import { getErrorMessage } from "@/lib/api-error";
import { useUploadBrandLogoMutation } from "@/store/api/brands.api";

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

interface BrandLogoUploadProps {
  /** The current logo, when editing */
  initialUrl?: string | null;
  /** The uploaded file id, or "" when the logo is removed */
  onChange: (fileId: string) => void;
  onUploading: (isUploading: boolean) => void;
}

/** Choose or drop an image; it's uploaded to private storage right away. */
export function BrandLogoUpload({ initialUrl, onChange, onUploading }: BrandLogoUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl ?? null);
  const [localError, setLocalError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [upload, { isLoading, error, reset }] = useUploadBrandLogoMutation();

  const pick = async (file: File | undefined) => {
    if (inputRef.current) inputRef.current.value = "";
    if (!file || isLoading) return;
    reset();
    setLocalError("");
    // Quick checks before uploading; the API checks the real file content again
    if (!ACCEPT.split(",").includes(file.type)) return setLocalError("Choose a PNG, JPEG, WebP or GIF image.");
    if (file.size > MAX_BYTES) return setLocalError("The logo must be 2 MB or smaller.");

    onUploading(true);
    const result = await upload(file);
    onUploading(false);
    if (!result.data) return;
    setPreviewUrl(result.data.data.url);
    onChange(result.data.data.id);
  };

  const message = localError || getErrorMessage(error);

  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-gray-700">Logo (optional)</span>
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          pick(event.dataTransfer.files[0]);
        }}
        className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed p-4 transition-colors focus-within:border-brand-500 ${
          isDragging ? "border-brand-500 bg-brand-50" : "border-gray-300 hover:border-brand-300 hover:bg-brand-50/40"
        }`}
      >
        <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white">
          {isLoading ? (
            <Loader2 className="size-6 animate-spin text-brand-600" aria-label="Uploading" />
          ) : previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed S3 URL
            <img src={previewUrl} alt="Logo preview" className="size-full object-contain" />
          ) : (
            <ImagePlus className="size-7 text-brand-400" aria-hidden />
          )}
        </span>
        <span className="min-w-0 text-sm">
          <span className="block font-medium text-brand-700">
            {isLoading ? "Uploading…" : previewUrl ? "Change the logo" : "Upload a logo"}
          </span>
          <span className="block text-xs text-gray-500">Drop an image here or choose one. PNG, JPEG, WebP or GIF, up to 2 MB.</span>
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT}
          disabled={isLoading}
          className="sr-only"
          onChange={(event) => pick(event.target.files?.[0])}
        />
      </label>
      {previewUrl && !isLoading && (
        <button
          type="button"
          onClick={() => {
            setPreviewUrl(null);
            onChange("");
          }}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="size-4" aria-hidden /> Remove logo
        </button>
      )}
      {message && <p className="text-xs text-red-600">{message}</p>}
    </div>
  );
}
