import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ModelErrorBoundary } from "./ModelErrorBoundary";

const ThrowingModel = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error("model failed to render");
  }

  return <p>model rendered</p>;
};

describe("ModelErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("contains a child error, renders the supplied fallback, and reports the error", () => {
    const onError = vi.fn();

    render(
      <>
        <p>surrounding page remains</p>
        <ModelErrorBoundary
          fallback={<p>model unavailable</p>}
          onError={onError}
          resetKey="first"
        >
          <ThrowingModel />
        </ModelErrorBoundary>
      </>,
    );

    expect(screen.getByText("surrounding page remains")).toBeInTheDocument();
    expect(screen.getByText("model unavailable")).toBeInTheDocument();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toEqual(
      expect.objectContaining({ message: "model failed to render" }),
    );
  });

  it("clears its captured error and retries children when resetKey changes", () => {
    const onError = vi.fn();
    const { rerender } = render(
      <ModelErrorBoundary
        fallback={<p>model unavailable</p>}
        onError={onError}
        resetKey="first"
      >
        <ThrowingModel />
      </ModelErrorBoundary>,
    );

    expect(screen.getByText("model unavailable")).toBeInTheDocument();

    rerender(
      <ModelErrorBoundary
        fallback={<p>model unavailable</p>}
        onError={onError}
        resetKey="second"
      >
        <ThrowingModel shouldThrow={false} />
      </ModelErrorBoundary>,
    );

    expect(screen.getByText("model rendered")).toBeInTheDocument();
    expect(screen.queryByText("model unavailable")).not.toBeInTheDocument();
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
