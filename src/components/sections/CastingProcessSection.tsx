import type { ArtifactExhibition } from "../../types/artifact";
import { SectionHeading } from "../ui/SectionHeading";
import styles from "./CastingProcessSection.module.css";

export interface CastingProcessSectionProps {
  exhibition: ArtifactExhibition;
}

export function CastingProcessSection({
  exhibition,
}: CastingProcessSectionProps) {
  return (
    <section
      className={styles.casting}
      id="casting"
      aria-labelledby="casting-title"
    >
      <div className={styles.inner}>
        <SectionHeading
          eyebrow="MAKING · 04"
          title="铸造工艺"
          headingId="casting-title"
        />

        <ol
          className={styles.timeline}
          aria-label="铸造工艺步骤"
          data-reveal-group
        >
          {exhibition.castingSteps.map((step) => (
            <li className={styles.step} data-reveal-item key={step.id}>
              <span className={styles.stepNumber} aria-hidden="true">
                {String(step.order).padStart(2, "0")}
              </span>
              <div className={styles.stepCopy}>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className={styles.detailGrid}>
          <div className={styles.highlights}>
            <p className={styles.detailEyebrow}>CASTING OBSERVATIONS</p>
            <h3>工艺观察要点</h3>
            <ul aria-label="铸造工艺要点" data-reveal-group>
              {exhibition.castingHighlights.map((highlight, index) => (
                <li data-reveal-item key={highlight}>
                  <span aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p>{highlight}</p>
                </li>
              ))}
            </ul>
          </div>

          <figure
            className={styles.structure}
            aria-label="工艺结构示意"
            data-reveal="diagram"
          >
            <figcaption className={styles.structureCaption}>
              <span>工艺结构示意</span>
              <strong>预留真实工艺动画接口</strong>
            </figcaption>

            <div className={styles.silhouette} aria-hidden="true">
              <span className={styles.bodyShape} />
              <span className={styles.ornamentShape} />
              <span className={styles.baseShape} />
            </div>

            <ul className={styles.structureLegend}>
              <li>
                <span aria-hidden="true" />
                主体器形
              </li>
              <li>
                <span aria-hidden="true" />
                分铸附饰
              </li>
              <li>
                <span aria-hidden="true" />
                盘体承托
              </li>
            </ul>
          </figure>
        </div>
      </div>
    </section>
  );
}
