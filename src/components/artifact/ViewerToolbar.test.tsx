import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ViewerToolbar } from "./ViewerToolbar";

afterEach(cleanup);

const renderToolbar = ({
  autoRotate = true,
  hotspotsVisible = true,
  fullscreen = false,
} = {}) => {
  const callbacks = {
    onReset: vi.fn(),
    onToggleAutoRotate: vi.fn(),
    onToggleHotspots: vi.fn(),
    onToggleFullscreen: vi.fn(),
  };

  const view = render(
    <ViewerToolbar
      autoRotate={autoRotate}
      hotspotsVisible={hotspotsVisible}
      fullscreen={fullscreen}
      {...callbacks}
    />,
  );

  return { ...view, ...callbacks };
};

describe("ViewerToolbar", () => {
  it("exposes text and aria-pressed state for rotation and hotspot toggles", () => {
    const { rerender } = renderToolbar();

    expect(screen.getByRole("button", { name: "自动旋转：开" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "热点显示：开" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "全屏查看" })).toHaveAttribute(
      "data-viewer-fullscreen-control",
    );
    expect(screen.getByText("自动旋转：开")).toHaveAttribute(
      "data-viewer-control-label",
      "visible",
    );
    expect(screen.getByText("热点显示：开")).toHaveAttribute(
      "data-viewer-control-label",
      "visible",
    );

    rerender(
      <ViewerToolbar
        autoRotate={false}
        hotspotsVisible={false}
        fullscreen
        onReset={vi.fn()}
        onToggleAutoRotate={vi.fn()}
        onToggleHotspots={vi.fn()}
        onToggleFullscreen={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "自动旋转：关" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "热点显示：关" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "退出全屏" })).toBeInTheDocument();
  });

  it("calls the matching callback for every control", async () => {
    const user = userEvent.setup();
    const callbacks = renderToolbar();

    await user.click(screen.getByRole("button", { name: "重置视角" }));
    await user.click(screen.getByRole("button", { name: "自动旋转：开" }));
    await user.click(screen.getByRole("button", { name: "热点显示：开" }));
    await user.click(screen.getByRole("button", { name: "全屏查看" }));

    expect(callbacks.onReset).toHaveBeenCalledTimes(1);
    expect(callbacks.onToggleAutoRotate).toHaveBeenCalledTimes(1);
    expect(callbacks.onToggleHotspots).toHaveBeenCalledTimes(1);
    expect(callbacks.onToggleFullscreen).toHaveBeenCalledTimes(1);
  });

  it("marks every decorative Lucide icon as hidden from assistive technology", () => {
    const { container } = renderToolbar();
    const icons = container.querySelectorAll("svg");

    expect(icons).toHaveLength(4);
    for (const icon of icons) {
      expect(icon).toHaveAttribute("aria-hidden", "true");
    }
  });
});
