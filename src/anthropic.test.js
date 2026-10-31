import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.hoisted runs before the vi.mock factory, so each test can swap the
// signed-in user without re-importing the module.
const authMock = vi.hoisted(() => ({ currentUser: null }));
vi.mock("./firebase", () => ({ auth: authMock }));

import {
  AiRequestError,
  generateFlashcards,
  generateFlashcardsFromNotes,
  generateNoteSummary,
  generateResponse,
} from "./anthropic";

const reply = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

const sentBody = () => JSON.parse(fetch.mock.calls[0][1].body);

beforeEach(() => {
  authMock.currentUser = { getIdToken: vi.fn().mockResolvedValue("id-token-123") };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply(200, { text: "AI answer" })));
});

describe("src/anthropic.js", () => {
  it("throws a 401 AiRequestError without calling the API when signed out", async () => {
    authMock.currentUser = null;
    const error = await generateNoteSummary("notes").catch((e) => e);

    expect(error).toBeInstanceOf(AiRequestError);
    expect(error.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("POSTs to /api/ai with the ID token and returns the text", async () => {
    const text = await generateNoteSummary("notes");

    expect(text).toBe("AI answer");
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("/api/ai");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer id-token-123");
    expect(sentBody()).toEqual({ task: "summary", text: "notes" });
  });

  it("sends the card count as a number", async () => {
    await generateFlashcards("Cells", "25");

    expect(sentBody()).toEqual({ task: "flashcards", source: "topic", text: "Cells", count: 25 });
  });

  describe("flashcard replies", () => {
    // What /api/ai returned in the incognito test: a complete 20-card JSON
    // array that the model wrapped in a markdown code fence.
    const cards = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      question: `What is concept ${i + 1} in cell biology?`,
      answer: `Concept ${i + 1} explained in a sentence.`,
    }));
    const fenced = "```json\n" + JSON.stringify(cards, null, 2) + "\n```";

    it.each([
      ["a topic", () => generateFlashcards("Cell biology", "20")],
      ["notes", () => generateFlashcardsFromNotes("Mitochondria make ATP.", "20")],
    ])("returns text the page can JSON.parse when the reply from %s is fence-wrapped", async (_label, generate) => {
      fetch.mockResolvedValue(reply(200, { text: fenced }));

      // The same two steps NewFlashcards, Note and NewNote run.
      const aiResponse = await generate();
      const parsedResponse = JSON.parse(aiResponse);

      expect(parsedResponse).toEqual(cards);
    });

    it.each([
      ["CRLF line endings", "```json\r\n" + JSON.stringify(cards, null, 2).replace(/\n/g, "\r\n") + "\r\n```"],
      ["no language tag", "```\n" + JSON.stringify(cards) + "\n```"],
    ])("strips a fence with %s", async (_label, text) => {
      fetch.mockResolvedValue(reply(200, { text }));

      expect(JSON.parse(await generateFlashcards("Cell biology", "20"))).toEqual(cards);
    });

    it.each([
      ["an unfenced reply", JSON.stringify(cards)],
      ["a reply with text before the fence", "Here are your cards:\n" + fenced],
    ])("leaves %s unchanged", async (_label, text) => {
      fetch.mockResolvedValue(reply(200, { text }));

      expect(await generateFlashcards("Cell biology", "20")).toBe(text);
    });
  });

  describe("chat history", () => {
    it("sends the question exactly once when history already ends with it", async () => {
      const history = [
        { id: 1, role: "assistant", content: "Welcome!" },
        { id: 2, role: "user", content: "What is osmosis?" },
      ];
      await generateResponse("What is osmosis?", history);

      // The ids are stripped too: the server only accepts role and content.
      expect(sentBody().messages).toEqual([
        { role: "assistant", content: "Welcome!" },
        { role: "user", content: "What is osmosis?" },
      ]);
    });

    it("appends the question when the last message is from the assistant, even with the same text", async () => {
      const history = [{ role: "assistant", content: "What is osmosis?" }];
      await generateResponse("What is osmosis?", history);

      expect(sentBody().messages).toEqual([
        { role: "assistant", content: "What is osmosis?" },
        { role: "user", content: "What is osmosis?" },
      ]);
    });

    it("sends at most the last 10 messages", async () => {
      const history = Array.from({ length: 15 }, (_, i) => ({
        role: i % 2 ? "assistant" : "user",
        content: `message ${i}`,
      }));
      await generateResponse("message 14", history);

      const { messages } = sentBody();
      expect(messages).toHaveLength(10);
      expect(messages.at(-1)).toEqual({ role: "user", content: "message 14" });
    });
  });

  describe("errors", () => {
    it.each([
      [400, "Invalid request"],
      [401, "Unauthorized"],
      [429, "Too many requests. Please try again shortly."],
      [502, "The AI service is unavailable. Please try again."],
    ])("carries HTTP status %i and the server's message", async (status, message) => {
      fetch.mockResolvedValue(reply(status, { error: message }));
      const error = await generateNoteSummary("notes").catch((e) => e);

      expect(error).toBeInstanceOf(AiRequestError);
      expect(error.status).toBe(status);
      expect(error.message).toBe(message);
      expect(error.message).not.toContain("id-token-123");
    });

    it("uses a fallback message when the error body is not JSON", async () => {
      fetch.mockResolvedValue({ ok: false, status: 504, json: async () => { throw new SyntaxError("x"); } });
      const error = await generateNoteSummary("notes").catch((e) => e);

      expect(error.status).toBe(504);
      expect(error.message).toBe("The AI request failed.");
    });

    it("treats a successful response without text as a 502", async () => {
      fetch.mockResolvedValue(reply(200, { unexpected: true }));
      const error = await generateNoteSummary("notes").catch((e) => e);

      expect(error.status).toBe(502);
    });
  });
});
