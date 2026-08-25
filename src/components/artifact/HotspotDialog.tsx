import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

import type { HotspotRecord } from "../../types/artifact";
import styles from "./HotspotDialog.module.css";

export interface HotspotDialogProps {
  hotspot: HotspotRecord | null;
  interpretationNotice: string;
  returnFocusTo?: HTMLElement | null;
  portalTarget?: HTMLElement | null;
  onClose(): void;
}

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const focusSafely = (element: HTMLElement | null) => {
  if (!element?.isConnected) {
    return;
  }

  try {
    element.focus({ preventScroll: true });
  } catch {
    try {
      element.focus();
    } catch {
      // A removed or otherwise unfocusable opener is non-fatal.
    }
  }
};

export function HotspotDialog({
  hotspot,
  interpretationNotice,
  returnFocusTo,
  portalTarget,
  onClose,
}: HotspotDialogProps) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();
  const noticeId = useId();

  onCloseRef.current = onClose;

  useEffect(() => {
    if (!hotspot) {
      return undefined;
    }

    const opener = returnFocusTo ?? null;
    focusSafely(closeButtonRef.current);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialog = dialogRef.current;
      const focusable = dialog
        ? Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        : [];

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (focusable.length === 1) {
        event.preventDefault();
        focusSafely(first);
      } else if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        focusSafely(last);
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        focusSafely(first);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (opener) {
        queueMicrotask(() => focusSafely(opener));
      }
    };
  }, [hotspot, returnFocusTo]);

  if (!hotspot) {
    return null;
  }

  return createPortal(
    <div
      className={`${styles.backdrop} ${portalTarget ? styles.embedded : ""}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={`${descriptionId} ${noticeId}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <p className={styles.eyebrow}>ARTIFACT DETAIL</p>
          <button
            ref={closeButtonRef}
            className={styles.closeButton}
            type="button"
            aria-label="关闭热点详情"
            onClick={onClose}
          >
            <X aria-hidden="true" focusable="false" size={20} />
          </button>
        </div>

        <h2 className={styles.title} id={titleId}>
          {hotspot.title}
        </h2>
        <p className={styles.description} id={descriptionId}>
          {hotspot.description}
        </p>
        <p className={styles.notice} id={noticeId}>
          <span aria-hidden="true">※</span>
          {interpretationNotice}
        </p>
      </section>
    </div>,
    portalTarget ?? document.body,
  );
}
