import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import type { Object3D } from "three";

import type { ModelTransform } from "../../types/artifact";

export interface ArtifactModelProps {
  src: string;
  transform: ModelTransform;
  onReady?: () => void;
}

export function ArtifactModel({ src, transform, onReady }: ArtifactModelProps) {
  const { scene } = useGLTF(src);
  const readySceneRef = useRef<Object3D | null>(null);
  const [positionX, positionY, positionZ] = transform.position;
  const [rotationX, rotationY, rotationZ] = transform.rotation;
  const [scaleX, scaleY, scaleZ] = transform.scale;

  const model = useMemo(() => {
    const clone = scene.clone(true);

    clone.position.set(positionX, positionY, positionZ);
    clone.rotation.set(rotationX, rotationY, rotationZ);
    clone.scale.set(scaleX, scaleY, scaleZ);
    return clone;
  }, [
    scene,
    positionX,
    positionY,
    positionZ,
    rotationX,
    rotationY,
    rotationZ,
    scaleX,
    scaleY,
    scaleZ,
  ]);

  useEffect(() => {
    if (!onReady || readySceneRef.current === model) {
      return;
    }

    readySceneRef.current = model;
    onReady();
  }, [model, onReady]);

  return <primitive object={model} dispose={null} />;
}
