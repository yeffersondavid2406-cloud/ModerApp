import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  classifyComments,
  clearModerationCache
} from "../src/services/moderationService.js";

const comments = JSON.parse(
  await readFile(
    new URL("../data/comentarios.json", import.meta.url),
    "utf-8"
  )
);

function countByCategory(results) {
  const counts = {
    ok: 0,
    spam: 0,
    revisar: 0
  };

  for (const result of results) {
    counts[result.moderacion.category]++;
  }

  return counts;
}

beforeEach(() => {
  clearModerationCache();
});

test("usa el clasificador por reglas cuando no se solicita IA", async () => {
  const { results, meta } = await classifyComments(comments, {
    useAI: false
  });

  assert.equal(results.length, 20);
  assert.ok(results.every(result => result.moderacion.method === "rules"));
  assert.equal(meta.usedAI, false);
  assert.equal(meta.fallbacks, 0);
  assert.deepEqual(countByCategory(results), {
    ok: 9,
    spam: 4,
    revisar: 7
  });
});

test("usa los resultados de la IA cuando el clasificador responde", async () => {
  const fakeAI = async batch => batch.map(() => ({
    category: "ok",
    reason: "Clasificación simulada de prueba.",
    confidence: 0.99,
    signals: [],
    method: "ai"
  }));

  const { results, meta } = await classifyComments(comments, {
    useAI: true,
    aiClassifier: fakeAI
  });

  assert.equal(results.length, 20);
  assert.ok(results.every(result => result.moderacion.method === "ai"));
  assert.equal(meta.usedAI, true);
  assert.equal(meta.fallbacks, 0);
});

test("cae en reglas si la IA falla", async () => {
  const failingAI = async () => {
    throw new Error("Fallo simulado de Gemini.");
  };

  const { results, meta } = await classifyComments(comments, {
    useAI: true,
    aiClassifier: failingAI
  });

  assert.equal(results.length, 20);
  assert.ok(
    results.every(result => result.moderacion.method === "rules_fallback")
  );
  assert.equal(meta.usedAI, false);
  assert.equal(meta.fallbacks, 20);
  assert.deepEqual(countByCategory(results), {
    ok: 9,
    spam: 4,
    revisar: 7
  });
});
