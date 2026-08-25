import { useProgress } from "@react-three/drei";
import { Box, Check, CircleAlert, LoaderCircle, MonitorX } from "lucide-react";

import type { ModelAvailabilityStatus } from "../../hooks/useModelAvailability";
import styles from "./ViewerStatusOverlay.module.css";

export interface ViewerStatusOverlayProps {
  availability: ModelAvailabilityStatus;
  modelReady: boolean;
  modelError: boolean;
  webglUnavailable?: boolean;
  fullscreenMessage?: string | null;
}

type ViewerVisualState =
  | "webgl"
  | "checking"
  | "loading"
  | "missing"
  | "error"
  | "ready";

const resolveViewerState = ({
  availability,
  modelReady,
  modelError,
  webglUnavailable,
}: Omit<ViewerStatusOverlayProps, "fullscreenMessage">): ViewerVisualState => {
  if (webglUnavailable) {
    return "webgl";
  }

  if (availability === "checking") {
    return "checking";
  }

  if (availability === "missing") {
    return "missing";
  }

  if (modelError) {
    return "error";
  }

  return modelReady ? "ready" : "loading";
};

export function ViewerStatusOverlay({
  availability,
  modelReady,
  modelError,
  webglUnavailable = false,
  fullscreenMessage,
}: ViewerStatusOverlayProps) {
  const { progress } = useProgress();
  const visualState = resolveViewerState({
    availability,
    modelReady,
    modelError,
    webglUnavailable,
  });
  const roundedProgress = Number.isFinite(progress) ? Math.round(progress) : null;
  const iconProps = {
    "aria-hidden": true,
    focusable: "false",
    size: 16,
  } as const;

  let content;

  switch (visualState) {
    case "webgl":
      content = (
        <>
          <MonitorX {...iconProps} />
          <span>当前设备无法启用实时 3D，已显示静态数字结构示意。</span>
        </>
      );
      break;
    case "checking":
      content = (
        <>
          <LoaderCircle className={styles.spinner} {...iconProps} />
          <span>正在检查三维模型…</span>
        </>
      );
      break;
    case "missing":
      content = (
        <>
          <Box {...iconProps} />
          <span>真实三维模型暂未提供，当前显示数字结构示意。</span>
        </>
      );
      break;
    case "error":
      content = (
        <>
          <CircleAlert {...iconProps} />
          <span>三维模型加载失败，已切换为数字结构示意。</span>
        </>
      );
      break;
    case "ready":
      content = (
        <>
          <Check {...iconProps} />
          <span>三维模型已就绪。</span>
        </>
      );
      break;
    default:
      content = (
        <>
          <LoaderCircle className={styles.spinner} {...iconProps} />
          <span>
            {roundedProgress !== null && roundedProgress > 0
              ? `三维模型加载中，${roundedProgress}%`
              : "三维模型加载中…"}
          </span>
        </>
      );
  }

  return (
    <div className={styles.statusStack} aria-live="polite" aria-atomic="true">
      <p
        className={`${styles.status} ${visualState === "ready" ? styles.ready : ""}`}
        data-viewer-status={visualState}
      >
        {content}
      </p>
      {fullscreenMessage ? (
        <p className={styles.fullscreenError}>
          <CircleAlert {...iconProps} />
          <span>{fullscreenMessage}</span>
        </p>
      ) : null}
    </div>
  );
}
