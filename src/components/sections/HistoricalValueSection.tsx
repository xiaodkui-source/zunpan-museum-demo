import type { ArtifactExhibition } from "../../types/artifact";
import { SectionHeading } from "../ui/SectionHeading";
import styles from "./HistoricalValueSection.module.css";

export interface HistoricalValueSectionProps {
  exhibition: ArtifactExhibition;
}

export function HistoricalValueSection({
  exhibition,
}: HistoricalValueSectionProps) {
  return (
    <section
      className={styles.history}
      id="history"
      aria-labelledby="history-title"
    >
      <div className={styles.inner}>
        <SectionHeading
          eyebrow="LEGACY · 05"
          title="历史价值"
          headingId="history-title"
        />

        <ol
          className={styles.valueGrid}
          aria-label="历史价值解读"
          data-reveal-group
        >
          {exhibition.historicalValues.map((value, index) => (
            <li className={styles.value} data-reveal-item key={value.keyword}>
              <div className={styles.valueHeader}>
                <span className={styles.number} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className={styles.keyword}>{value.keyword}</p>
              </div>
              <h3>{value.title}</h3>
              <p className={styles.description}>{value.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
