import "dotenv/config";

function toPositiveInteger(value, fallback) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const PORT = toPositiveInteger(process.env.PORT, 3000);

export const GEMINI_API_KEY = (
  process.env.GEMINI_API_KEY ||
  process.env.AI_API_KEY ||
  ""
).trim();

export const AI_MODEL = (
  process.env.AI_MODEL ||
  "gemini-3.8-flash"
).trim();

export const AI_API_VERSION = (
  process.env.AI_API_VERSION ||
  "v1beta"
).trim();

export const AI_TIMEOUT_MS = toPositiveInteger(
  process.env.AI_TIMEOUT_MS,
  30000
);

export const AI_BATCH_SIZE = toPositiveInteger(
  process.env.AI_BATCH_SIZE,
  8
);

export const AI_ENABLED =
  Boolean(GEMINI_API_KEY) && process.env.AI_ENABLED !== "false";
