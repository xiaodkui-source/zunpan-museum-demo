import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ViewerStatusOverlay } from "./ViewerStatusOverlay";
import { WebGLFallback } from "./WebGLFallback";

vi.mock("@react-three/drei", () => ({
  useProgress: () => ({ progress: 42 }),
}));

afterEach(cleanup);

describe("WebGLFallback", () => {
  it("keeps the artifact explorable with the local digital-study poster", () => {
    render(<WebGLFallback />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("实时 3D 暂不可用");
    expect(status).toHaveTextContent("仍可浏览");
    expect(screen.getByRole("img", { name: /曾侯乙尊盘.*数字结构示意/ })).toHaveAttribute(
      "src",
      "/images/zunpan-poster.svg",
    );
  });

  it("notifies its parent exactly once after the WebGL fallback mounts", () => {
    const onUnavailable = vi.fn();
    const { unmount } = render(
      <WebGLFallback onUnavailable={onUnavailable} />,
    );

    expect(onUnavailable).toHaveBeenCalledTimes(1);
    unmount();
    expect(onUnavailable).toHaveBeenCalledTimes(1);
  });

  it("gives WebGL unavailability precedence over model loading progress", () => {
    render(
      <ViewerStatusOverlay
        availability="available"
        modelReady={false}
        modelError={false}
        webglUnavailable
      />,
    );

    expect(
      screen.getByText(
        "当前设备无法启用实时 3D，已显示静态数字结构示意。",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/三维模型加载中/)).not.toBeInTheDocument();
  });
});
