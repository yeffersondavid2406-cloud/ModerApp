import { AI_BATCH_SIZE } from "../config/env.js";
import {
  classifyCommentsWithAI,
  getAIModel,
  isAIEnabled
} from "./aiAgent.js";
import { classifyWithRules } from "./moderationRules.js";

const aiCache = new Map();
const AI_COOLDOWN_MS = 60000;

let aiCooldownUntil = 0;

function buildCacheKey(comment) {
  return JSON.stringify({
    id: comment.id ?? null,
    usuario: comment.usuario ?? "",
    texto: comment.texto ?? "",
    reportes: Number(comment.reportes) || 0
  });
}

function chunk(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function describeBatchFailure(error) {
  const status =
    error?.status ??
    error?.code ??
    error?.response?.status;

  return status ? `estado ${status}` : "error de conexión o respuesta";
}

function isAIUnavailable(error) {
  const status = Number(
    error?.status ??
    error?.code ??
    error?.response?.status
  );

  return status === 429 || status === 503;
}

function shouldStopAIBatch(error) {
  const status = Number(
    error?.status ??
    error?.code ??
    error?.response?.status
  );

  return [401, 403, 404, 429, 503].includes(status);
}

export function clearModerationCache() {
  aiCache.clear();
  aiCooldownUntil = 0;
}

export async function classifyComments(comments, options = {}) {
  const {
    useAI = isAIEnabled(),
    aiClassifier = classifyCommentsWithAI
  } = options;

  if (!Array.isArray(comments) || comments.length === 0) {
    return {
      results: [],
      meta: {
        total: 0,
        aiEnabled: isAIEnabled(),
        model: getAIModel(),
        usedAI: false,
        fallbacks: 0
      }
    };
  }

  const prepared = comments.map(comment => ({
    comment,
    rules: classifyWithRules(comment),
    ai: null
  }));

  if (useAI) {
    const pending = [];

    for (const item of prepared) {
      const cached = aiCache.get(buildCacheKey(item.comment));

      if (cached) {
        item.ai = cached;
      } else {
        pending.push(item);
      }
    }

    if (Date.now() >= aiCooldownUntil) {
      for (const group of chunk(pending, AI_BATCH_SIZE)) {
        if (Date.now() < aiCooldownUntil) {
          break;
        }

        const aiComments = group.map(item => ({
          ...item.comment,
          ruleSignals: item.rules.signals
        }));

        try {
          const aiResults = await aiClassifier(aiComments);

          if (Array.isArray(aiResults)) {
            group.forEach((item, index) => {
              const aiResult = aiResults[index];

              if (aiResult) {
                item.ai = aiResult;
                aiCache.set(buildCacheKey(item.comment), aiResult);
              }
            });
          }

          aiCooldownUntil = 0;
        } catch (error) {
          if (isAIUnavailable(error)) {
            aiCooldownUntil = Date.now() + AI_COOLDOWN_MS;
          }

          const ids = group
            .map(item => item.comment.id ?? "sin id")
            .join(", ");

          console.warn(
            `No fue posible clasificar con IA (${ids}): ` +
            `${describeBatchFailure(error)}. Se usará el clasificador por reglas.`
          );

          // NUEVO: muestra el error real
          console.error("status:", error?.status ?? error?.code);
          console.error("message:", error?.message);

          if (shouldStopAIBatch(error)) {
            break;
          }
        }
      }
    }
  }

  let usedAI = false;
  let fallbacks = 0;

  const results = prepared.map(item => {
    if (item.ai) {
      usedAI = true;

      return {
        ...item.comment,
        moderacion: item.ai
      };
    }

    if (useAI) {
      fallbacks++;
    }

    return {
      ...item.comment,
      moderacion: {
        ...item.rules,
        method: useAI ? "rules_fallback" : "rules"
      }
    };
  });

  return {
    results,
    meta: {
      total: results.length,
      aiEnabled: isAIEnabled(),
      model: getAIModel(),
      usedAI,
      fallbacks
    }
  };
}

export async function classifyComment(comment, options = {}) {
  const { results, meta } = await classifyComments([comment], options);

  return {
    result: results[0],
    meta
  };
}
