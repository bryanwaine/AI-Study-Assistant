import { z } from "zod";

import { MAX_CARDS, MIN_CARDS, NOTE_MAX_CHARS } from "../../shared/limits.js";

// Upper bounds on what a client may send. They cap cost per request and
// reject oversized payloads before anything reaches the model.
export const LIMITS = {
  chatMessages: 10,
  // Assistant replies are capped at 1024 tokens (~4-5k chars) and come back
  // as history, so this must sit well above that.
  chatMessageChars: 10000,
  topicChars: 200,
  textChars: NOTE_MAX_CHARS,
  minCards: MIN_CARDS,
  maxCards: MAX_CARDS,
};

const format = (n) => n.toLocaleString("en-US");

// The only messages a 400 may carry besides "Invalid request". They are fixed
// strings built from the limits, never from the input, so a response cannot
// echo what the client sent.
export const LENGTH_ERRORS = {
  notes: `Notes must be at most ${format(LIMITS.textChars)} characters.`,
  topic: `A topic must be at most ${format(LIMITS.topicChars)} characters.`,
  chatMessage: `Each chat message must be at most ${format(LIMITS.chatMessageChars)} characters.`,
};
export const LENGTH_ERROR_MESSAGES = new Set(Object.values(LENGTH_ERRORS));

const chatMessage = z.strictObject({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(LIMITS.chatMessageChars, { message: LENGTH_ERRORS.chatMessage }),
});

// strictObject rejects unknown keys, so a client that tries to send its own
// `system` prompt (or anything else) gets a 400 instead of being ignored.
const chatRequest = z.strictObject({
  task: z.literal("chat"),
  messages: z
    .array(chatMessage)
    .min(1)
    .max(LIMITS.chatMessages)
    // Optional chaining: zod still runs this refine after .min(1) fails, so
    // an empty array must not crash it.
    .refine((messages) => messages.at(-1)?.role === "user", {
      message: "The last message must come from the user",
    }),
});

const summaryRequest = z.strictObject({
  task: z.literal("summary"),
  text: z.string().min(1).max(LIMITS.textChars, { message: LENGTH_ERRORS.notes }),
});

const flashcardsRequest = z
  .strictObject({
    task: z.literal("flashcards"),
    source: z.enum(["topic", "notes"]),
    text: z.string().min(1).max(LIMITS.textChars, { message: LENGTH_ERRORS.notes }),
    count: z.number().int().min(LIMITS.minCards).max(LIMITS.maxCards),
  })
  .refine((req) => req.source !== "topic" || req.text.length <= LIMITS.topicChars, {
    message: LENGTH_ERRORS.topic,
    path: ["text"],
  });

// `task` decides which of the three shapes the body must match.
export const aiRequestSchema = z.discriminatedUnion("task", [
  chatRequest,
  summaryRequest,
  flashcardsRequest,
]);
