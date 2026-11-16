
import { classifyWithRules } from "../services/moderationRules.js";

export async function classifyCommentController(req, res) {
  try {
    const { usuario, texto, reportes } = req.body;

    if (
      typeof usuario !== "string" ||
      typeof texto !== "string" ||
      typeof reportes !== "number"
    ) {
      return res.status(400).json({
        success: false,
        message: "Los datos del comentario no son válidos."
      });
    }

    const result = classifyWithRules({
      usuario,
      texto,
      reportes
    });

    return res.json({
      success: true,
      comentario: { usuario, texto, reportes },
      moderacion: result,
      metodo: "reglas"
    });

  } catch (error) {
    console.error("Error al moderar comentario:", error);

    return res.status(500).json({
      success: false,
      message: "No fue posible analizar el comentario."
    });
  }
}
