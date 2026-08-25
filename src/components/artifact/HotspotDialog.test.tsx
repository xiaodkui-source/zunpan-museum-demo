import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { zunpanExhibition } from "../../data/artifact";
import type { HotspotRecord } from "../../types/artifact";
import { HotspotDialog } from "./HotspotDialog";

const hotspot = zunpanExhibition.hotspots[0];

afterEach(cleanup);

const renderDialog = (
  props: Partial<{
    hotspot: HotspotRecord | null;
    returnFocusTo: HTMLElement | null;
    portalTarget: HTMLElement | null;
    onClose: () => void;
  }> = {},
) => {
  const onClose = props.onClose ?? vi.fn();

  render(
    <HotspotDialog
      hotspot={props.hotspot === undefined ? hotspot : props.hotspot}
      interpretationNotice={zunpanExhibition.interpretationNotice}
      returnFocusTo={props.returnFocusTo}
      portalTarget={props.portalTarget}
      onClose={onClose}
    />,
  );

  return { onClose };
};

describe("HotspotDialog", () => {
  it("renders the selected hotspot and its independent interpretation notice", () => {
    renderDialog();

    const dialog = screen.getByRole("dialog", { name: hotspot.title });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveTextContent(hotspot.description);
    expect(dialog).toHaveTextContent(zunpanExhibition.interpretationNotice);
  });

  it("portals into a supplied fullscreen subtree target", () => {
    const portalTarget = document.createElement("div");
    portalTarget.setAttribute("data-artifact-viewer", "");
    document.body.append(portalTarget);

    renderDialog({ portalTarget });

    expect(portalTarget).toContainElement(
      screen.getByRole("dialog", { name: hotspot.title }),
    );
  });

  it("moves focus to its accessible close button when opened", async () => {
    renderDialog();

    const closeButton = screen.getByRole("button", { name: "关闭热点详情" });
    await waitFor(() => expect(closeButton).toHaveFocus());
    expect(closeButton.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("requests close when Escape is pressed", async () => {
    const user = userEvent.setup();
    const { onClose } = renderDialog();

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("requests close from the close button", async () => {
    const user = userEvent.setup();
    const { onClose } = renderDialog();

    await user.click(screen.getByRole("button", { name: "关闭热点详情" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes from the backdrop without treating a panel click as a backdrop click", () => {
    const { onClose } = renderDialog();
    const dialog = screen.getByRole("dialog", { name: hotspot.title });
    const backdrop = dialog.parentElement;

    expect(backdrop).not.toBeNull();
    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(backdrop as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("traps forward and backward Tab navigation inside the dialog", async () => {
    const user = userEvent.setup();
    renderDialog();
    const closeButton = screen.getByRole("button", { name: "关闭热点详情" });

    await waitFor(() => expect(closeButton).toHaveFocus());
    await user.tab();
    expect(closeButton).toHaveFocus();

    await user.tab({ shift: true });
    expect(closeButton).toHaveFocus();
  });

  it("restores focus to the exact opener after closing and unmounting", async () => {
    const user = userEvent.setup();
    const opener = document.createElement("button");
    opener.textContent = "热点入口";
    document.body.append(opener);
    opener.focus();

    const Harness = () => {
      const [selected, setSelected] = useState<HotspotRecord | null>(hotspot);

      return (
        <HotspotDialog
          hotspot={selected}
          interpretationNotice={zunpanExhibition.interpretationNotice}
          returnFocusTo={opener}
          onClose={() => setSelected(null)}
        />
      );
    };

    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "关闭热点详情" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(opener).toHaveFocus());
  });
});
