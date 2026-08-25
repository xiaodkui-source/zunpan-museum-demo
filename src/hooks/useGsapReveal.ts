import { gsap } from "gsap";
import { useEffect, useRef, type MutableRefObject } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const REVEAL_TARGET_SELECTOR = [
  "[data-hero-reveal]",
  "[data-viewer-reveal]",
  "[data-reveal]",
  "[data-reveal-group]",
  "[data-reveal-item]",
].join(",");

interface KillableTween {
  kill: () => void;
}

const safelyClearRevealStyles = (targets: readonly HTMLElement[]) => {
  if (targets.length === 0) {
    return;
  }

  try {
    gsap.set(targets, {
      clearProps: "opacity,visibility,transform",
    });
  } catch {
    for (const target of targets) {
      target.style.removeProperty("opacity");
      target.style.removeProperty("visibility");
      target.style.removeProperty("transform");
    }
  }
};

const getContainerTargets = (container: HTMLElement) => {
  if (!container.hasAttribute("data-reveal-group")) {
    return [container];
  }

  const items = Array.from(
    container.querySelectorAll<HTMLElement>("[data-reveal-item]"),
  );
  return items.length > 0 ? items : [container];
};

export function useGsapReveal<
  T extends HTMLElement,
>(): MutableRefObject<T | null> {
  const scopeRef = useRef<T | null>(null);

  useEffect(() => {
    const root = scopeRef.current;
    if (!root) {
      return undefined;
    }

    const allTargets = Array.from(
      root.querySelectorAll<HTMLElement>(REVEAL_TARGET_SELECTOR),
    );
    const activeTweens: KillableTween[] = [];
    let observer: IntersectionObserver | null = null;
    let context: ReturnType<typeof gsap.context> | null = null;
    let mediaQuery: MediaQueryList | null = null;
    let removeMotionListener: () => void = () => {};
    let resourcesReleased = false;
    let motionSuppressed = false;

    const killActiveTweens = () => {
      for (const tween of activeTweens.splice(0)) {
        try {
          tween.kill();
        } catch {
          // A failed tween cleanup must not prevent the remaining cleanup.
        }
      }
    };

    const showFinalState = () => {
      safelyClearRevealStyles(allTargets);
    };

    const handleMotionChange = (event: MediaQueryListEvent) => {
      if (!event.matches) {
        return;
      }

      motionSuppressed = true;
      observer?.disconnect();
      killActiveTweens();
      showFinalState();
    };

    const releaseResources = () => {
      if (resourcesReleased) {
        return;
      }
      resourcesReleased = true;

      removeMotionListener();
      observer?.disconnect();
      killActiveTweens();

      try {
        context?.revert();
      } catch {
        // DOM visibility is restored below when setup itself fails.
      }
    };

    try {
      if (
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function"
      ) {
        mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
        motionSuppressed = mediaQuery.matches;

        if (typeof mediaQuery.addEventListener === "function") {
          mediaQuery.addEventListener("change", handleMotionChange);
          removeMotionListener = () =>
            mediaQuery?.removeEventListener("change", handleMotionChange);
        } else {
          mediaQuery.addListener(handleMotionChange);
          removeMotionListener = () =>
            mediaQuery?.removeListener(handleMotionChange);
        }
      }

      context = gsap.context(() => {
        if (motionSuppressed) {
          showFinalState();
          return;
        }

        const heroTargets = Array.from(
          root.querySelectorAll<HTMLElement>("[data-hero-reveal]"),
        );
        if (heroTargets.length > 0) {
          gsap.set(heroTargets, { autoAlpha: 0, y: 20 });
          activeTweens.push(
            gsap.to(heroTargets, {
              autoAlpha: 1,
              y: 0,
              duration: 0.76,
              stagger: 0.1,
              ease: "power2.out",
              clearProps: "opacity,visibility,transform",
            }),
          );
        }

        const viewerTargets = Array.from(
          root.querySelectorAll<HTMLElement>("[data-viewer-reveal]"),
        );
        if (viewerTargets.length > 0) {
          gsap.set(viewerTargets, { autoAlpha: 0, y: 18 });
          activeTweens.push(
            gsap.to(viewerTargets, {
              autoAlpha: 1,
              y: 0,
              duration: 0.72,
              ease: "power2.out",
              clearProps: "opacity,visibility,transform",
            }),
          );
        }

        const containers = Array.from(
          root.querySelectorAll<HTMLElement>(
            "[data-reveal], [data-reveal-group]",
          ),
        );
        const leafContainers = containers.filter(
          (container) =>
            !containers.some(
              (candidate) =>
                candidate !== container && container.contains(candidate),
            ),
        );
        const targetsByContainer = new Map(
          leafContainers.map((container) => [
            container,
            getContainerTargets(container),
          ]),
        );
        const animatingContainers = new Set<HTMLElement>();

        if (typeof IntersectionObserver === "function") {
          observer = new IntersectionObserver(
            (entries) => {
              const restoreWithoutAnimation = (
                entry: IntersectionObserverEntry,
              ) => {
                const container = entry.target as HTMLElement;
                const targets = targetsByContainer.get(container) ?? [container];
                safelyClearRevealStyles(targets);
                observer?.unobserve(container);
              };

              if (resourcesReleased || motionSuppressed) {
                entries.forEach(restoreWithoutAnimation);
                return;
              }

              for (const entry of entries) {
                if (resourcesReleased || motionSuppressed) {
                  restoreWithoutAnimation(entry);
                  continue;
                }

                if (!entry.isIntersecting) {
                  continue;
                }

                const container = entry.target as HTMLElement;
                const targets = targetsByContainer.get(container) ?? [container];
                if (animatingContainers.has(container)) {
                  continue;
                }

                animatingContainers.add(container);
                try {
                  let revealTween: KillableTween | null = null;
                  revealTween = gsap.to(targets, {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.72,
                    stagger: 0.09,
                    ease: "power2.out",
                    clearProps: "opacity,visibility,transform",
                    onComplete: () => {
                      if (revealTween) {
                        const tweenIndex = activeTweens.indexOf(revealTween);
                        if (tweenIndex >= 0) {
                          activeTweens.splice(tweenIndex, 1);
                        }
                      }
                      animatingContainers.delete(container);
                      observer?.unobserve(container);
                    },
                  });
                  activeTweens.push(revealTween);
                } catch {
                  animatingContainers.delete(container);
                  safelyClearRevealStyles(targets);
                  observer?.unobserve(container);
                }
              }
            },
            {
              rootMargin: "0px 0px -12% 0px",
              threshold: 0.18,
            },
          );

          for (const [container, targets] of targetsByContainer) {
            gsap.set(targets, { autoAlpha: 0, y: 22 });
            observer.observe(container);
          }
        } else {
          for (const targets of targetsByContainer.values()) {
            activeTweens.push(
              gsap.fromTo(
                targets,
                { autoAlpha: 0, y: 16 },
                {
                  autoAlpha: 1,
                  y: 0,
                  duration: 0.6,
                  stagger: 0.08,
                  ease: "power2.out",
                  clearProps: "opacity,visibility,transform",
                },
              ),
            );
          }
        }
      }, root);
    } catch {
      releaseResources();
      showFinalState();
    }

    return releaseResources;
  }, []);

  return scopeRef;
}
