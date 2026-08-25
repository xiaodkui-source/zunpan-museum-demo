import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { zunpanExhibition } from "../../data/artifact";
import { ArtifactExperienceSection } from "./ArtifactExperienceSection";

vi.mock("../three/ArtifactViewer", () => ({
  ArtifactViewer: () => <div data-testid="artifact-viewer-mock" />,
}));

afterEach(cleanup);

describe("ArtifactExperienceSection", () => {
  it("renders an accessible viewer fallback before resolving exactly one lazy viewer", async () => {
    render(<ArtifactExperienceSection exhibition={zunpanExhibition} />);

    const title = screen.getByRole("heading", {
      level: 1,
      name: zunpanExhibition.title,
    });
    const section = title.closest("section");

    expect(section).toHaveAttribute("id", "home");
    expect(section).toHaveAttribute("aria-labelledby", "exhibition-title");
    expect(title).toHaveAttribute("id", "exhibition-title");
    expect(screen.getByRole("status")).toHaveTextContent("正在准备三维展陈…");
    expect(await screen.findAllByTestId("artifact-viewer-mock")).toHaveLength(1);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders every exact Hero value from the exhibition data and the exploration cue", () => {
    render(<ArtifactExperienceSection exhibition={zunpanExhibition} />);

    const heroValues = [
      zunpanExhibition.title,
      zunpanExhibition.englishTitle,
      zunpanExhibition.period,
      zunpanExhibition.excavationYear,
      zunpanExhibition.hero.excavationSite,
      zunpanExhibition.hero.summary,
    ];

    for (const value of heroValues) {
      expect(screen.getByText(value)).toBeInTheDocument();
    }
    expect(screen.getByText("向下探索")).toBeInTheDocument();
  });

  it("describes rotate, zoom, pan, and double-click reset controls in readable text", () => {
    render(<ArtifactExperienceSection exhibition={zunpanExhibition} />);

    const instructions = screen.getByRole("region", { name: "三维交互说明" });
    expect(instructions).toHaveTextContent("旋转");
    expect(instructions).toHaveTextContent("缩放");
    expect(instructions).toHaveTextContent("平移");
    expect(instructions).toHaveTextContent("双击重置");
  });

  it("lists all three hotspot titles from the exhibition data", () => {
    render(<ArtifactExperienceSection exhibition={zunpanExhibition} />);
    const instructions = screen.getByRole("region", { name: "三维交互说明" });

    for (const hotspot of zunpanExhibition.hotspots) {
      expect(within(instructions).getByText(hotspot.title)).toBeInTheDocument();
    }
  });
});
