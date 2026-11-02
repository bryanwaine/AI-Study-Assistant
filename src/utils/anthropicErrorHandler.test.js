import { describe, expect, it, vi } from "vitest";

// src/anthropic.js imports Firebase, which cannot start without config here.
vi.mock("../firebase", () => ({ auth: { currentUser: null } }));

import { AiRequestError } from "../anthropic";
import handleAnthropicError from "./anthropicErrorHandler";

describe("handleAnthropicError", () => {
  it("shows the server's fixed message for a 400 from /api/ai", () => {
    const error = new AiRequestError("Notes must be at most 50,000 characters.", 400);

    expect(handleAnthropicError(error).message).toBe("Notes must be at most 50,000 characters.");
  });

  it("keeps the friendly default when the server sent only the generic 400", () => {
    const error = new AiRequestError("Invalid request", 400);

    expect(handleAnthropicError(error).message).toBe(
      "Your input is too long or invalid. Please shorten it and try again."
    );
  });

  it("does not use the message of a 400 that did not come from /api/ai", () => {
    const error = Object.assign(new Error("some library detail"), { status: 400 });

    expect(handleAnthropicError(error).message).toBe(
      "Your input is too long or invalid. Please shorten it and try again."
    );
  });
});
