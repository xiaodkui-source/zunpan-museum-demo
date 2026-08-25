import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useGsapReveal } from "./useGsapReveal";

const gsapMocks = vi.hoisted(() => {
  const contextRevert = vi.fn();
  const tweenKill = vi.fn();

  return {
    contextRevert,
    tweenKill,
    set: vi.fn(
      (_targets: unknown, _variables: Record<string, unknown>) => undefined,
    ),
    to: vi.fn(
      (_targets: unknown, _variables: Record<string, unknown>) => ({
        kill: tweenKill,
      }),
    ),
    fromTo: vi.fn(
      (
        _targets: unknown,
        _fromVariables: Record<string, unknown>,
        _toVariables: Record<string, unknown>,
      ) => ({ kill: tweenKill }),
    ),
    context: vi.fn((callback: () => void, _scope?: unknown) => {
      callback();
      return { revert: contextRevert };
    }),
  };
});

vi.mock("gsap", () => ({
  gsap: {
    context: gsapMocks.context,
    fromTo: gsapMocks.fromTo,
    set: gsapMocks.set,
    to: gsapMocks.to,
  },
}));

const observerSpies = {
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
};

let observerCallback: IntersectionObserverCallback | null = null;
let observerInstance: IntersectionObserver | null = null;
let mediaChangeListener: ((event: MediaQueryListEvent) => void) | null = null;
let removeMediaListener = vi.fn(
  (_type: string, _listener: EventListenerOrEventListenerObject) => undefined,
);

class IntersectionObserverMock implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "0px";
  readonly thresholds = [0.18];

  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback;
    observerInstance = this;
  }

  disconnect = observerSpies.disconnect;
  observe = observerSpies.observe;
  takeRecords = () => [];
  unobserve = observerSpies.unobserve;
}

function stubMotionPreference(matches: boolean) {
  removeMediaListener = vi.fn(
    (_type: string, _listener: EventListenerOrEventListenerObject) => undefined,
  );
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() =>
      ({
        matches,
        media: "(prefers-reduced-motion: reduce)",
        onchange: null,
        addEventListener: vi.fn(
          (_type: string, listener: EventListenerOrEventListenerObject) => {
            if (typeof listener === "function") {
              mediaChangeListener =
                listener as (event: MediaQueryListEvent) => void;
            }
          },
        ),
        removeEventListener: removeMediaListener,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(() => true),
      }) as unknown as MediaQueryList,
    ),
  );
}

function RevealHarness() {
  const scopeRef = useGsapReveal<HTMLDivElement>();

  return (
    <div ref={scopeRef}>
      <p data-hero-reveal>Hero eyebrow</p>
      <div data-viewer-reveal>Viewer</div>
      <section data-reveal="parent" data-testid="reveal-parent">
        <header data-reveal="heading" data-testid="reveal-heading">
          Section heading
        </header>
        <ol data-reveal-group data-testid="reveal-group">
          <li data-reveal-item>First item</li>
          <li data-reveal-item>Second item</li>
        </ol>
      </section>
    </div>
  );
}

function createIntersectionEntry(target: HTMLElement): IntersectionObserverEntry {
  const bounds = target.getBoundingClientRect();

  return {
    boundingClientRect: bounds,
    intersectionRect: bounds,
    target,
    isIntersecting: true,
    intersectionRatio: 1,
    rootBounds: null,
    time: 0,
  };
}

