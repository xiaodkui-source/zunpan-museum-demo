import { SiteFooter } from "./components/layout/SiteFooter";
import { SiteHeader } from "./components/navigation/SiteHeader";
import { ArtifactExperienceSection } from "./components/sections/ArtifactExperienceSection";
import { CastingProcessSection } from "./components/sections/CastingProcessSection";
import { HistoricalValueSection } from "./components/sections/HistoricalValueSection";
import { OrnamentSection } from "./components/sections/OrnamentSection";
import { OverviewSection } from "./components/sections/OverviewSection";
import { zunpanExhibition } from "./data/artifact";
import { useGsapReveal } from "./hooks/useGsapReveal";
import styles from "./App.module.css";

const focusHomeContent = () => {
  const home = document.getElementById("home");
  const focusTarget =
    document.getElementById("exhibition-title") ??
    document.getElementById("main-content");

  try {
    home?.scrollIntoView({ block: "start" });
  } catch {
    // The fallback remains useful in DOM environments without scrolling APIs.
  }

  try {
    focusTarget?.focus({ preventScroll: true });
  } catch {
    try {
      focusTarget?.focus();
    } catch {
      // Entering immersive mode must never make the surrounding page unusable.
    }
  }
};

const enterImmersiveMode = () => {
  const viewer = document.querySelector<HTMLElement>("[data-artifact-viewer]");
  const fullscreenControl = viewer?.querySelector<HTMLButtonElement>(
    "[data-viewer-fullscreen-control]",
  );

  if (fullscreenControl) {
    fullscreenControl.click();
    return;
  }

  focusHomeContent();
};

export default function App() {
  const mainRef = useGsapReveal<HTMLElement>();

  return (
    <>
      <a className={styles.skipLink} href="#main-content">
        跳至主要内容
      </a>

      <SiteHeader
        navigation={zunpanExhibition.navigation}
        onEnterImmersive={enterImmersiveMode}
      />

      <main
        className={styles.main}
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
      >
        <ArtifactExperienceSection exhibition={zunpanExhibition} />
        <OverviewSection exhibition={zunpanExhibition} />
        <OrnamentSection exhibition={zunpanExhibition} />
        <CastingProcessSection exhibition={zunpanExhibition} />
        <HistoricalValueSection exhibition={zunpanExhibition} />
      </main>

      <SiteFooter exhibition={zunpanExhibition} />
    </>
  );
}
