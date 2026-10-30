import { auth } from "./firebase";

// The prompts and the Anthropic API key live on the server, in the /api/ai
// Netlify Function (netlify/functions/ai.js). This module only calls it.

/**
 * An error from the /api/ai endpoint. `status` is the HTTP status, so
 * handleAnthropicError can turn it into a user-facing message. A signed-out
 * user gets status 401, the same as an expired or rejected token.
 */
export class AiRequestError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "AiRequestError";
    this.status = status;
  }
}

/**
 * Sends a task to /api/ai with the current user's Firebase ID token.
 *
 * @param {Object} body - The request body; `task` selects chat, summary or flashcards.
 * @returns {Promise<string>} - The model's text reply.
 * @throws {AiRequestError} If the user is signed out or the server answers with an error.
 */
const callAi = async (body) => {
  const user = auth.currentUser;
  if (!user) {
    throw new AiRequestError("You are not signed in.", 401);
  }
  // getIdToken refreshes the token when it is close to expiring.
  const token = await user.getIdToken();

  const response = await fetch("/api/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AiRequestError(data?.error ?? "The AI request failed.", response.status);
  }
  if (typeof data?.text !== "string") {
    throw new AiRequestError("The AI service returned an unexpected response.", 502);
  }
  return data.text;
};

/**
 * Generates a response to a given question based on a conversation history.
 *
 * @param {string} question - The question to be answered.
 * @param {Array<Object>} history - The conversation history. Each element should have a `role` and a `content` field.
 *   The callers pass history that already ends with `question`; it is only appended when missing.
 * @returns {Promise<string>} - A promise that resolves to the AI response.
 */
const generateResponse = async (question, history = []) => {
  // The server accepts at most 10 messages, including the question.
  const MAX_CONTEXT = 10;
  const last = history.at(-1);
  const endsWithQuestion = last?.role === "user" && last?.content === question;
  const conversation = endsWithQuestion
    ? history
    : [...history, { role: "user", content: question }];

  return callAi({
    task: "chat",
    messages: conversation.slice(-MAX_CONTEXT).map((message) => ({
      role: message.role,
      content: message.content,
    })),
  });
};

/**
 * Generates flashcards based on a specified topic.
 *
 * @param {string} topic - The topic for which flashcards should be generated.
 * @param {number|string} numberOfCards - The exact number of flashcards to generate (20-40).
 * @returns {Promise<string>} - A promise that resolves to a string containing the JSON array of generated flashcards.
 */
const generateFlashcards = async (topic, numberOfCards) =>
  callAi({ task: "flashcards", source: "topic", text: topic, count: Number(numberOfCards) });

/**
 * Generates flashcards based on study notes.
 *
 * @param {string} notes - The study notes from which flashcards should be generated.
 * @param {number|string} numberOfCards - The exact number of flashcards to generate (20-40).
 * @returns {Promise<string>} - A promise that resolves to a string containing the JSON array of generated flashcards.
 */
const generateFlashcardsFromNotes = async (notes, numberOfCards) =>
  callAi({ task: "flashcards", source: "notes", text: notes, count: Number(numberOfCards) });

/**
 * Generates a concise summary of study notes.
 *
 * @param {string} notes - The study notes from which a summary should be generated.
 * @returns {Promise<string>} - A promise that resolves to a string containing the generated summary.
 */
const generateNoteSummary = async (notes) => callAi({ task: "summary", text: notes });

export { generateResponse, generateFlashcards, generateFlashcardsFromNotes, generateNoteSummary };
