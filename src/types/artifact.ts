export type Vec3 = readonly [number, number, number];

export type SectionId =
  | "home"
  | "overview"
  | "ornaments"
  | "casting"
  | "history";

export interface CameraPose {
  position: Vec3;
  target: Vec3;
  fov?: number;
}

export type CameraCommandReason = "initial" | "hotspot" | "reset";

export interface CameraCommand {
  sequence: number;
  reason: CameraCommandReason;
  pose: CameraPose;
}

export interface ModelTransform {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
}

export interface ArtifactModelConfig {
  src: string;
  poster: string;
  alt: string;
  minDistance: number;
  maxDistance: number;
  defaultCamera: CameraPose;
  transform: ModelTransform;
}

export interface HotspotRecord {
  id: string;
  title: string;
  description: string;
  position: Vec3;
  camera: CameraPose;
}

export interface OrnamentRecord {
  id: string;
  title: string;
  description: string;
  media: string;
  alt: string;
}

export interface CastingStep {
  id: string;
  order: number;
  title: string;
  description: string;
}

export interface HistoricalValue {
  keyword: "礼制" | "工艺" | "审美" | "楚风";
  title: string;
  description: string;
}

export interface ArtifactExhibition {
  navigation: readonly {
    id: SectionId;
    label: string;
  }[];
  title: string;
  englishTitle: string;
  eyebrow: string;
  period: string;
  excavationYear: string;
  material: string;
  hero: {
    excavationSite: string;
    summary: string;
  };
  overview: {
    name: string;
    period: string;
    excavationYear: string;
    excavationSite: string;
    material: string;
    type: string;
    composition: string;
    collection: string;
    description: string;
    dimensions: {
      zunHeight: string;
      panHeight: string;
      panDiameter: string;
    };
  };
  model: ArtifactModelConfig;
  interpretationNotice: string;
  hotspots: readonly HotspotRecord[];
  ornaments: readonly OrnamentRecord[];
  castingSteps: readonly CastingStep[];
  castingHighlights: readonly string[];
  historicalValues: readonly HistoricalValue[];
  footer: {
    projectNature: string;
    dataReview: string;
    copyright: string;
  };
}
