import type { ArtifactExhibition } from "../types/artifact";

export const zunpanExhibition = {
  navigation: [
    { id: "home", label: "首页" },
    { id: "overview", label: "文物概览" },
    { id: "ornaments", label: "纹饰解析" },
    { id: "casting", label: "铸造工艺" },
    { id: "history", label: "历史价值" },
  ],
  title: "曾侯乙尊盘",
  englishTitle: "Zun and Pan of Marquis Yi of Zeng",
  eyebrow: "ZENG HOU YI ZUN PAN",
  period: "战国早期",
  excavationYear: "1978年",
  material: "青铜",
  hero: {
    excavationSite: "湖北随州曾侯乙墓",
    summary:
      "一器之中，盘龙交错，蟠螭盘旋。曾侯乙尊盘以繁复精密的镂空装饰和高超的青铜铸造工艺，展现了战国时期礼制、艺术与技术的高度融合。",
  },
  overview: {
    name: "曾侯乙尊盘",
    period: "战国早期",
    excavationYear: "1978年",
    excavationSite: "湖北随州擂鼓墩曾侯乙墓",
    material: "青铜",
    type: "礼器、酒器组合",
    composition: "尊、盘",
    collection: "湖北省博物馆",
    description:
      "曾侯乙尊盘由尊与盘组合而成，本数字展聚焦器形结构、纹饰层次与铸造观察线索。",
    // 正式上线前需依据权威馆藏资料再次核对
    dimensions: {
      zunHeight: "约33厘米",
      panHeight: "约24厘米",
      panDiameter: "约58厘米",
    },
  },
  model: {
    src: "/models/zunpan.glb",
    poster: "/images/zunpan-poster.svg",
    alt: "曾侯乙尊盘三维数字示意模型",
    minDistance: 3.4,
    maxDistance: 11,
    defaultCamera: {
      position: [0, 0.05, 5.5],
      target: [0, 0, 0],
      fov: 38,
    },
    transform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  },
  interpretationNotice:
    "热点位置与模型均为数字示意，正式上线前需结合权威资料复核。",
  hotspots: [
    {
      id: "zun-rim",
      title: "尊口镂空纹饰",
      description:
        "尊口装饰由多层相互缠绕的蟠螭纹组成，构件细密复杂，形成强烈的空间层次和视觉张力。",
      position: [0, 0.86, 0.24],
      camera: {
        position: [2.5, 1.35, 4.5],
        target: [0, 0.75, 0],
        fov: 34,
      },
    },
    {
      id: "openwork-attachment",
      title: "尊体蟠螭结构",
      description:
        "大量龙蛇形纹饰彼此穿插、衔接和盘绕，体现了战国青铜装饰由平面纹样向立体雕塑发展的趋势。",
      position: [0.7, 0.17, 0.32],
      camera: {
        position: [2.8, 0.6, 4.35],
        target: [0.35, 0.16, 0],
        fov: 32,
      },
    },
    {
      id: "basin-pattern",
      title: "盘体承托结构",
      description:
        "尊与盘既可组合使用，也具有相对独立的造型结构，体现了礼器功能与审美表达的统一。",
      position: [-0.66, -0.65, 0.34],
      camera: {
        position: [-2.8, -0.42, 4.4],
        target: [-0.32, -0.6, 0],
        fov: 33,
      },
    },
  ],
  ornaments: [
    {
      id: "panchi",
      title: "蟠螭纹",
      description: "以数字线稿辅助观察回旋、交叠的纹饰组织方式。",
      media: "/images/ornaments/panchi.svg",
      alt: "蟠螭纹数字示意图",
    },
    {
      id: "openwork-cloud",
      title: "镂空卷云结构",
      description: "以数字线稿辅助观察镂空卷云结构的虚实层次。",
      media: "/images/ornaments/openwork-cloud.svg",
      alt: "镂空卷云结构数字示意图",
    },
    {
      id: "dragon-serpent",
      title: "龙蛇形立体装饰",
      description: "以数字线稿辅助观察龙蛇形构件的穿插与盘绕。",
      media: "/images/ornaments/dragon-serpent.svg",
      alt: "龙蛇形立体装饰数字示意图",
    },
  ],
  castingSteps: [
    {
      id: "form-design",
      order: 1,
      title: "器形设计",
      description:
        "据考古资料推测，工匠可能先根据尊、盘的组合关系进行器形设计。",
    },
    {
      id: "mold-and-pattern-making",
      order: 2,
      title: "模具与范型制作",
      description:
        "据考古资料推测，可能采用模具与范型逐步建立器体轮廓。",
    },
    {
      id: "complex-ornament-forming",
      order: 3,
      title: "复杂纹饰构件成形",
      description:
        "复杂镂空构件与多层立体纹饰可能采用分别制备的方式成形。",
    },
    {
      id: "separate-casting-and-assembly",
      order: 4,
      title: "分铸与组合",
      description:
        "学界通常认为，分铸与连接技术可能用于组合器体和附饰构件。",
    },
    {
      id: "pouring-and-forming",
      order: 5,
      title: "浇注成形",
      description:
        "据考古资料推测，合范后浇注可能形成主要器体。",
    },
    {
      id: "finishing-and-surface-treatment",
      order: 6,
      title: "修整与表面处理",
      description:
        "修整与表面处理体现出战国时期高水平青铜制造能力。",
    },
  ],
  castingHighlights: [
    "复杂镂空构件",
    "多层立体纹饰",
    "分铸与连接技术",
    "战国时期高水平青铜制造能力",
  ],
  historicalValues: [
    {
      keyword: "礼制",
      title: "礼器组合",
      description:
        "曾侯乙尊盘反映了战国时期高等级贵族宴饮、礼仪和器用制度。",
    },
    {
      keyword: "工艺",
      title: "复合铸造",
      description:
        "器物结构复杂、装饰密集，体现了青铜铸造、构件组合和立体装饰技术的成熟。",
    },
    {
      keyword: "审美",
      title: "繁缛秩序",
      description:
        "繁密而有秩序的纹饰形成强烈视觉张力，展现战国时期追求奇巧与华丽的艺术倾向。",
    },
    {
      keyword: "楚风",
      title: "地域气韵",
      description:
        "器物的龙蛇意象、流动线条和浪漫气质，与楚文化艺术精神具有密切联系。",
    },
  ],
  footer: {
    projectNature:
      "本页面为曾侯乙墓数字文物展示网站的交互原型，用于探索三维文物、数字叙事与博物馆线上展陈的结合方式。",
    dataReview:
      "文物资料将在正式版本中依据湖北省博物馆及相关考古报告进行校订。",
    copyright: "© 2026 曾侯乙尊盘数字展陈 Demo",
  },
} as const satisfies ArtifactExhibition;
