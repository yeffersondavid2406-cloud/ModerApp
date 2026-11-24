import {
  classifyComment,
  classifyComments
} from "../services/moderationService.js";
import {
  MAX_BATCH_SIZE,
  validateComment,
  validateComments
} from "../utils/validators.js";

export async function classifyCommentController(req, res) {
  try {
    const body = req.body;

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

      const errors = validateComments(comments);

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Algunos comentarios contienen datos inválidos.",
          errores: errors
        });
      }

      const { results, meta } = await classifyComments(comments);

      return res.json({
        success: true,
        meta,
        resultados: results
      });
    }

    const validationError = validateComment(body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const { result, meta } = await classifyComment(body);

    return res.json({
      success: true,
      meta,
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
