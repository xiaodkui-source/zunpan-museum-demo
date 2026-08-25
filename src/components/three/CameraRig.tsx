import { useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import type { PerspectiveCamera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import type { CameraCommand, CameraPose } from "../../types/artifact";

export interface CameraRigProps {
  cameraCommand: CameraCommand;
  controlsRef: MutableRefObject<OrbitControlsImpl | null>;
  reducedMotion: boolean;
}

interface TweenedCameraPose {
  positionX: number;
  positionY: number;
  positionZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  fov: number;
}

const applyPose = (
  camera: PerspectiveCamera,
  controls: OrbitControlsImpl,
  pose: CameraPose,
  invalidate: () => void,
) => {
  camera.position.set(...pose.position);
  controls.target.set(...pose.target);

  if (pose.fov !== undefined) {
    camera.fov = pose.fov;
    camera.updateProjectionMatrix();
  }

  controls.update();
  invalidate();
};

export function CameraRig({
  cameraCommand,
  controlsRef,
  reducedMotion,
}: CameraRigProps) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const invalidate = useThree((state) => state.invalidate);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const controls = controlsRef.current;

    if (!controls) {
      return undefined;
    }

    tweenRef.current?.kill();
    tweenRef.current = null;

    if (cameraCommand.reason === "initial" || reducedMotion) {
      controls.enabled = true;
      applyPose(camera, controls, cameraCommand.pose, invalidate);
      return undefined;
    }

    const [positionX, positionY, positionZ] = camera.position.toArray();
    const [targetX, targetY, targetZ] = controls.target.toArray();
    const [nextPositionX, nextPositionY, nextPositionZ] =
      cameraCommand.pose.position;
    const [nextTargetX, nextTargetY, nextTargetZ] = cameraCommand.pose.target;
    const state: TweenedCameraPose = {
      positionX,
      positionY,
      positionZ,
      targetX,
      targetY,
      targetZ,
      fov: camera.fov,
    };

    controls.enabled = false;

    const restoreControls = () => {
      controls.enabled = true;
      controls.update();
      invalidate();
    };

    const tween = gsap.to(state, {
      positionX: nextPositionX,
      positionY: nextPositionY,
      positionZ: nextPositionZ,
      targetX: nextTargetX,
      targetY: nextTargetY,
      targetZ: nextTargetZ,
      fov: cameraCommand.pose.fov ?? camera.fov,
      duration: 0.86,
      ease: "power2.inOut",
      onUpdate: () => {
        camera.position.set(state.positionX, state.positionY, state.positionZ);
        controls.target.set(state.targetX, state.targetY, state.targetZ);
        camera.fov = state.fov;
        camera.updateProjectionMatrix();
        controls.update();
        invalidate();
      },
      onComplete: restoreControls,
      onInterrupt: restoreControls,
    });

    tweenRef.current = tween;

    return () => {
      if (tweenRef.current === tween) {
        tweenRef.current = null;
      }
      tween.kill();
      controls.enabled = true;
    };
  }, [camera, cameraCommand.sequence, cameraCommand, controlsRef, invalidate, reducedMotion]);

  return null;
}
