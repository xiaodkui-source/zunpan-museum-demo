import { useEffect } from "react";

import styles from "./WebGLFallback.module.css";

export interface WebGLFallbackProps {
  poster?: string;
  className?: string;
  onUnavailable?: () => void;
}

const supportsWebGL = (): boolean => {
  if (
    typeof window === "undefined" ||
    (!window.WebGLRenderingContext && !window.WebGL2RenderingContext)
  ) {
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");

    return Boolean(context);
  } catch {
    return false;
  }
};

export function WebGLFallback({
  poster = "/images/zunpan-poster.svg",
  className,
  onUnavailable,
}: WebGLFallbackProps) {
  const classes = className
    ? `${styles.fallback} ${className}`
    : styles.fallback;

  useEffect(() => {
    if (!supportsWebGL()) {
      onUnavailable?.();
    }
  }, [onUnavailable]);

  return (
    <aside className={classes} role="status" aria-live="polite">
      <div className={styles.posterFrame}>
        <img
          className={styles.poster}
          src={poster}
          alt="曾侯乙尊盘上尊与下盘的数字结构示意海报"
        />
      </div>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>DIGITAL STRUCTURE STUDY</p>
        <h2 className={styles.title}>实时 3D 暂不可用</h2>
        <p className={styles.description}>
          当前设备或浏览器无法呈现实时三维场景，文物概览、纹饰与工艺内容仍可浏览。
        </p>
      </div>
    </aside>
  );
}
