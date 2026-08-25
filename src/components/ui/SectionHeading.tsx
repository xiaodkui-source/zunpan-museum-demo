import type { ReactNode } from "react";

import styles from "./SectionHeading.module.css";

export interface SectionHeadingProps {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  id?: string;
  headingId?: string;
  align?: "start" | "center";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  id,
  headingId,
  align = "start",
}: SectionHeadingProps) {
  const resolvedHeadingId = headingId ?? id;

  return (
    <header
      className={`${styles.heading} ${
        align === "center" ? styles.center : styles.start
      }`}
      data-reveal="heading"
    >
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2 className={styles.title} id={resolvedHeadingId}>
        {title}
      </h2>
      {description ? <p className={styles.description}>{description}</p> : null}
    </header>
  );
}
