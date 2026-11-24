import test from "node:test";
import assert from "node:assert/strict";
import {
  extractJSON,
  maskPersonalData,
  validateAIResult
} from "../src/services/aiAgent.js";

test("oculta teléfonos y correos antes de enviarlos a Gemini", () => {
  const masked = maskPersonalData(
    "Mi número es 310 555 1234 y mi correo ana@example.com"
  );

  assert.ok(!masked.includes("310 555 1234"));
  assert.ok(!masked.includes("ana@example.com"));
  assert.match(masked, /TELÉFONO OCULTO/);
  assert.match(masked, /CORREO OCULTO/);
});

test("extrae JSON aunque venga dentro de un bloque Markdown", () => {
  const parsed = extractJSON(
    '```json\n{"results":[{"id":"1"}]}\n```'
  );

  assert.equal(parsed.results[0].id, "1");
});

test("extrae JSON aunque haya texto adicional alrededor", () => {
  const parsed = extractJSON(
    'Respuesta del modelo: {"results":[]} fin'
  );

  assert.deepEqual(parsed, { results: [] });
});

test("acepta un resultado válido de Gemini", () => {
  const result = validateAIResult({
    id: "2",
    category: "SPAM",
    reason: "Publicidad no solicitada.",
    confidence: 0.95,
    signals: ["publicidad", "publicidad", "enlace_externo"]
  });

  assert.deepEqual(result, {
    category: "spam",
    reason: "Publicidad no solicitada.",
    confidence: 0.95,
    signals: ["publicidad", "enlace_externo"],
    method: "ai"
  });
});

test("rechaza resultados incompletos o inválidos", () => {
  assert.equal(validateAIResult(null), null);
  assert.equal(validateAIResult({ category: "otra", reason: "x", confidence: 1 }), null);
  assert.equal(validateAIResult({ category: "ok", reason: "", confidence: 1 }), null);
  assert.equal(validateAIResult({ category: "ok", reason: "x", confidence: 2 }), null);
});
