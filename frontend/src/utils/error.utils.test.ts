import { describe, expect, it } from "vitest";
import { getErrorMessage } from "./error.utils";

describe("getErrorMessage", () => {
  it("returns a useful message from common error shapes", () => {
    expect(getErrorMessage("Failed")).toBe("Failed");
    expect(getErrorMessage(new Error("Broken"))).toBe("Broken");
    expect(
      getErrorMessage({
        response: { data: { message: "Request failed" } }
      })
    ).toBe("Request failed");
    expect(
      getErrorMessage({
        response: { data: { error: "Invalid payload" } }
      })
    ).toBe("Invalid payload");
  });

  it("falls back for empty or unknown errors", () => {
    expect(getErrorMessage("")).toBe("Something went wrong. Please try again.");
    expect(getErrorMessage(null, "Fallback")).toBe("Fallback");
    expect(getErrorMessage({ message: "" }, "Fallback")).toBe("Fallback");
  });
});
