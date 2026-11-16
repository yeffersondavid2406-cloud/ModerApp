
import { classifyComment } from "../services/aiAgent.js";

export async function classifyCommentController(req, res) {
  try {
    const { usuario, texto, reportes } = req.body;

    // Validar los datos recibidos
    if (
      typeof usuario !== "string" ||
      typeof texto !== "string" ||
      typeof reportes !== "number"
    ) {
      return res.status(400).json({
        success: false,
        message: "Los datos del comentario no son válidos.",
      });
    }

    // Enviar el comentario a Gemini
    const result = await classifyComment({
      usuario,
      texto,
      reportes,
    });

    return res.json({
      success: true,
      comentario: {
        usuario,
        texto,
        reportes,
      },
      moderacion: result,
    });
  } catch (error) {
    console.error("Error al moderar comentario:", error);

    return res.status(500).json({
      success: false,
      message: "No fue posible analizar el comentario.",
    });
  }
}
