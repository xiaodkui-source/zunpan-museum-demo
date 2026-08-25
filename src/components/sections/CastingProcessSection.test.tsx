import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { zunpanExhibition } from "../../data/artifact";
import { CastingProcessSection } from "./CastingProcessSection";

const expectedCastingSteps = [
  {
    title: "器形设计",
    description:
      "据考古资料推测，工匠可能先根据尊、盘的组合关系进行器形设计。",
  },
  {
    title: "模具与范型制作",
    description: "据考古资料推测，可能采用模具与范型逐步建立器体轮廓。",
  },
  {
    title: "复杂纹饰构件成形",
    description: "复杂镂空构件与多层立体纹饰可能采用分别制备的方式成形。",
  },
  {
    title: "分铸与组合",
    description: "学界通常认为，分铸与连接技术可能用于组合器体和附饰构件。",
  },
  {
    title: "浇注成形",
    description: "据考古资料推测，合范后浇注可能形成主要器体。",
  },
  {
    title: "修整与表面处理",
    description: "修整与表面处理体现出战国时期高水平青铜制造能力。",
  },
] as const;

const expectedCastingHighlights = [
  "复杂镂空构件",
  "多层立体纹饰",
  "分铸与连接技术",
  "战国时期高水平青铜制造能力",
] as const;

afterEach(cleanup);

describe("CastingProcessSection", () => {
  it("renders the labelled casting section and the exact six-step ordered process", () => {
    render(<CastingProcessSection exhibition={zunpanExhibition} />);

    const section = document.querySelector<HTMLElement>("section#casting");
    const heading = screen.getByRole("heading", {
      level: 2,
      name: "铸造工艺",
    });
    const process = screen.getByRole("list", { name: "铸造工艺步骤" });
    const steps = within(process).getAllByRole("listitem");

    expect(section).not.toBeNull();
    expect(section).toHaveAttribute("aria-labelledby", "casting-title");
    expect(section).not.toHaveAttribute("data-reveal");
    expect(heading).toHaveAttribute("id", "casting-title");
    expect(screen.getByText("MAKING · 04")).toBeVisible();
    expect(process.tagName).toBe("OL");
    expect(process).toHaveAttribute("data-reveal-group");
    expect(steps).toHaveLength(6);

    expectedCastingSteps.forEach((step, index) => {
      const item = steps[index];

      expect(item).toHaveAttribute("data-reveal-item");
      expect(within(item).getByText(String(index + 1).padStart(2, "0"))).toBeVisible();
      expect(
        within(item).getByRole("heading", { level: 3, name: step.title }),
      ).toBeVisible();
      expect(within(item).getByText(step.description, { exact: true })).toBeVisible();
    });
  });

  it("renders the four centralized casting highlights without component copy drift", () => {
    render(<CastingProcessSection exhibition={zunpanExhibition} />);

    const highlights = screen.getByRole("list", { name: "铸造工艺要点" });
    const items = within(highlights).getAllByRole("listitem");

    expect(items).toHaveLength(4);
    expectedCastingHighlights.forEach((highlight, index) => {
      expect(items[index]).toHaveTextContent(highlight);
    });
  });

  it("labels the structural placeholder as an interface rather than an archaeological conclusion", () => {
    render(<CastingProcessSection exhibition={zunpanExhibition} />);

    const diagram = screen.getByLabelText("工艺结构示意");

    expect(diagram).toHaveTextContent("工艺结构示意");
    expect(diagram).toHaveTextContent("预留真实工艺动画接口");
    expect(diagram).toHaveTextContent("主体器形");
    expect(diagram).toHaveTextContent("分铸附饰");
    expect(diagram).toHaveTextContent("盘体承托");
  });
});
