/**
 * Logs an error's name and message to the console in development builds only.
 *
 * A JSON.parse SyntaxError quotes the start of the text that failed to parse,
 * which here is the model's reply and may echo the user's notes, so its
 * message is replaced with a fixed description.
 *
 * @param {string} context - What failed, e.g. "Flashcard generation failed".
 * @param {unknown} error - The caught error.
 */
const logDevError = (context, error) => {
  if (!import.meta.env.DEV) return;
  const message = error instanceof SyntaxError ? "reply was not valid JSON" : error?.message;
  console.error(`${context}:`, error?.name, message);
};

export default logDevError;
