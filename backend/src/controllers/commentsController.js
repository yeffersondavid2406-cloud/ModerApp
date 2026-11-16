
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { classifyWithRules } from "../services/moderationRules.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

const commentsPath = path.resolve(
  currentDirectory,
  "../../data/comentarios.json"
);

export async function getComments(req, res) {
  try {
    const fileContent = await readFile(commentsPath, "utf-8");
    const comments = JSON.parse(fileContent);

    const classifiedComments = comments.map(comment => ({
      ...comment,
      moderacion: classifyWithRules(comment)
    }));

    const counts = {
      ok: classifiedComments.filter(c => c.moderacion.category === "ok").length,
      spam: classifiedComments.filter(c => c.moderacion.category === "spam").length,
      revisar: classifiedComments.filter(c => c.moderacion.category === "revisar").length
    };

    return res.json({
      success: true,
      total: classifiedComments.length,
      counts,
      comments: classifiedComments
    });

  } catch (error) {
    console.error("Error al obtener comentarios:", error);

    return res.status(500).json({
      success: false,
      message: "No fue posible obtener los comentarios."
    });
  }
}
