import { describe, expect, it } from "vitest";

import { shouldAutoRotate } from "./viewerMotion";

describe("ArtifactScene render activity", () => {
  it("stops auto rotation while inactive and restores only an unpaused preference", () => {
    expect(shouldAutoRotate(true, false, false)).toBe(false);
    expect(shouldAutoRotate(true, false, true)).toBe(true);
    expect(shouldAutoRotate(false, false, true)).toBe(false);
    expect(shouldAutoRotate(true, true, true)).toBe(false);
  });
});
