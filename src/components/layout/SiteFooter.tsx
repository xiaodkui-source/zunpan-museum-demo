import { ArrowUp } from "lucide-react";

import type { ArtifactExhibition } from "../../types/artifact";
import styles from "./SiteFooter.module.css";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const returnToExhibitionStart = () => {
  const home = document.getElementById("home");
  const title = document.getElementById("exhibition-title");
  const reducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia(REDUCED_MOTION_QUERY).matches;
  const behavior: ScrollBehavior = reducedMotion ? "auto" : "smooth";
  let scrolled = false;

  try {
    if (typeof home?.scrollIntoView === "function") {
      home.scrollIntoView({
        behavior,
        block: "start",
      });
      scrolled = true;
    }
  } catch {
    // Fall through to the window-level scroll API.
  }

  if (!scrolled) {
    try {
      if (typeof window.scrollTo === "function") {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior,
        });
      }
    } catch {
      try {
        window.scrollTo(0, 0);
      } catch {
        // Focus restoration below remains available if scrolling is unsupported.
      }
    }
  }

  try {
    title?.focus({ preventScroll: true });
  } catch {
    try {
      title?.focus();
    } catch {
      // Older DOM implementations may not expose programmatic focus.
    }
  }
};

export interface SiteFooterProps {
  exhibition: ArtifactExhibition;
}

export function SiteFooter({ exhibition }: SiteFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.identity}>
          <p className={styles.chineseTitle}>{exhibition.title}</p>
          <p className={styles.englishTitle}>{exhibition.englishTitle}</p>
        </div>

        <div className={styles.notes}>
          <p>{exhibition.footer.projectNature}</p>
          <p>{exhibition.footer.dataReview}</p>
        </div>

        <button
          className={styles.returnButton}
          type="button"
          onClick={returnToExhibitionStart}
        >
          <span>返回顶部</span>
          <ArrowUp aria-hidden="true" focusable="false" size={17} />
        </button>

        <p className={styles.copyright}>{exhibition.footer.copyright}</p>
      </div>
    </footer>
  );
}
