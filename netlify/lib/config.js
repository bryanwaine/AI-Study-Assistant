/**
 * A problem with the function's environment variables. Its message names the
 * variable but never includes the variable's value, so it is safe to log.
 */
export class ConfigError extends Error {
  name = "ConfigError";
}

const SERVICE_ACCOUNT_FIELDS = ["project_id", "client_email", "private_key"];

/**
 * Reads and checks the server-side secrets.
 *
 * @param {Record<string, string | undefined>} env - Usually process.env.
 * @returns {{ anthropicApiKey: string, serviceAccount: { projectId: string,
 *   clientEmail: string, privateKey: string } }}
 * @throws {ConfigError} If a variable is missing or malformed.
 */
export function readConfig(env) {
  const anthropicApiKey = env.ANTHROPIC_API_KEY?.trim();
  if (!anthropicApiKey) {
    throw new ConfigError("ANTHROPIC_API_KEY is not set");
  }

  const raw = env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw?.trim()) {
    throw new ConfigError("FIREBASE_SERVICE_ACCOUNT is not set");
  }

  let account;
  try {
    account = JSON.parse(raw);
  } catch {
    // The SyntaxError is discarded on purpose: its message can quote the
    // start of the input, which here is the secret itself.
    throw new ConfigError("FIREBASE_SERVICE_ACCOUNT is not valid JSON");
  }

  for (const field of SERVICE_ACCOUNT_FIELDS) {
    if (typeof account?.[field] !== "string" || !account[field]) {
      throw new ConfigError(`FIREBASE_SERVICE_ACCOUNT is missing "${field}"`);
    }
  }

  return {
    anthropicApiKey,
    serviceAccount: {
      projectId: account.project_id,
      clientEmail: account.client_email,
      // A key pasted with its newlines escaped arrives as literal "\n"
      // sequences, which the PEM parser rejects. Real newlines are left as-is.
      privateKey: account.private_key.replace(/\\n/g, "\n"),
    },
  };
}
