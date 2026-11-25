"use client";

import { useEffect, useId, useRef } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface FormDialogProps {
  title: string;
  submitLabel: string;
  isLoading: boolean;
  error: string;
  onSubmit: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

/** A form in a modal. Mount it only while it's open. */
export function FormDialog({ title, submitLabel, isLoading, error, onSubmit, onClose, children }: FormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
  }, []);

  const close = () => {
    if (!isLoading) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-xl bg-white p-0 text-left shadow-xl backdrop:bg-gray-900/40 backdrop:backdrop-blur-[1px]"
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="space-y-4 p-5 sm:p-6"
      >
        <h2 id={titleId} className="text-base font-semibold text-gray-900">
          {title}
        </h2>
        {children}
        {error && <Alert>{error}</Alert>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={close} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
