
import { classifyComment } from "../services/aiAgent.js";

const MAX_BATCH_SIZE = 100;
const CONCURRENCY = 3;

function validateComment(comment) {
  if (!comment || typeof comment !== "object" || Array.isArray(comment)) {
    return "El comentario debe ser un objeto válido.";
  }

  if (
    comment.usuario !== undefined &&
    typeof comment.usuario !== "string"
  ) {
    return "El usuario debe ser un texto.";
  }

  if (typeof comment.texto !== "string") {
    return "El texto del comentario es obligatorio.";
  }

  if (
    comment.reportes !== undefined &&
    (
      !Number.isInteger(comment.reportes) ||
      comment.reportes < 0
    )
  ) {
    return "El número de reportes debe ser un entero positivo.";
  }

  if (
    comment.id !== undefined &&
    !["string", "number"].includes(typeof comment.id)
  ) {
    return "El ID del comentario no es válido.";
  }

  return null;
}

// Analizar un comentario individual.
async function analyzeSingleComment(comment) {
  const result = await classifyComment(comment);

  return {
    id: comment.id ?? null,
    usuario: comment.usuario || "usuario_desconocido",
    texto: comment.texto,
    reportes: comment.reportes ?? 0,
    moderacion: result
  };
}

// Analizar varios comentarios con concurrencia limitada.
async function analyzeBatch(comments) {
  const results = new Array(comments.length);

  let currentIndex = 0;

  async function worker() {
    while (true) {
      const index = currentIndex++;

      if (index >= comments.length) {
        break;
      }

      const comment = comments[index];

      try {
        results[index] = {
          success: true,
          ...await analyzeSingleComment(comment)
        };
      } catch (error) {
        console.error(
          `Error analizando comentario ${comment.id ?? index}:`,
          error.message
        );

        results[index] = {
          success: false,
          id: comment.id ?? null,
          usuario: comment.usuario || "usuario_desconocido",
          error: "No fue posible analizar este comentario."
        };
      }
    }
  }

  const workers = Array.from(
    {
      length: Math.min(CONCURRENCY, comments.length)
    },
    () => worker()
  );

  await Promise.all(workers);

  const summary = {
    total: results.length,
    ok: 0,
    spam: 0,
    revisar: 0,
    errores: 0
  };

  for (const result of results) {
    if (!result.success) {
      summary.errores++;
      continue;
    }

    summary[result.moderacion.category]++;
  }

  return {
    success: true,
    resumen: summary,
    resultados: results
  };
}

export async function classifyCommentController(req, res) {
  try {
    const body = req.body;

    // Detectar si se recibió una lista de comentarios.
    const isBatch = Array.isArray(body) ||
      (body && Array.isArray(body.comentarios));

    if (isBatch) {
      const comments = Array.isArray(body)
        ? body
        : body.comentarios;

      if (comments.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Debes enviar al menos un comentario."
        });
      }

      if (comments.length > MAX_BATCH_SIZE) {
        return res.status(400).json({
          success: false,
          message: `El máximo permitido es ${MAX_BATCH_SIZE} comentarios.`
        });
      }

      // Validar todos los comentarios antes de procesarlos.
      const invalidComments = [];

      comments.forEach((comment, index) => {
        const error = validateComment(comment);

        if (error) {
          invalidComments.push({
            index,
            id: comment?.id ?? null,
            error
          });
        }
      });

      if (invalidComments.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Algunos comentarios contienen datos inválidos.",
          errores: invalidComments
        });
      }

      const result = await analyzeBatch(comments);

      return res.status(200).json(result);
    }

    // Análisis individual.
    const validationError = validateComment(body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const result = await analyzeSingleComment(body);

    return res.status(200).json({
      success: true,
      comentario: result
    });

  } catch (error) {
    console.error("Error en el servicio de moderación:", error);

    return res.status(500).json({
      success: false,
      message: "No fue posible realizar la moderación.",
      error: process.env.NODE_ENV === "development"
        ? error.message
        : undefined
    });
  }
}
