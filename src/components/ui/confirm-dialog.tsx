"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "./button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  /** Red confirm button and warning icon for actions that take something away */
  tone?: "danger" | "default";
  isLoading?: boolean;
  /** Shows an optional "Reason" box; its text is passed to onConfirm */
  withReason?: boolean;
  error?: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

/**
 * Accessible confirmation modal built on the native <dialog> element
 * (focus stays inside, Escape and the backdrop close it).
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = "default",
  isLoading,
  withReason,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const reasonId = useId();
  const [reason, setReason] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => {
    if (isLoading) return;
    setReason("");
    onCancel();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault(); // Escape: let React state decide
        close();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) close(); // click on the backdrop
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-0 text-left shadow-xl backdrop:bg-gray-900/40 backdrop:backdrop-blur-[1px]"
    >
      <form
        method="dialog"
        className="space-y-4 p-5 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm(reason.trim());
        }}
      >
        <div className="flex gap-3">
          {tone === "danger" && (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle className="size-5" aria-hidden />
            </span>
          )}
          <div className="space-y-1.5">
            <h2 id={titleId} className="text-base font-semibold text-gray-900">
              {title}
            </h2>
            <div className="text-sm text-gray-600">{description}</div>
          </div>
        </div>

        {withReason && (
          <div className="space-y-1.5">
            <label htmlFor={reasonId} className="block text-sm font-medium text-gray-700">
              Reason (optional)
            </label>
            <textarea
              id={reasonId}
              rows={2}
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Saved in the company's activity log"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={close} disabled={isLoading} autoFocus>
            Cancel
          </Button>
          <Button type="submit" variant={tone === "danger" ? "danger" : "primary"} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
