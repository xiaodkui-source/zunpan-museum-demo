import type { Box3 } from "three";

export interface ModelFrame {
  position: [number, number, number];
  scale: number;
}

const normalizeZero = (value: number) => (Object.is(value, -0) ? 0 : value);

export function frameModelBounds(bounds: Box3, displayHeight: number): ModelFrame {
  const height = bounds.max.y - bounds.min.y;

  if (!Number.isFinite(height) || height <= 0 || displayHeight <= 0) {
    return { position: [0, 0, 0], scale: 1 };
  }

  const scale = displayHeight / height;
  const centerX = (bounds.min.x + bounds.max.x) / 2;
  const centerY = (bounds.min.y + bounds.max.y) / 2;
  const centerZ = (bounds.min.z + bounds.max.z) / 2;

  return {
    position: [
      normalizeZero(-centerX * scale),
      normalizeZero(-centerY * scale),
      normalizeZero(-centerZ * scale),
    ],
    scale,
  };
}
