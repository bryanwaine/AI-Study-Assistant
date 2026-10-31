import { describe, expect, it, vi } from "vitest";

// src/anthropic.js imports Firebase, which cannot start without config here.
vi.mock("../firebase", () => ({ auth: { currentUser: null } }));

import { LENGTH_ERRORS } from "../../netlify/lib/schema.js";
import { NOTE_MAX_CHARS } from "../../shared/limits";
import { AiRequestError } from "../anthropic";
import createNoteWithSummary, { NOTE_TOO_LONG_MESSAGE } from "./createNoteWithSummary";

function setup({ generateNoteSummary } = {}) {
  return {
    generateNoteSummary: generateNoteSummary ?? vi.fn().mockResolvedValue("A short summary."),
    saveNote: vi.fn().mockResolvedValue("new-note-id"),
    updateNote: vi.fn().mockResolvedValue(undefined),
  };
}

const note = (overrides = {}) => ({
  userId: "user-1",
  noteId: null,
  title: "Cells",
  fileName: "cells.pdf",
  text: "Mitochondria make ATP.",
  previousMessages: [],
  ...overrides,
});

describe("createNoteWithSummary", () => {
  it("calls the model first, then saves the note once with the text and the summary", async () => {
    const deps = setup();
    const result = await createNoteWithSummary(note(), deps);

    expect(deps.generateNoteSummary).toHaveBeenCalledWith("Mitochondria make ATP.");
    expect(deps.saveNote).toHaveBeenCalledTimes(1);
    expect(deps.generateNoteSummary.mock.invocationCallOrder[0]).toBeLessThan(
      deps.saveNote.mock.invocationCallOrder[0]
    );
    const messages = [
      expect.objectContaining({ role: "user", content: "Mitochondria make ATP." }),
      expect.objectContaining({ role: "assistant", content: "A short summary." }),
    ];
    expect(deps.saveNote).toHaveBeenCalledWith("user-1", messages, "Cells", "cells.pdf");
    expect(deps.updateNote).not.toHaveBeenCalled();
    expect(result).toEqual({ noteId: "new-note-id", messages });
  });

  it.each([
    ["the server rejects the note", new AiRequestError("Notes must be at most 50,000 characters.", 400)],
    ["the model is rate limited", new AiRequestError("Too many requests. Please try again shortly.", 429)],
    ["the network fails", new TypeError("Failed to fetch")],
  ])("saves nothing when %s", async (_label, error) => {
    const deps = setup({ generateNoteSummary: vi.fn().mockRejectedValue(error) });

    await expect(createNoteWithSummary(note(), deps)).rejects.toBe(error);
    expect(deps.saveNote).not.toHaveBeenCalled();
    expect(deps.updateNote).not.toHaveBeenCalled();
  });

  it("rejects a note over the limit before calling the model, with the server's message", async () => {
    const deps = setup();
    const error = await createNoteWithSummary(note({ text: "x".repeat(NOTE_MAX_CHARS + 1) }), deps).catch(
      (e) => e
    );

    expect(error).toBeInstanceOf(AiRequestError);
    expect(error.status).toBe(400);
    expect(error.message).toBe(LENGTH_ERRORS.notes);
    expect(NOTE_TOO_LONG_MESSAGE).toBe(LENGTH_ERRORS.notes);
    expect(deps.generateNoteSummary).not.toHaveBeenCalled();
    expect(deps.saveNote).not.toHaveBeenCalled();
  });

  it("accepts a note of exactly the limit", async () => {
    const deps = setup();
    await createNoteWithSummary(note({ text: "x".repeat(NOTE_MAX_CHARS) }), deps);

    expect(deps.saveNote).toHaveBeenCalledTimes(1);
  });

  it("updates an existing note, keeping its earlier messages", async () => {
    const deps = setup();
    const earlier = [{ id: 1, role: "user", content: "Old notes" }, { id: 2, role: "assistant", content: "Old" }];
    const result = await createNoteWithSummary(
      note({ noteId: "existing-id", previousMessages: earlier }),
      deps
    );

    expect(deps.saveNote).not.toHaveBeenCalled();
    expect(deps.updateNote).toHaveBeenCalledTimes(1);
    expect(deps.updateNote).toHaveBeenCalledWith("user-1", "existing-id", [
      ...earlier,
      expect.objectContaining({ role: "user", content: "Mitochondria make ATP." }),
      expect.objectContaining({ role: "assistant", content: "A short summary." }),
    ]);
    expect(result.noteId).toBe("existing-id");
  });
});
