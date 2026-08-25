import type { ArtifactExhibition } from "../../types/artifact";
import { SafeImage } from "../ui/SafeImage";
import { SectionHeading } from "../ui/SectionHeading";
import styles from "./OverviewSection.module.css";

export interface OverviewSectionProps {
  exhibition: ArtifactExhibition;
}

export function OverviewSection({ exhibition }: OverviewSectionProps) {
  const { overview } = exhibition;
  const archiveFields = [
    ["名称", overview.name],
    ["年代", overview.period],
    ["出土时间", overview.excavationYear],
    ["出土地点", overview.excavationSite],
    ["材质", overview.material],
    ["类型", overview.type],
    ["组成", overview.composition],
    ["收藏单位", overview.collection],
  ] as const;
  const dimensions = [
    ["尊高", overview.dimensions.zunHeight],
    ["盘高", overview.dimensions.panHeight],
    ["盘径", overview.dimensions.panDiameter],
  ] as const;

  return (
    <section
      className={styles.overview}
      id="overview"
      aria-labelledby="overview-title"
    >
      <div className={styles.inner}>
        <SectionHeading
          eyebrow="ARCHIVE · 02"
          title="文物概览"
          description={overview.description}
          headingId="overview-title"
        />

        <div className={styles.grid}>
          <figure className={styles.visual} data-reveal="overview-visual">
            <div className={styles.visualFrame}>
              <SafeImage
                className={styles.poster}
                src={exhibition.model.poster}
                alt={exhibition.model.alt}
                loading="lazy"
              />
              <span className={styles.diagramLabel}>数字结构示意</span>
              <span className={styles.cornerTop} aria-hidden="true" />
              <span className={styles.cornerBottom} aria-hidden="true" />
            </div>
            <figcaption className={styles.caption}>
              器形结构与组合关系的数字观察图，不作为馆藏实拍。
            </figcaption>
          </figure>

          <div className={styles.archive} data-reveal="overview-data">
            <dl className={styles.archiveList} aria-label="文物档案数据">
              {archiveFields.map(([label, value]) => (
                <div className={styles.archiveRow} key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>

            <div className={styles.dimensionBlock}>
              <p className={styles.dimensionEyebrow}>MEASUREMENTS</p>
              <dl className={styles.dimensionList} aria-label="尺寸数据">
                {dimensions.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <p className={styles.dimensionNotice}>
                <span aria-hidden="true">※</span>
                尺寸为暂定展示数据，正式上线前需依据权威馆藏资料再次核对。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
