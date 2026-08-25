import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { zunpanExhibition } from "../../data/artifact";
import { SiteFooter } from "./SiteFooter";

function renderFooter() {
  return render(
    <>
      <section id="home">
        <h1 id="exhibition-title" tabIndex={-1}>
          {zunpanExhibition.title}
        </h1>
      </section>
      <SiteFooter exhibition={zunpanExhibition} />
    </>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("SiteFooter", () => {
  it("renders the exact centralized identity, project, review, and copyright copy", () => {
    renderFooter();
    const footer = screen.getByRole("contentinfo");

    expect(within(footer).getByText("曾侯乙尊盘", { exact: true })).toBeVisible();
    expect(
      within(footer).getByText("Zun and Pan of Marquis Yi of Zeng", {
        exact: true,
      }),
    ).toBeVisible();
    expect(
      within(footer).getByText(
        "本页面为曾侯乙墓数字文物展示网站的交互原型，用于探索三维文物、数字叙事与博物馆线上展陈的结合方式。",
        { exact: true },
      ),
    ).toBeVisible();
    expect(
      within(footer).getByText(
        "文物资料将在正式版本中依据湖北省博物馆及相关考古报告进行校订。",
        { exact: true },
      ),
    ).toBeVisible();
    expect(
      within(footer).getByText("© 2026 曾侯乙尊盘数字展陈 Demo", {
        exact: true,
      }),
    ).toBeVisible();
    expect(footer.querySelectorAll('a[href^="http"]')).toHaveLength(0);
  });

  it("smoothly returns to home and restores focus to the exhibition title", () => {
    renderFooter();
    const home = document.getElementById("home") as HTMLElement;
    const title = document.getElementById("exhibition-title") as HTMLElement;
    const scrollIntoView = vi.fn();
    const focus = vi.spyOn(title, "focus");

    Object.defineProperty(home, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false }) as MediaQueryList),
    );

    const button = screen.getByRole("button", { name: "返回顶部" });
    const icon = button.querySelector("svg");
    fireEvent.click(button);

    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(title).toHaveFocus();
  });

  it("remains safe with reduced motion, a missing scroll API, and focus-option failure", () => {
    renderFooter();
    const home = document.getElementById("home") as HTMLElement;
    const title = document.getElementById("exhibition-title") as HTMLElement;
    const nativeFocus = HTMLElement.prototype.focus;
    const focus = vi.spyOn(title, "focus");
    const scrollTo = vi.fn();

    Object.defineProperty(home, "scrollIntoView", {
      configurable: true,
      value: undefined,
    });
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true }) as MediaQueryList),
    );
    vi.stubGlobal("scrollTo", scrollTo);
    focus.mockImplementation((options?: FocusOptions) => {
      if (options) {
        throw new Error("focus options unsupported");
      }
      nativeFocus.call(title);
    });

    expect(() => {
      fireEvent.click(screen.getByRole("button", { name: "返回顶部" }));
    }).not.toThrow();
    expect(scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: "auto",
    });
    expect(focus).toHaveBeenCalledTimes(2);
    expect(title).toHaveFocus();
  });

  it("falls back to legacy window coordinates when both primary scroll APIs throw", () => {
    renderFooter();
    const home = document.getElementById("home") as HTMLElement;
    const scrollIntoView = vi.fn(() => {
      throw new Error("element scrolling unavailable");
    });
    const scrollTo = vi.fn(
      (first: number | ScrollToOptions, _second?: number) => {
        if (typeof first === "object") {
          throw new Error("options scrolling unavailable");
        }
      },
    );

    Object.defineProperty(home, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false }) as MediaQueryList),
    );
    vi.stubGlobal("scrollTo", scrollTo);

    expect(() => {
      fireEvent.click(screen.getByRole("button", { name: "返回顶部" }));
    }).not.toThrow();
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(scrollTo).toHaveBeenNthCalledWith(1, {
      top: 0,
      left: 0,
      behavior: "smooth",
    });
    expect(scrollTo).toHaveBeenNthCalledWith(2, 0, 0);
  });

  it("uses window scrolling when the home target is absent", () => {
    render(
      <>
        <h1 id="exhibition-title" tabIndex={-1}>
          曾侯乙尊盘
        </h1>
        <SiteFooter exhibition={zunpanExhibition} />
      </>,
    );
    const scrollTo = vi.fn();
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false }) as MediaQueryList),
    );
    vi.stubGlobal("scrollTo", scrollTo);

    fireEvent.click(screen.getByRole("button", { name: "返回顶部" }));

    expect(scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  });
});
