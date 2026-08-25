import { ContactShadows, OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import type { Group } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import type {
  ArtifactModelConfig,
  CameraCommand,
  HotspotRecord,
  ModelTransform,
  Vec3,
} from "../../types/artifact";
import { ArtifactModel } from "./ArtifactModel";
import { CameraRig } from "./CameraRig";
import { DustField } from "./DustField";
import { HotspotMarker } from "./HotspotMarker";
import { ModelErrorBoundary } from "./ModelErrorBoundary";
import { PlaceholderArtifact } from "./PlaceholderArtifact";
import { shouldAutoRotate } from "./viewerMotion";

export interface ArtifactSceneProps {
  model: ArtifactModelConfig;
  hotspots: readonly HotspotRecord[];
  modelAvailable: boolean;
  autoRotate: boolean;
  hotspotsVisible: boolean;
  cameraCommand: CameraCommand;
  reducedMotion: boolean;
  lowQuality: boolean;
  shadows: boolean;
  dustCount: number;
  renderActive: boolean;
  onPauseAutoRotate(): void;
  onSelectHotspot(id: string, opener: HTMLButtonElement): void;
  onModelReady(): void;
  onModelError(): void;
}

const IDENTITY_TRANSFORM: ModelTransform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};

const mutableTuple = ([x, y, z]: Vec3): [number, number, number] => [x, y, z];

export function ArtifactScene({
  model,
  hotspots,
  modelAvailable,
  autoRotate,
  hotspotsVisible,
  cameraCommand,
  reducedMotion,
  lowQuality,
  shadows,
  dustCount,
  renderActive,
  onPauseAutoRotate,
  onSelectHotspot,
  onModelReady,
  onModelError,
}: ArtifactSceneProps) {
  const floatingGroupRef = useRef<Group | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const invalidate = useThree((state) => state.invalidate);

  useFrame(({ clock }) => {
    if (!floatingGroupRef.current) {
      return;
    }

    floatingGroupRef.current.position.y = reducedMotion
      ? 0
      : Math.sin(clock.elapsedTime * 0.46) * 0.022;
  });

  return (
    <>
      <ambientLight intensity={0.52} color="#ddcda9" />
      <hemisphereLight
        color="#e6c586"
        groundColor="#0b2922"
        intensity={0.68}
      />
      <directionalLight
        castShadow={shadows}
        color="#e5b36a"
        intensity={3}
        position={[4.4, 5.3, 5.6]}
        shadow-mapSize-width={shadows ? 1024 : 256}
        shadow-mapSize-height={shadows ? 1024 : 256}
      />
      <directionalLight
        color="#6cb7a1"
        intensity={1.15}
        position={[-4.5, 2.8, 3.8]}
      />
      <spotLight
        color="#4e8579"
        intensity={1.45}
        angle={0.62}
        penumbra={0.82}
        position={[-3.8, 3.6, -2.6]}
      />
      <pointLight color="#f0dcc0" intensity={1.15} position={[-1.6, 1.8, 3.6]} />

      <mesh position={[0, 0.25, -3.4]} scale={[1.25, 1.25, 1]}>
        <circleGeometry args={[3.2, 64]} />
        <meshBasicMaterial
          color="#315f57"
          transparent
          opacity={0.075}
          depthWrite={false}
        />
      </mesh>

      <group ref={floatingGroupRef}>
        <group
          position={mutableTuple(model.transform.position)}
          rotation={mutableTuple(model.transform.rotation)}
          scale={mutableTuple(model.transform.scale)}
        >
          {modelAvailable ? (
            <ModelErrorBoundary
              fallback={<PlaceholderArtifact transform={IDENTITY_TRANSFORM} />}
              onError={onModelError}
              resetKey={model.src}
            >
              <Suspense fallback={<PlaceholderArtifact transform={IDENTITY_TRANSFORM} />}>
                <ArtifactModel
                  src={model.src}
                  transform={IDENTITY_TRANSFORM}
                  onReady={onModelReady}
                />
              </Suspense>
            </ModelErrorBoundary>
          ) : (
            <PlaceholderArtifact transform={IDENTITY_TRANSFORM} />
          )}

          {hotspotsVisible
            ? hotspots.map((hotspot, index) => (
                <HotspotMarker
                  key={hotspot.id}
                  hotspot={hotspot}
                  index={index}
                  onSelect={onSelectHotspot}
                />
              ))
            : null}
        </group>
      </group>

      {shadows && !lowQuality && !reducedMotion ? (
        <ContactShadows
          position={[0, -1.1, 0]}
          opacity={0.3}
          scale={7}
          blur={2.7}
          far={4.5}
          resolution={512}
          color="#050807"
          frames={1}
        />
      ) : null}

      <DustField count={dustCount} active={renderActive} />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan
        enableDamping
        dampingFactor={0.075}
        minDistance={model.minDistance}
        maxDistance={model.maxDistance}
        autoRotate={shouldAutoRotate(autoRotate, reducedMotion, renderActive)}
        autoRotateSpeed={0.45}
        target={mutableTuple(model.defaultCamera.target)}
        onStart={onPauseAutoRotate}
        onChange={() => invalidate()}
      />
      <CameraRig
        cameraCommand={cameraCommand}
        controlsRef={controlsRef}
        reducedMotion={reducedMotion}
      />
    </>
  );
}
