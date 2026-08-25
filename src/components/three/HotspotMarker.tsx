import { Html } from "@react-three/drei";

import type { HotspotRecord } from "../../types/artifact";
import styles from "./HotspotMarker.module.css";

export interface HotspotMarkerProps {
  hotspot: HotspotRecord;
  index: number;
  onSelect(id: string, opener: HTMLButtonElement): void;
}

export function HotspotMarker({
  hotspot,
  index,
  onSelect,
}: HotspotMarkerProps) {
  return (
    <Html
      center
      position={[...hotspot.position]}
      distanceFactor={6.5}
      wrapperClass={styles.wrapper}
      zIndexRange={[20, 10]}
    >
      <button
        className={styles.marker}
        type="button"
        aria-label={`查看热点：${hotspot.title}`}
        onClick={(event) => onSelect(hotspot.id, event.currentTarget)}
      >
        <span className={styles.index} aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className={styles.label}>{hotspot.title}</span>
      </button>
    </Html>
  );
}
