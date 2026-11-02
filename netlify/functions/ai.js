import Anthropic from "@anthropic-ai/sdk";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import { ConfigError, readConfig } from "../lib/config.js";
import { createHandler } from "../lib/handler.js";

// Netlify's synchronous function time limit for this site (30 s by default).
// Change only this constant once the site's real limit is confirmed.
const FUNCTION_TIME_LIMIT_SECONDS = 30;

// The model call gets the limit minus ~3 s, which is kept for start-up and
// token verification, so the client gets our 502 rather than a Netlify
// timeout. The SDK's own timeout stops waiting for response headers; the
// abort signal also covers reading the body.
const MODEL_DEADLINE_MS = (FUNCTION_TIME_LIMIT_SECONDS - 3) * 1000;

// No retries: the SDK waits out the API's retry-after header (up to 60 s)
// before retrying, which could outlast the function. A 429 is passed on to
// the client instead.
const MAX_RETRIES = 0;

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
    timeout: MODEL_DEADLINE_MS,
    maxRetries: MAX_RETRIES,
  });

  handler = createHandler({
    verifyToken: (token) => auth.verifyIdToken(token),
    callModel: (params) =>
      anthropic.messages.create(params, { signal: AbortSignal.timeout(MODEL_DEADLINE_MS) }),
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
