import { ImageOff } from "lucide-react";
import { type ImgHTMLAttributes, useState } from "react";

import styles from "./SafeImage.module.css";

export interface SafeImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  src: string;
  alt: string;
}

export function SafeImage(props: SafeImageProps) {
  return <SafeImageSource key={props.src} {...props} />;
}

function SafeImageSource({
  src,
  alt,
  className,
  onError,
  style,
  ...imageProps
}: SafeImageProps) {
  const [hasFailed, setHasFailed] = useState(false);

  if (hasFailed) {
    return (
      <div
        className={`${styles.fallback} ${className ?? ""}`}
        style={style}
        role="status"
      >
        <ImageOff
          className={styles.fallbackIcon}
          aria-hidden="true"
          focusable="false"
          size={28}
        />
        <span className={styles.fallbackTitle}>图像暂不可用</span>
        <span className={styles.fallbackAlt}>{alt}</span>
      </div>
    );
  }

  return (
    <img
      {...imageProps}
      className={`${styles.image} ${className ?? ""}`}
      src={src}
      alt={alt}
      style={style}
      onError={(event) => {
        onError?.(event);
        setHasFailed(true);
      }}
    />
  );
}
