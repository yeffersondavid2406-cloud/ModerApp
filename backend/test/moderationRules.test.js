import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { classifyWithRules } from "../src/services/moderationRules.js";

const comments = JSON.parse(
  await readFile(
    new URL("../data/comentarios.json", import.meta.url),
    "utf-8"
  )
);

const expectedCategories = {
  1: "ok",
  2: "spam",
  3: "ok",
  4: "revisar",
  5: "ok",
  6: "spam",
  7: "revisar",
  8: "revisar",
  9: "ok",
  10: "ok",
  11: "ok",
  12: "spam",
  13: "revisar",
  14: "ok",
  15: "revisar",
  16: "revisar",
  17: "spam",
  18: "revisar",
  19: "ok",
  20: "ok"
};

function classifyAll() {
  return comments.map(comment => ({
    comment,
    moderation: classifyWithRules(comment)
  }));
}

test("clasifica los 20 comentarios con la categoría esperada", () => {
  const results = classifyAll();

  for (const { comment, moderation } of results) {
    assert.equal(
      moderation.category,
      expectedCategories[comment.id],
      `Comentario ${comment.id}: ${moderation.reason}`
    );
  }
});

test("devuelve un motivo y una confianza válida en todos los casos", () => {
  for (const { moderation } of classifyAll()) {
    assert.equal(typeof moderation.reason, "string");
    assert.ok(moderation.reason.length > 0);
    assert.ok(moderation.confidence >= 0 && moderation.confidence <= 1);
    assert.equal(moderation.method, "rules");
    assert.ok(Array.isArray(moderation.signals));
  }
});

test("calcula los conteos esperados", () => {
  const counts = {
    ok: 0,
    spam: 0,
    revisar: 0
  };

  for (const { moderation } of classifyAll()) {
    counts[moderation.category]++;
  }

  assert.deepEqual(counts, {
    ok: 9,
    spam: 4,
    revisar: 7
  });
});

test("marca teléfono, vacío, amenaza e insulto con sus señales", () => {
  const byId = new Map(
    comments.map(comment => [
      comment.id,
      classifyWithRules(comment)
    ])
  );

  assert.ok(byId.get(7).signals.includes("dato_personal"));
  assert.ok(byId.get(8).signals.includes("vacio"));
  assert.ok(byId.get(18).signals.includes("amenaza"));
  assert.ok(byId.get(13).signals.includes("insulto"));
});

test("no trata la pregunta sobre una estafa como publicidad", () => {
  const moderation = classifyWithRules(
    comments.find(comment => comment.id === 15)
  );

  assert.equal(moderation.category, "revisar");
  assert.ok(moderation.signals.includes("posible_estafa"));
  assert.ok(!moderation.signals.includes("publicidad"));
});

test("un enlace informativo no se clasifica como spam", () => {
  const moderation = classifyWithRules(
    comments.find(comment => comment.id === 19)
  );

  assert.equal(moderation.category, "ok");
  assert.ok(moderation.signals.includes("enlace_externo"));
});
