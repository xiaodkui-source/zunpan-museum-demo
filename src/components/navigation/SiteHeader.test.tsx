import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { zunpanExhibition } from "../../data/artifact";
import { SiteHeader } from "./SiteHeader";

const renderHeader = (onEnterImmersive = vi.fn()) => {
  render(
    <SiteHeader
      navigation={zunpanExhibition.navigation}
      onEnterImmersive={onEnterImmersive}
    />,
  );

  return { onEnterImmersive };
};

afterEach(cleanup);

describe("SiteHeader", () => {
  beforeEach(() => {
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 0,
    });
  });

  it("renders the exhibition brand and data-backed navigation links", () => {
    renderHeader();

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByText(zunpanExhibition.title)).toBeInTheDocument();
    const primaryNavigation = screen.getByRole("navigation", { name: "主导航" });

    for (const item of zunpanExhibition.navigation) {
      expect(within(primaryNavigation).getByRole("link", { name: item.label })).toHaveAttribute(
        "href",
        `#${item.id}`,
      );
    }
  });

  it("calls the immersive-mode callback once", async () => {
    const user = userEvent.setup();
    const { onEnterImmersive } = renderHeader();

    const button = screen.getByRole("button", { name: "进入沉浸模式" });
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");

    await user.click(button);

    expect(onEnterImmersive).toHaveBeenCalledTimes(1);
  });

  it("opens and closes the mobile menu with its button and Escape", async () => {
    const user = userEvent.setup();
    renderHeader();

    const menuButton = screen.getByRole("button", { name: "打开导航菜单" });
    const controlledId = menuButton.getAttribute("aria-controls");
    expect(controlledId).toBeTruthy();
    const mobileNavigation = document.getElementById(controlledId ?? "");
    expect(mobileNavigation).toHaveAttribute("aria-label", "移动导航");

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(mobileNavigation).not.toBeVisible();

    await user.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "关闭导航菜单" })).toBe(menuButton);
    expect(mobileNavigation).toBeVisible();

    await user.keyboard("{Escape}");

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(mobileNavigation).not.toBeVisible();
  });

  it("closes the mobile menu after a navigation link is selected", async () => {
    const user = userEvent.setup();
    renderHeader();

    const menuButton = screen.getByRole("button", { name: "打开导航菜单" });
    await user.click(menuButton);

    const mobileNavigation = screen.getByRole("navigation", { name: "移动导航" });
    await user.click(
      within(mobileNavigation).getByRole("link", {
        name: zunpanExhibition.navigation[1].label,
      }),
    );

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(mobileNavigation).not.toBeVisible();
  });

  it("reflects whether the page has scrolled beyond the header threshold", () => {
    renderHeader();
    const header = screen.getByRole("banner");

    expect(header).toHaveAttribute("data-scrolled", "false");

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 96,
    });
    fireEvent.scroll(window);

    expect(header).toHaveAttribute("data-scrolled", "true");

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 0,
    });
    fireEvent.scroll(window);

    expect(header).toHaveAttribute("data-scrolled", "false");
  });
});
