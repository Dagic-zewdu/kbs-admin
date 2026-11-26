"use client";

import clsx from "clsx";
import { ImageIcon } from "lucide-react";
import { useState } from "react";

interface FadeImageProps {
  src: string | null | undefined;
  alt?: string;
  /** Size and shape of the box */
  className?: string;
  imageClassName?: string;
  /** Shown when there is no image */
  fallback?: React.ReactNode;
}

/** A soft shimmer first, then the photo fades in whole, never drawn line by line */
export function FadeImage({ src, alt = "", className, imageClassName, fallback }: FadeImageProps) {
  const [loaded, setLoaded] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const isLoaded = Boolean(src) && loaded === src;
  const isFailed = Boolean(src) && failed === src;

  return (
    <span className={clsx("relative flex shrink-0 items-center justify-center overflow-hidden bg-gray-50", className)}>
      {src && !isLoaded && !isFailed && <span aria-hidden className="absolute inset-0 animate-pulse bg-gray-200/70" />}
      {(!src || isFailed) && (fallback ?? <ImageIcon className="size-5 text-gray-300" aria-hidden />)}
      {src && !isFailed && (
        // eslint-disable-next-line @next/next/no-img-element -- signed S3 URLs, sized by their box
        <img
          // A cached photo is complete before React sees onLoad
          ref={(image) => {
            if (image?.complete && image.naturalWidth > 0 && loaded !== src) setLoaded(src);
          }}
          src={src}
          alt={alt}
          decoding="async"
          onLoad={() => setLoaded(src)}
          onError={() => setFailed(src)}
          className={clsx("size-full object-contain transition-opacity duration-500 ease-out", isLoaded ? "opacity-100" : "opacity-0", imageClassName)}
        />
      )}
    </span>
  );
}
