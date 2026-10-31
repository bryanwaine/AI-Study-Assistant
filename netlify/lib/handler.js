import {
  FLASHCARD_SYSTEM_PROMPT,
  NOTES_FLASHCARD_SYSTEM_PROMPT,
  NOTE_SUMMARY_SYSTEM_PROMPT,
  SESSION_SYSTEM_PROMPT,
} from "./prompts.js";
import { aiRequestSchema } from "./schema.js";

const MODEL = "claude-haiku-4-5";

const jsonResponse = (status, body, headers) =>
  Response.json(body, { status, headers });

/**
 * Turns a validated request body into Anthropic Messages API parameters.
 * The system prompt is always chosen here, never taken from the client.
 */
export function buildModelRequest(input) {
  switch (input.task) {
    case "chat":
      return {
        model: MODEL,
        max_tokens: 1024,
        system: SESSION_SYSTEM_PROMPT,
        messages: input.messages,
      };
    case "summary":
      return {
        model: MODEL,
        max_tokens: 1024,
        system: NOTE_SUMMARY_SYSTEM_PROMPT(input.text),
        messages: [{ role: "user", content: input.text }],
      };
    case "flashcards":
      return {
        model: MODEL,
        max_tokens: 4096,
        system:
          input.source === "topic"
            ? FLASHCARD_SYSTEM_PROMPT(input.text, input.count)
            : NOTES_FLASHCARD_SYSTEM_PROMPT(input.text, input.count),
        messages: [{ role: "user", content: input.text }],
      };
    default:
      // Unreachable while the schema and this switch agree; fails loudly if a
      // task is added to one but not the other.
      throw new Error(`Unknown task: ${input.task}`);
  }
}

/**
 * Creates the POST /api/ai request handler.
 *
 * @param {Object} deps
 * @param {(token: string) => Promise<unknown>} deps.verifyToken - Resolves for
 *   a valid Firebase ID token and rejects otherwise.
 * @param {(params: Object) => Promise<Object>} deps.callModel - Sends params to
 *   the Anthropic Messages API and resolves with the API's message object.
 * @param {{ info: Function, error: Function }} [deps.logger] - Defaults to console.
 * @returns {(request: Request) => Promise<Response>}
 */
export function createHandler({ verifyToken, callModel, logger = console }) {
  return async function handler(request) {
    if (request.method !== "POST") {
      return jsonResponse(405, { error: "Method not allowed" }, { Allow: "POST" });
    }

    const match = /^Bearer\s+(\S+)$/i.exec(request.headers.get("authorization") ?? "");
    if (!match) {
      return jsonResponse(401, { error: "Unauthorized" });
    }
    try {
      await verifyToken(match[1]);
    } catch {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(400, { error: "Invalid request" });
    }
    const parsed = aiRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse(400, { error: "Invalid request" });
    }

    const startedAt = Date.now();
    try {
      const message = await callModel(buildModelRequest(parsed.data));
      // Metadata about the call only, never the prompt, request or reply.
      logger.info("AI model call", {
        durationMs: Date.now() - startedAt,
        stopReason: message?.stop_reason,
        outputTokens: message?.usage?.output_tokens,
      });
      // A flashcard deck cut off at the token limit is always broken JSON, so
      // it is not sent on. Chat and summary replies stay readable when cut off.
      if (parsed.data.task === "flashcards" && message?.stop_reason === "max_tokens") {
        return jsonResponse(502, { error: "The AI service is unavailable. Please try again." });
      }
      const text = message?.content?.[0]?.text;
      if (typeof text !== "string") {
        throw new Error("Model response contained no text");
      }
      return jsonResponse(200, { text });
    } catch (error) {
      // Only the error's name, status and the call's duration are logged: never
      // the request body, the prompt or the model output, which all contain
      // user content.
      logger.error("AI request failed", {
        name: error?.name,
        status: error?.status,
        durationMs: Date.now() - startedAt,
      });
      if (error?.status === 429) {
        return jsonResponse(429, { error: "Too many requests. Please try again shortly." });
      }
      return jsonResponse(502, { error: "The AI service is unavailable. Please try again." });
    }
  };
}
