import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { zunpanExhibition } from "../../data/artifact";
import { SafeImage } from "../ui/SafeImage";
import { OverviewSection } from "./OverviewSection";

afterEach(cleanup);

describe("OverviewSection", () => {
  it("renders a labelled overview section and its centralized introduction", () => {
    render(<OverviewSection exhibition={zunpanExhibition} />);

    const section = document.querySelector<HTMLElement>("section#overview");
    const heading = screen.getByRole("heading", {
      level: 2,
      name: "文物概览",
    });

    expect(section).not.toBeNull();
    expect(section).toHaveAttribute("aria-labelledby", "overview-title");
    expect(heading).toHaveAttribute("id", "overview-title");
    expect(screen.getByText("ARCHIVE · 02")).toBeVisible();
    expect(section).toHaveTextContent(zunpanExhibition.overview.description);
  });

  it("presents all eight centralized archive fields in a semantic description list", () => {
    render(<OverviewSection exhibition={zunpanExhibition} />);
    const archive = screen.getByLabelText("文物档案数据");
    const expectedPairs = [
      ["名称", zunpanExhibition.overview.name],
      ["年代", zunpanExhibition.overview.period],
      ["出土时间", zunpanExhibition.overview.excavationYear],
      ["出土地点", zunpanExhibition.overview.excavationSite],
      ["材质", zunpanExhibition.overview.material],
      ["类型", zunpanExhibition.overview.type],
      ["组成", zunpanExhibition.overview.composition],
      ["收藏单位", zunpanExhibition.overview.collection],
    ];

    expect(archive.tagName).toBe("DL");
    const rows = Array.from(archive.children);
    expect(rows).toHaveLength(8);
    expectedPairs.forEach(([term, definition], index) => {
      expect(rows[index].querySelector("dt")).toHaveTextContent(term);
      expect(rows[index].querySelector("dd")).toHaveTextContent(definition);
    });
  });

  it("renders the three overview dimensions beside the exact review notice", () => {
    render(<OverviewSection exhibition={zunpanExhibition} />);
    const dimensions = screen.getByLabelText("尺寸数据");

    expect(dimensions.tagName).toBe("DL");
    expect(dimensions.querySelectorAll("dt")).toHaveLength(3);
    expect(within(dimensions).getByText("尊高")).toBeVisible();
    expect(
      within(dimensions).getByText(
        zunpanExhibition.overview.dimensions.zunHeight,
      ),
    ).toBeVisible();
    expect(within(dimensions).getByText("盘高")).toBeVisible();
    expect(
      within(dimensions).getByText(
        zunpanExhibition.overview.dimensions.panHeight,
      ),
    ).toBeVisible();
    expect(within(dimensions).getByText("盘径")).toBeVisible();
    expect(
      within(dimensions).getByText(
        zunpanExhibition.overview.dimensions.panDiameter,
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        "尺寸为暂定展示数据，正式上线前需依据权威馆藏资料再次核对。",
      ),
    ).toBeVisible();
  });

  it("uses the local poster with centralized alt text and a visible digital-diagram label", () => {
    render(<OverviewSection exhibition={zunpanExhibition} />);

    expect(
      screen.getByRole("img", { name: zunpanExhibition.model.alt }),
    ).toHaveAttribute("src", "/images/zunpan-poster.svg");
    expect(screen.getByText("数字结构示意")).toBeVisible();
  });
});

describe("SafeImage", () => {
  it("renders the image normally and preserves caller load handlers", () => {
    const onLoad = vi.fn();
    render(
      <SafeImage
        src="/images/zunpan-poster.svg"
        alt="测试数字结构示意"
        loading="lazy"
        onLoad={onLoad}
      />,
    );
    const image = screen.getByRole("img", { name: "测试数字结构示意" });

    expect(image).toHaveAttribute("loading", "lazy");
    fireEvent.load(image);
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it("replaces a broken image with a readable local fallback and preserves onError", () => {
    const onError = vi.fn();
    render(
      <SafeImage
        src="/images/missing.svg"
        alt="缺失纹样数字示意"
        onError={onError}
      />,
    );

    fireEvent.error(
      screen.getByRole("img", { name: "缺失纹样数字示意" }),
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("图像暂不可用");
    expect(screen.getByRole("status")).toHaveTextContent(
      "缺失纹样数字示意",
    );
  });

  it("resets its error state when src changes", () => {
    const { rerender } = render(
      <SafeImage src="/images/missing.svg" alt="可恢复示意" />,
    );
    fireEvent.error(screen.getByRole("img", { name: "可恢复示意" }));
    expect(screen.getByRole("status")).toBeInTheDocument();

    rerender(
      <SafeImage src="/images/zunpan-poster.svg" alt="可恢复示意" />,
    );

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "可恢复示意" })).toHaveAttribute(
      "src",
      "/images/zunpan-poster.svg",
    );

    rerender(<SafeImage src="/images/missing.svg" alt="可恢复示意" />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "可恢复示意" })).toHaveAttribute(
      "src",
      "/images/missing.svg",
    );
  });
});
