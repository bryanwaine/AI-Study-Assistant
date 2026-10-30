import { z } from "zod";

// Upper bounds on what a client may send. They cap cost per request and
// reject oversized payloads before anything reaches the model.
export const LIMITS = {
  chatMessages: 10,
  // Assistant replies are capped at 1024 tokens (~4-5k chars) and come back
  // as history, so this must sit well above that.
  chatMessageChars: 10000,
  topicChars: 200,
  textChars: 50000,
  minCards: 20,
  maxCards: 40,
};

const chatMessage = z.strictObject({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(LIMITS.chatMessageChars),
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
  text: z.string().min(1).max(LIMITS.textChars),
});

const flashcardsRequest = z
  .strictObject({
    task: z.literal("flashcards"),
    source: z.enum(["topic", "notes"]),
    text: z.string().min(1).max(LIMITS.textChars),
    count: z.number().int().min(LIMITS.minCards).max(LIMITS.maxCards),
  })
  .refine((req) => req.source !== "topic" || req.text.length <= LIMITS.topicChars, {
    message: `A topic must be at most ${LIMITS.topicChars} characters`,
    path: ["text"],
  });

// `task` decides which of the three shapes the body must match.
export const aiRequestSchema = z.discriminatedUnion("task", [
  chatRequest,
  summaryRequest,
  flashcardsRequest,
]);
