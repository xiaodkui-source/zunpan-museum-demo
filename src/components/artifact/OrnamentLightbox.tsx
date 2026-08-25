import {
  ChevronLeft,
  ChevronRight,
  Move,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import type { OrnamentRecord } from "../../types/artifact";
import { SafeImage } from "../ui/SafeImage";
import styles from "./OrnamentLightbox.module.css";

export interface OrnamentLightboxProps {
  items: readonly OrnamentRecord[];
  index: number | null;
  returnFocusTo?: HTMLElement | null;
  onIndexChange(index: number): void;
  onClose(): void;
}

interface PanPosition {
  x: number;
  y: number;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  captureTarget: HTMLDivElement;
  captureRequested: boolean;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;
const PAN_LIMIT_PER_ZOOM = 220;
const EMPTY_PAN: PanPosition = { x: 0, y: 0 };

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

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
      // Removed or otherwise unfocusable openers are non-fatal.
    }
  }
};

export function OrnamentLightbox({
  items,
  index,
  returnFocusTo,
  onIndexChange,
  onClose,
}: OrnamentLightboxProps) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const dragListenersCleanupRef = useRef<(() => void) | null>(null);
  const focusCycleRef = useRef(0);
  const openRef = useRef(false);
  const mountedRef = useRef(true);
  const indexRef = useRef(index);
  const itemCountRef = useRef(items.length);
  const onIndexChangeRef = useRef(onIndexChange);
  const onCloseRef = useRef(onClose);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [pan, setPan] = useState<PanPosition>(EMPTY_PAN);
  const [isDragging, setIsDragging] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const instructionId = useId();

  const item = index === null ? undefined : items[index];
  const isOpen = item !== undefined;

  openRef.current = isOpen;
  indexRef.current = index;
  itemCountRef.current = items.length;
  onIndexChangeRef.current = onIndexChange;
  onCloseRef.current = onClose;

  const endActiveDrag = useCallback(() => {
    const drag = dragRef.current;
    dragRef.current = null;
    dragListenersCleanupRef.current?.();
    dragListenersCleanupRef.current = null;

    if (drag?.captureRequested) {
      try {
        const hasCapture = drag.captureTarget.hasPointerCapture?.(
          drag.pointerId,
        );
        if (hasCapture !== false) {
          drag.captureTarget.releasePointerCapture?.(drag.pointerId);
        }
      } catch {
        // Capture may already have been released by the browser.
      }
    }

    if (mountedRef.current) {
      setIsDragging(false);
    }
  }, []);

  const resetView = useCallback(() => {
    endActiveDrag();
    dragRef.current = null;
    setZoom(MIN_ZOOM);
    setPan(EMPTY_PAN);
  }, [endActiveDrag]);

  const moveSelection = useCallback(
    (direction: -1 | 1) => {
      const currentIndex = indexRef.current;
      const itemCount = itemCountRef.current;
      if (currentIndex === null || itemCount === 0) {
        return;
      }

      resetView();
      onIndexChangeRef.current(
        (currentIndex + direction + itemCount) % itemCount,
      );
    },
    [resetView],
  );

  useEffect(() => {
    resetView();
  }, [item?.id, item?.media, resetView]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      endActiveDrag();
    };
  }, [endActiveDrag]);

  useEffect(() => {
    if (!isOpen) {
      endActiveDrag();
    }
  }, [endActiveDrag, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const focusCycle = focusCycleRef.current + 1;
    focusCycleRef.current = focusCycle;
    openRef.current = true;
    const opener = returnFocusTo ?? null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    focusSafely(closeButtonRef.current);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveSelection(-1);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveSelection(1);
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
        focusSafely(dialog);
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (!dialog?.contains(activeElement)) {
        event.preventDefault();
        focusSafely(event.shiftKey ? last : first);
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
      document.body.style.overflow = previousOverflow;
      openRef.current = false;
      queueMicrotask(() => {
        if (
          focusCycleRef.current !== focusCycle ||
          openRef.current
        ) {
          return;
        }

        focusSafely(opener);
      });
    };
  }, [isOpen, moveSelection]);

  const updateZoom = (direction: -1 | 1) => {
    endActiveDrag();
    const nextZoom = clamp(
      zoom + direction * ZOOM_STEP,
      MIN_ZOOM,
      MAX_ZOOM,
    );
    const panLimit = PAN_LIMIT_PER_ZOOM * (nextZoom - MIN_ZOOM);

    setZoom(nextZoom);
    setPan((currentPan) =>
      nextZoom === MIN_ZOOM
        ? EMPTY_PAN
        : {
            x: clamp(currentPan.x, -panLimit, panLimit),
            y: clamp(currentPan.y, -panLimit, panLimit),
          },
    );
  };

  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (zoom <= MIN_ZOOM) {
      return;
    }

    event.preventDefault();
    endActiveDrag();
    const captureTarget = event.currentTarget;
    let captureRequested = false;

    try {
      if (typeof captureTarget.setPointerCapture === "function") {
        captureTarget.setPointerCapture(event.pointerId);
        captureRequested = true;
      }
    } catch {
      // Window listeners below provide the fallback when capture is unavailable.
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
      captureTarget,
      captureRequested,
    };
    setIsDragging(true);

    const handleWindowPointerMove = (pointerEvent: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== pointerEvent.pointerId) {
        return;
      }

      const panLimit = PAN_LIMIT_PER_ZOOM * (zoom - MIN_ZOOM);
      setPan({
        x: clamp(
          drag.originX + pointerEvent.clientX - drag.startX,
          -panLimit,
          panLimit,
        ),
        y: clamp(
          drag.originY + pointerEvent.clientY - drag.startY,
          -panLimit,
          panLimit,
        ),
      });
    };

    const handleWindowPointerEnd = (pointerEvent: PointerEvent) => {
      if (dragRef.current?.pointerId === pointerEvent.pointerId) {
        endActiveDrag();
      }
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerEnd);
    window.addEventListener("pointercancel", handleWindowPointerEnd);
    dragListenersCleanupRef.current = () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleWindowPointerEnd);
    };
  };

  if (!item || index === null) {
    return null;
  }

  const zoomPercent = Math.round(zoom * 100);
  const imageTransform = `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoom})`;

  return createPortal(
    <div
      className={styles.backdrop}
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
        aria-describedby={`${descriptionId} ${instructionId}`}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>ORNAMENT STUDY</p>
            <h2 className={styles.title} id={titleId}>
              {item.title}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            className={styles.iconButton}
            type="button"
            aria-label="关闭纹饰细节"
            onClick={onClose}
          >
            <X aria-hidden="true" focusable="false" size={22} />
          </button>
        </header>

        <div className={styles.content}>
          <div
            className={`${styles.stage} ${
              zoom > MIN_ZOOM ? styles.pannable : ""
            } ${isDragging ? styles.dragging : ""}`}
            data-testid="ornament-pan-surface"
            onPointerDown={beginDrag}
          >
            <SafeImage
              className={styles.image}
              src={item.media}
              alt={item.alt}
              draggable={false}
              style={{ transform: imageTransform }}
            />
            <span className={styles.diagramLabel}>数字纹样示意</span>
          </div>

          <div className={styles.details}>
            <div className={styles.copy}>
              <p className={styles.count} aria-live="polite">
                {index + 1} / {items.length}
              </p>
              <p className={styles.description} id={descriptionId}>
                {item.description}
              </p>
              <p className={styles.instruction} id={instructionId}>
                <Move aria-hidden="true" focusable="false" size={17} />
                放大后可拖动观察；方向键可切换纹样。
              </p>
            </div>

            <div className={styles.toolbar} aria-label="纹饰图像工具">
              <button
                className={styles.iconButton}
                type="button"
                aria-label="缩小"
                disabled={zoom <= MIN_ZOOM}
                onClick={() => updateZoom(-1)}
              >
                <ZoomOut aria-hidden="true" focusable="false" size={20} />
              </button>
              <output className={styles.zoomValue} aria-live="polite">
                {zoomPercent}%
              </output>
              <button
                className={styles.iconButton}
                type="button"
                aria-label="放大"
                disabled={zoom >= MAX_ZOOM}
                onClick={() => updateZoom(1)}
              >
                <ZoomIn aria-hidden="true" focusable="false" size={20} />
              </button>
              <button
                className={styles.resetButton}
                type="button"
                aria-label="复位视图"
                onClick={resetView}
              >
                <RotateCcw aria-hidden="true" focusable="false" size={18} />
                <span>复位</span>
              </button>
            </div>
          </div>
        </div>

        <nav className={styles.navigation} aria-label="纹饰切换">
          <button
            className={styles.navigationButton}
            type="button"
            aria-label="上一张"
            onClick={() => moveSelection(-1)}
          >
            <ChevronLeft aria-hidden="true" focusable="false" size={21} />
            <span>上一张</span>
          </button>
          <button
            className={styles.navigationButton}
            type="button"
            aria-label="下一张"
            onClick={() => moveSelection(1)}
          >
            <span>下一张</span>
            <ChevronRight aria-hidden="true" focusable="false" size={21} />
          </button>
        </nav>
      </section>
    </div>,
    document.body,
  );
}
