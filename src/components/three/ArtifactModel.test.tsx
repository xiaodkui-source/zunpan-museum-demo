import { cleanup, render, waitFor } from "@testing-library/react";
import { BoxGeometry, Mesh, MeshStandardMaterial, Scene } from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ArtifactModel } from "./ArtifactModel";

const modelMocks = vi.hoisted(() => ({
  useGLTF: vi.fn(),
  preload: vi.fn(),
}));

vi.mock("@react-three/drei", () => {
  Object.assign(modelMocks.useGLTF, { preload: modelMocks.preload });
  return { useGLTF: modelMocks.useGLTF };
});

describe("ArtifactModel", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    Object.values(modelMocks).forEach((mock) => mock.mockClear());
  });

  it("loads on demand, clones and transforms the scene, then reports readiness after mount", async () => {
    const onReady = vi.fn();
    const scene = new Scene();
    scene.add(new Mesh(new BoxGeometry(), new MeshStandardMaterial()));
    const clone = vi.spyOn(scene, "clone");
    const transform = {
      position: [1, 2, 3],
      rotation: [0.1, 0.2, 0.3],
      scale: [1.1, 1.2, 1.3],
    } as const;
    modelMocks.useGLTF.mockReturnValue({ scene });

    render(
      <ArtifactModel
        src="/models/zunpan.glb"
        transform={transform}
        onReady={onReady}
      />,
    );

    expect(modelMocks.useGLTF).toHaveBeenCalledWith("/models/zunpan.glb");
    expect(clone).toHaveBeenCalledWith(true);
    const clonedScene = clone.mock.results[0]?.value;
    expect(clonedScene).toBeDefined();
    if (!clonedScene) {
      throw new Error("Expected the model scene to be cloned");
    }
    expect(clonedScene.position.toArray()).toEqual([1, 2, 3]);
    expect(clonedScene.rotation.x).toBeCloseTo(0.1);
    expect(clonedScene.rotation.y).toBeCloseTo(0.2);
    expect(clonedScene.rotation.z).toBeCloseTo(0.3);
    expect(clonedScene.scale.toArray()).toEqual([1.1, 1.2, 1.3]);
    expect(modelMocks.preload).not.toHaveBeenCalled();
    await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
  });

  it("preserves shared model resources without cloning or disposing them", () => {
    const geometry = new BoxGeometry();
    const sharedMaterial = new MeshStandardMaterial();
    const scene = new Scene();
    scene.add(
      new Mesh(geometry, sharedMaterial),
      new Mesh(geometry, sharedMaterial),
    );
    const geometryDispose = vi.spyOn(geometry, "dispose");
    const materialDispose = vi.spyOn(sharedMaterial, "dispose");
    const cloneMaterial = vi.spyOn(sharedMaterial, "clone");
    const cloneScene = vi.spyOn(scene, "clone");
    modelMocks.useGLTF.mockReturnValue({ scene });

    const { unmount } = render(
      <ArtifactModel
        src="/models/zunpan.glb"
        transform={{
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        }}
      />,
    );

    const clonedScene = cloneScene.mock.results[0]?.value as Scene | undefined;
    const clonedMeshes = clonedScene?.children as Mesh[] | undefined;
    expect(clonedMeshes).toHaveLength(2);
    expect(clonedMeshes?.[0]?.geometry).toBe(geometry);
    expect(clonedMeshes?.[1]?.geometry).toBe(geometry);
    expect(clonedMeshes?.[0]?.material).toBe(sharedMaterial);
    expect(clonedMeshes?.[1]?.material).toBe(sharedMaterial);

    unmount();

    expect(geometryDispose).not.toHaveBeenCalled();
    expect(materialDispose).not.toHaveBeenCalled();
    expect(cloneMaterial).not.toHaveBeenCalled();
  });
});
