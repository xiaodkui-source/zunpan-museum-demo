import { useState } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { zunpanExhibition } from "../../data/artifact";
import { OrnamentLightbox } from "./OrnamentLightbox";

const items = zunpanExhibition.ornaments;

beforeAll(() => {
  class TestPointerEvent extends MouseEvent {
    readonly pointerId: number;

    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
    }
  }

  vi.stubGlobal("PointerEvent", TestPointerEvent);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

const flushMicrotasks = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

interface ControlledLightboxProps {
  initialIndex?: number | null;
  opener?: HTMLElement | null;
  onClose?: () => void;
}

function ControlledLightbox({
  initialIndex = 0,
  opener = null,
  onClose = () => undefined,
}: ControlledLightboxProps) {
  const [index, setIndex] = useState<number | null>(initialIndex);

  return (
    <OrnamentLightbox
      items={items}
      index={index}
      returnFocusTo={opener}
      onIndexChange={setIndex}
      onClose={() => {
        onClose();
        setIndex(null);
      }}
    />
  );
}

describe("OrnamentLightbox", () => {
  it("renders the selected item as a labelled modal in a body portal", async () => {
    render(
      <OrnamentLightbox
        items={items}
        index={0}
        onIndexChange={() => undefined}
        onClose={() => undefined}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: items[0].title });
    const image = screen.getByRole("img", { name: items[0].alt });

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(document.body).toContainElement(dialog);
    expect(dialog).toHaveTextContent(items[0].description);
    expect(image).toHaveAttribute("src", items[0].media);
    expect(image).toHaveAttribute("draggable", "false");
    expect(screen.getByText("1 / 3")).toBeVisible();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "关闭纹饰细节" }),
      ).toHaveFocus(),
    );
  });

  it("does not render a dialog when no item is selected", () => {
    render(
      <OrnamentLightbox
        items={items}
        index={null}
        onIndexChange={() => undefined}
        onClose={() => undefined}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes from its close button and restores the exact opener", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const opener = document.createElement("button");
    opener.textContent = "第二张纹饰入口";
    document.body.append(opener);
    opener.focus();

    render(<ControlledLightbox opener={opener} onClose={onClose} />);
    await user.click(
      screen.getByRole("button", { name: "关闭纹饰细节" }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it("closes on Escape and safely restores focus", async () => {
    const user = userEvent.setup();
    const opener = document.createElement("button");
    opener.textContent = "纹饰入口";
    document.body.append(opener);
    opener.focus();

    render(<ControlledLightbox opener={opener} />);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it("keeps the original open-cycle opener when returnFocusTo changes", async () => {
    const originalOpener = document.createElement("button");
    const replacementOpener = document.createElement("button");
    originalOpener.textContent = "原始入口";
    replacementOpener.textContent = "后续入口";
    document.body.append(originalOpener, replacementOpener);
    originalOpener.focus();

    const { rerender } = render(
      <OrnamentLightbox
        items={items}
        index={0}
        returnFocusTo={originalOpener}
        onIndexChange={() => undefined}
        onClose={() => undefined}
      />,
    );
    const closeButton = screen.getByRole("button", {
      name: "关闭纹饰细节",
    });
    await waitFor(() => expect(closeButton).toHaveFocus());

    rerender(
      <OrnamentLightbox
        items={items}
        index={0}
        returnFocusTo={replacementOpener}
        onIndexChange={() => undefined}
        onClose={() => undefined}
      />,
    );
    await flushMicrotasks();
    expect(closeButton).toHaveFocus();

    rerender(
      <OrnamentLightbox
        items={items}
        index={null}
        returnFocusTo={replacementOpener}
        onIndexChange={() => undefined}
        onClose={() => undefined}
      />,
    );
    await flushMicrotasks();
    expect(originalOpener).toHaveFocus();
  });

  it("invalidates a queued focus restore when reopened before its microtask", async () => {
    const firstOpener = document.createElement("button");
    const secondOpener = document.createElement("button");
    firstOpener.textContent = "首次入口";
    secondOpener.textContent = "再次入口";
    document.body.append(firstOpener, secondOpener);
    firstOpener.focus();

    const { rerender } = render(
      <OrnamentLightbox
        items={items}
        index={0}
        returnFocusTo={firstOpener}
        onIndexChange={() => undefined}
        onClose={() => undefined}
      />,
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "关闭纹饰细节" }),
      ).toHaveFocus(),
    );

    rerender(
      <OrnamentLightbox
        items={items}
        index={null}
        returnFocusTo={firstOpener}
        onIndexChange={() => undefined}
        onClose={() => undefined}
      />,
    );
    rerender(
      <OrnamentLightbox
        items={items}
        index={0}
        returnFocusTo={secondOpener}
        onIndexChange={() => undefined}
        onClose={() => undefined}
      />,
    );
    await flushMicrotasks();

    expect(
      screen.getByRole("button", { name: "关闭纹饰细节" }),
    ).toHaveFocus();
    expect(firstOpener).not.toHaveFocus();
  });

  it("closes from the backdrop but not from the panel", () => {
    const onClose = vi.fn();
    render(
      <OrnamentLightbox
        items={items}
        index={0}
        onIndexChange={() => undefined}
        onClose={onClose}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: items[0].title });
    const backdrop = dialog.parentElement;

    expect(backdrop).not.toBeNull();
    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(backdrop as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("wraps through items with ArrowLeft and ArrowRight", async () => {
    const user = userEvent.setup();
    render(<ControlledLightbox />);

    await user.keyboard("{ArrowLeft}");
    expect(
      screen.getByRole("dialog", { name: items[2].title }),
    ).toBeInTheDocument();
    expect(screen.getByText("3 / 3")).toBeVisible();

    await user.keyboard("{ArrowRight}");
    expect(
      screen.getByRole("dialog", { name: items[0].title }),
    ).toBeInTheDocument();
  });

  it("wraps through items with the visible previous and next buttons", async () => {
    const user = userEvent.setup();
    render(<ControlledLightbox initialIndex={2} />);

    await user.click(screen.getByRole("button", { name: "下一张" }));
    expect(
      screen.getByRole("dialog", { name: items[0].title }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "上一张" }));
    expect(
      screen.getByRole("dialog", { name: items[2].title }),
    ).toBeInTheDocument();
  });

  it("clamps zoom between 100% and 300% and resets to 100%", async () => {
    const user = userEvent.setup();
    render(<ControlledLightbox />);
    const zoomIn = screen.getByRole("button", { name: "放大" });
    const zoomOut = screen.getByRole("button", { name: "缩小" });

    for (let click = 0; click < 12; click += 1) {
      await user.click(zoomIn);
    }
    expect(screen.getByText("300%")).toBeVisible();
    expect(zoomIn).toBeDisabled();

    for (let click = 0; click < 12; click += 1) {
      await user.click(zoomOut);
    }
    expect(screen.getByText("100%")).toBeVisible();
    expect(zoomOut).toBeDisabled();

    await user.click(zoomIn);
    await user.click(zoomIn);
    expect(screen.getByText("150%")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "复位视图" }));
    expect(screen.getByText("100%")).toBeVisible();
  });

  it("resets zoom and pan whenever the selected item changes", async () => {
    const user = userEvent.setup();
    render(<ControlledLightbox />);

    await user.click(screen.getByRole("button", { name: "放大" }));
    const stage = screen.getByTestId("ornament-pan-surface");
    const image = screen.getByRole("img", { name: items[0].alt });
    fireEvent.pointerDown(stage, {
      pointerId: 1,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(stage, {
      pointerId: 1,
      clientX: 180,
      clientY: 150,
    });
    fireEvent.pointerUp(stage, { pointerId: 1 });
    expect(image.style.transform).not.toContain("translate3d(0px, 0px, 0px)");

    await user.click(screen.getByRole("button", { name: "下一张" }));

    expect(screen.getByText("100%")).toBeVisible();
    expect(screen.getByRole("img", { name: items[1].alt })).toHaveStyle({
      transform: "translate3d(0px, 0px, 0px) scale(1)",
    });
  });

  it("resets zoom and pan when the item changes at the same index", async () => {
    const user = userEvent.setup();
    const replacementItems = [
      {
        ...items[0],
        id: "replacement-panchi",
        media: "/images/ornaments/replacement-panchi.svg",
        alt: "替换蟠螭纹数字示意图",
      },
      ...items.slice(1),
    ];
    const { rerender } = render(
      <OrnamentLightbox
        items={items}
        index={0}
        onIndexChange={() => undefined}
        onClose={() => undefined}
      />,
    );

    const zoomIn = screen.getByRole("button", { name: "放大" });
    for (let click = 0; click < 4; click += 1) {
      await user.click(zoomIn);
    }
    const stage = screen.getByTestId("ornament-pan-surface");
    fireEvent.pointerDown(stage, {
      pointerId: 17,
      clientX: 40,
      clientY: 40,
    });
    fireEvent.pointerMove(stage, {
      pointerId: 17,
      clientX: 150,
      clientY: 130,
    });
    expect(screen.getByText("200%")).toBeVisible();

    rerender(
      <OrnamentLightbox
        items={replacementItems}
        index={0}
        onIndexChange={() => undefined}
        onClose={() => undefined}
      />,
    );

    expect(screen.getByText("100%")).toBeVisible();
    expect(
      screen.getByRole("img", { name: "替换蟠螭纹数字示意图" }),
    ).toHaveStyle({
      transform: "translate3d(0px, 0px, 0px) scale(1)",
    });
  });

  it("supports clamped pointer panning while zoomed and stops after pointerup", async () => {
    const user = userEvent.setup();
    render(<ControlledLightbox />);

    await user.click(screen.getByRole("button", { name: "放大" }));
    await user.click(screen.getByRole("button", { name: "放大" }));
    const stage = screen.getByTestId("ornament-pan-surface");
    const image = screen.getByRole("img", { name: items[0].alt });
    const initialTransform = image.style.transform;

    fireEvent.pointerDown(stage, {
      pointerId: 7,
      clientX: 40,
      clientY: 60,
    });
    fireEvent.pointerMove(stage, {
      pointerId: 7,
      clientX: 900,
      clientY: -900,
    });

    expect(image.style.transform).not.toBe(initialTransform);
    expect(image.style.transform).toContain("translate3d(110px, -110px, 0px)");

    fireEvent.pointerUp(stage, { pointerId: 7 });
    const releasedTransform = image.style.transform;
    fireEvent.pointerMove(stage, {
      pointerId: 7,
      clientX: 200,
      clientY: 200,
    });
    expect(image.style.transform).toBe(releasedTransform);
  });

  it("finishes a drag from window events when pointer capture is unavailable", async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { unmount } = render(<ControlledLightbox />);

    const zoomIn = screen.getByRole("button", { name: "放大" });
    for (let click = 0; click < 4; click += 1) {
      await user.click(zoomIn);
    }
    const stage = screen.getByTestId("ornament-pan-surface");
    Object.defineProperty(stage, "setPointerCapture", {
      configurable: true,
      value: undefined,
    });
    const image = screen.getByRole("img", { name: items[0].alt });
    const initialTransform = image.style.transform;

    fireEvent.pointerDown(stage, {
      pointerId: 23,
      clientX: 30,
      clientY: 40,
    });
    fireEvent.pointerMove(window, {
      pointerId: 23,
      clientX: 170,
      clientY: 150,
    });
    expect(image.style.transform).not.toBe(initialTransform);

    fireEvent.pointerUp(window, { pointerId: 23 });
    const releasedTransform = image.style.transform;
    fireEvent.pointerMove(window, {
      pointerId: 23,
      clientX: 260,
      clientY: 250,
    });
    expect(image.style.transform).toBe(releasedTransform);

    unmount();
    fireEvent.pointerMove(window, {
      pointerId: 23,
      clientX: 300,
      clientY: 300,
    });
    fireEvent.pointerUp(window, { pointerId: 23 });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("traps forward and backward Tab navigation inside the dialog", async () => {
    const user = userEvent.setup();
    render(<ControlledLightbox />);
    const dialog = screen.getByRole("dialog", { name: items[0].title });
    const buttons = Array.from(
      dialog.querySelectorAll<HTMLButtonElement>("button:not([disabled])"),
    );
    const closeButton = screen.getByRole("button", {
      name: "关闭纹饰细节",
    });

    await waitFor(() => expect(closeButton).toHaveFocus());
    await user.tab({ shift: true });
    expect(buttons.at(-1)).toHaveFocus();

    await user.tab();
    expect(closeButton).toHaveFocus();
  });
});
