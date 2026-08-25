import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useModelAvailability } from "./useModelAvailability";
import { useReducedMotion } from "./useReducedMotion";
import { useRenderActivity } from "./useRenderActivity";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
});

describe("useReducedMotion", () => {
  it("tracks modern media-query changes and removes its listener", () => {
    let onChange: ((event: MediaQueryListEvent) => void) | undefined;
    const removeEventListener = vi.fn();
    const mediaQuery = {
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addEventListener: vi.fn((_type, listener) => {
        onChange = listener as (event: MediaQueryListEvent) => void;
      }),
      removeEventListener,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as MediaQueryList;
    vi.stubGlobal("matchMedia", vi.fn(() => mediaQuery));

    const { result, unmount } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);

    act(() => onChange?.({ matches: false } as MediaQueryListEvent));
    expect(result.current).toBe(false);

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith("change", onChange);
  });

  it("supports legacy media-query listeners", () => {
    let onChange: ((event: MediaQueryListEvent) => void) | undefined;
    const removeListener = vi.fn();
    const mediaQuery = {
      matches: false,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addListener: vi.fn((listener) => {
        onChange = listener as (event: MediaQueryListEvent) => void;
      }),
      removeListener,
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;
    vi.stubGlobal("matchMedia", vi.fn(() => mediaQuery));

    const { result, unmount } = renderHook(() => useReducedMotion());
    act(() => onChange?.({ matches: true } as MediaQueryListEvent));
    expect(result.current).toBe(true);

    unmount();
    expect(removeListener).toHaveBeenCalledWith(onChange);
  });
});

describe("useRenderActivity", () => {
  it("combines intersection and document visibility and disconnects the observer", () => {
    let intersectionCallback: IntersectionObserverCallback | undefined;
    const observe = vi.fn();
    const disconnect = vi.fn();

    class IntersectionObserverMock {
      constructor(callback: IntersectionObserverCallback) {
        intersectionCallback = callback;
      }

      observe = observe;
      disconnect = disconnect;
      unobserve = vi.fn();
      takeRecords = vi.fn(() => []);
      root = null;
      rootMargin = "0px";
      thresholds = [0];
    }

    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });

    const Probe = () => {
      const { ref, isActive, isInViewport } = useRenderActivity<HTMLDivElement>();
      return (
        <div
          ref={ref}
          data-testid="probe"
          data-active={String(isActive)}
          data-in-viewport={String(isInViewport)}
        />
      );
    };

    const { unmount } = render(<Probe />);
    const probe = screen.getByTestId("probe");
    expect(observe).toHaveBeenCalledWith(probe);
    expect(probe).toHaveAttribute("data-active", "true");

    act(() => {
      intersectionCallback?.(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    expect(probe).toHaveAttribute("data-in-viewport", "false");
    expect(probe).toHaveAttribute("data-active", "false");

    act(() => {
      intersectionCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    fireEvent(document, new Event("visibilitychange"));
    expect(probe).toHaveAttribute("data-in-viewport", "true");
    expect(probe).toHaveAttribute("data-active", "false");

    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("defaults to in-view when IntersectionObserver is unavailable", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const { result } = renderHook(() => useRenderActivity());

    expect(result.current.isInViewport).toBe(true);
    expect(result.current.isActive).toBe(true);
  });
});

describe("useModelAvailability", () => {
  const encode = (value: string) => new TextEncoder().encode(value);

  const streamResponse = ({
    magic,
    ok = true,
    status = 206,
  }: {
    magic: string;
    ok?: boolean;
    status?: number;
  }) => {
    const cancel = vi.fn(async () => undefined);
    const read = vi
      .fn()
      .mockResolvedValueOnce({ done: false, value: encode(magic) })
      .mockResolvedValue({ done: true, value: undefined });

    return {
      cancel,
      read,
      response: {
        ok,
        status,
        body: { getReader: () => ({ read, cancel }) },
      } as unknown as Response,
    };
  };

  const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((next) => {
      resolve = next;
    });
    return { promise, resolve };
  };

  it("marks a ranged glTF response as available", async () => {
    const glb = streamResponse({ magic: "glTF" });
    const fetchMock = vi.fn(async () => glb.response);
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useModelAvailability("/models/zunpan.glb"));

    expect(result.current.status).toBe("checking");
    await waitFor(() => expect(result.current.status).toBe("available"));
    expect(result.current.message).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "/models/zunpan.glb",
      expect.objectContaining({
        headers: { Range: "bytes=0-3" },
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("stops a response stream after reading the four-byte GLB signature", async () => {
    const cancel = vi.fn(async () => undefined);
    const read = vi.fn(async () => ({
      done: false,
      value: encode("glTFextra payload"),
    }));
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      body: { getReader: () => ({ read, cancel }) },
    } as unknown as Response)));

    const { result } = renderHook(() => useModelAvailability("/models/zunpan.glb"));

    await waitFor(() => expect(result.current.status).toBe("available"));
    expect(read).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("cancels a 404 response body without reading it", async () => {
    const missing = streamResponse({ magic: "not read", ok: false, status: 404 });
    vi.stubGlobal("fetch", vi.fn(async () => missing.response));

    const { result } = renderHook(() => useModelAvailability("/models/zunpan.glb"));

    await waitFor(() => expect(result.current.status).toBe("missing"));
    expect(result.current.message).toEqual(expect.any(String));
    expect(missing.read).not.toHaveBeenCalled();
    expect(missing.cancel).toHaveBeenCalledTimes(1);
  });

  it("treats a response without a readable stream as missing without buffering it", async () => {
    const arrayBuffer = vi.fn(async () => encode("glTF plus an unbounded payload").buffer);
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 206,
      body: null,
      arrayBuffer,
    } as unknown as Response)));

    const { result } = renderHook(() => useModelAvailability("/models/zunpan.glb"));

    await waitFor(() => expect(result.current.status).toBe("missing"));
    expect(result.current.message).toEqual(expect.any(String));
    expect(arrayBuffer).not.toHaveBeenCalled();
  });

  it("marks an HTML fallback stream as missing", async () => {
    const html = streamResponse({ magic: "<!DOCTYPE html>" });
    vi.stubGlobal("fetch", vi.fn(async () => html.response));

    const { result } = renderHook(() => useModelAvailability("/models/zunpan.glb"));

    await waitFor(() => expect(result.current.status).toBe("missing"));
    expect(result.current.message).toEqual(expect.any(String));
  });

  it("exposes checking during the first render for a newly requested src", async () => {
    const sourceA = streamResponse({ magic: "glTF" });
    const sourceB = deferred<Response>();
    vi.stubGlobal("fetch", vi.fn((src: RequestInfo | URL) =>
      String(src).endsWith("a.glb")
        ? Promise.resolve(sourceA.response)
        : sourceB.promise,
    ));
    const renders: Array<{ src: string; status: string }> = [];

    const Probe = ({ src }: { src: string }) => {
      const availability = useModelAvailability(src);
      renders.push({ src, status: availability.status });
      return <span>{availability.status}</span>;
    };

    const { rerender } = render(<Probe src="/models/a.glb" />);
    await waitFor(() => expect(screen.getByText("available")).toBeInTheDocument());

    const firstSourceBRender = renders.length;
    rerender(<Probe src="/models/b.glb" />);

    expect(renders[firstSourceBRender]).toEqual({
      src: "/models/b.glb",
      status: "checking",
    });
  });

  it("aborts the previous src and ignores its response if it arrives late", async () => {
    const sourceA = deferred<Response>();
    const sourceB = deferred<Response>();
    const responseA = streamResponse({ magic: "glTF" });
    const responseB = streamResponse({ magic: "<!DOCTYPE html>" });
    const signals = new Map<string, AbortSignal>();
    vi.stubGlobal("fetch", vi.fn((src: RequestInfo | URL, init?: RequestInit) => {
      const key = String(src);
      signals.set(key, init?.signal as AbortSignal);
      return key.endsWith("a.glb") ? sourceA.promise : sourceB.promise;
    }));

    const { result, rerender } = renderHook(
      ({ src }) => useModelAvailability(src),
      { initialProps: { src: "/models/a.glb" } },
    );

    rerender({ src: "/models/b.glb" });
    expect(signals.get("/models/a.glb")?.aborted).toBe(true);

    sourceB.resolve(responseB.response);
    await waitFor(() => expect(result.current.status).toBe("missing"));

    sourceA.resolve(responseA.response);
    await waitFor(() => expect(responseA.cancel).toHaveBeenCalledTimes(1));
    expect(responseA.read).not.toHaveBeenCalled();
    expect(result.current.status).toBe("missing");
  });

  it("aborts an unfinished check on cleanup", () => {
    let requestSignal: AbortSignal | undefined;
    vi.stubGlobal("fetch", vi.fn((_src, init) => {
      requestSignal = init?.signal as AbortSignal;
      return new Promise<Response>(() => undefined);
    }));

    const { unmount } = renderHook(() => useModelAvailability("/models/zunpan.glb"));
    expect(requestSignal?.aborted).toBe(false);

    unmount();
    expect(requestSignal?.aborted).toBe(true);
  });
});
