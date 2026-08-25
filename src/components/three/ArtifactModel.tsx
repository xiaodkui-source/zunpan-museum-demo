import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { Box3, type Object3D } from "three";

import type { ModelTransform } from "../../types/artifact";
import { frameModelBounds } from "./modelFraming";

export interface ArtifactModelProps {
  src: string;
  transform: ModelTransform;
  onReady?: () => void;
}

const DISPLAY_MODEL_HEIGHT = 2;

export function ArtifactModel({ src, transform, onReady }: ArtifactModelProps) {
  const { scene } = useGLTF(src);
  const readySceneRef = useRef<Object3D | null>(null);
  const [positionX, positionY, positionZ] = transform.position;
  const [rotationX, rotationY, rotationZ] = transform.rotation;
  const [scaleX, scaleY, scaleZ] = transform.scale;

  const model = useMemo(() => {
    const clone = scene.clone(true);
    const frame = frameModelBounds(
      new Box3().setFromObject(clone),
      DISPLAY_MODEL_HEIGHT,
    );

    clone.position.set(
      frame.position[0] + positionX,
      frame.position[1] + positionY,
      frame.position[2] + positionZ,
    );
    clone.rotation.set(rotationX, rotationY, rotationZ);
    clone.scale.set(
      frame.scale * scaleX,
      frame.scale * scaleY,
      frame.scale * scaleZ,
    );
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
