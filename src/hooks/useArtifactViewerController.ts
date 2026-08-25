import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";

import type {
  CameraCommand,
  CameraPose,
  HotspotRecord,
} from "../types/artifact";

export interface ArtifactViewerControllerParams {
  hotspots: readonly HotspotRecord[];
  defaultCamera: CameraPose;
  reducedMotion?: boolean;
}

export interface CloseHotspotOptions {
  restoreFocus?: boolean;
}

export interface ArtifactViewerController {
  selectedHotspotId: string | null;
  selectedHotspot: HotspotRecord | null;
  autoRotate: boolean;
  hotspotsVisible: boolean;
  cameraCommand: CameraCommand;
  openerRef: MutableRefObject<HTMLElement | null>;
  selectHotspot: (id: string, opener?: HTMLElement | null) => void;
  closeHotspot: (options?: CloseHotspotOptions) => void;
  resetCamera: () => void;
  pauseAutoRotate: () => void;
  toggleAutoRotate: () => void;
  toggleHotspots: () => void;
}

const focusElementSafely = (element: HTMLElement) => {
  if (!element.isConnected) {
    return;
  }

  try {
    element.focus({ preventScroll: true });
  } catch {
    try {
      element.focus();
    } catch {
      // Losing a removed or otherwise unfocusable opener is non-fatal.
    }
  }
};

export function useArtifactViewerController({
  hotspots,
  defaultCamera,
  reducedMotion = false,
}: ArtifactViewerControllerParams): ArtifactViewerController {
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(() => !reducedMotion);
  const [hotspotsVisible, setHotspotsVisible] = useState(true);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>(() => ({
    sequence: 0,
    reason: "initial",
    pose: defaultCamera,
  }));
  const openerRef = useRef<HTMLElement | null>(null);
  const hotspotsVisibleRef = useRef(true);
  const focusRestoreGenerationRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      focusRestoreGenerationRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setAutoRotate(false);
    }
  }, [reducedMotion]);

  const selectedHotspot = useMemo(
    () =>
      hotspots.find((hotspot) => hotspot.id === selectedHotspotId) ?? null,
    [hotspots, selectedHotspotId],
  );

  const invalidateFocusRestore = useCallback(() => {
    focusRestoreGenerationRef.current += 1;
  }, []);

  const restoreOpenerFocus = useCallback(() => {
    const generation = focusRestoreGenerationRef.current + 1;
    focusRestoreGenerationRef.current = generation;
    const opener = openerRef.current;
    openerRef.current = null;

    if (opener) {
      queueMicrotask(() => {
        if (
          mountedRef.current &&
          focusRestoreGenerationRef.current === generation
        ) {
          focusElementSafely(opener);
        }
      });
    }
  }, []);

  const selectHotspot = useCallback(
    (id: string, opener?: HTMLElement | null) => {
      const hotspot = hotspots.find((candidate) => candidate.id === id);

      if (!hotspot) {
        return;
      }

      invalidateFocusRestore();
      openerRef.current = opener ?? null;

      setSelectedHotspotId(hotspot.id);
      setAutoRotate(false);
      setCameraCommand((current) => ({
        sequence: current.sequence + 1,
        reason: "hotspot",
        pose: hotspot.camera,
      }));
    },
    [hotspots, invalidateFocusRestore],
  );

  const closeHotspot = useCallback(
    ({ restoreFocus = true }: CloseHotspotOptions = {}) => {
      setSelectedHotspotId(null);

      if (restoreFocus) {
        restoreOpenerFocus();
      } else {
        invalidateFocusRestore();
        openerRef.current = null;
      }
    },
    [invalidateFocusRestore, restoreOpenerFocus],
  );

  const resetCamera = useCallback(() => {
    invalidateFocusRestore();
    setSelectedHotspotId(null);
    openerRef.current = null;
    setCameraCommand((current) => ({
      sequence: current.sequence + 1,
      reason: "reset",
      pose: defaultCamera,
    }));
  }, [defaultCamera, invalidateFocusRestore]);

  const pauseAutoRotate = useCallback(() => {
    setAutoRotate(false);
  }, []);

  const toggleAutoRotate = useCallback(() => {
    setAutoRotate((current) => !current);
  }, []);

  const toggleHotspots = useCallback(() => {
    const visible = !hotspotsVisibleRef.current;
    invalidateFocusRestore();
    hotspotsVisibleRef.current = visible;
    setHotspotsVisible(visible);

    if (!visible) {
      closeHotspot();
    }
  }, [closeHotspot, invalidateFocusRestore]);

  return {
    selectedHotspotId,
    selectedHotspot,
    autoRotate,
    hotspotsVisible,
    cameraCommand,
    openerRef,
    selectHotspot,
    closeHotspot,
    resetCamera,
    pauseAutoRotate,
    toggleAutoRotate,
    toggleHotspots,
  };
}
