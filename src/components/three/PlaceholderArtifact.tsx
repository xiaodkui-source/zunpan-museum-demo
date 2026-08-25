import { Object3D, Vector2 } from "three";
import type { InstancedMesh } from "three";

import type { ModelTransform, Vec3 } from "../../types/artifact";

export interface PlaceholderArtifactProps {
  transform?: ModelTransform;
}

const IDENTITY_TRANSFORM: ModelTransform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};

const ZUN_PROFILE = [
  new Vector2(0.34, 0),
  new Vector2(0.42, 0.08),
  new Vector2(0.43, 0.2),
  new Vector2(0.64, 0.38),
  new Vector2(0.76, 0.64),
  new Vector2(0.69, 0.92),
  new Vector2(0.48, 1.16),
  new Vector2(0.42, 1.46),
  new Vector2(0.66, 1.72),
  new Vector2(0.94, 1.93),
  new Vector2(1.02, 2.05),
];

const ORNAMENT_ANGLES = Array.from(
  { length: 8 },
  (_, index) => (index / 8) * Math.PI * 2,
);
const ORNAMENT_TRANSFORM = new Object3D();

const positionOrnaments = (mesh: InstancedMesh) => {
  ORNAMENT_ANGLES.forEach((angle, index) => {
    ORNAMENT_TRANSFORM.position.set(
      Math.cos(angle) * 0.79,
      0.72,
      Math.sin(angle) * 0.79,
    );
    ORNAMENT_TRANSFORM.rotation.set(Math.PI / 2, angle, 0);
    ORNAMENT_TRANSFORM.scale.set(1, 1, 1);
    ORNAMENT_TRANSFORM.updateMatrix();
    mesh.setMatrixAt(index, ORNAMENT_TRANSFORM.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
};

const mutableTuple = ([x, y, z]: Vec3): [number, number, number] => [x, y, z];

export function PlaceholderArtifact({
  transform = IDENTITY_TRANSFORM,
}: PlaceholderArtifactProps) {
  return (
    <group
      name="zunpan-digital-study"
      position={mutableTuple(transform.position)}
      rotation={mutableTuple(transform.rotation)}
      scale={mutableTuple(transform.scale)}
    >
      <group name="lower-basin">
        <mesh position={[0, -0.92, 0]} receiveShadow>
          <cylinderGeometry args={[0.82, 0.92, 0.18, 72]} />
          <meshStandardMaterial
            color="#30271f"
            metalness={0.84}
            roughness={0.38}
          />
        </mesh>

        <mesh position={[0, -0.66, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[1.5, 1.28, 0.34, 96]} />
          <meshStandardMaterial
            color="#4a3827"
            metalness={0.88}
            roughness={0.32}
          />
        </mesh>

        <mesh position={[0, -0.47, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.42, 0.08, 14, 96]} />
          <meshStandardMaterial
            color="#b6965d"
            metalness={0.9}
            roughness={0.24}
          />
        </mesh>

        <mesh position={[0, -0.72, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.18, 0.035, 10, 96]} />
          <meshStandardMaterial
            color="#356c62"
            metalness={0.7}
            roughness={0.48}
          />
        </mesh>
      </group>

      <group name="upper-vessel" position={[0, -0.44, 0]}>
        <mesh castShadow receiveShadow>
          <latheGeometry args={[ZUN_PROFILE, 96]} />
          <meshStandardMaterial
            color="#463527"
            metalness={0.9}
            roughness={0.31}
          />
        </mesh>

        <mesh position={[0, 2.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.99, 0.075, 16, 96]} />
          <meshStandardMaterial
            color="#c0a06a"
            metalness={0.93}
            roughness={0.22}
          />
        </mesh>

        <mesh position={[0, 1.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.44, 0.04, 12, 72]} />
          <meshStandardMaterial
            color="#8f744b"
            metalness={0.88}
            roughness={0.3}
          />
        </mesh>

        <mesh position={[0, 0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.39, 0.045, 12, 72]} />
          <meshStandardMaterial
            color="#3b756a"
            metalness={0.75}
            roughness={0.44}
          />
        </mesh>

        <instancedMesh
          name="vessel-ornaments"
          args={[undefined, undefined, ORNAMENT_ANGLES.length]}
          castShadow
          frustumCulled={false}
          onUpdate={positionOrnaments}
        >
          <torusGeometry args={[0.17, 0.035, 10, 28]} />
          <meshStandardMaterial
            color="#527b69"
            metalness={0.82}
            roughness={0.36}
          />
        </instancedMesh>
      </group>
    </group>
  );
}
