import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import logDevError from "./logDevError";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("logDevError", () => {
  it("logs the error's name and message in development", () => {
    vi.stubEnv("DEV", true);
    logDevError("Flashcard generation failed", Object.assign(new Error("Rate limited"), { name: "AiRequestError" }));

    expect(console.error).toHaveBeenCalledWith("Flashcard generation failed:", "AiRequestError", "Rate limited");
  });

  it("replaces a JSON.parse message, which quotes the reply", () => {
    vi.stubEnv("DEV", true);
    let parseError;
    try {
      JSON.parse("My private notes about mitochondria");
    } catch (error) {
      parseError = error;
    }
    // Guard: the native message really does quote the input.
    expect(parseError.message).toContain("My private");

    logDevError("Flashcard generation failed", parseError);

    expect(console.error).toHaveBeenCalledWith(
      "Flashcard generation failed:",
      "SyntaxError",
      "reply was not valid JSON"
    );
    expect(JSON.stringify(console.error.mock.calls)).not.toContain("private");
  });

  it("logs nothing in production", () => {
    vi.stubEnv("DEV", false);
    logDevError("Flashcard generation failed", new Error("boom"));

    expect(console.error).not.toHaveBeenCalled();
  });
});
