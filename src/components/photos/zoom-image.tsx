"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";

const MAX_ZOOM = 5;
const LENS = 180;
const LENS_ZOOM = 2.5;

type Point = { x: number; y: number };

/** Zoom with buttons, the wheel or two fingers; drag to move. On a computer, the lens magnifies what is under the pointer. */
export function ZoomImage({ src, alt }: { src: string; alt: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [lens, setLens] = useState<(Point & { width: number; height: number }) | null>(null);
  const pointers = useRef(new Map<number, Point>());
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);

  const clampOffset = (next: Point, level: number) => {
    const box = boxRef.current?.getBoundingClientRect();
    if (!box) return next;
    const maxX = ((level - 1) * box.width) / 2;
    const maxY = ((level - 1) * box.height) / 2;
    return { x: Math.max(-maxX, Math.min(maxX, next.x)), y: Math.max(-maxY, Math.min(maxY, next.y)) };
  };
  /** Zooms toward a point of the box, so what is under the pointer stays there */
  const zoomTo = (level: number, at?: Point) => {
    const next = Math.max(1, Math.min(MAX_ZOOM, level));
    const box = boxRef.current?.getBoundingClientRect();
    if (box && at) {
      const fromCentre = { x: at.x - box.left - box.width / 2, y: at.y - box.top - box.height / 2 };
      const ratio = next / zoom;
      setOffset(clampOffset({ x: fromCentre.x - (fromCentre.x - offset.x) * ratio, y: fromCentre.y - (fromCentre.y - offset.y) * ratio }, next));
    } else setOffset((current) => clampOffset(current, next));
    setZoom(next);
    if (next === 1) setOffset({ x: 0, y: 0 });
  };

  const distance = () => {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  return (
    <div className="flex h-full flex-col gap-2">
      <div
        ref={boxRef}
        className={`relative min-h-0 flex-1 touch-none select-none overflow-hidden rounded-lg bg-white ${zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
        onWheel={(event) => zoomTo(zoom * (event.deltaY < 0 ? 1.2 : 1 / 1.2), { x: event.clientX, y: event.clientY })}
        onDoubleClick={(event) => zoomTo(zoom > 1 ? 1 : 2.5, { x: event.clientX, y: event.clientY })}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (pointers.current.size === 2) pinch.current = { distance: distance(), zoom };
        }}
        onPointerMove={(event) => {
          const before = pointers.current.get(event.pointerId);
          if (event.pointerType === "mouse" && zoom === 1) {
            const box = event.currentTarget.getBoundingClientRect();
            setLens({ x: event.clientX - box.left, y: event.clientY - box.top, width: box.width, height: box.height });
          }
          if (!before) return;
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (pointers.current.size === 2 && pinch.current) {
            zoomTo(pinch.current.zoom * (distance() / pinch.current.distance));
          } else if (pointers.current.size === 1 && zoom > 1) {
            setOffset((current) => clampOffset({ x: current.x + event.clientX - before.x, y: current.y + event.clientY - before.y }, zoom));
          }
        }}
        onPointerUp={(event) => {
          pointers.current.delete(event.pointerId);
          if (pointers.current.size < 2) pinch.current = null;
        }}
        onPointerCancel={(event) => pointers.current.delete(event.pointerId)}
        onPointerLeave={() => setLens(null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- signed S3 URL */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="pointer-events-none size-full object-contain transition-transform duration-75"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
        />
        {lens && zoom === 1 && (
          <Lens src={src} at={lens} />
        )}
      </div>
      <div className="flex items-center justify-center gap-2">
        <button type="button" aria-label="Zoom out" disabled={zoom <= 1} onClick={() => zoomTo(zoom / 1.5)} className="flex size-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40">
          <Minus className="size-4" />
        </button>
        <span className="w-14 text-center text-sm tabular-nums text-gray-700">{Math.round(zoom * 100)}%</span>
        <button type="button" aria-label="Zoom in" disabled={zoom >= MAX_ZOOM} onClick={() => zoomTo(zoom * 1.5)} className="flex size-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40">
          <Plus className="size-4" />
        </button>
        <button type="button" aria-label="Back to the whole photo" disabled={zoom === 1} onClick={() => zoomTo(1)} className="flex size-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40">
          <RotateCcw className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** A round magnifier under the pointer, showing that spot of the photo bigger */
function Lens({ src, at }: { src: string; at: Point & { width: number; height: number } }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute overflow-hidden rounded-full border-2 border-white bg-white shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
      style={{ width: LENS, height: LENS, left: at.x - LENS / 2, top: at.y - LENS / 2 }}
    >
      {/* The same photo, laid out like the big one but bigger, moved so the spot under the pointer is in the middle */}
      {/* eslint-disable-next-line @next/next/no-img-element -- signed S3 URL */}
      <img
        src={src}
        alt=""
        className="absolute max-w-none object-contain"
        style={{
          width: at.width * LENS_ZOOM,
          height: at.height * LENS_ZOOM,
          left: LENS / 2 - at.x * LENS_ZOOM,
          top: LENS / 2 - at.y * LENS_ZOOM,
        }}
      />
    </span>
  );
}
