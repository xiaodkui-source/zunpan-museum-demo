import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";

const fullscreenControlClick = vi.hoisted(() => vi.fn());

vi.mock("./components/sections/ArtifactExperienceSection", () => ({
  ArtifactExperienceSection: () => (
    <section id="home" aria-label="mock experience">
      <div data-artifact-viewer>
        <button
          type="button"
          data-viewer-fullscreen-control
          onClick={() => fullscreenControlClick(document.activeElement)}
        >
          viewer fullscreen
        </button>
      </div>
    </section>
  ),
}));

describe("App immersive entry", () => {
  beforeEach(() => {
    fullscreenControlClick.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("delegates the header action to the viewer fullscreen control without moving focus", async () => {
    const user = userEvent.setup();
    render(<App />);
    const immersiveButton = screen.getByRole("button", {
      name: "进入沉浸模式",
    });
    const viewer = document.querySelector<HTMLElement>("[data-artifact-viewer]");
    const requestFullscreen = vi.fn(async () => undefined);

    expect(viewer).not.toBeNull();
    Object.defineProperty(viewer as HTMLElement, "requestFullscreen", {
      configurable: true,
      value: requestFullscreen,
    });

    await user.click(immersiveButton);

    expect(fullscreenControlClick).toHaveBeenCalledWith(immersiveButton);
    expect(requestFullscreen).not.toHaveBeenCalled();
    expect(immersiveButton).toHaveFocus();
  });

  it("integrates one complete overview and ornament study section", () => {
    render(<App />);

    expect(document.querySelectorAll("section#overview")).toHaveLength(1);
    expect(screen.getByLabelText("文物档案数据")).toBeInTheDocument();
    expect(document.querySelectorAll("section#ornaments")).toHaveLength(1);
    expect(
      document.querySelectorAll('#ornaments [data-reveal="card"]'),
    ).toHaveLength(3);
    expect(document.querySelectorAll("h1")).toHaveLength(0);
  });
});