beforeEach(() => {
  observerCallback = null;
  observerInstance = null;
  mediaChangeListener = null;
  Object.values(observerSpies).forEach((spy) => spy.mockReset());
  gsapMocks.context.mockClear();
  gsapMocks.contextRevert.mockReset();
  gsapMocks.fromTo.mockClear();
  gsapMocks.set.mockClear();
  gsapMocks.to.mockClear();
  gsapMocks.tweenKill.mockReset();
  vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
  stubMotionPreference(false);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("useGsapReveal", () => {
  it("observes and hides only leaf reveal containers when reveal hooks are nested", () => {
    render(<RevealHarness />);
    const parent = screen.getByTestId("reveal-parent");
    const heading = screen.getByTestId("reveal-heading");
    const group = screen.getByTestId("reveal-group");
    const groupItems = Array.from(group.querySelectorAll("[data-reveal-item]"));
    const initiallyHidden = gsapMocks.set.mock.calls
      .filter(([, variables]) => variables.autoAlpha === 0)
      .flatMap(([targets]) => (Array.isArray(targets) ? targets : [targets]));

    expect(observerSpies.observe).not.toHaveBeenCalledWith(parent);
    expect(observerSpies.observe).toHaveBeenCalledWith(heading);
    expect(observerSpies.observe).toHaveBeenCalledWith(group);
    expect(initiallyHidden).not.toContain(parent);
    expect(initiallyHidden).toContain(heading);
    expect(initiallyHidden).toEqual(expect.arrayContaining(groupItems));
  });

  it("keeps every target visible and creates no animations under reduced motion", () => {
    stubMotionPreference(true);

    render(<RevealHarness />);

    expect(gsapMocks.fromTo).not.toHaveBeenCalled();
    expect(gsapMocks.to).not.toHaveBeenCalled();
    expect(observerSpies.observe).not.toHaveBeenCalled();
    expect(gsapMocks.set).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        clearProps: "opacity,visibility,transform",
      }),
    );
    expect(gsapMocks.set).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ autoAlpha: 0 }),
    );
  });

  it("animates an intersecting reveal group and unobserves it after completion", () => {
    render(<RevealHarness />);
    const group = screen.getByTestId("reveal-group");
    const groupItems = Array.from(group.querySelectorAll("[data-reveal-item]"));

    expect(observerCallback).not.toBeNull();
    observerCallback?.(
      [createIntersectionEntry(group)],
      observerInstance as IntersectionObserver,
    );

    const groupTweenCall = gsapMocks.to.mock.calls.find(([targets]) =>
      Array.isArray(targets) && targets.includes(groupItems[0]),
    );
    expect(groupTweenCall).toBeDefined();
    expect(groupTweenCall?.[1]).toEqual(
      expect.objectContaining({
        autoAlpha: 1,
        y: 0,
        ease: "power2.out",
        duration: expect.any(Number),
        stagger: expect.any(Number),
        onComplete: expect.any(Function),
      }),
    );

    const onComplete = (groupTweenCall?.[1] as { onComplete: () => void })
      .onComplete;
    onComplete();
    expect(observerSpies.unobserve).toHaveBeenCalledWith(group);
  });

  it("restores observed content if tween creation throws inside the observer callback", () => {
    render(<RevealHarness />);
    const group = screen.getByTestId("reveal-group");
    const groupItems = Array.from(group.querySelectorAll("[data-reveal-item]"));
    gsapMocks.to.mockImplementationOnce(() => {
      throw new Error("animation unavailable");
    });

    expect(() => {
      observerCallback?.(
        [createIntersectionEntry(group)],
        observerInstance as IntersectionObserver,
      );
    }).not.toThrow();
    expect(gsapMocks.set).toHaveBeenLastCalledWith(groupItems, {
      clearProps: "opacity,visibility,transform",
    });
    expect(observerSpies.unobserve).toHaveBeenCalledWith(group);
  });

  it("disconnects observation, removes preference listeners, kills tweens, and reverts context", () => {
    const { unmount } = render(<RevealHarness />);

    unmount();

    expect(observerSpies.disconnect).toHaveBeenCalledTimes(1);
    expect(removeMediaListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
    expect(gsapMocks.tweenKill).toHaveBeenCalled();
    expect(gsapMocks.contextRevert).toHaveBeenCalledTimes(1);
  });

  it("uses an immediate light fallback animation when IntersectionObserver is unavailable", () => {
    vi.stubGlobal("IntersectionObserver", undefined);

    render(<RevealHarness />);
    const group = screen.getByTestId("reveal-group");
    const groupItems = Array.from(group.querySelectorAll("[data-reveal-item]"));
    const fallbackCall = gsapMocks.fromTo.mock.calls.find(([targets]) =>
      Array.isArray(targets) && targets.includes(groupItems[0]),
    );

    expect(fallbackCall).toBeDefined();
    expect(fallbackCall?.[1]).toEqual(
      expect.objectContaining({ autoAlpha: 0, y: expect.any(Number) }),
    );
    expect(fallbackCall?.[2]).toEqual(
      expect.objectContaining({
        autoAlpha: 1,
        y: 0,
        ease: "power2.out",
        clearProps: "opacity,visibility,transform",
      }),
    );
  });

  it("returns all targets to a visible state if reduced motion changes at runtime", () => {
    render(<RevealHarness />);

    expect(mediaChangeListener).not.toBeNull();
    mediaChangeListener?.({ matches: true } as MediaQueryListEvent);

    expect(observerSpies.disconnect).toHaveBeenCalled();
    expect(gsapMocks.tweenKill).toHaveBeenCalled();
    expect(gsapMocks.set).toHaveBeenLastCalledWith(
      expect.any(Array),
      expect.objectContaining({
        clearProps: "opacity,visibility,transform",
      }),
    );
  });

  it("suppresses a queued observer callback after unmount", () => {
    const { unmount } = render(<RevealHarness />);
    const group = screen.getByTestId("reveal-group");
    const groupItems = Array.from(group.querySelectorAll("[data-reveal-item]"));
    const queuedCallback = observerCallback;

    unmount();
    const tweenCallsAfterUnmount = gsapMocks.to.mock.calls.length;
    const setCallsAfterUnmount = gsapMocks.set.mock.calls.length;
    queuedCallback?.(
      [createIntersectionEntry(group)],
      observerInstance as IntersectionObserver,
    );

    expect(gsapMocks.to).toHaveBeenCalledTimes(tweenCallsAfterUnmount);
    expect(gsapMocks.set).toHaveBeenCalledTimes(setCallsAfterUnmount + 1);
    expect(gsapMocks.set).toHaveBeenLastCalledWith(groupItems, {
      clearProps: "opacity,visibility,transform",
    });
    expect(observerSpies.unobserve).toHaveBeenCalledWith(group);
  });

  it("permanently suppresses queued observer callbacks after reduced motion turns on", () => {
    render(<RevealHarness />);
    const group = screen.getByTestId("reveal-group");
    const queuedCallback = observerCallback;

    mediaChangeListener?.({ matches: true } as MediaQueryListEvent);
    const tweenCallsAfterPreferenceChange = gsapMocks.to.mock.calls.length;
    queuedCallback?.(
      [createIntersectionEntry(group)],
      observerInstance as IntersectionObserver,
    );

    expect(gsapMocks.to).toHaveBeenCalledTimes(tweenCallsAfterPreferenceChange);
    expect(observerSpies.unobserve).toHaveBeenCalledWith(group);

    mediaChangeListener?.({ matches: false } as MediaQueryListEvent);
    queuedCallback?.(
      [createIntersectionEntry(group)],
      observerInstance as IntersectionObserver,
    );
    expect(gsapMocks.to).toHaveBeenCalledTimes(tweenCallsAfterPreferenceChange);
  });
});
