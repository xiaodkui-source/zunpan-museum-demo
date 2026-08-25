import { Box3, Vector3 } from "three";
import { describe, expect, it } from "vitest";

import { frameModelBounds } from "./modelFraming";

describe("frameModelBounds", () => {
  it("centers an offset GLB and scales its height to the intended display height", () => {
    const frame = frameModelBounds(
      new Box3(new Vector3(-0.5, 0, -0.5), new Vector3(0.5, 0.765, 0.5)),
      2.5,
    );

    expect(frame.scale).toBeCloseTo(3.2679738562);
    expect(frame.position).toEqual([0, -1.25, 0]);
  });
});
