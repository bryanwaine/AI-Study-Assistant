import Anthropic from "@anthropic-ai/sdk";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import { ConfigError, readConfig } from "../lib/config.js";
import { createHandler } from "../lib/handler.js";

// Netlify stops a synchronous function after 30 s by default. One attempt
// may take up to 25 s (a 40-card deck is a long reply), and the overall
// deadline cuts off a retry before Netlify does, leaving ~3 s for start-up
// and token verification, so the client gets our 502 rather than a timeout.
const ATTEMPT_TIMEOUT_MS = 25_000;
const DEADLINE_MS = 27_000;
const MAX_RETRIES = 1;

// Built on the first request, then reused while this instance stays warm.
let handler;

function getHandler() {
  if (handler) return handler;

  const config = readConfig(process.env);

  // Netlify can reuse a warm instance, and initializeApp throws if the
  // default app already exists, so reuse it when present.
  let app;
  try {
    app = getApps().length ? getApp() : initializeApp({ credential: cert(config.serviceAccount) });
  } catch {
    throw new ConfigError("FIREBASE_SERVICE_ACCOUNT could not be used as a credential");
  }
  const auth = getAuth(app);

  const anthropic = new Anthropic({
    apiKey: config.anthropicApiKey,
    timeout: ATTEMPT_TIMEOUT_MS,
    maxRetries: MAX_RETRIES,
  });

  handler = createHandler({
    verifyToken: (token) => auth.verifyIdToken(token),
    callModel: (params) =>
      anthropic.messages.create(params, { signal: AbortSignal.timeout(DEADLINE_MS) }),
  });
  return handler;
}

export default async function ai(request) {
  let handle;
  try {
    handle = getHandler();
  } catch (error) {
    // A ConfigError message names the variable, never its value. Any other
    // error is reduced to its name in case its message carries a secret.
    console.error(
      error instanceof ConfigError
        ? `AI function misconfigured: ${error.message}`
        : `AI function failed to start: ${error?.name}`
    );
    return Response.json({ error: "Server error" }, { status: 500 });
  }
  return handle(request);
}

export const config = { path: "/api/ai" };
