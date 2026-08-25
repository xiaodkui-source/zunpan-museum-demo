import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PlaceholderArtifact } from "./PlaceholderArtifact";

describe("PlaceholderArtifact", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("builds an upper vessel and lower basin from controlled museum-study geometry", () => {
    const { container } = render(<PlaceholderArtifact />);

    expect(container.querySelectorAll("mesh").length).toBeGreaterThanOrEqual(7);
    expect(container.querySelector("lathegeometry")).not.toBeNull();
    expect(container.querySelector("cylindergeometry")).not.toBeNull();
    expect(container.querySelector("torusgeometry")).not.toBeNull();
    expect(container.querySelector("boxgeometry, spheregeometry")).toBeNull();
  });

  it("uses one instanced ornament resource instead of eight repeated meshes", () => {
    const { container } = render(<PlaceholderArtifact />);
    const ornaments = container.querySelectorAll("instancedmesh");

    expect(ornaments).toHaveLength(1);
    expect(ornaments[0].querySelectorAll("torusgeometry")).toHaveLength(1);
    expect(ornaments[0].querySelectorAll("meshstandardmaterial")).toHaveLength(1);
  });
});
