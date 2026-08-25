import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { zunpanExhibition } from "../../data/artifact";
import { HistoricalValueSection } from "./HistoricalValueSection";

afterEach(cleanup);

describe("HistoricalValueSection", () => {
  it("renders one semantically labelled history section", () => {
    render(<HistoricalValueSection exhibition={zunpanExhibition} />);

    const section = document.querySelector<HTMLElement>("section#history");
    const heading = screen.getByRole("heading", {
      level: 2,
      name: "历史价值",
    });

    expect(section).not.toBeNull();
    expect(section).toHaveAttribute("aria-labelledby", "history-title");
    expect(heading).toHaveAttribute("id", "history-title");
    expect(screen.getByText("LEGACY · 05")).toBeVisible();
  });

  it("renders the four unique historical values in source order with exact copy", () => {
    render(<HistoricalValueSection exhibition={zunpanExhibition} />);

    const list = screen.getByRole("list", { name: "历史价值解读" });
    const items = within(list).getAllByRole("listitem");
    const renderedKeywords: string[] = [];

    expect(list.tagName).toBe("OL");
    expect(list).toHaveAttribute("data-reveal-group");
    expect(items).toHaveLength(4);

    zunpanExhibition.historicalValues.forEach((value, index) => {
      const item = items[index];

      expect(item).toHaveAttribute("data-reveal-item");
      expect(within(item).getByText(String(index + 1).padStart(2, "0"))).toBeVisible();
      expect(within(item).getByText(value.keyword, { exact: true })).toBeVisible();
      expect(
        within(item).getByRole("heading", { level: 3, name: value.title }),
      ).toBeVisible();
      expect(within(item).getByText(value.description, { exact: true })).toBeVisible();
      renderedKeywords.push(value.keyword);
    });

    expect(renderedKeywords).toEqual(["礼制", "工艺", "审美", "楚风"]);
    expect(new Set(renderedKeywords).size).toBe(4);
  });
});
