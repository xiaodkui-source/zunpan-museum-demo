import type { ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { zunpanExhibition } from "../../data/artifact";
import { ArtifactViewer } from "./ArtifactViewer";

const canvasMode = vi.hoisted(() => ({ fallback: false }));

vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children, fallback }: { children: ReactNode; fallback: ReactNode }) => (
    <div data-testid="canvas-mock">
      {canvasMode.fallback ? fallback : children}
    </div>
  ),
}));

vi.mock("@react-three/drei", () => ({
  PerformanceMonitor: () => null,
  useProgress: () => ({ progress: 0 }),
}));

vi.mock("../../hooks/useModelAvailability", () => ({
  useModelAvailability: () => ({ status: "missing", message: null }),
}));

vi.mock("./ArtifactScene", () => ({
  ArtifactScene: () => null,
}));

let fullscreenElement: Element | null = null;

describe("ArtifactViewer fullscreen controller", () => {
  beforeEach(() => {
    canvasMode.fallback = false;
    fullscreenElement = null;
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => fullscreenElement,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    fullscreenElement = null;
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: null,
    });
  });

  it("reports a rejected fullscreen request without throwing and preserves trigger focus", async () => {
    render(<ArtifactViewer exhibition={zunpanExhibition} />);
    const viewer = screen.getByRole("group", {
      name: `${zunpanExhibition.title}三维交互查看器`,
    });
    const control = screen.getByRole("button", { name: "全屏查看" });
    const trigger = document.createElement("button");
    document.body.append(trigger);
    trigger.focus();
    const requestFullscreen = vi.fn(async () => {
      throw new Error("fullscreen rejected");
    });
    Object.defineProperty(viewer, "requestFullscreen", {
      configurable: true,
      value: requestFullscreen,
    });

    act(() => control.click());

    expect(
      await screen.findByText("当前浏览器未能进入全屏，可继续在页面中浏览"),
    ).toBeInTheDocument();
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveFocus();
  });

  it("announces a static digital study instead of loading when Canvas falls back", async () => {
    canvasMode.fallback = true;

    render(<ArtifactViewer exhibition={zunpanExhibition} />);

    expect(
      await screen.findByText(
        "当前设备无法启用实时 3D，已显示静态数字结构示意。",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/三维模型加载中/)).not.toBeInTheDocument();
  });

  it("restores the original programmatic trigger after fullscreen exits", async () => {
    render(<ArtifactViewer exhibition={zunpanExhibition} />);
    const viewer = screen.getByRole("group", {
      name: `${zunpanExhibition.title}三维交互查看器`,
    });
    const trigger = document.createElement("button");
    document.body.append(trigger);
    trigger.focus();
    const requestFullscreen = vi.fn(async () => {
      fullscreenElement = viewer;
      fireEvent(document, new Event("fullscreenchange"));
    });
    const exitFullscreen = vi.fn(async () => {
      fullscreenElement = null;
      fireEvent(document, new Event("fullscreenchange"));
    });
    Object.defineProperty(viewer, "requestFullscreen", {
      configurable: true,
      value: requestFullscreen,
    });
    Object.defineProperty(document, "exitFullscreen", {
      configurable: true,
      value: exitFullscreen,
    });

    act(() => screen.getByRole("button", { name: "全屏查看" }).click());
    await screen.findByRole("button", { name: "退出全屏" });

    viewer.focus();
    act(() => screen.getByRole("button", { name: "退出全屏" }).click());

    await waitFor(() => expect(trigger).toHaveFocus());
    expect(exitFullscreen).toHaveBeenCalledTimes(1);
  });
});
