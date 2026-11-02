import { generateKeyPairSync } from "node:crypto";

import { cert } from "firebase-admin/app";
import { describe, expect, it } from "vitest";

import { ConfigError, readConfig } from "./config.js";

// A throwaway key generated per run, so no real credential is in the repo.
const { privateKey: pem } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

const account = (overrides = {}) =>
  JSON.stringify({
    project_id: "demo-project",
    client_email: "svc@demo-project.iam.gserviceaccount.com",
    private_key: pem,
    ...overrides,
  });

const env = (overrides = {}) => ({
  ANTHROPIC_API_KEY: "sk-ant-test",
  FIREBASE_SERVICE_ACCOUNT: account(),
  ...overrides,
});

function configErrorFrom(environment) {
  try {
    readConfig(environment);
  } catch (error) {
    return error;
  }
  throw new Error("readConfig did not throw");
}

describe("readConfig", () => {
  it("returns the API key and service account", () => {
    expect(readConfig(env())).toEqual({
      anthropicApiKey: "sk-ant-test",
      serviceAccount: {
        projectId: "demo-project",
        clientEmail: "svc@demo-project.iam.gserviceaccount.com",
        privateKey: pem,
      },
    });
  });

  it.each([
    ["ANTHROPIC_API_KEY is missing", { ANTHROPIC_API_KEY: undefined }, "ANTHROPIC_API_KEY is not set"],
    ["ANTHROPIC_API_KEY is blank", { ANTHROPIC_API_KEY: "  " }, "ANTHROPIC_API_KEY is not set"],
    ["FIREBASE_SERVICE_ACCOUNT is missing", { FIREBASE_SERVICE_ACCOUNT: undefined },
      "FIREBASE_SERVICE_ACCOUNT is not set"],
    ["the service account lacks a field", { FIREBASE_SERVICE_ACCOUNT: account({ private_key: "" }) },
      'FIREBASE_SERVICE_ACCOUNT is missing "private_key"'],
    ["the service account is a JSON string, not an object", { FIREBASE_SERVICE_ACCOUNT: '"oops"' },
      'FIREBASE_SERVICE_ACCOUNT is missing "project_id"'],
  ])("throws a ConfigError when %s", (_label, overrides, message) => {
    const error = configErrorFrom(env(overrides));

    expect(error).toBeInstanceOf(ConfigError);
    expect(error.message).toBe(message);
  });

  it("does not leak the secret when the service account is not valid JSON", () => {
    const raw = "supersecretkeymaterial";
    // Guard: the native SyntaxError really does quote the start of the input.
    expect(() => JSON.parse(raw)).toThrow("supersecre");

    const error = configErrorFrom(env({ FIREBASE_SERVICE_ACCOUNT: raw }));

    expect(error).toBeInstanceOf(ConfigError);
    expect(error.message).toBe("FIREBASE_SERVICE_ACCOUNT is not valid JSON");
    expect(error.message).not.toContain("supersecre");
  });

  it("turns literal \\n sequences in the private key into newlines", () => {
    const escaped = pem.replace(/\n/g, "\\n");
    const { serviceAccount } = readConfig(env({ FIREBASE_SERVICE_ACCOUNT: account({ private_key: escaped }) }));

    expect(escaped).not.toContain("\n");
    expect(serviceAccount.privateKey).toBe(pem);
    // firebase-admin parses the key here, so this proves it is usable.
    expect(() => cert(serviceAccount)).not.toThrow();
  });
});
