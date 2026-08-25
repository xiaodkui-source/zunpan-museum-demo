import {
  MapPin,
  MapPinOff,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";

import styles from "./ViewerToolbar.module.css";

export interface ViewerToolbarProps {
  autoRotate: boolean;
  hotspotsVisible: boolean;
  fullscreen: boolean;
  onReset(): void;
  onToggleAutoRotate(): void;
  onToggleHotspots(): void;
  onToggleFullscreen(): void;
}

export function ViewerToolbar({
  autoRotate,
  hotspotsVisible,
  fullscreen,
  onReset,
  onToggleAutoRotate,
  onToggleHotspots,
  onToggleFullscreen,
}: ViewerToolbarProps) {
  const iconProps = {
    "aria-hidden": true,
    focusable: "false",
    size: 18,
    strokeWidth: 1.7,
  } as const;

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="三维查看器工具">
      <button className={styles.control} type="button" onClick={onReset}>
        <RotateCcw {...iconProps} />
        <span className={styles.label} data-viewer-control-label="visible">
          重置视角
        </span>
      </button>

      <button
        className={styles.control}
        type="button"
        aria-pressed={autoRotate}
        onClick={onToggleAutoRotate}
      >
        {autoRotate ? <Pause {...iconProps} /> : <Play {...iconProps} />}
        <span className={styles.label} data-viewer-control-label="visible">
          自动旋转：{autoRotate ? "开" : "关"}
        </span>
      </button>

      <button
        className={styles.control}
        type="button"
        aria-pressed={hotspotsVisible}
        onClick={onToggleHotspots}
      >
        {hotspotsVisible ? (
          <MapPin {...iconProps} />
        ) : (
          <MapPinOff {...iconProps} />
        )}
        <span className={styles.label} data-viewer-control-label="visible">
          热点显示：{hotspotsVisible ? "开" : "关"}
        </span>
      </button>

      <button
        className={styles.control}
        type="button"
        data-viewer-fullscreen-control
        onClick={onToggleFullscreen}
      >
        {fullscreen ? (
          <Minimize2 {...iconProps} />
        ) : (
          <Maximize2 {...iconProps} />
        )}
        <span className={styles.label} data-viewer-control-label="visible">
          {fullscreen ? "退出全屏" : "全屏查看"}
        </span>
      </button>
    </div>
  );
}
