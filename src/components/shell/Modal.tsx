"use client";

import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Label of the close button (already translated). */
  closeLabel: string;
  children: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A small modal dialog on top of the native `<dialog>`: the page behind is
 * inert, Esc closes it, Tab cycles inside it, and focus goes back to where it
 * was when it closes. Clicking the backdrop also closes it. An element marked
 * `data-autofocus` gets focus on opening; otherwise the browser picks the
 * first focusable one (the close button).
 */
export function Modal({ open, onClose, title, closeLabel, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      dialog.showModal();
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Covers every way of closing: Esc, the button, the backdrop.
  const handleClose = () => {
    onClose();
    const target = returnFocus.current;
    returnFocus.current = null;
    if (target?.isConnected) target.focus({ preventScroll: true });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab") return;
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE),
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !event.currentTarget.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  // A click whose target is the <dialog> itself landed on the backdrop: the
  // content fills the dialog box completely.
  const handleClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) event.currentTarget.close();
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={handleClose}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      className="m-auto w-[min(30rem,calc(100%-2rem))] rounded-lg border border-line bg-background p-0 text-foreground shadow-xl backdrop:bg-background/70 backdrop:backdrop-blur-[2px]"
    >
      <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto p-4">
        <div className="mb-3 flex items-start gap-3">
          <h2 id={titleId} className="min-w-0 flex-1 text-base font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label={closeLabel}
            title={closeLabel}
            className="-mt-1 -mr-1 flex size-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
          >
            <svg aria-hidden viewBox="0 0 16 16" className="size-4 fill-current">
              <path d="M4.2 3a.85.85 0 0 0-1.2 1.2L6.8 8 3 11.8A.85.85 0 1 0 4.2 13L8 9.2l3.8 3.8a.85.85 0 0 0 1.2-1.2L9.2 8 13 4.2A.85.85 0 0 0 11.8 3L8 6.8 4.2 3Z" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
