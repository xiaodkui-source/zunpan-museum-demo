import { useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";

export interface RenderActivity<T extends Element> {
  ref: MutableRefObject<T | null>;
  isActive: boolean;
  isInViewport: boolean;
}

const readDocumentVisibility = () =>
  typeof document === "undefined" || document.visibilityState !== "hidden";

export function useRenderActivity<T extends Element = HTMLElement>(): RenderActivity<T> {
  const ref = useRef<T | null>(null);
  const [isInViewport, setIsInViewport] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(
    readDocumentVisibility,
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsDocumentVisible(readDocumentVisibility());
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const element = ref.current;

    if (!element || typeof IntersectionObserver === "undefined") {
      setIsInViewport(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry?.isIntersecting ?? false);
      },
      { threshold: 0.01 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return {
    ref,
    isActive: isInViewport && isDocumentVisible,
    isInViewport,
  };
}
