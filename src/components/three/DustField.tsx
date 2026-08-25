import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Points } from "three";

export interface DustFieldProps {
  count: number;
  active: boolean;
}

const sample = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

const createPositions = (count: number) => {
  const positions = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    positions[offset] = (sample(index + 1) - 0.5) * 9;
    positions[offset + 1] = (sample(index + 101) - 0.5) * 6;
    positions[offset + 2] = (sample(index + 211) - 0.5) * 6;
  }

  return positions;
};

export function DustField({ count, active }: DustFieldProps) {
  const pointsRef = useRef<Points | null>(null);
  const positions = useMemo(() => createPositions(count), [count]);

  useFrame((_state, delta) => {
    if (!active || !pointsRef.current || count === 0) {
      return;
    }

    pointsRef.current.rotation.y += delta * 0.012;
    pointsRef.current.rotation.x += delta * 0.002;
  });

  if (count === 0) {
    return null;
  }

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#a8834d"
        size={0.024}
        sizeAttenuation
        transparent
        opacity={0.15}
        depthWrite={false}
      />
    </points>
  );
}
