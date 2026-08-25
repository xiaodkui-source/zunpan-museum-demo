import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { zunpanExhibition } from "../../data/artifact";
import { OrnamentSection } from "./OrnamentSection";

afterEach(cleanup);

describe("OrnamentSection", () => {
  it("renders a labelled section with three centralized ornament studies", () => {
    render(<OrnamentSection exhibition={zunpanExhibition} />);

    const section = document.querySelector<HTMLElement>("section#ornaments");
    expect(section).not.toBeNull();
    expect(section).toHaveAttribute("aria-labelledby", "ornaments-title");
    expect(
      screen.getByRole("heading", { level: 2, name: "纹饰解析" }),
    ).toHaveAttribute("id", "ornaments-title");
    expect(screen.getByText("DETAIL STUDY · 03")).toBeVisible();

    const cards = section?.querySelectorAll('[data-reveal="card"]') ?? [];
    expect(cards).toHaveLength(3);
    expect(
      within(section as HTMLElement).getAllByText("数字纹样示意"),
    ).toHaveLength(3);

    zunpanExhibition.ornaments.forEach((item, index) => {
      const card = cards[index] as HTMLElement;
      expect(
        within(card).getByRole("heading", { level: 3, name: item.title }),
      ).toBeVisible();
      expect(within(card).getByText(item.description)).toBeVisible();
      expect(within(card).getByRole("img", { name: item.alt })).toHaveAttribute(
        "src",
        item.media,
      );
      expect(
        within(card).getByRole("button", { name: `查看${item.title}细节` }),
      ).toHaveTextContent("查看细节");
    });
  });

  it("opens the second item in a single lightbox and returns focus to its exact button", async () => {
    const user = userEvent.setup();
    render(<OrnamentSection exhibition={zunpanExhibition} />);
    const secondItem = zunpanExhibition.ornaments[1];
    const secondOpener = screen.getByRole("button", {
      name: `查看${secondItem.title}细节`,
    });

    await user.click(secondOpener);

    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    const dialog = screen.getByRole("dialog", { name: secondItem.title });
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByRole("img", { name: secondItem.alt }),
    ).toHaveAttribute("src", secondItem.media);
    expect(screen.getByText("2 / 3")).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "关闭纹饰细节" }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(secondOpener).toHaveFocus());
  });
});
