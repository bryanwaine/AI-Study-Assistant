// Limits shared by the browser and the /api/ai Netlify Function, so the forms
// and the server always agree. Plain constants only: this file is bundled
// into the client and packaged with the function.

// Flashcards per deck. Preview measurements put the model at ~80-95 output
// tokens per card and ~85-110 tokens/s, so 15 cards stay well inside the
// function's 27 s model deadline (40 cards took up to ~28.5 s).
export const MIN_CARDS = 10;
export const MAX_CARDS = 15;
export const DEFAULT_CARDS = 10;

// Longest note (in characters) that can be summarised or turned into cards.
export const NOTE_MAX_CHARS = 50000;
