import { NOTE_MAX_CHARS } from "../../shared/limits";
import { AiRequestError } from "../anthropic";

// Same wording as the server's 400 for an over-limit note (netlify/lib/schema.js).
export const NOTE_TOO_LONG_MESSAGE = `Notes must be at most ${NOTE_MAX_CHARS.toLocaleString("en-US")} characters.`;

/**
 * Summarises a note, then saves it once with both the user's text and the
 * summary. The model is called first, so a failed or rejected request leaves
 * nothing behind in Firestore.
 *
 * @param {Object} note
 * @param {string} note.userId
 * @param {string|null} note.noteId - Set when adding to a note already saved.
 * @param {string} note.title
 * @param {string} note.fileName
 * @param {string} note.text - The extracted note text.
 * @param {Array<Object>} note.previousMessages - Messages already in the note.
 * @param {Object} deps - generateNoteSummary, saveNote and updateNote.
 * @returns {Promise<{ noteId: string, messages: Array<Object> }>}
 * @throws {AiRequestError} With status 400 if the text is over the limit.
 */
const createNoteWithSummary = async (
  { userId, noteId, title, fileName, text, previousMessages },
  { generateNoteSummary, saveNote, updateNote }
) => {
  if (text.length > NOTE_MAX_CHARS) {
    throw new AiRequestError(NOTE_TOO_LONG_MESSAGE, 400);
  }

  const userMessage = { id: Date.now(), role: "user", content: text };
  const summary = await generateNoteSummary(text);
  const aiMessage = { id: Date.now() + 1, role: "assistant", content: summary };
  const messages = [...previousMessages, userMessage, aiMessage];

  if (noteId) {
    await updateNote(userId, noteId, messages);
    return { noteId, messages };
  }
  const newNoteId = await saveNote(userId, messages, title, fileName);
  return { noteId: newNoteId, messages };
};

export default createNoteWithSummary;
