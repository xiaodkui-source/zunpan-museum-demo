import { ArrowUpRight } from "lucide-react";
import { useState } from "react";

import type { ArtifactExhibition } from "../../types/artifact";
import { OrnamentLightbox } from "../artifact/OrnamentLightbox";
import { SafeImage } from "../ui/SafeImage";
import { SectionHeading } from "../ui/SectionHeading";
import styles from "./OrnamentSection.module.css";

export interface OrnamentSectionProps {
  exhibition: ArtifactExhibition;
}

export function OrnamentSection({ exhibition }: OrnamentSectionProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [opener, setOpener] = useState<HTMLButtonElement | null>(null);

  return (
    <section
      className={styles.ornaments}
      id="ornaments"
      aria-labelledby="ornaments-title"
    >
      <div className={styles.inner}>
        <SectionHeading
          eyebrow="DETAIL STUDY · 03"
          title="纹饰解析"
          description="以本地数字线稿观察纹饰的回旋、镂空与立体盘绕关系。"
          headingId="ornaments-title"
        />

        <div className={styles.grid}>
          {exhibition.ornaments.map((item, index) => (
            <article
              className={styles.card}
              data-reveal="card"
              key={item.id}
            >
              <div className={styles.mediaFrame}>
                <SafeImage
                  className={styles.image}
                  src={item.media}
                  alt={item.alt}
                  loading="lazy"
                />
                <span className={styles.diagramLabel}>数字纹样示意</span>
                <span className={styles.index} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.description}>{item.description}</p>
                <button
                  className={styles.detailButton}
                  type="button"
                  aria-label={`查看${item.title}细节`}
                  onClick={(event) => {
                    setOpener(event.currentTarget);
                    setSelectedIndex(index);
                  }}
                >
                  <span>查看细节</span>
                  <ArrowUpRight
                    aria-hidden="true"
                    focusable="false"
                    size={18}
                  />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <OrnamentLightbox
        items={exhibition.ornaments}
        index={selectedIndex}
        returnFocusTo={opener}
        onIndexChange={setSelectedIndex}
        onClose={() => setSelectedIndex(null)}
      />
    </section>
  );
}
