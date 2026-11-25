"use client";

import { Lock } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { Button } from "./button";

/** A message with one OK button. Mount it only while it's open. */
export function NoticeDialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-0 text-left shadow-xl backdrop:bg-gray-900/40 backdrop:backdrop-blur-[1px]"
    >
      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
            <Lock className="size-5" aria-hidden />
          </span>
          <div className="space-y-1.5">
            <h2 id={titleId} className="text-base font-semibold text-gray-900">
              {title}
            </h2>
            <div className="text-sm text-gray-600">{children}</div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={onClose} autoFocus>
            OK
          </Button>
        </div>
      </div>
    </dialog>
  );
}
