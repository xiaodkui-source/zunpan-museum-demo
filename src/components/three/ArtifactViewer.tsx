import { PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";

import { HotspotDialog } from "../artifact/HotspotDialog";
import { ViewerToolbar } from "../artifact/ViewerToolbar";
import { useArtifactViewerController } from "../../hooks/useArtifactViewerController";
import { useModelAvailability } from "../../hooks/useModelAvailability";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useRenderActivity } from "../../hooks/useRenderActivity";
import type { ArtifactExhibition } from "../../types/artifact";
import { ArtifactScene } from "./ArtifactScene";
import { ViewerStatusOverlay } from "./ViewerStatusOverlay";
import { WebGLFallback } from "./WebGLFallback";
import styles from "./ArtifactViewer.module.css";

export interface ArtifactViewerProps {
  exhibition: ArtifactExhibition;
}

const FULLSCREEN_ERROR_MESSAGE =
  "当前浏览器未能进入全屏，可继续在页面中浏览";

const readViewportWidth = () =>
  typeof window === "undefined" ? 1280 : window.innerWidth;

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
      // Fullscreen exit remains usable if its opener has disappeared.
    }
  }
};

export function ArtifactViewer({ exhibition }: ArtifactViewerProps) {
  const reducedMotion = useReducedMotion();
  const renderActivity = useRenderActivity<HTMLDivElement>();
  const availability = useModelAvailability(exhibition.model.src);
  const controller = useArtifactViewerController({
    hotspots: exhibition.hotspots,
    defaultCamera: exhibition.model.defaultCamera,
    reducedMotion,
  });
  const [viewportWidth, setViewportWidth] = useState(readViewportWidth);
  const [lowQuality, setLowQuality] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenMessage, setFullscreenMessage] = useState<string | null>(null);
  const performanceDeclinedRef = useRef(false);
  const fullscreenOpenerRef = useRef<HTMLElement | null>(null);
  const wasFullscreenRef = useRef(false);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (availability.status !== "available") {
      setModelReady(false);
      setModelError(false);
    }
  }, [availability.status, exhibition.model.src]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const viewerIsFullscreen =
        document.fullscreenElement === renderActivity.ref.current;
      setFullscreen(viewerIsFullscreen);

      if (
        viewerIsFullscreen &&
        !wasFullscreenRef.current &&
        !fullscreenOpenerRef.current
      ) {
        fullscreenOpenerRef.current = document.activeElement as HTMLElement | null;
      }

      if (wasFullscreenRef.current && !viewerIsFullscreen) {
        const opener = fullscreenOpenerRef.current;
        fullscreenOpenerRef.current = null;
        queueMicrotask(() => focusSafely(opener));
      }

      wasFullscreenRef.current = viewerIsFullscreen;
      window.requestAnimationFrame?.(() => {
        window.dispatchEvent(new Event("resize"));
      });
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [renderActivity.ref]);

  const handlePerformanceDecline = useCallback(() => {
    if (performanceDeclinedRef.current) {
      return;
    }

    performanceDeclinedRef.current = true;
    setLowQuality(true);
  }, []);

  const handleModelReady = useCallback(() => {
    setModelError(false);
    setModelReady(true);
  }, []);

  const handleModelError = useCallback(() => {
    setModelReady(false);
    setModelError(true);
  }, []);

  const handleWebglUnavailable = useCallback(() => {
    setWebglUnavailable(true);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const viewer = renderActivity.ref.current;
    setFullscreenMessage(null);

    if (!viewer) {
      setFullscreenMessage(FULLSCREEN_ERROR_MESSAGE);
      return;
    }

    try {
      if (document.fullscreenElement) {
        if (typeof document.exitFullscreen !== "function") {
          throw new Error("Fullscreen exit is unavailable");
        }
        await document.exitFullscreen();
        return;
      }

      if (typeof viewer.requestFullscreen !== "function") {
        throw new Error("Fullscreen entry is unavailable");
      }

      fullscreenOpenerRef.current = document.activeElement as HTMLElement | null;
      await viewer.requestFullscreen();
    } catch {
      const opener = fullscreenOpenerRef.current;
      fullscreenOpenerRef.current = null;
      focusSafely(opener);
      setFullscreenMessage(FULLSCREEN_ERROR_MESSAGE);
    }
  }, [renderActivity.ref]);

  const closeHotspot = useCallback(() => {
    controller.closeHotspot();
  }, [controller.closeHotspot]);

  const dpr = lowQuality
    ? 1
    : reducedMotion || viewportWidth < 640
      ? 1.25
      : viewportWidth < 1024
        ? 1.5
        : 1.75;
  const shadows = viewportWidth >= 1024 && !reducedMotion && !lowQuality;
  const dustCount = reducedMotion || lowQuality ? 0 : viewportWidth < 1024 ? 40 : 72;
  const continuousRender =
    renderActivity.isActive && controller.autoRotate && !reducedMotion;

  return (
    <div
      ref={renderActivity.ref}
      className={styles.viewer}
      data-artifact-viewer
      data-fullscreen={fullscreen}
      role="group"
      aria-label={`${exhibition.title}三维交互查看器`}
      tabIndex={0}
      onDoubleClick={controller.resetCamera}
      onContextMenu={(event) => event.preventDefault()}
    >
      <p className={styles.visuallyHidden}>
        拖动旋转，滚轮缩放，右键平移，双击重置视角。
      </p>

      <Canvas
        className={styles.canvas}
        fallback={
          <WebGLFallback
            poster={exhibition.model.poster}
            className={styles.fallback}
            onUnavailable={handleWebglUnavailable}
          />
        }
        camera={{
          position: [...exhibition.model.defaultCamera.position],
          fov: exhibition.model.defaultCamera.fov ?? 38,
          near: 0.1,
          far: 100,
        }}
        dpr={[1, dpr]}
        frameloop={continuousRender ? "always" : "demand"}
        shadows={shadows}
        gl={{
          alpha: true,
          antialias: !lowQuality,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.04;
          gl.outputColorSpace = SRGBColorSpace;
        }}
      >
        <PerformanceMonitor flipflops={1} onDecline={handlePerformanceDecline} />
        <ArtifactScene
          model={exhibition.model}
          hotspots={exhibition.hotspots}
          modelAvailable={availability.status === "available"}
          autoRotate={controller.autoRotate}
          hotspotsVisible={controller.hotspotsVisible}
          cameraCommand={controller.cameraCommand}
          reducedMotion={reducedMotion}
          lowQuality={lowQuality}
          shadows={shadows}
          dustCount={dustCount}
          renderActive={renderActivity.isActive}
          onPauseAutoRotate={controller.pauseAutoRotate}
          onSelectHotspot={controller.selectHotspot}
          onModelReady={handleModelReady}
          onModelError={handleModelError}
        />
      </Canvas>

      <ViewerStatusOverlay
        availability={availability.status}
        modelReady={modelReady}
        modelError={modelError}
        webglUnavailable={webglUnavailable}
        fullscreenMessage={fullscreenMessage}
      />

      <div className={styles.toolbarDock}>
        <ViewerToolbar
          autoRotate={controller.autoRotate}
          hotspotsVisible={controller.hotspotsVisible}
          fullscreen={fullscreen}
          onReset={controller.resetCamera}
          onToggleAutoRotate={controller.toggleAutoRotate}
          onToggleHotspots={controller.toggleHotspots}
          onToggleFullscreen={() => void toggleFullscreen()}
        />
      </div>

      <HotspotDialog
        hotspot={controller.selectedHotspot}
        interpretationNotice={exhibition.interpretationNotice}
        portalTarget={renderActivity.ref.current}
        onClose={closeHotspot}
      />
    </div>
  );
}
