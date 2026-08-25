import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { zunpanExhibition } from "../data/artifact";
import { useArtifactViewerController } from "./useArtifactViewerController";

afterEach(cleanup);

const renderController = (reducedMotion = false) =>
  renderHook(() =>
    useArtifactViewerController({
      hotspots: zunpanExhibition.hotspots,
      defaultCamera: zunpanExhibition.model.defaultCamera,
      reducedMotion,
    }),
  );

describe("useArtifactViewerController", () => {
  it("starts with the default camera and motion-aware rotation state", () => {
    const standard = renderController();

    expect(standard.result.current.selectedHotspotId).toBeNull();
    expect(standard.result.current.selectedHotspot).toBeNull();
    expect(standard.result.current.autoRotate).toBe(true);
    expect(standard.result.current.hotspotsVisible).toBe(true);
    expect(standard.result.current.cameraCommand).toEqual({
      sequence: 0,
      reason: "initial",
      pose: zunpanExhibition.model.defaultCamera,
    });

    standard.unmount();

    const reduced = renderController(true);
    expect(reduced.result.current.autoRotate).toBe(false);
  });

  it("stops rotation when reduced motion becomes active without restarting it later", () => {
    const { result, rerender } = renderHook(
      ({ reducedMotion }) =>
        useArtifactViewerController({
          hotspots: zunpanExhibition.hotspots,
          defaultCamera: zunpanExhibition.model.defaultCamera,
          reducedMotion,
        }),
      { initialProps: { reducedMotion: false } },
    );

    expect(result.current.autoRotate).toBe(true);

    rerender({ reducedMotion: true });
    expect(result.current.autoRotate).toBe(false);

    rerender({ reducedMotion: false });
    expect(result.current.autoRotate).toBe(false);
  });

  it("selects a valid hotspot, pauses rotation, and advances the camera command", () => {
    const { result } = renderController();
    const hotspot = zunpanExhibition.hotspots[1];
    const opener = document.createElement("button");

    act(() => result.current.selectHotspot(hotspot.id, opener));

    expect(result.current.selectedHotspotId).toBe(hotspot.id);
    expect(result.current.selectedHotspot).toBe(hotspot);
    expect(result.current.autoRotate).toBe(false);
    expect(result.current.openerRef.current).toBe(opener);
    expect(result.current.cameraCommand).toEqual({
      sequence: 1,
      reason: "hotspot",
      pose: hotspot.camera,
    });
  });

  it("ignores an unknown hotspot id without changing state", () => {
    const { result } = renderController();
    const initialCommand = result.current.cameraCommand;

    act(() => result.current.selectHotspot("not-a-real-hotspot"));

    expect(result.current.selectedHotspotId).toBeNull();
    expect(result.current.autoRotate).toBe(true);
    expect(result.current.cameraCommand).toBe(initialCommand);
  });

  it("resets to the default pose with an incremented command without restarting rotation", () => {
    const { result } = renderController();

    act(() => result.current.selectHotspot(zunpanExhibition.hotspots[0].id));
    act(() => result.current.resetCamera());

    expect(result.current.selectedHotspotId).toBeNull();
    expect(result.current.autoRotate).toBe(false);
    expect(result.current.cameraCommand).toEqual({
      sequence: 2,
      reason: "reset",
      pose: zunpanExhibition.model.defaultCamera,
    });
  });

  it("supports pausing and toggling rotation and hotspot visibility", () => {
    const { result } = renderController();

    act(() => result.current.pauseAutoRotate());
    expect(result.current.autoRotate).toBe(false);

    act(() => result.current.toggleAutoRotate());
    expect(result.current.autoRotate).toBe(true);

    act(() => result.current.toggleHotspots());
    expect(result.current.hotspotsVisible).toBe(false);

    act(() => result.current.toggleHotspots());
    expect(result.current.hotspotsVisible).toBe(true);
  });

  it("restores focus to the opener when a hotspot closes", async () => {
    const { result } = renderController();
    const opener = document.createElement("button");
    document.body.append(opener);

    act(() => result.current.selectHotspot(zunpanExhibition.hotspots[0].id, opener));
    act(() => result.current.closeHotspot());

    expect(result.current.selectedHotspotId).toBeNull();
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it("closes the selected hotspot and restores focus when markers are hidden", async () => {
    const { result } = renderController();
    const opener = document.createElement("button");
    document.body.append(opener);

    act(() => result.current.selectHotspot(zunpanExhibition.hotspots[0].id, opener));
    act(() => result.current.toggleHotspots());

    expect(result.current.hotspotsVisible).toBe(false);
    expect(result.current.selectedHotspotId).toBeNull();
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it("does not let a stale close task steal focus after another hotspot is selected", async () => {
    const { result } = renderController();
    const openerA = document.createElement("button");
    const openerB = document.createElement("button");
    document.body.append(openerA, openerB);
    openerB.focus();

    act(() => {
      result.current.selectHotspot(zunpanExhibition.hotspots[0].id, openerA);
      result.current.closeHotspot();
      result.current.selectHotspot(zunpanExhibition.hotspots[1].id, openerB);
    });
    await Promise.resolve();

    expect(result.current.selectedHotspotId).toBe(zunpanExhibition.hotspots[1].id);
    expect(result.current.openerRef.current).toBe(openerB);
    expect(openerB).toHaveFocus();
    expect(openerA).not.toHaveFocus();
  });

  it("does not run a queued focus restore after unmount", async () => {
    const { result, unmount } = renderController();
    const opener = document.createElement("button");
    const focusSentinel = document.createElement("button");
    document.body.append(opener, focusSentinel);

    act(() => result.current.selectHotspot(zunpanExhibition.hotspots[0].id, opener));
    focusSentinel.focus();
    act(() => result.current.closeHotspot());
    unmount();
    await Promise.resolve();

    expect(focusSentinel).toHaveFocus();
    expect(opener).not.toHaveFocus();
  });

  it("keeps controller callbacks stable across state changes", () => {
    const { result } = renderController();
    const callbacks = {
      selectHotspot: result.current.selectHotspot,
      closeHotspot: result.current.closeHotspot,
      resetCamera: result.current.resetCamera,
      pauseAutoRotate: result.current.pauseAutoRotate,
      toggleAutoRotate: result.current.toggleAutoRotate,
      toggleHotspots: result.current.toggleHotspots,
    };

    act(() => result.current.toggleAutoRotate());

    expect(result.current.selectHotspot).toBe(callbacks.selectHotspot);
    expect(result.current.closeHotspot).toBe(callbacks.closeHotspot);
    expect(result.current.resetCamera).toBe(callbacks.resetCamera);
    expect(result.current.pauseAutoRotate).toBe(callbacks.pauseAutoRotate);
    expect(result.current.toggleAutoRotate).toBe(callbacks.toggleAutoRotate);
    expect(result.current.toggleHotspots).toBe(callbacks.toggleHotspots);
  });
});
