import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ErrorBoundary from "./ErrorBoundary";

const BrokenChild = () => {
  throw new Error("Render failed");
};

describe("ErrorBoundary", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("shows a controlled fallback when a child render fails", () => {
    render(
      <ErrorBoundary>
        <BrokenChild />
      </ErrorBoundary>
    );

    expect(
      screen.getByRole("heading", { name: /something went wrong/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Render failed")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reload page/i })
    ).toBeInTheDocument();
  });
});
