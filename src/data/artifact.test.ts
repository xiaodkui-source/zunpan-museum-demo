import { describe, expect, it } from "vitest";

import { zunpanExhibition } from "./artifact";

const isVec3 = (value: unknown): value is readonly [number, number, number] =>
  Array.isArray(value) &&
  value.length === 3 &&
  value.every((coordinate) => typeof coordinate === "number");

const collectKeys = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap(collectKeys);
  }

  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, nestedValue]) => [
      key,
      ...collectKeys(nestedValue),
    ]);
  }

  return [];
};

describe("zunpanExhibition", () => {
  it("defines five uniquely addressable navigation sections", () => {
    expect(zunpanExhibition.navigation.map(({ label }) => label)).toEqual([
      "首页",
      "文物概览",
      "纹饰解析",
      "铸造工艺",
      "历史价值",
    ]);

    const sectionIds = zunpanExhibition.navigation.map(({ id }) => id);
    expect(new Set(sectionIds).size).toBe(5);
  });

  it("matches the six exact hero identity fields from the objective", () => {
    expect({
      title: zunpanExhibition.title,
      englishTitle: zunpanExhibition.englishTitle,
      period: zunpanExhibition.period,
      excavationYear: zunpanExhibition.excavationYear,
      excavationSite: zunpanExhibition.hero.excavationSite,
      summary: zunpanExhibition.hero.summary,
    }).toEqual({
      title: "曾侯乙尊盘",
      englishTitle: "Zun and Pan of Marquis Yi of Zeng",
      period: "战国早期",
      excavationYear: "1978年",
      excavationSite: "湖北随州曾侯乙墓",
      summary:
        "一器之中，盘龙交错，蟠螭盘旋。曾侯乙尊盘以繁复精密的镂空装饰和高超的青铜铸造工艺，展现了战国时期礼制、艺术与技术的高度融合。",
    });
  });

  it("matches the exact overview facts and centralized dimensions", () => {
    expect({
      name: zunpanExhibition.overview.name,
      period: zunpanExhibition.overview.period,
      excavationYear: zunpanExhibition.overview.excavationYear,
      excavationSite: zunpanExhibition.overview.excavationSite,
      material: zunpanExhibition.overview.material,
      type: zunpanExhibition.overview.type,
      composition: zunpanExhibition.overview.composition,
      collection: zunpanExhibition.overview.collection,
    }).toEqual({
      name: "曾侯乙尊盘",
      period: "战国早期",
      excavationYear: "1978年",
      excavationSite: "湖北随州擂鼓墩曾侯乙墓",
      material: "青铜",
      type: "礼器、酒器组合",
      composition: "尊、盘",
      collection: "湖北省博物馆",
    });

    expect(zunpanExhibition.overview.dimensions).toEqual({
      zunHeight: "约33厘米",
      panHeight: "约24厘米",
      panDiameter: "约58厘米",
    });
  });

  it("matches the exact hotspot titles and descriptions", () => {
    expect(
      zunpanExhibition.hotspots.map(({ title, description }) => ({
        title,
        description,
      })),
    ).toEqual([
      {
        title: "尊口镂空纹饰",
        description:
          "尊口装饰由多层相互缠绕的蟠螭纹组成，构件细密复杂，形成强烈的空间层次和视觉张力。",
      },
      {
        title: "尊体蟠螭结构",
        description:
          "大量龙蛇形纹饰彼此穿插、衔接和盘绕，体现了战国青铜装饰由平面纹样向立体雕塑发展的趋势。",
      },
      {
        title: "盘体承托结构",
        description:
          "尊与盘既可组合使用，也具有相对独立的造型结构，体现了礼器功能与审美表达的统一。",
      },
    ]);

    expect(zunpanExhibition.interpretationNotice).toBe(
      "热点位置与模型均为数字示意，正式上线前需结合权威资料复核。",
    );

    const hotspotIds = zunpanExhibition.hotspots.map(({ id }) => id);
    expect(new Set(hotspotIds).size).toBe(3);

    for (const hotspot of zunpanExhibition.hotspots) {
      expect(isVec3(hotspot.position)).toBe(true);
      expect(isVec3(hotspot.camera.position)).toBe(true);
      expect(isVec3(hotspot.camera.target)).toBe(true);
    }
  });

  it("matches all ornament titles, local media paths, and digital-demo alt text", () => {
    expect(
      zunpanExhibition.ornaments.map(({ title, media, alt }) => ({
        title,
        media,
        alt,
      })),
    ).toEqual([
      {
        title: "蟠螭纹",
        media: "/images/ornaments/panchi.svg",
        alt: "蟠螭纹数字示意图",
      },
      {
        title: "镂空卷云结构",
        media: "/images/ornaments/openwork-cloud.svg",
        alt: "镂空卷云结构数字示意图",
      },
      {
        title: "龙蛇形立体装饰",
        media: "/images/ornaments/dragon-serpent.svg",
        alt: "龙蛇形立体装饰数字示意图",
      },
    ]);

    for (const { media } of zunpanExhibition.ornaments) {
      expect(media).toMatch(/^\/(?!\/)/);
      expect(media).not.toMatch(/^https?:\/\//);
    }
  });

  it("uses title-aligned stable ornament ids", () => {
    expect(zunpanExhibition.ornaments.map(({ id }) => id)).toEqual([
      "panchi",
      "openwork-cloud",
      "dragon-serpent",
    ]);
  });

  it("keeps the six exact casting titles in order and qualifies every description", () => {
    expect(zunpanExhibition.castingSteps.map(({ title }) => title)).toEqual([
      "器形设计",
      "模具与范型制作",
      "复杂纹饰构件成形",
      "分铸与组合",
      "浇注成形",
      "修整与表面处理",
    ]);
    expect(zunpanExhibition.castingSteps.map(({ order }) => order)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
    expect(
      zunpanExhibition.castingSteps.map(({ description }) => description),
    ).toEqual([
      "据考古资料推测，工匠可能先根据尊、盘的组合关系进行器形设计。",
      "据考古资料推测，可能采用模具与范型逐步建立器体轮廓。",
      "复杂镂空构件与多层立体纹饰可能采用分别制备的方式成形。",
      "学界通常认为，分铸与连接技术可能用于组合器体和附饰构件。",
      "据考古资料推测，合范后浇注可能形成主要器体。",
      "修整与表面处理体现出战国时期高水平青铜制造能力。",
    ]);

    for (const step of zunpanExhibition.castingSteps) {
      expect(step.description).toMatch(
        /可能采用|据考古资料推测|体现出|学界通常认为/,
      );
    }

    const castingDescription = zunpanExhibition.castingSteps
      .map(({ description }) => description)
      .join("");
    expect(castingDescription).toContain("复杂镂空构件");
    expect(castingDescription).toContain("多层立体纹饰");
    expect(castingDescription).toMatch(/分铸.*连接|连接.*分铸/);
    expect(castingDescription).toContain("战国时期高水平青铜制造能力");
  });

  it("uses title-aligned stable casting-step ids", () => {
    expect(zunpanExhibition.castingSteps.map(({ id }) => id)).toEqual([
      "form-design",
      "mold-and-pattern-making",
      "complex-ornament-forming",
      "separate-casting-and-assembly",
      "pouring-and-forming",
      "finishing-and-surface-treatment",
    ]);
  });

  it("centralizes the four exact casting highlights", () => {
    expect(zunpanExhibition.castingHighlights).toEqual([
      "复杂镂空构件",
      "多层立体纹饰",
      "分铸与连接技术",
      "战国时期高水平青铜制造能力",
    ]);
  });

  it("matches all four historical-value descriptions exactly", () => {
    expect(
      zunpanExhibition.historicalValues.map(({ keyword, description }) => ({
        keyword,
        description,
      })),
    ).toEqual([
      {
        keyword: "礼制",
        description:
          "曾侯乙尊盘反映了战国时期高等级贵族宴饮、礼仪和器用制度。",
      },
      {
        keyword: "工艺",
        description:
          "器物结构复杂、装饰密集，体现了青铜铸造、构件组合和立体装饰技术的成熟。",
      },
      {
        keyword: "审美",
        description:
          "繁密而有秩序的纹饰形成强烈视觉张力，展现战国时期追求奇巧与华丽的艺术倾向。",
      },
      {
        keyword: "楚风",
        description:
          "器物的龙蛇意象、流动线条和浪漫气质，与楚文化艺术精神具有密切联系。",
      },
    ]);
  });

  it("matches both exact footer statements without inventing a source URL", () => {
    expect(zunpanExhibition.footer.projectNature).toBe(
      "本页面为曾侯乙墓数字文物展示网站的交互原型，用于探索三维文物、数字叙事与博物馆线上展陈的结合方式。",
    );
    expect(zunpanExhibition.footer.dataReview).toBe(
      "文物资料将在正式版本中依据湖北省博物馆及相关考古报告进行校订。",
    );
    expect(zunpanExhibition.footer.copyright).toBe(
      "© 2026 曾侯乙尊盘数字展陈 Demo",
    );
    expect(
      Object.keys(zunpanExhibition.footer).filter((key) => /url/i.test(key)),
    ).toEqual([]);
  });

  it("preserves the model paths, distance limits, transforms, and camera tuples", () => {
    expect(zunpanExhibition.model.src).toBe("/models/zunpan.glb");
    expect(zunpanExhibition.model.poster).toBe("/images/zunpan-poster.svg");
    expect(zunpanExhibition.model.minDistance).toBe(3.4);
    expect(zunpanExhibition.model.maxDistance).toBe(11);
    expect(isVec3(zunpanExhibition.model.defaultCamera.position)).toBe(true);
    expect(isVec3(zunpanExhibition.model.defaultCamera.target)).toBe(true);
    expect(isVec3(zunpanExhibition.model.transform.position)).toBe(true);
    expect(isVec3(zunpanExhibition.model.transform.rotation)).toBe(true);
    expect(isVec3(zunpanExhibition.model.transform.scale)).toBe(true);
  });

  it("keeps the short hero provenance distinct from detailed overview provenance", () => {
    expect(zunpanExhibition.hero.excavationSite).toBe("湖北随州曾侯乙墓");
    expect(zunpanExhibition.overview.excavationSite).toBe(
      "湖北随州擂鼓墩曾侯乙墓",
    );
    expect(zunpanExhibition.hero.excavationSite).not.toBe(
      zunpanExhibition.overview.excavationSite,
    );
  });

  it("does not contain commerce, price, or invented collection-number fields", () => {
    const forbiddenKeys = new Set([
      "shop",
      "shopping",
      "cart",
      "buy",
      "price",
      "collectionId",
      "collectionNumber",
      "accessionNumber",
      "museumId",
    ]);

    expect(collectKeys(zunpanExhibition).filter((key) => forbiddenKeys.has(key))).toEqual([]);
  });
});
