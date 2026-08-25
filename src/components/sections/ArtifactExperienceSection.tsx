import { ArrowDown, MousePointer2, Move3d, Rotate3d } from "lucide-react";
import { lazy, Suspense } from "react";

import type { ArtifactExhibition } from "../../types/artifact";
import styles from "./ArtifactExperienceSection.module.css";

const ArtifactViewer = lazy(() =>
  import("../three/ArtifactViewer").then(({ ArtifactViewer: Viewer }) => ({
    default: Viewer,
  })),
);

export interface ArtifactExperienceSectionProps {
  exhibition: ArtifactExhibition;
}

export function ArtifactExperienceSection({
  exhibition,
}: ArtifactExperienceSectionProps) {
  return (
    <section
      className={styles.experience}
      id="home"
      aria-labelledby="exhibition-title"
    >
      <div className={styles.grid}>
        <header className={styles.hero}>
          <p className={styles.archiveLabel} data-hero-reveal>
            DIGITAL BRONZE ARCHIVE · 01
          </p>
          <p className={styles.englishTitle} data-hero-reveal>
            {exhibition.englishTitle}
          </p>
          <h1
            className={styles.title}
            id="exhibition-title"
            tabIndex={-1}
            data-hero-reveal
          >
            {exhibition.title}
          </h1>

          <dl className={styles.meta} data-hero-reveal>
            <div>
              <dt>年代</dt>
              <dd>{exhibition.period}</dd>
            </div>
            <div>
              <dt>出土</dt>
              <dd>{exhibition.excavationYear}</dd>
            </div>
            <div>
              <dt>地点</dt>
              <dd>{exhibition.hero.excavationSite}</dd>
            </div>
          </dl>

          <p className={styles.summary} data-hero-reveal>
            {exhibition.hero.summary}
          </p>
          <a
            className={styles.exploreLink}
            href="#viewer-instructions"
            data-hero-reveal
          >
            <span>向下探索</span>
            <ArrowDown aria-hidden="true" focusable="false" size={17} />
          </a>
        </header>

        <div className={styles.viewerCell} data-viewer-reveal>
          <div className={styles.viewerSticky}>
            <Suspense
              fallback={
                <div className={styles.viewerLoading} role="status" aria-live="polite">
                  <span className={styles.viewerLoadingMark} aria-hidden="true" />
                  <span>正在准备三维展陈…</span>
                </div>
              }
            >
              <ArtifactViewer exhibition={exhibition} />
            </Suspense>
          </div>
        </div>

        <section
          className={styles.instructions}
          id="viewer-instructions"
          role="region"
          aria-label="三维交互说明"
        >
          <div className={styles.instructionsHeading}>
            <p>INTERACTION NOTES</p>
            <h2>观察一件器物，先从改变视角开始</h2>
          </div>

          <ul className={styles.controlsList} aria-label="查看器操作方式">
            <li>
              <Rotate3d aria-hidden="true" focusable="false" size={19} />
              <span>拖动旋转</span>
            </li>
            <li>
              <MousePointer2 aria-hidden="true" focusable="false" size={19} />
              <span>滚轮缩放</span>
            </li>
            <li>
              <Move3d aria-hidden="true" focusable="false" size={19} />
              <span>右键平移</span>
            </li>
            <li>
              <Rotate3d aria-hidden="true" focusable="false" size={19} />
              <span>双击重置</span>
            </li>
          </ul>

          <ol className={styles.hotspotList} aria-label="数字示意热点">
            {exhibition.hotspots.map((hotspot, index) => (
              <li key={hotspot.id}>
                <span className={styles.hotspotIndex} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{hotspot.title}</h3>
                  <p>{hotspot.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </section>
  );
}
