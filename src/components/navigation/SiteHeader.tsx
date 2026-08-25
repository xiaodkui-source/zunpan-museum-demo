import { useEffect, useState } from "react";
import { Maximize2, Menu, X } from "lucide-react";

import { zunpanExhibition } from "../../data/artifact";
import type { ArtifactExhibition } from "../../types/artifact";
import styles from "./SiteHeader.module.css";

export interface SiteHeaderProps {
  navigation: ArtifactExhibition["navigation"];
  onEnterImmersive(): void;
}

const SCROLL_THRESHOLD = 64;
const MOBILE_NAVIGATION_ID = "site-mobile-navigation";

export function SiteHeader({
  navigation,
  onEnterImmersive,
}: SiteHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updateScrolledState = () => {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
    };

    const closeMenuOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    updateScrolledState();
    window.addEventListener("scroll", updateScrolledState, { passive: true });
    window.addEventListener("keydown", closeMenuOnEscape);

    return () => {
      window.removeEventListener("scroll", updateScrolledState);
      window.removeEventListener("keydown", closeMenuOnEscape);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen((isOpen) => !isOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className={styles.header} data-scrolled={isScrolled}>
      <div className={styles.headerInner}>
        <a
          className={styles.brand}
          href="#home"
          aria-label={`${zunpanExhibition.title}，返回首页`}
        >
          <span className={styles.brandEyebrow}>{zunpanExhibition.eyebrow}</span>
          <strong className={styles.brandTitle}>{zunpanExhibition.title}</strong>
        </a>

        <nav className={styles.desktopNav} aria-label="主导航">
          <ul className={styles.navigationList}>
            {navigation.map((item) => (
              <li key={item.id}>
                <a className={styles.navigationLink} href={`#${item.id}`}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          <button
            className={styles.immersiveButton}
            type="button"
            onClick={onEnterImmersive}
            aria-label="进入沉浸模式"
          >
            <Maximize2 aria-hidden="true" focusable="false" size={17} />
            <span className={styles.immersiveLabel}>进入沉浸模式</span>
          </button>

          <button
            className={styles.menuToggle}
            type="button"
            aria-controls={MOBILE_NAVIGATION_ID}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "关闭导航菜单" : "打开导航菜单"}
            onClick={toggleMenu}
          >
            {isMenuOpen ? (
              <X aria-hidden="true" focusable="false" size={21} />
            ) : (
              <Menu aria-hidden="true" focusable="false" size={21} />
            )}
          </button>
        </div>
      </div>

      <nav
        className={styles.mobilePanel}
        id={MOBILE_NAVIGATION_ID}
        aria-label="移动导航"
        hidden={!isMenuOpen}
      >
        <ul className={styles.mobileNavigationList}>
          {navigation.map((item, index) => (
            <li key={item.id}>
              <a
                className={styles.mobileNavigationLink}
                href={`#${item.id}`}
                onClick={closeMenu}
              >
                <span>{item.label}</span>
                <span className={styles.mobileIndex} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
